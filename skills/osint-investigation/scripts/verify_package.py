#!/usr/bin/env python3
"""Verify the portable skill package without executing helpers or changing files."""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path, PurePosixPath, PureWindowsPath

ROOT = Path(__file__).resolve().parents[1]
SEMVER_RE = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$")


def verify_versions(errors: list[str]) -> None:
    version_file = ROOT / 'VERSION'
    if not version_file.exists():
        errors.append('VERSION missing')
        return
    version = version_file.read_text(encoding='utf-8').strip()
    if not SEMVER_RE.fullmatch(version):
        errors.append(f'VERSION is not valid SemVer: {version!r}')
        return
    try:
        metadata = json.loads((ROOT / 'skill.json').read_text(encoding='utf-8'))
        if metadata.get('version') != version:
            errors.append(f'skill.json version mismatch: expected {version!r}')
        if metadata.get('name') != ROOT.name:
            errors.append(f'skill.json name mismatch: expected {ROOT.name!r}')
    except (OSError, ValueError, AttributeError) as exc:
        errors.append(f'skill.json metadata check failed: {exc}')
    try:
        text = (ROOT / 'SKILL.md').read_text(encoding='utf-8-sig')
        header = re.match(r'^---\n(.*?)\n---(?:\n|$)', text, re.DOTALL)
        if not header:
            raise ValueError('SKILL.md frontmatter missing')
        frontmatter = header.group(1)
        name = re.search(r'(?m)^name:\s*([^\n]+)$', frontmatter)
        if not name or name.group(1).strip().strip('\"\'') != ROOT.name:
            errors.append(f'SKILL.md name mismatch: expected {ROOT.name!r}')
        block = re.search(r'(?m)^metadata:[ \t]*\n((?:[ \t]+[^\n]*(?:\n|$))+)', frontmatter)
        match = re.search(r'(?m)^  version:[ \t]*([^\n]+)', block.group(1)) if block else None
        if not match or match.group(1).strip().strip('\"\'') != version:
            errors.append(f'SKILL.md version mismatch: expected {version!r}')
    except (OSError, ValueError) as exc:
        errors.append(f'SKILL.md metadata check failed: {exc}')


def verify_manifest(errors: list[str]) -> None:
    try:
        entries = [line.strip() for line in (ROOT / 'manifest.txt').read_text(encoding='utf-8').splitlines() if line.strip()]
    except OSError as exc:
        errors.append(f'manifest.txt missing or unreadable: {exc}')
        return
    if len(entries) != len(set(entries)):
        errors.append('manifest.txt contains duplicate entries')
    for rel in entries:
        parts = PurePosixPath(rel).parts
        if ('\\' in rel or ':' in rel or not parts or '..' in parts
                or PurePosixPath(rel).is_absolute() or PureWindowsPath(rel).drive):
            errors.append(f'unsafe manifest entry: {rel}')
            continue
        target = ROOT / rel
        if not target.resolve().is_relative_to(ROOT.resolve()):
            errors.append(f'unsafe manifest entry outside package: {rel}')
        elif not target.is_file():
            errors.append(f'manifest entry missing or not a file: {rel}')


def verify_strategy_package(errors: list[str]) -> None:
    """Ensure adaptive investigation resources remain reachable after installation."""
    required = {
        'references/adaptive-investigation-strategy.md',
        'references/trajectory-evaluation.md',
        'templates/strategy-checkpoint.md',
        'scripts/trajectory_eval.py',
        'tests/test_trajectory_eval.py',
        'tests/test_strategy_package.py',
        'tests/fixtures/behavioral-cases.json',
    }
    try:
        entries = set((ROOT / 'manifest.txt').read_text(encoding='utf-8').splitlines())
        for rel in sorted(required):
            if rel not in entries or not (ROOT / rel).is_file():
                errors.append(f'AIS resource missing from package: {rel}')
        skill = (ROOT / 'SKILL.md').read_text(encoding='utf-8')
        if 'references/adaptive-investigation-strategy.md' not in skill:
            errors.append('SKILL.md missing AIS route')
    except OSError as exc:
        errors.append(f'AIS package check failed: {exc}')


def verify_catalog(errors: list[str]) -> None:
    try:
        catalog = json.loads((ROOT / 'references/catalog.json').read_text(encoding='utf-8'))
        if catalog['stats']['tools'] < 1000:
            errors.append('catalog unexpectedly small')
        if catalog['stats']['tools'] != len(catalog['tools']):
            errors.append('catalog tool count does not match tools')
        ids = [tool['id'] for tool in catalog['tools']]
        if len(ids) != len(set(ids)):
            errors.append('duplicate tool IDs')
        if any(' ' in tool['url'] for tool in catalog['tools']):
            errors.append('catalog contains URL with spaces')
        source = (ROOT / 'references/source/awesome-osint-README.md').read_bytes()
        expected = catalog['source']['snapshot_sha256']
        if hashlib.sha256(source).hexdigest() != expected:
            errors.append('source snapshot hash mismatch')
        attribution = (ROOT / 'ATTRIBUTION.md').read_text(encoding='utf-8')
        if expected not in attribution:
            errors.append('ATTRIBUTION.md snapshot hash is stale')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        errors.append(f'catalog error: {exc}')


def main() -> int:
    errors: list[str] = []
    verify_manifest(errors)
    verify_versions(errors)
    verify_strategy_package(errors)
    verify_catalog(errors)
    for script in (ROOT / 'scripts').glob('*.py'):
        try:
            compile(script.read_bytes(), str(script), 'exec')
        except (OSError, SyntaxError) as exc:
            errors.append(f'{script.name}: {exc}')
    if errors:
        print('FAILED')
        for error in errors:
            print('-', error)
        return 1
    print('OK - package paths, metadata, strategy resources, catalog, snapshot hash, attribution, and Python syntax verified.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
