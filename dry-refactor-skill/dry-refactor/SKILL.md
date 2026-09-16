---
name: dry-refactor
description: Finds copy-pasted (duplicated) code in React / Node.js projects, reports it with evidence, and — only after an approved plan — merges copies into one shared piece and verifies against the repo's own checks. Use when the user mentions duplicate code, repeated code, copy-paste, DRY, "don't repeat yourself", extract a shared hook/component/helper, "did this change add duplication", or asks to review new code for reuse of existing helpers. Not for general code review, style, or performance work.
---

# dry-refactor

Finds duplicated code, shows the evidence, decides per finding whether merging is
justified, and edits only after the user approves a plan. Verification means running
the checks the repository already has — never "proved correct".

## 1. Inputs

**Scope** (where to look) — pick from what the user said; ask only if none applies:

| Scope | User says | What you do |
|---|---|---|
| `path` | a folder, file, glob, or "the whole repo" | scan that path |
| `changes` | "what I just built", "my changes", "this branch", "vs main" | scan the repo, mark findings that touch changed lines (`--changed` or `--diff-base <ref>`) |
| `snippet` | pastes code in the chat, no repo path | no scanner; analyze by reading |

**Action level** (how far to go) — default is `report`:

| Level | Does | Edits files? |
|---|---|---|
| `report` | findings + assessment + coverage | no |
| `plan` | report + a concrete proposal per finding, then **stop** | no |
| `apply` | executes an **approved** plan, one finding at a time | yes |

If the user does not name a level, run `report` and end with one line offering `plan`.
"Skip the plan and just do it" still produces the plan first; approval can be given
in the same message next time ("apply, plan approved"). One approval covers one plan —
do not re-ask per finding. Snippet scope obeys the same three levels.

## 2. Rules (load the reference when you reach the step)

- `references/do-not-dry.md` — when a match must be **left alone**. Read before deciding anything.
- `references/react-node-patterns.md` — what duplication looks like in this stack and the *suggested* move for each. Strategies, never mandatory.
- `references/guardrails.md` — how to edit: surgical, style-matching, contract-preserving.
- `references/finding-schema.md` — exact shape of `raw-findings.json`, `assessments.json`, `progress.json`.
- `references/verification.md` — baseline, per-finding checks, rollback, resume.
- `references/report-template.md` — the output shape for every level.

Eligibility: **3+ copies → eligible for extraction. 2 copies → eligible only for reuse of
an existing helper** (deleting a copy in favour of something that already exists adds no
abstraction). Eligible means "may be proposed", never "will be merged".

## 3. Workflow

### Step 0 — Baseline (path and changes scope; skip for snippet)
1. Find the checks: `package.json` scripts (`test`, `lint`, `typecheck`/`tsc`). If none, say so in the report and, before any `apply`, offer to add characterization tests first.
2. Run them once **before** touching anything. Record pass/fail per check and the names of failing tests. Pre-existing failures are recorded, never hidden, never "fixed".

### Step 1 — Detect (scanner)
```
node <skill-dir>/scripts/find-dupes.mjs <paths> [--changed | --diff-base <ref>] [--normalized] --out .dry-refactor
```
- Default is the **exact** pass (`.js .jsx .ts .tsx`). Add `--normalized` (experimental, `.js .jsx` only) when exact finds little in React code — most React duplication is renamed copies, so try it and report its coverage.
- Changes scope: use `--min-lines 3`. The common finding there is a small helper (2–4 lines) re-implemented next to an existing one; the default 6-line window misses it. Also grep for existing helpers by name/signature (Step 2).
- Read `.dry-refactor/raw-findings.json` and `coverage.json`. Never edit `raw-findings.json`.
- A **cluster** (`C-n`) is several fragments in the same files close together. Read the whole enclosing functions/components and treat the cluster as one candidate — the gaps are the meaningful differences (endpoint strings, state setters, dependencies) that a shared piece would take as parameters.
- Snippet scope: no scanner. Say "evidence from reading; no repository context".

### Step 2 — Judge (per finding or cluster) → `assessments.json`
For each candidate, read the actual code (whole enclosing function/component, not just the matched lines) and record:
- **evidence** — match type, copies, lines, cluster, scanner coverage caveats.
- **decision** — `extract` | `reuse` | `report-only` | `leave-alone`.
- **reason** — why the copies should or should not share one implementation. Cite the pattern name from `react-node-patterns.md` or the rule from `do-not-dry.md`.
- **risk** — contracts touched (exports, props, signatures), side effects, callers found by grep, tests that cover the code.
- Near-identical copies that **differ in behavior** (one cancels a request, one does not; different rounding) → `report-only`, name the difference, ask whether it is a bug or intentional. Never pick one behavior silently.
- Changes scope: grep the repo for an existing helper/hook/component the new code duplicates. If one exists → `reuse`, touch nothing outside the changed files. Old duplication near the change is reported as a separate path-scope candidate, not folded into this work.

### Step 3 — Report (level `report`)
Fill `report-template.md` §Report. Include coverage (scanned / ignored / failed / normalization skipped with reasons) and the baseline check results. Stop.

### Step 4 — Plan (level `plan`)
For each `extract`/`reuse` finding: what changes, what stays the same (every export, prop name, signature), files touched, the shared piece's location (where the repo already keeps shared code — detect `hooks/`, `utils/`, `lib/`, `components/common/`; do not invent a new convention), risk, checks that will run. Save the plan with the current file hashes (`progress.json`). **Stop and wait for approval.** The user may drop rows.

### Step 5 — Apply (level `apply`, approved plan only)
Before the first edit: re-hash every file in the plan; on mismatch, stop, name the file, re-plan that finding or ask. Then, one finding at a time:
1. Make the edit (extract or reuse) and update every call site.
2. Run the affected tests first, then the full checks. Compare against the **baseline**, not against "all green".
3. Green (no new failures) → `status: fixed`, write `progress.json`, optional atomic commit `refactor(dry): <what> (<finding id>)`.
4. Red (new failure) → restore the files from the per-finding snapshot taken before the edit and delete files the finding created (see `references/verification.md › Rollback`; never `git checkout` / `restore` / `stash` / `reset`, and never reverse-apply an index-relative `git diff` — the developer's own uncommitted edits stay), re-run the checks that went red and confirm they are back to baseline, then `status: reverted` with the failing check named, and continue with the next finding.
5. Mid-session, warn only if a file you are about to touch changed since the plan.

### Step 6 — Verify and close
Re-run the scanner with `--baseline .dry-refactor/raw-findings.json` (keep the first run as `raw-findings.before.json`). Report eliminated / new / remaining, per-finding status, checks run vs baseline, pre-existing failures still present, and anything you noticed but did not touch. Wording: "verified against available checks: <list>".

## 4. Never
- Edit before an approved plan; edit tests to make them pass; rename an export or change a prop/signature; "improve" adjacent code; merge two copies whose behavior differs without a human decision; introduce a flag-driven shared function; claim behavioral equivalence from a green run.
- Store anything in memory or outside `.dry-refactor/`. Suggest adding `.dry-refactor/` to `.gitignore` once.

## 5. Resume
If `.dry-refactor/progress.json` exists, read it first: scope, config, approved plan, hashes, per-finding status. Re-validate hashes for pending findings; continue from the first `pending`. Say what was done before and what remains.
