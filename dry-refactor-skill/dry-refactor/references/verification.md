# Verification, rollback, resume

## What "verified" means here
Verified against the checks the repository already has. It never means proved
equivalent. A green run plus a lower duplicate count is evidence, not proof; say so.

## Baseline (before any edit)
1. Discover commands from `package.json` scripts: `test`, `lint`, `typecheck` / `tsc`
   / `type-check`. Note absent ones.
2. Run each once. Record pass/fail counts and the names of failing tests in
   `progress.json › checks.baseline`.
3. If there are no tests covering the target files: say so in the report, and before
   `apply` offer to write characterization tests (tests that pin current behavior)
   first. Do not refactor untested code silently.
4. Pre-existing failures: keep them visible in every later report as "pre-existing,
   unchanged". Never fix, delete, or skip them as part of this work.

## Per finding (apply)
1. Run the tests closest to the touched files first (path filter if the runner supports
   it), then the full suite, lint, and typecheck.
2. Compare to the baseline. New failure = red. Same failures as baseline = green.
3. Green → `fixed`. Red → revert (below) → `reverted` with the failing check named.

## Rollback — only your own changes

The working tree may already contain the developer's uncommitted edits, possibly in the
same files you are about to change. `git diff`, `git diff HEAD`, `git stash`,
`git checkout --`, `git restore` and `git reset` all measure against the index or a
commit, so every one of them would sweep those edits up with yours. Never use them for
this. The reference point is the working tree **as it was immediately before this
finding**, not what Git has recorded.

Before editing a finding (id `<id>`):
1. List every file the plan will modify and every file it will create.
2. Copy each file to be modified, byte for byte, to
   `.dry-refactor/snapshots/<id>/<same relative path>`.
3. Write `.dry-refactor/snapshots/<id>/manifest.json`:
   `{ "modified": [paths], "created": [paths], "hashes": { path: sha256-before } }`.
   Confirm each hash matches the hash recorded at plan approval; mismatch → stale plan
   (below), do not edit.

After editing, for the record only:
4. Save `.dry-refactor/patches/<id>.diff` by comparing the snapshot copies with the
   current files (`git diff --no-index <snapshot> <current>` per file, or an equivalent
   that never consults the index). This diff contains exactly your changes and nothing
   else. It is documentation; it is not the rollback mechanism.

To roll back:
5. For each `modified` path, copy the snapshot copy back over the current file.
   For each `created` path, delete the file. Do nothing to any other file.
6. Re-hash the restored files; each must equal `hashes[path]` from the manifest.
7. **Re-run the checks that went red.** They must return to the baseline state
   (same pass/fail set as before this finding). Only then record `status: reverted`
   with the failing check named. If they do not return to baseline, stop and report;
   something outside your snapshot changed.
8. Keep the snapshot until the closing report, then leave it in `.dry-refactor/`
   (gitignored) for the developer.

If, at step 5, a file's current hash matches neither your post-edit hash nor the
snapshot (someone edited it during the check run), stop, show both diffs, and ask.
Do not overwrite.

Sanity check you can apply to any rollback method: a developer's unrelated,
uncommitted line in a file you touched must be present after the rollback. If a
method cannot guarantee that, it is not a rollback of "only your own changes".

## Stale plans
- At approval, record the hash of every file the plan touches.
- Before the **first** apply and on **resume**, re-hash. Mismatch → mark that finding
  `stale`, name the file, re-plan it or ask. Findings whose files are unchanged may
  proceed if the user says so.
- Mid-session, do not re-hash everything after every finding; warn only if a file you
  are about to edit changed since the plan.

## Resume
- `progress.json` is written after every status change, so a new session can continue.
- On resume: re-read scope, config, plan, hashes; re-validate hashes for `pending`
  items; report what was done; continue from the first `pending`. The approval given
  in a previous session still stands for the unchanged items — do not re-ask.

## Closing report inputs
- Scanner re-run with `--baseline .dry-refactor/raw-findings.before.json`:
  eliminated / new / remaining ids.
- Per-finding status table.
- Checks: baseline vs final, pre-existing failures still present.
- "Noticed, not touched" list.
