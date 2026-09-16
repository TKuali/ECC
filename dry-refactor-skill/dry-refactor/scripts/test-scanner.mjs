#!/usr/bin/env node
/**
 * Scanner fixture tests for find-dupes.mjs.  Run:  node scripts/test-scanner.mjs
 * Zero dependencies (node:test). Exercises fixtures/scanner/* and, informationally,
 * fixtures/held-out/* (never asserted — see fixtures/held-out/README.md).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { run, parseArgs, lex, computeEligible, parseUnifiedDiff, compareBaseline } from './find-dupes.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const FX = path.join(ROOT, 'fixtures', 'scanner');

function scan(dir, extra = []) {
  const opts = parseArgs([path.join(FX, dir), '--no-write', ...extra]);
  return run(opts);
}
const base = (f) => path.basename(f);
const locs = (finding) => finding.locations.map((l) => `${base(l.file)}:${l.start_line}-${l.end_line}`);

test('01 exact duplicate across two files: correct locations', () => {
  const { result } = scan('01-exact-two-files', ['--normalized']);
  const exact = result.findings.filter((f) => f.match_type === 'exact');
  assert.equal(exact.length, 1);
  assert.deepEqual(locs(exact[0]).sort(), ['a.js:4-12', 'b.js:4-12']);
  assert.equal(exact[0].advisory, false);
  // the normalized finding here adds nothing over exact and must be flagged, not shown as new work
  const norm = result.findings.filter((f) => f.match_type === 'normalized');
  assert.equal(norm.length, 1);
  assert.equal(norm[0].subsumed_by, exact[0].id);
  assert.equal(result.summary.normalized_findings, 0);
});

test('02 renamed copy: exact misses, normalized finds it and stays advisory; literals preserved', () => {
  const { result } = scan('02-renamed-copy', ['--normalized']);
  assert.equal(result.findings.filter((f) => f.match_type === 'exact').length, 0);
  const norm = result.findings.filter((f) => f.match_type === 'normalized');
  assert.equal(norm.length, 1);
  assert.equal(norm[0].advisory, true);
  assert.equal(norm[0].locations.length, 2);
  // the two fetch lines differ only in template-literal text, which is preserved,
  // so the match must start AFTER them (line 4 / line 12), not on them
  assert.deepEqual(locs(norm[0]).sort(), ['loaders.js:12-17', 'loaders.js:4-9']);
});

test('03 property keys are preserved: no normalized match may include admin/guest', () => {
  const { result } = scan('03-property-keys', ['--normalized']);
  const norm = result.findings.filter((f) => f.match_type === 'normalized');
  assert.ok(norm.length >= 1, 'the renamed prefix/suffix around the key line should still match');
  const src = fs.readFileSync(path.join(FX, '03-property-keys', 'roles.js'), 'utf8');
  const { tokens } = lex(src);
  for (const f of norm) {
    for (const l of f.locations) {
      const inside = tokens.slice(l.start_token, l.end_token).map((t) => t.v);
      assert.ok(!inside.includes('admin') && !inside.includes('guest'), `finding ${f.id} spans a property key: ${locs(f)}`);
    }
  }
  const { eligible, excluded } = computeEligible(tokens);
  assert.ok(excluded.has('admin') && excluded.has('guest'));
  assert.ok(!eligible.has('admin') && !eligible.has('guest'));
});

test('04 shadowing: a name declared twice is never normalized', () => {
  const { eligibleDump } = scan('04-shadowing', ['--normalized', '--dump-eligible']);
  const names = Object.values(eligibleDump)[0];
  assert.ok(!names.includes('value'), 'value is declared twice (outer const + parameter)');
  assert.ok(names.includes('total'), 'total is declared once and is eligible');
  assert.ok(!names.includes('read'), 'function names are preserved');
});

test('05 shorthand and destructuring targets are never normalized', () => {
  const { eligibleDump } = scan('05-shorthand-destructuring', ['--normalized', '--dump-eligible']);
  const names = Object.values(eligibleDump)[0];
  for (const n of ['id', 'name', 'a', 'rest']) assert.ok(!names.includes(n), `${n} must not be eligible`);
  assert.deepEqual(names, ['props', 'width']);
});

test('06 unsupported syntax: exact pass still runs; normalization skipped with a reason, not silently', () => {
  const { result, coverage } = scan('06-unsupported-syntax', ['--normalized']);
  const exact = result.findings.filter((f) => f.match_type === 'exact');
  assert.equal(exact.length, 1);
  assert.deepEqual(locs(exact[0]).sort(), ['Broken.jsx:2-7', 'Fine.js:2-7']);
  assert.equal(coverage.normalized.attempted, 2);
  assert.equal(coverage.normalized.supported, 1);
  assert.equal(coverage.normalized.skipped.length, 1);
  assert.match(coverage.normalized.skipped[0].file, /Broken\.jsx$/);
  assert.match(coverage.normalized.skipped[0].reason, /unterminated string/);
});

test('07 typescript: exact finds it; normalized pass declares it unsupported', () => {
  const { result, coverage } = scan('07-typescript-excluded', ['--normalized']);
  assert.equal(result.findings.filter((f) => f.match_type === 'exact').length, 1);
  assert.equal(result.findings.filter((f) => f.match_type === 'normalized').length, 0);
  assert.equal(coverage.normalized.supported, 0);
  assert.equal(coverage.normalized.skipped.length, 2);
  for (const s of coverage.normalized.skipped) assert.match(s.reason, /typescript not supported/);
});

test('08 trivial closing-brace runs are not findings', () => {
  const { result } = scan('08-trivial-lines', ['--normalized', '--min-lines', '3']);
  assert.equal(result.findings.length, 0);
});

test('09 default ignores: node_modules and *.test.* are skipped and disclosed in coverage', () => {
  // node_modules and *.test.* copies are generated here so the repo never has to commit a node_modules folder
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dry-ignored-'));
  const src = fs.readFileSync(path.join(FX, '09-ignored-paths', 'src', 'x.js'), 'utf8');
  fs.mkdirSync(path.join(tmp, 'src')); fs.mkdirSync(path.join(tmp, 'node_modules', 'pkg'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'src', 'x.js'), src);
  fs.writeFileSync(path.join(tmp, 'src', 'x.test.js'), src);
  fs.writeFileSync(path.join(tmp, 'node_modules', 'pkg', 'x.js'), src);
  const { result, coverage } = run(parseArgs([tmp, '--no-write']));
  assert.equal(result.findings.length, 0);
  assert.equal(coverage.files_scanned, 1);
  assert.equal(coverage.files_ignored.length, 2);
  const reasons = coverage.files_ignored.map((x) => x.reason).join(' ');
  assert.match(reasons, /node_modules/);
  assert.match(reasons, /\*\.test\.\*/);
});

