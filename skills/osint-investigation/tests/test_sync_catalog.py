"""Offline catalog refresh tests; never fetch remote resources."""
import contextlib
import hashlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import sync_catalog

SAMPLE = "## General Search\n* [Example](https://example.org) - Public search API\n"


class SyncTests(unittest.TestCase):
    def test_invalid_or_truncated_refresh_preserves_every_existing_file(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "input.md"
            source.write_text(
                "## General Search\n"
                "* [One](https://example.org/one) - Public search\n"
                "* [Two](https://example.org/two) - Public search\n"
                "* [Three](https://example.org/three) - Public search\n",
                encoding="utf-8",
            )
            (root / "ATTRIBUTION.md").write_text(
                "- Snapshot retrieved: old\n- Snapshot SHA-256: `old`\n", encoding="utf-8")
            argv = ["sync", "--from-file", str(source), "--output-dir", str(root / "references")]
            with patch.object(sys, "argv", argv), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(sync_catalog.main(), 0)
            protected = [*sorted((root / "references").rglob("*")), root / "ATTRIBUTION.md"]
            before = {p: p.read_bytes() for p in protected if p.is_file()}
            for bad_source in ("<html>Service temporarily unavailable</html>", SAMPLE):
                with self.subTest(source=bad_source):
                    source.write_text(bad_source, encoding="utf-8")
                    with patch.object(sys, "argv", argv), contextlib.redirect_stderr(io.StringIO()) as errors:
                        with contextlib.redirect_stdout(io.StringIO()):
                            self.assertEqual(sync_catalog.main(), 1)
                    self.assertIn("Refusing", errors.getvalue())
                    self.assertEqual(before, {p: p.read_bytes() for p in before})

    def test_empty_first_refresh_does_not_create_output(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "input.md"
            source.write_text("No catalog available", encoding="utf-8")
            output = root / "references"
            argv = ["sync", "--from-file", str(source), "--output-dir", str(output)]
            with patch.object(sys, "argv", argv), contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(sync_catalog.main(), 1)
            self.assertFalse(output.exists())

    def test_refresh_rejects_unreadable_existing_catalog(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "input.md"
            source.write_text(SAMPLE, encoding="utf-8")
            output = root / "references"
            output.mkdir()
            catalog = output / "catalog.json"
            catalog.write_text("broken existing metadata", encoding="utf-8")
            before = catalog.read_bytes()
            argv = ["sync", "--from-file", str(source), "--output-dir", str(output)]
            with patch.object(sys, "argv", argv), contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(sync_catalog.main(), 1)
            self.assertEqual(catalog.read_bytes(), before)
            self.assertFalse((output / "source").exists())

    def test_small_reviewable_change_is_allowed_at_threshold(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "input.md"
            output = root / "references"
            argv = ["sync", "--from-file", str(source), "--output-dir", str(output)]
            for count, expected in ((5, 0), (4, 0), (3, 1)):
                with self.subTest(count=count):
                    text = "## General Search\n" + "".join(
                        f"* [Tool {n}](https://example.org/{n}) - Public search\n"
                        for n in range(count))
                    source.write_text(text, encoding="utf-8")
                    with patch.object(sys, "argv", argv), contextlib.redirect_stdout(io.StringIO()):
                        with contextlib.redirect_stderr(io.StringIO()):
                            self.assertEqual(sync_catalog.main(), expected)
            self.assertEqual(len(json.loads((output / "catalog.json").read_text())["tools"]), 4)

    def test_normalization_removes_hidden_controls_and_snapshot_decorations(self):
        hidden = '\u200b\u200c\u200d\u2060\ufeff\u202a\u202e\u2066\u2069\ufe00\ufe0f\U000e0100\U000e01ef\U000e0000\U000e007f\u180e\u115f\u1160\u2061\u2064\u3164'
        decorations = '\U0001f9d9\u2642\U0001f4d6\U0001f970\U0001f631'
        text = '## ' + decorations + ' Table of Contents\n' + SAMPLE + hidden + '中文 café\n'
        expected = '##  Table of Contents\n' + SAMPLE + '中文 café\n'
        self.assertEqual(sync_catalog.normalize_source(text), expected)
        self.assertEqual(sync_catalog.normalize_source(expected), expected)
        self.assertEqual(sync_catalog.normalize_source('text \t\r\nnext \t'), 'text\nnext')

    def test_offline_refresh_preserves_exact_snapshot_digest(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "input.md"
            source.write_bytes(SAMPLE.encode())
            attribution = root / "ATTRIBUTION.md"
            attribution.write_text("- Snapshot retrieved: old\n- Snapshot SHA-256: `old`\n", encoding="utf-8")
            argv = ["sync", "--from-file", str(source), "--output-dir", str(root / "references")]
            with patch.object(sys, "argv", argv), patch.object(sync_catalog, "fetch") as fetch:
                with contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(sync_catalog.main(), 0)
            fetch.assert_not_called()
            snapshot = (root / "references/source/awesome-osint-README.md").read_bytes()
            catalog = json.loads((root / "references/catalog.json").read_text(encoding="utf-8"))
            self.assertEqual(hashlib.sha256(snapshot).hexdigest(), catalog["source"]["snapshot_sha256"])
            self.assertIn(catalog["source"]["snapshot_sha256"], attribution.read_text())
            self.assertEqual(catalog["stats"]["tools"], 1)
            self.assertTrue((root / "references/catalog.csv").is_file())
            self.assertIn("General Search", (root / "references/taxonomy.md").read_text())

    def test_no_attribution_update_and_missing_input(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "input.md"
            source.write_text(SAMPLE, encoding="utf-8")
            argv = ["sync", "--from-file", str(source), "--output-dir", str(root / "references"), "--no-attribution-update"]
            with patch.object(sys, "argv", argv), patch.object(sync_catalog, "update_attribution") as update:
                with contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(sync_catalog.main(), 0)
                update.assert_not_called()
                source.unlink()
                with contextlib.redirect_stderr(io.StringIO()):
                    self.assertEqual(sync_catalog.main(), 1)

    def test_fetch_validates_content_type(self):
        class Response:
            def __init__(self, kind):
                self.headers = {"Content-Type": kind}
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False
            def read(self, limit):
                return SAMPLE.encode()
        with patch.object(sync_catalog, "urlopen", return_value=Response("text/plain")):
            self.assertEqual(sync_catalog.fetch("https://example.org/README.md", 3), SAMPLE)
        with patch.object(sync_catalog, "urlopen", return_value=Response("application/pdf")):
            with self.assertRaises(RuntimeError):
                sync_catalog.fetch("https://example.org/README.md", 3)


if __name__ == "__main__":
    unittest.main()
