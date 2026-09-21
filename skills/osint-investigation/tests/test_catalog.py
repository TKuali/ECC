"""Offline tests for curated discovery and optional compatible catalogs."""
import contextlib
import copy
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
from cataloglib import load_catalog, score_tool
import search_catalog
import select_tools


def invoke(module, args):
    out, err = io.StringIO(), io.StringIO()
    with patch.object(sys, "argv", [module.__name__, *map(str, args)]):
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            status = module.main()
    return status, out.getvalue(), err.getvalue()


class CatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_catalog(ROOT / "references/catalog.json")

    def test_curated_catalog_has_unique_working_records(self):
        tools = self.catalog["tools"]
        self.assertTrue(20 <= len(tools) <= 35)
        self.assertEqual(len(tools), len({tool["id"] for tool in tools}))
        self.assertTrue(all(tool["description"] and tool["domain"] for tool in tools))

    def test_every_workflow_stage_has_a_candidate(self):
        self.assertEqual(set(select_tools.PROFILES), {
            "domain", "company", "username", "people", "email", "image", "news", "threat", "monitoring"})
        for profile in select_tools.PROFILES:
            with self.subTest(profile=profile):
                status, out, err = invoke(select_tools, ["--workflow", profile, "--json", "--per-stage", "1"])
                self.assertEqual(status, 0, err)
                self.assertTrue(all(stage["tools"] for stage in json.loads(out)), out)

    def test_english_and_chinese_discovery(self):
        for query in ("domain DNS", "域名", "公司", "图片", "威胁", "监控"):
            status, out, err = invoke(search_catalog, [query, "--json", "--top", "3"])
            self.assertEqual(status, 0, err)
            self.assertTrue(json.loads(out), query)
            self.assertLessEqual(len(json.loads(out)), 3)
        self.assertEqual(score_tool(self.catalog["tools"][0], ""), 0)
        self.assertEqual(invoke(search_catalog, ["qzxvnonce98765"])[0], 1)
        self.assertEqual(json.loads(invoke(search_catalog, ["qzxvnonce98765", "--json"])[1]), [])

    def test_external_full_shape_risk_and_category_filters(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "catalog.json"
            rows = []
            for risk in ("low", "guarded", "restricted"):
                rows.append(dict(id=risk, name="Example " + risk, url="https://example.org/" + risk,
                                 category="General Search", description="Example source", tags=["example"], risk_tier=risk))
            path.write_text(json.dumps({"schema_version": "1.0.0", "tools": rows, "source": {"name": "fixture"}}))
            for flags, expected in (([], 2), (["--max-risk", "low"], 1), (["--include-restricted"], 3),
                                    (["--category", "No Such Category"], 0)):
                status, out, err = invoke(search_catalog, ["example", "--json", "--catalog", path, *flags])
                self.assertEqual(status, 0, err)
                self.assertEqual(len(json.loads(out)), expected)

    def test_malformed_external_catalog_is_rejected(self):
        valid = {"tools": [copy.deepcopy(self.catalog["tools"][0])]}
        bad_values = [None, [], {}, {"tools": []}, {"tools": [None]}, {"tools": "wrong"}]
        for field, value in (("id", ""), ("name", 7), ("url", "file:///private"),
                             ("url", "https://example.org/ bad"), ("risk_tier", "unknown"),
                             ("tags", "wrong"), ("description", []), ("subcategory", 5)):
            bad = copy.deepcopy(valid)
            bad["tools"][0][field] = value
            bad_values.append(bad)
        duplicate = copy.deepcopy(valid)
        duplicate["tools"].append(copy.deepcopy(duplicate["tools"][0]))
        bad_values.append(duplicate)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "catalog.json"
            for bad in bad_values:
                with self.subTest(catalog=bad):
                    path.write_text(json.dumps(bad), encoding="utf-8")
                    with self.assertRaises(ValueError):
                        load_catalog(path)
            path.write_text("not json", encoding="utf-8")
            for module, args in ((search_catalog, ["domain"]), (select_tools, ["--workflow", "domain"])):
                status, out, err = invoke(module, [*args, "--catalog", path])
                self.assertEqual(status, 2)
                self.assertFalse(out)
                self.assertIn("catalog", err.lower())
                self.assertNotIn("Traceback", err)
            path.unlink()
            with self.assertRaises(ValueError):
                load_catalog(path)

    def test_cli_works_from_unrelated_directory_and_rejects_nonpositive_limits(self):
        with tempfile.TemporaryDirectory() as folder:
            for script, args, invalid in (("search_catalog.py", ["域名", "--json"], ["--top", "0"]),
                                          ("select_tools.py", ["--workflow", "image", "--json"], ["--per-stage", "-1"])):
                command = [sys.executable, str(ROOT / "scripts" / script), *args]
                result = subprocess.run(command, cwd=folder, capture_output=True, text=True, encoding="utf-8")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertTrue(json.loads(result.stdout))
                self.assertEqual(subprocess.run(command + invalid, cwd=folder, capture_output=True).returncode, 2)


if __name__ == "__main__":
    unittest.main()
