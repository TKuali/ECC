"""Regression cases for preserving evidence and bounded local helper output."""
import codecs
import contextlib
import csv
import io
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import evidence_ledger
import visual_case


def invoke(module, args):
    output = io.StringIO()
    with patch.object(sys, "argv", [module.__name__, *map(str, args)]):
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            status = module.main()
    return status, output.getvalue()


class RuntimeRegressionTests(unittest.TestCase):
    def test_append_preserves_original_bytes_and_csv_records(self):
        for bom in (b"", codecs.BOM_UTF8):
            for terminator in (b"", b"\r\n", b"\n", b"\r"):
                for include_record in (False, True):
                    with self.subTest(bom=bool(bom), terminator=terminator,
                                      include_record=include_record):
                        with tempfile.TemporaryDirectory() as folder:
                            path = Path(folder) / "evidence.csv"
                            output = io.StringIO(newline="")
                            writer = csv.DictWriter(output, fieldnames=evidence_ledger.FIELDS)
                            writer.writeheader()
                            old_claim = 'Original evidence, "quoted"\r\nsecond line'
                            if include_record:
                                writer.writerow({"claim": old_claim, "confidence": "low"})
                            original = bom + output.getvalue().encode("utf-8").rstrip(b"\r\n") + terminator
                            path.write_bytes(original)
                            status, log = invoke(evidence_ledger, ["add", path, "--claim", "New evidence"])
                            self.assertEqual(status, 0, log)
                            self.assertTrue(path.read_bytes().startswith(original))
                            with path.open(encoding="utf-8-sig", newline="") as handle:
                                rows = list(csv.DictReader(handle))
                            expected = [old_claim, "New evidence"] if include_record else ["New evidence"]
                            self.assertEqual([row["claim"] for row in rows], expected)
                            self.assertTrue(all(None not in row for row in rows))
                            suffix = path.read_bytes()[len(original):]
                            self.assertEqual(suffix.startswith(b"\r\n"), not bool(terminator))

    def test_visual_rejects_multiplication_and_total_overflow(self):
        for data in ("A,Example,1e308,2\n", "A,Example,1e308,1\nA,Example,1e308,1\n"):
            with self.subTest(data=data), tempfile.TemporaryDirectory() as folder:
                path = Path(folder) / "matrix.csv"
                original = ("candidate_id,candidate_name,clue_weight,match_score_minus2_to_plus2\n" + data).encode()
                path.write_bytes(original)
                status, log = invoke(visual_case, ["score", path])
                self.assertEqual(status, 2, log)
                self.assertIn("finite", log)
                self.assertEqual(path.read_bytes(), original)

    def test_visual_init_checks_all_output_links_before_writing(self):
        for filename in ("visual-clues.csv", "workflow-checklist.md"):
            with self.subTest(filename=filename), tempfile.TemporaryDirectory() as folder:
                case = Path(folder) / "case"
                case.mkdir()
                destination = case / filename
                destination.write_bytes(b"existing analyst evidence")
                # Exercise rejection on hosts where native symlink creation requires privileges.
                with patch.object(Path, "is_symlink", autospec=True,
                                  side_effect=lambda path: path == destination):
                    status, log = invoke(visual_case, ["init", case, "--force"])
                self.assertEqual(status, 2, log)
                self.assertIn("symbolic link", log)
                self.assertEqual(destination.read_bytes(), b"existing analyst evidence")
                self.assertEqual(list(case.iterdir()), [destination])

    def test_visual_init_rejects_linked_case_directory_before_mkdir(self):
        with tempfile.TemporaryDirectory() as folder:
            case = Path(folder) / "linked-case"
            with patch.object(Path, "is_symlink", autospec=True,
                              side_effect=lambda path: path == case):
                status, log = invoke(visual_case, ["init", case, "--force"])
            self.assertEqual(status, 2, log)
            self.assertIn("symbolic link", log)
            self.assertFalse(case.exists())

    def test_visual_init_rejects_output_symlinks_before_writing(self):
        with tempfile.TemporaryDirectory() as folder:
            try:
                (Path(folder) / "probe").symlink_to(Path(folder) / "missing")
            except OSError as exc:
                self.skipTest(f"Symbolic links unavailable on this host: {exc}")
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            target = root / "outside"
            target.mkdir()
            evidence = target / "original.txt"
            evidence.write_bytes(b"preserved evidence")
            case = root / "linked-case"
            case.symlink_to(target, target_is_directory=True)
            status, log = invoke(visual_case, ["init", case, "--force"])
            self.assertEqual(status, 2, log)
            self.assertIn("symbolic link", log)
            self.assertTrue(case.is_symlink())
            self.assertEqual(list(target.iterdir()), [evidence])
            self.assertEqual(evidence.read_bytes(), b"preserved evidence")
        for filename in ("visual-clues.csv", "workflow-checklist.md"):
            for dangling in (False, True):
                for force in (False, True):
                    with self.subTest(filename=filename, dangling=dangling, force=force):
                        with tempfile.TemporaryDirectory() as folder:
                            root = Path(folder)
                            case = root / "case"
                            case.mkdir()
                            target = root / "outside.txt"
                            if not dangling:
                                target.write_bytes(b"preserved evidence")
                            destination = case / filename
                            destination.symlink_to(target)
                            args = ["init", case] + (["--force"] if force else [])
                            status, log = invoke(visual_case, args)
                            self.assertEqual(status, 2, log)
                            self.assertIn("symbolic link", log)
                            self.assertTrue(destination.is_symlink())
                            self.assertEqual(list(case.iterdir()), [destination])
                            if dangling:
                                self.assertFalse(target.exists())
                            else:
                                self.assertEqual(target.read_bytes(), b"preserved evidence")


if __name__ == "__main__":
    unittest.main()
