import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import crawl


class CrawlTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)/"catalog_v2"
        self.root.mkdir()
        self.patcher=patch.object(crawl,"ROOT",self.root)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()
        self.temp.cleanup()

    def test_legacy_ids_are_kept_and_invalid_reserved_id_is_not_reused(self):
        old=[{"id":17,"url":crawl.BASE+"akor/example-549.html"},
             {"id":18,"url":crawl.BASE+"akor/--akor-.html"}]
        (self.root.parent/"akor_urls.json").write_text(json.dumps(old))
        (self.root.parent/"sarki_bilgileri.json").write_text(json.dumps(old[:1]))
        db=crawl.connect()
        crawl.seed_legacy(db)
        crawl.add_urls(db,[crawl.BASE+"akor/new-999.html",old[1]["url"]])
        crawl.assign_new_ids(db)
        self.assertEqual([tuple(r) for r in db.execute("SELECT site_id,song_id FROM identities ORDER BY song_id")],[(549,17),(999,19)])
        self.assertEqual(db.execute('SELECT count(*) FROM pages').fetchone()[0],2)
        self.assertEqual(db.execute('SELECT reason FROM rejected_urls').fetchone()[0],'invalid_source_id')
        db.close()

    def test_unicode_source_urls_are_encoded_only_for_transport(self):
        class Response:
            status=200
            url=crawl.BASE+"akor/example-1.html"
            def read(self):return b'<html>test</html>'
            def __enter__(self):return self
            def __exit__(self,*args):return None
        with patch.object(crawl,"urlopen",return_value=Response()) as request:
            result=crawl.Downloader(0).fetch(crawl.BASE+"akor/bi’-masal-1.html")
        self.assertEqual(result['status'],200)
        url=request.call_args[0][0].full_url
        self.assertTrue(url.isascii())
        self.assertIn('%E2%80%99',url)
        self.assertIn('’',result['url'])
        self.assertTrue((self.root/result['cache_file']).exists())

    def test_published_new_ids_survive_rebuilding_resume_database(self):
        old=[{"id":17,"url":crawl.BASE+"akor/example-549.html"}]
        (self.root.parent/'akor_urls.json').write_text(json.dumps(old))
        (self.root.parent/'sarki_bilgileri.json').write_text(json.dumps(old))
        (self.root/'dist').mkdir()
        published={'id':81,'artist':'Example','title':'New',
                   'source':{'site_id':999,'url':crawl.BASE+'akor/new-999.html'}}
        (self.root/'dist/songs.jsonl').write_text(json.dumps(published)+'\n')
        quarantined={'id':90,'artist':'Example','title':'Review',
                     'source':{'site_id':1000,'url':crawl.BASE+'akor/review-1000.html'}}
        (self.root/'dist/manifest.json').write_text(json.dumps({'quality':{'quarantined_songs':[quarantined]}}))
        db=crawl.connect()
        crawl.seed_legacy(db)
        crawl.add_urls(db,[crawl.BASE+'akor/another-800.html'])
        crawl.assign_new_ids(db)
        self.assertEqual(db.execute('SELECT song_id FROM identities WHERE site_id=999').fetchone()[0],81)
        self.assertEqual(db.execute('SELECT song_id FROM identities WHERE site_id=1000').fetchone()[0],90)
        self.assertEqual(db.execute('SELECT song_id FROM identities WHERE site_id=800').fetchone()[0],91)
        db.close()

    def test_discovery_numbers_cannot_replace_shipped_application_ids(self):
        first=crawl.BASE+'akor/first-10.html'
        second=crawl.BASE+'akor/second-20.html'
        (self.root.parent/'akor_urls.json').write_text(json.dumps([{'id':1,'url':second},{'id':2,'url':first}]))
        (self.root.parent/'sarki_bilgileri.json').write_text(json.dumps([{'id':1,'url':first},{'id':2,'url':second}]))
        db=crawl.connect()
        # Simulate the old unpublished resume registry, then migrate it.
        db.execute('INSERT INTO identities VALUES (10,2,?,NULL,1)',(first,))
        db.execute('INSERT INTO identities VALUES (20,1,?,NULL,1)',(second,))
        db.commit()
        crawl.seed_legacy(db)
        self.assertEqual([tuple(r) for r in db.execute('SELECT site_id,song_id FROM identities ORDER BY site_id')],[(10,1),(20,2)])
        db.close()


if __name__=='__main__':
    unittest.main()
