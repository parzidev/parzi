import gzip
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import URLError

import crawl
import random_probe


class Response:
    def __init__(self, body=b"<html></html>", status=200):
        self.body = body
        self.status = status

    def read(self):
        return self.body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None


class RandomProbeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.root_patch = patch.object(random_probe, "ROOT", self.root)
        self.crawl_patch = patch.object(crawl, "ROOT", self.root)
        self.root_patch.start()
        self.crawl_patch.start()
        self.db = crawl.connect()

    def tearDown(self):
        self.db.close()
        self.crawl_patch.stop()
        self.root_patch.stop()
        self.temp.cleanup()

    def run_probe(self, responses, batches=1):
        with patch.object(random_probe, "build_opener") as factory, patch.object(random_probe.time, "sleep") as sleep:
            opener = factory.return_value
            opener.open.side_effect = responses
            stats = random_probe.probe_random(self.db, batches=batches)
        return stats, factory, opener, sleep

    def test_anonymous_post_enqueues_new_entities_and_assigns_song_id(self):
        known = crawl.BASE + "akor/known-1.html"
        crawl.add_urls(self.db, [known])
        crawl.assign_new_ids(self.db)
        body = b'''<div><a href="/akor/known-1.html">Known</a>
        <a href="/akor/new-2.html">New</a><a href="/akor-tab/artist/">Artist</a>
        <a href="/repertuar/12/list.html">List</a></div>'''
        stats, factory, opener, sleep = self.run_probe([Response(), Response(body)])
        self.assertEqual(stats["new_direct_songs"], 1)
        self.assertEqual(stats["new_song_urls"], 1)
        self.assertEqual(stats["new_artists"], 1)
        self.assertEqual(stats["new_repertoires"], 1)
        self.assertFalse(stats["exhaustive"])
        self.assertEqual(stats["successful_batches"], 1)
        self.assertEqual(stats["failures"], 0)
        self.assertEqual(self.db.execute("SELECT song_id FROM identities WHERE site_id=2").fetchone()[0], 2)
        request = opener.open.call_args_list[1].args[0]
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.data, b"get=randomContent")
        self.assertEqual(request.get_header("Referer"), crawl.BASE)
        self.assertIsNone(request.get_header("Cookie"))
        self.assertEqual(len(factory.call_args.args[0].cookiejar), 0)
        sleep.assert_called_once_with(0.5)
        directory = self.root / stats["cache_dir"]
        self.assertEqual(gzip.decompress((directory / "0001.html.gz").read_bytes()), body)
        audit = [json.loads(line) for line in (directory / "audit.jsonl").read_text().splitlines()]
        self.assertEqual(audit[1]["counts"], {"songs": 2, "artists": 1, "repertoires": 1})
        self.assertNotIn("headers", audit[1])
        self.assertEqual(json.loads(self.db.execute("SELECT value FROM meta WHERE key='random_probe'").fetchone()[0]), stats)

    def test_duplicate_replies_and_source_aliases_do_not_inflate_new_songs(self):
        crawl.add_urls(self.db, [crawl.BASE + "akor/known-2.html"])
        crawl.assign_new_ids(self.db)
        body = b'<div><a href="/akor/alias-2.html">Alias</a><a href="/akor/new-3.html">New</a></div>'
        stats, _, _, _ = self.run_probe([Response(), Response(body), Response(body)], batches=2)
        self.assertEqual(stats["batches"], 2)
        self.assertEqual(stats["successful_batches"], 2)
        self.assertEqual(stats["new_song_urls"], 2)
        self.assertEqual(stats["new_direct_songs"], 1)
        self.assertEqual(self.db.execute("SELECT count(*) FROM identities").fetchone()[0], 2)

    def test_network_failure_is_audited_and_later_batch_continues(self):
        body = b'<div><a href="/akor/new-3.html">New</a></div>'
        stats, _, _, _ = self.run_probe([Response(), URLError("connection failed"), Response(body)], batches=2)
        self.assertEqual(stats["batches"], 2)
        self.assertEqual(stats["failures"], 1)
        self.assertEqual(stats["successful_batches"], 1)
        self.assertEqual(stats["new_direct_songs"], 1)
        audit = (self.root / stats["cache_dir"] / "audit.jsonl").read_text()
        self.assertIn('"error": "URLError"', audit)
        self.assertNotIn("connection failed", audit)

    def test_empty_random_response_is_not_recorded_as_success(self):
        stats, _, _, _ = self.run_probe([Response(), Response(b"<div>unavailable</div>")])
        self.assertEqual(stats["failures"], 1)
        self.assertEqual(stats["successful_batches"], 0)
        self.assertEqual(stats["new_direct_songs"], 0)
        audit = [json.loads(line) for line in (self.root / stats["cache_dir"] / "audit.jsonl").read_text().splitlines()]
        self.assertEqual(audit[1]["status"], 200)
        self.assertEqual(audit[1]["error"], "ValueError")

    def test_blank_response_is_cached_and_counted_as_failure(self):
        stats, _, _, _ = self.run_probe([Response(), Response(b"")])
        self.assertEqual(stats["failures"], 1)
        self.assertEqual(stats["successful_batches"], 0)

    def test_bootstrap_failure_stops_without_posting(self):
        stats, _, opener, sleep = self.run_probe([URLError("offline")])
        self.assertEqual(stats["batches"], 0)
        self.assertEqual(stats["failures"], 1)
        self.assertTrue(stats["bootstrap_failed"])
        self.assertEqual(opener.open.call_count, 1)
        sleep.assert_not_called()

    def test_invalid_limits_cannot_bypass_request_spacing(self):
        for arguments in ({"batches": 0}, {"batches": True}, {"batches": 1, "interval": 0.1}, {"interval": float("nan")}):
            with self.assertRaises(ValueError):
                random_probe.probe_random(self.db, **arguments)


if __name__ == "__main__":
    unittest.main()