test('10 comment-only differences: exact pass is broken up, normalized pass ignores comments', () => {
  const { result } = scan('10-comments-only-difference', ['--normalized']);
  assert.equal(result.findings.filter((f) => f.match_type === 'exact').length, 0);
  const norm = result.findings.filter((f) => f.match_type === 'normalized');
  assert.equal(norm.length, 1);
  assert.deepEqual(locs(norm[0]).sort(), ['a.js:1-14', 'b.js:1-14']);
});

test('11 --ignore glob is honoured and disclosed', () => {
  const { result, coverage } = scan('01-exact-two-files', ['--ignore', '**/b.js']);
  assert.equal(result.findings.length, 0);
  assert.equal(coverage.files_ignored.length, 1);
  assert.match(coverage.files_ignored[0].reason, /\*\*\/b\.js/);
});

test('12 unified diff parsing yields added-line ranges per file', () => {
  const diff = [
    'diff --git a/src/x.js b/src/x.js', '--- a/src/x.js', '+++ b/src/x.js',
    '@@ -10,0 +11,3 @@', '+a', '+b', '+c',
    '@@ -20 +24 @@', '-x', '+y',
    '@@ -30,2 +34,0 @@', '-p', '-q',
    'diff --git a/gone.js b/gone.js', '--- a/gone.js', '+++ /dev/null', '@@ -1,3 +0,0 @@', '-1', '-2', '-3',
  ].join('\n');
  const r = parseUnifiedDiff(diff);
  assert.deepEqual(r.get('src/x.js'), [[11, 13], [24, 24]]);
  assert.equal(r.has('gone.js'), false);
});

test('13 --changed marks findings that touch uncommitted or untracked lines (git required)', (t) => {
  let hasGit = true;
  try { execFileSync('git', ['--version'], { stdio: 'ignore' }); } catch { hasGit = false; }
  if (!hasGit) { t.skip('git not available'); return; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dry-changes-'));
  const g = (args) => execFileSync('git', args, { cwd: tmp, stdio: 'ignore', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } });
  g(['init', '-q']);
  const a = fs.readFileSync(path.join(FX, '01-exact-two-files', 'a.js'), 'utf8');
  fs.mkdirSync(path.join(tmp, 'src'));
  fs.writeFileSync(path.join(tmp, 'src', 'existing.js'), a);
  g(['add', '.']); g(['commit', '-q', '-m', 'base']);
  // a new, untracked file re-implements the committed block
  fs.writeFileSync(path.join(tmp, 'src', 'fresh.js'), a.replace('loadUsers', 'loadAgain'));
  const cwd = process.cwd();
  process.chdir(tmp);
  try {
    const { result } = run(parseArgs(['src', '--changed', '--no-write']));
    const exact = result.findings.filter((f) => f.match_type === 'exact');
    assert.equal(exact.length, 1);
    assert.equal(exact[0].intersects_changes, true);
    const byFile = Object.fromEntries(exact[0].locations.map((l) => [base(l.file), l.in_changes]));
    assert.equal(byFile['fresh.js'], true, 'new copy is in the changes');
    assert.equal(byFile['existing.js'], false, 'committed copy is supporting evidence, not new work');
    assert.equal(result.changes.ref, 'HEAD');
  } finally { process.chdir(cwd); }
});

test('14 baseline comparison reports eliminated / new / remaining by stable content id', () => {
  const before = scan('01-exact-two-files').result;
  const after = scan('01-exact-two-files', ['--ignore', '**/b.js']).result;
  const cmp = compareBaseline(before, after.findings);
  assert.equal(cmp.eliminated.length, 1);
  assert.equal(cmp.new.length, 0);
  assert.equal(cmp.remaining.length, 0);
  // ids are content-based, so a re-run of the same code yields the same id
  assert.equal(before.findings[0].id, scan('01-exact-two-files').result.findings[0].id);
});

test('15 held-out set runs without crashing and reports coverage (informational, not asserted)', () => {
  const dir = path.join(ROOT, 'fixtures', 'held-out');
  const { result, coverage } = run(parseArgs([dir, '--normalized', '--no-write']));
  console.log(`   held-out: files=${coverage.files_scanned} exact=${result.summary.exact_findings} normalized=${result.summary.normalized_findings} normalized-skipped=${coverage.normalized.skipped.length}`);
  for (const s of coverage.normalized.skipped) console.log(`   held-out skip: ${base(s.file)} — ${s.reason}`);
  for (const f of result.findings) console.log(`   held-out finding: ${f.id} ${f.match_type} ${locs(f).join(' | ')}`);
  assert.ok(coverage.files_scanned >= 1);
});
