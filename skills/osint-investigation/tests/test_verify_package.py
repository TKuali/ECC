"""Regression checks for the ECC skill package, independent of release branding."""
import contextlib
import hashlib
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import verify_package


class PackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "osint-investigation"
        shutil.copytree(ROOT, self.root, ignore=shutil.ignore_patterns("__pycache__"))
        self.write("SKILL.md", "---\nname: osint-investigation\n"
                   "description: Test package\nmetadata:\n  origin: ECC\n"
                   "  version: 1.4.0\n---\n"
                   "references/adaptive-investigation-strategy.md\n")
        metadata = json.loads((self.root / "skill.json").read_text(encoding="utf-8"))
        metadata.update(name="osint-investigation", version="1.4.0")
        self.write("skill.json", json.dumps(metadata))
        self.write("VERSION", "1.4.0\n")
        for rel in ("README.md", "CHANGELOG.md", "workflows/wanted-person-location-intelligence.md"):
            (self.root / rel).unlink(missing_ok=True)
        entries = sorted(p.relative_to(self.root).as_posix()
                         for p in self.root.rglob("*") if p.is_file())
        self.write("manifest.txt", "\n".join(entries) + "\n")
        self.patcher = patch.object(verify_package, "ROOT", self.root)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

    def write(self, rel, text):
        target = self.root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(text.encode("utf-8"))

    def errors_from(self, check):
        errors = []
        check(errors)
        return errors

    def test_ecc_package_does_not_require_upstream_release_or_wanted_mode(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(verify_package.main(), 0)
        self.assertFalse(list(self.root.rglob("*.pyc")), "verification must be read-only")

    def test_metadata_order_is_not_significant(self):
        self.assertEqual(self.errors_from(verify_package.verify_versions), [])

    def test_version_and_name_mismatches_are_reported(self):
        self.write("skill.json", '{"name":"other-skill","version":"9.9.9"}')
        errors = self.errors_from(verify_package.verify_versions)
        self.assertTrue(any("name mismatch" in error for error in errors), errors)
        self.assertTrue(any("version mismatch" in error for error in errors), errors)

    def test_bad_or_missing_version_is_reported(self):
        for version in ("not-semver", ""):
            with self.subTest(version=version):
                self.write("VERSION", version)
                self.assertTrue(self.errors_from(verify_package.verify_versions))
        (self.root / "VERSION").unlink()
        self.assertTrue(self.errors_from(verify_package.verify_versions))

    def test_malformed_metadata_is_reported(self):
        self.write("skill.json", "not json")
        self.write("SKILL.md", "no frontmatter")
        self.assertGreaterEqual(len(self.errors_from(verify_package.verify_versions)), 2)

    def test_manifest_rejects_traversal_absolute_and_windows_paths(self):
        original = (self.root / "manifest.txt").read_text(encoding="utf-8")
        for bad in ("../outside.txt", "/etc/passwd", "C:/private.txt", "a/../../outside", "a\\..\\outside"):
            with self.subTest(entry=bad):
                self.write("manifest.txt", original + bad + "\n")
                errors = self.errors_from(verify_package.verify_manifest)
                self.assertTrue(any("unsafe manifest" in error for error in errors), errors)

    def test_manifest_rejects_duplicates_missing_files_and_directories(self):
        original = (self.root / "manifest.txt").read_text(encoding="utf-8")
        self.write("manifest.txt", original + "SKILL.md\nabsent.txt\nscripts\n")
        errors = self.errors_from(verify_package.verify_manifest)
        self.assertTrue(any("duplicate" in error for error in errors), errors)
        self.assertTrue(any("absent.txt" in error for error in errors), errors)
        self.assertTrue(any("scripts" in error for error in errors), errors)

    def test_missing_manifest_is_reported(self):
        (self.root / "manifest.txt").unlink()
        self.assertTrue(self.errors_from(verify_package.verify_manifest))

    def test_changed_snapshot_and_attribution_are_detected(self):
        self.write("references/source/awesome-osint-README.md", "changed")
        self.write("ATTRIBUTION.md", "missing digest")
        errors = self.errors_from(verify_package.verify_catalog)
        self.assertTrue(any("snapshot hash" in error for error in errors), errors)
        self.assertTrue(any("ATTRIBUTION" in error for error in errors), errors)

    def test_catalog_integrity_errors_are_detected(self):
        catalog = json.loads((self.root / "references/catalog.json").read_text(encoding="utf-8"))
        catalog["tools"][1]["id"] = catalog["tools"][0]["id"]
        catalog["tools"][0]["url"] = "https://example.org/ bad"
        catalog["stats"]["tools"] = 1
        self.write("references/catalog.json", json.dumps(catalog))
        errors = self.errors_from(verify_package.verify_catalog)
        self.assertTrue(any("small" in error for error in errors), errors)
        self.assertTrue(any("duplicate" in error for error in errors), errors)
        self.assertTrue(any("spaces" in error for error in errors), errors)

    def test_invalid_catalog_and_python_fail_cleanly(self):
        self.write("references/catalog.json", "broken json")
        self.write("scripts/broken.py", "def incomplete(")
        with contextlib.redirect_stdout(io.StringIO()) as output:
            self.assertEqual(verify_package.main(), 1)
        self.assertIn("catalog error", output.getvalue())
        self.assertIn("broken.py", output.getvalue())


if __name__ == "__main__":
    unittest.main()
