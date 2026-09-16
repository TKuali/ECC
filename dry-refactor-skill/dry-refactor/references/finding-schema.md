# Files the skill reads and writes

All under `.dry-refactor/` in the repository root (suggest adding it to `.gitignore`).

| File | Written by | Rule |
|---|---|---|
| `raw-findings.json` | scanner | scanner evidence only — **never edited** by the skill |
| `raw-findings.before.json` | skill (copy) | the first scan of a session, used for the closing `--baseline` comparison |
| `coverage.json` | scanner | what was scanned / ignored / failed / normalization coverage |
| `assessments.json` | skill | one assessment per finding or cluster, keyed by id |
| `progress.json` | skill | scope, config, baseline checks, approved plan, hashes, per-finding status |

Keeping raw results separate from assessments makes it possible to tell detector
errors from judgment errors, and to re-judge without rescanning.

## raw-findings.json (scanner)
```json
{
  "version": "1.0.0",
  "generated_at": "2026-09-15T14:02:11.000Z",
  "cwd": "/repo",
  "scope": ["src"],
  "config": { "min_lines": 6, "min_tokens": 40, "min_chars": 120, "normalized": true, "changed": false, "diff_base": null, "ignore": [] },
  "changes": { "ref": "HEAD", "error": null, "files_with_changes": 2 },
  "summary": { "files_scanned": 41, "exact_findings": 3, "normalized_findings": 5, "normalized_subsumed": 1, "clusters": 2, "intersecting_changes": 1, "duplicated_lines_exact": 54 },
  "file_hashes": { "src/a.js": "<sha1>" },
  "findings": [
    {
      "id": "D-9358fcea",
      "match_type": "exact",
      "advisory": false,
      "lines": 6, "approx_tokens": 52, "chars": 210,
      "content_hash": "<sha1>",
      "cluster": "C-1",
      "intersects_changes": false,
      "locations": [ { "file": "src/components/UserCard.jsx", "start_line": 7, "end_line": 13, "in_changes": false } ],
      "preview": "first three lines…"
    },
    {
      "id": "N-6b26db2a",
      "match_type": "normalized",
      "advisory": true,
      "tokens": 71, "lines": 9, "chars": 300,
      "subsumed_by": null,
      "cluster": "C-1",
      "locations": [ { "file": "…", "start_line": 6, "end_line": 14, "start_token": 30, "end_token": 101 } ]
    }
  ]
}
```
IDs are content-based (`D-` exact, `N-` normalized): the same duplicated text yields
the same id across runs, which is what makes `--baseline` diffs meaningful.

## assessments.json (skill)
```json
{
  "generated_at": "…",
  "raw_findings_generated_at": "…",
  "items": {
    "C-1": {
      "covers": ["D-9358fcea", "N-6b26db2a", "N-580f73a0"],
      "pattern": "R1 repeated fetch lifecycle",
      "evidence": "exact 6 lines × 4 copies + normalized fragments in one cluster; normalization supported for 4/4 files",
      "decision": "extract",
      "reason": "identical lifecycle incl. cancellation in all 4 copies; differences are endpoint, setter, label — values not logic",
      "risk": "low: no exports change; render untouched; covered by tests/contracts.test.mjs",
      "copies": 4,
      "contracts_touched": [],
      "callers": ["src/pages/Dashboard.jsx"],
      "checks_covering": ["tests/contracts.test.mjs"]
    },
    "D-1e9e595c": {
      "pattern": "coincidental",
      "evidence": "exact 4 lines × 3 copies",
      "decision": "leave-alone",
      "reason": "do-not-dry: same shape, different rounding mode per owner (tax vs discount vs shipping)",
      "risk": "n/a"
    }
  }
}
```
`decision` ∈ `extract` | `reuse` | `report-only` | `leave-alone`.

## progress.json (skill)
```json
{
  "session_started": "…",
  "scope": ["src"], "scope_kind": "path",
  "config": { "min_lines": 6, "normalized": true },
  "checks": {
    "commands": { "test": "npm test", "lint": "npm run lint", "typecheck": null },
    "baseline": { "test": { "pass": 3, "fail": 1, "failing": ["tests/legacy.test.mjs › legacy: pagination default is 50"] }, "lint": { "ok": true } }
  },
  "plan": {
    "approved_at": "…",
    "approved_by_message": "Plan approved. Apply all three.",
    "items": [
      { "id": "C-1", "action": "extract", "shared_piece": "src/hooks/useResource.js", "files": ["src/components/UserCard.jsx", "…"], "unchanged": ["default exports", "{ id } prop", "endpoints"], "risk": "low" }
    ],
    "file_hashes": { "src/components/UserCard.jsx": "<sha1 at approval>" }
  },
  "items": {
    "C-1": { "status": "fixed", "checks": { "test": { "pass": 3, "fail": 1, "new_failures": [] } }, "commit": "abc123", "finished_at": "…" },
    "D-…": { "status": "reverted", "reason": "tests/routes.test.mjs › thrown → 500 failed after edit; hunks reverted" },
    "D-…": { "status": "skipped", "reason": "user declined" },
    "D-…": { "status": "pending" }
  }
}
```
`status` ∈ `pending` | `fixed` | `reverted` | `skipped` | `stale` (hash mismatch, needs re-plan).
