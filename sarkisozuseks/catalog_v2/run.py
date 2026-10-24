"""Resume the live catalog crawl; publish only after independent validation."""
from __future__ import annotations

import fcntl
import json
import os
import sys
import time
import traceback

import build
import crawl
from validate_catalog import validate_catalog


def save_state(stage, **values):
    record={"pid":os.getpid(),"updated_at":crawl.now(),"stage":stage,**values}
    target=crawl.ROOT/"state"/"run.json"
    temporary=target.with_suffix(".tmp")
    temporary.write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n")
    temporary.replace(target)
    print(json.dumps(record,ensure_ascii=False),flush=True)


def run():
    db=crawl.connect()
    with (crawl.ROOT/"state"/"pipeline.lock").open("w") as lock:
        try:
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:
            print('{"stage":"already_running"}',flush=True)
            return 0
        try:
            save_state("seed")
            crawl.seed_legacy(db)
            crawl.add_urls(db,[crawl.BASE])
            crawl.load_sitemaps(db,crawl.Downloader(0.5))
            crawl.assign_new_ids(db)
            # Every newly linked listing is visited. Successful cached pages
            # are reused; failed pages are not silently counted as downloaded.
            retry_ceiling=db.execute("SELECT coalesce(max(attempts),0)+3 FROM pages WHERE kind='song'").fetchone()[0]
            while True:
                previous_count=-1
                while True:
                    current_count=db.execute("SELECT count(*) FROM pages").fetchone()[0]
                    if current_count==previous_count:
                        break
                    previous_count=current_count
                    save_state("discover",known_pages=current_count)
                    build.discover(db)
                for round_number in range(1,4):
                    pending=db.execute("SELECT count(*) FROM pages WHERE kind='song' AND coalesce(status,0)!=200 AND attempts<?",(retry_ceiling,)).fetchone()[0]
                    if not pending:
                        break
                    save_state("download_songs",round=round_number,remaining=pending)
                    crawl.download_pending(db,crawl.Downloader(0.5),4,["song"],retry_ceiling,0)
                    if round_number<3:
                        time.sleep(30)
                # A newly downloaded song can link an unindexed artist/list.
                if not build.scan_cached_links(db):
                    break
            save_state("export")
            # Staging remains separate from dist until all validation passes.
            candidate=crawl.ROOT/"state"/"candidate"
            build.export(db,candidate)
            report=validate_catalog(candidate)
            (crawl.ROOT/"state"/"validation.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
            if not report["valid"]:
                save_state("validation_failed",report=report)
                return 2
            output=crawl.ROOT/"dist"
            if output.exists():
                backup=crawl.ROOT/"state"/"previous-dist"
                if backup.exists():
                    import shutil
                    shutil.rmtree(backup)
                output.replace(backup)
            candidate.replace(output)
            save_state("complete",counts=report["counts"],output=str(output))
            return 0
        except Exception as error:
            save_state("incomplete",error=type(error).__name__+": "+str(error),status=crawl.status(db))
            traceback.print_exc()
            return 2


if __name__=="__main__":
    sys.exit(run())
