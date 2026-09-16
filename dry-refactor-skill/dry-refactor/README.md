# dry-refactor

A Claude Code skill that finds duplicated code in React / Node.js repositories, reports
it with evidence, and — only after an approved plan — merges copies into one shared piece
and verifies against the repository's own checks.

Zero external dependencies: one Node stdlib script, markdown references, `node:test`
fixtures. Nothing is downloaded at run time.

## Layout
```
dry-refactor/
├── SKILL.md                      workflow, inputs, rules, never-list, resume
├── scripts/
│   ├── find-dupes.mjs            scanner (exact pass; --normalized experimental)
│   └── test-scanner.mjs          scanner fixture tests:  node scripts/test-scanner.mjs
├── references/
│   ├── do-not-dry.md             when a match must be left alone
│   ├── react-node-patterns.md    R1–R6 React, N1–N5 Node — suggested strategies
│   ├── guardrails.md             surgical edits, frozen contracts, honest wording
│   ├── finding-schema.md         raw-findings / assessments / progress files
│   ├── verification.md           baseline, per-finding checks, rollback, resume
│   └── report-template.md        fixed output shapes (report / plan / apply / close)
└── fixtures/
    ├── scanner/                  authored scanner cases (asserted)
    ├── held-out/                 never used while tuning the scanner (printed, not asserted)
    ├── workflow/W01…W10          mini-projects with case.md + runnable checks
    └── BASELINE.md               record of built-in cleanup vs this skill on the fixtures
```

## Use
```
# report only (default)
node <skill>/scripts/find-dupes.mjs src --out .dry-refactor
# React code: exact finds little; try the experimental normalized pass and read its coverage
node <skill>/scripts/find-dupes.mjs src --normalized
# review a change
node <skill>/scripts/find-dupes.mjs . --changed            # working tree vs HEAD
node <skill>/scripts/find-dupes.mjs . --diff-base main     # branch vs main
# after applying, prove what was eliminated
node <skill>/scripts/find-dupes.mjs src --baseline .dry-refactor/raw-findings.before.json
```
In Claude Code: "find duplicated code in src/", "did my change add duplication?",
"plan a DRY refactor of the handlers", "apply, plan approved".

Add `.dry-refactor/` to `.gitignore`.

## What the scanner is and is not
- **Exact pass** (default): trimmed, non-blank lines, nothing else normalized. Works on
  `.js .jsx .ts .tsx`. Deterministic; can match inside comments and strings.
- **Normalized pass** (`--normalized`, experimental, `.js .jsx` only): renames a
  *restricted* subset of local identifiers so renamed copies can match. A name is
  normalized only if it is declared exactly once in the file and never appears as a
  property key, property access, JSX tag/attribute/text, shorthand/destructuring
  target, import/export, class name, callee, or next to another identifier. Strings,
  template literals, numbers and regexes are preserved. Files it cannot lex are
  skipped **with a reason** in `coverage.json`; the exact pass still runs on them.
  Normalized findings are advisory and never authorize extraction by themselves.
- **Clusters**: fragments in the same files close together are labelled `C-n`. In React
  code the meaningful differences (endpoint, setter, dependency) split one duplicated
  lifecycle into several fragments; the skill reads a cluster as one candidate.
- **What it does not do**: scope analysis, TypeScript-aware normalization, semantic
  equivalence. Judgment is the skill's job (see `references/do-not-dry.md`).

## Tests
```
node scripts/test-scanner.mjs                 # 15 scanner cases + held-out printout
for d in fixtures/workflow/W*/; do (cd "$d" && npm test); done   # each fixture's own checks
```
Workflow fixtures are exercised by the skill-tester harness using each `case.md`
(see `tools/skill-tester/workspaces/dry-refactor/test-spec.json`).

## References that shaped the design
- Anthropic `pr-review-toolkit` → `code-simplifier`: review recently modified code only,
  preserve exact functionality, score findings.
- Andrej Karpathy's observations on LLM coding pitfalls (community "karpathy-guidelines"):
  surgical changes, no speculative abstractions, define success criteria.
- Google, *Migrating Code At Scale With LLMs* (FSE 2025); Airbnb's React test migration;
  Amazon's Java upgrade work: deterministic detection → model transformation →
  deterministic validation. This skill is that pattern: `find-dupes.mjs` → judgment →
  the repo's own checks.
- `kucherenko/jscpd` `dry-refactoring` skill: the scan → read → extract → rescan loop.
- Vercel React best-practices skill: one rule per section with an example.
