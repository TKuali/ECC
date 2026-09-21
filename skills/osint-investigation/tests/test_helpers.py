"""Exercise user-visible helper behavior with synthetic local evidence."""
import contextlib
import csv
import hashlib
import io
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import evidence_ledger
import search_catalog
import select_tools
import visual_case
from cataloglib import parse_readme, score_tool


def invoke(module, args):
    output = io.StringIO()
    with patch.object(sys, "argv", [module.__name__, *map(str, args)]):
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            status = module.main()
    return status, output.getvalue()


class HelperTests(unittest.TestCase):
    def test_ledger_roundtrip_hash_and_summary(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "case" / "evidence.csv"
            source = Path(folder) / "public.txt"
            source.write_bytes(b"synthetic public evidence")
            status, output = invoke(evidence_ledger, ["add", path, "--claim", 'A claim, with "quotes"', "--file", source])
            self.assertEqual(status, 0, output)
            with path.open(newline="", encoding="utf-8") as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual(rows[0]["claim"], 'A claim, with "quotes"')
            self.assertEqual(rows[0]["file_sha256"], hashlib.sha256(source.read_bytes()).hexdigest())
            self.assertTrue(rows[0]["accessed_at"])
            status, output = invoke(evidence_ledger, ["summary", path])
            self.assertEqual(status, 0)
            self.assertIn("Rows: 1", output)
            self.assertIn("Rows without URL or file hash: 0", output)
            before = path.read_bytes()
            self.assertEqual(invoke(evidence_ledger, ["init", path])[0], 1)
            self.assertEqual(path.read_bytes(), before)
            self.assertEqual(invoke(evidence_ledger, ["init", path, "--force"])[0], 0)

    def test_ledger_rejects_wrong_header_without_modification(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "other.csv"
            path.write_bytes(b"other,columns\nold,record\n")
            before = path.read_bytes()
            status, output = invoke(evidence_ledger, ["add", path, "--claim", "claim"])
            self.assertEqual(status, 1, output)
            self.assertEqual(path.read_bytes(), before)

    def test_visual_init_preserves_existing_work_until_force(self):
        with tempfile.TemporaryDirectory() as folder:
            case = Path(folder) / "case"
            self.assertEqual(invoke(visual_case, ["init", case])[0], 0)
            matrix = case / "location-candidates.csv"
            matrix.write_text("analyst work", encoding="utf-8")
            status, output = invoke(visual_case, ["init", case])
            self.assertEqual(status, 0)
            self.assertIn("Skipped", output)
            self.assertEqual(matrix.read_text(), "analyst work")
            self.assertEqual(invoke(visual_case, ["init", case, "--force"])[0], 0)
            self.assertNotEqual(matrix.read_text(), "analyst work")

    def matrix(self, root, weight="2", score="-2"):
        path = root / "matrix.csv"
        path.write_text("candidate_id,candidate_name,clue_weight,match_score_minus2_to_plus2\n"
                        f"A,Public landmark,{weight},{score}\n", encoding="utf-8")
        return path

    def test_visual_rejects_nonfinite_negative_weight_and_out_of_range(self):
        with tempfile.TemporaryDirectory() as folder:
            for weight, score in (("nan", "1"), ("inf", "1"), ("-1", "1"), ("2", "nan"), ("2", "inf"), ("2", "3"), ("two", "1")):
                with self.subTest(weight=weight, score=score):
                    status, output = invoke(visual_case, ["score", self.matrix(Path(folder), weight, score)])
                    self.assertEqual(status, 2, output)

    def test_visual_score_and_missing_inputs(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.matrix(Path(folder))
            status, output = invoke(visual_case, ["score", path])
            self.assertEqual(status, 0)
            self.assertIn("A\tPublic landmark\t-4.00\t0\t1\t1", output)
            path.write_text("candidate_id\nA\n")
            self.assertEqual(invoke(visual_case, ["score", path])[0], 2)
            path.unlink()
            self.assertEqual(invoke(visual_case, ["score", path])[0], 2)

    def test_no_matching_query_does_not_return_unrelated_low_risk_tools(self):
        status, output = invoke(search_catalog, ["qzxvnonceunfindable98765", "--json"])
        self.assertEqual(status, 0)
        self.assertEqual(json.loads(output), [])
        self.assertEqual(invoke(search_catalog, ["qzxvnonceunfindable98765"])[0], 1)

    def test_catalog_search_filters_and_profiles(self):
        status, output = invoke(search_catalog, ["domain DNS", "--json", "--top", "4", "--max-risk", "low"])
        rows = json.loads(output)
        self.assertEqual(status, 0)
        self.assertTrue(rows)
        self.assertLessEqual(len(rows), 4)
        self.assertTrue(all(row["risk_tier"] == "low" for row in rows))
        self.assertEqual(invoke(search_catalog, ["image", "--top", "1"])[0], 0)
        for profile in select_tools.PROFILES:
            with self.subTest(profile=profile):
                status, output = invoke(select_tools, ["--workflow", profile, "--per-stage", "1", "--json"])
                rows = json.loads(output)
                self.assertEqual(status, 0)
                self.assertTrue(rows)
                self.assertTrue(all(len(row["tools"]) <= 1 for row in rows))
                self.assertFalse(any(t["risk_tier"] == "restricted" for row in rows for t in row["tools"]))
        self.assertEqual(invoke(select_tools, ["--workflow", "image"])[0], 0)

    def test_helper_assets_resolve_outside_skill_directory(self):
        with tempfile.TemporaryDirectory() as folder:
            for script, args in (("search_catalog.py", ["domain DNS", "--json", "--top", "1"]),
                                 ("select_tools.py", ["--workflow", "image", "--json"]),
                                 ("visual_case.py", ["init", "case"])):
                result = subprocess.run([sys.executable, str(ROOT / "scripts" / script), *args],
                                        cwd=folder, capture_output=True, text=True, encoding="utf-8")
                self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue((Path(folder) / "case/visual-clues.csv").is_file())

    def test_catalog_parser_handles_nested_categories_duplicate_and_restricted(self):
        source = ("## General Search\n### Test tools\n#### Deep\n"
                  "* [Example](https://example.org) - free command-line API\n"
                  "* [Example](https://example.org) - free command-line API\n"
                  "## People Investigations\n- [Face Tool] https://example.org/face - face search\n"
                  "## Credits\n* [Not a tool](https://example.org/credits)\n")
        catalog = parse_readme(source, "2026-01-01", "https://example.org/source", "https://example.org/repo")
        self.assertEqual(len(catalog["tools"]), 2)
        self.assertEqual(catalog["tools"][1]["risk_tier"], "restricted")
        self.assertGreater(score_tool(catalog["tools"][0], "Example"), 0)
        self.assertEqual(score_tool(catalog["tools"][0], ""), 0)


if __name__ == "__main__":
    unittest.main()
