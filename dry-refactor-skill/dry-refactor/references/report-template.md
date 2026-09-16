# Output templates

Use these shapes verbatim (headings and column names). The skill-tester measures
format conformance against them.

## Report (level: report)

```
# dry-refactor · report
Scope: <path | changes vs <ref> | snippet>   Passes: exact[, normalized]   Baseline checks: <test: n pass / m fail (pre-existing: …) | lint: ok | typecheck: n/a | none found>

## Candidates
| ID | Pattern | Copies | Lines | Evidence | Decision | Reason | Risk |
|---|---|---|---|---|---|---|---|
| C-1 (D-…, N-…) | R1 repeated fetch lifecycle | 4 | 9 | exact+normalized cluster, 4/4 files normalized | extract | identical lifecycle; gaps are endpoint/setter/label | low — no exports change; covered by contracts.test.mjs |
| D-… | coincidental | 3 | 4 | exact | leave-alone | do-not-dry: different rounding per owner | n/a |
| D-… | N5 copy of existing helper | 2 | 3 | exact; 1 copy in changes | reuse | utils/format.js already exports formatCurrency | low — only Receipt.jsx changes |

## Coverage
Scanned <n> · ignored <n> (<top reasons>) · failed <n> · normalized: attempted <n>, supported <n>, skipped <n> (<reasons>)
Snippet scope: "evidence from reading; no repository context; callers/imports unchecked."

## Next
<one line: "Say `plan` for a proposal on the extract/reuse rows." | "Nothing to propose."> 
```

## Plan (level: plan)

```
# dry-refactor · plan  (awaiting approval)
| # | ID | Action | Shared piece (location) | Files touched | Stays unchanged | Checks that will run | Risk |
|---|---|---|---|---|---|---|---|
| 1 | C-1 | extract | src/hooks/useResource.js (repo has no hooks dir; smallest sensible location) | UserCard.jsx, OrderCard.jsx, InvoiceCard.jsx, ShipmentCard.jsx | default exports, { id } prop, endpoints, Spinner/ErrorBanner usage | npm test | low |
| 2 | D-… | reuse | (existing) src/utils/format.js | Receipt.jsx | format.js untouched | npm test | low |

Not proposed: D-… (leave-alone — <reason>), D-… (report-only — behavior differs: <difference>; decide first).
Pre-existing failures that will remain: <names | none>.
Approve with "apply" (all rows) or "apply 1" (subset). Plan saved with file hashes.
```

## Apply progress (one line per finding, as it happens)

```
[1/2] C-1 extract → src/hooks/useResource.js · call sites 4 · npm test 4 pass / 0 new failures · fixed · commit abc123
[2/2] D-… reuse → Receipt.jsx · npm test … · fixed
```

## Close (after apply)

```
# dry-refactor · close
Rescan vs before: eliminated <n> (<ids>) · new <n> · remaining <n>
| ID | Status | Detail |
|---|---|---|
| C-1 | fixed | useResource.js added; 4 components updated |
| D-… | reverted | routes.test.mjs › "thrown → 500" failed; hunks reverse-applied |
| D-… | skipped | user declined |
Checks: baseline test 3 pass / 1 fail → final 3 pass / 1 fail (pre-existing unchanged: legacy.test.mjs) · lint ok · typecheck n/a
Verified against available checks: <list>. Not proven equivalent.
Noticed, not touched: <items or none>
```

## Snippet apply

Same as Close but headed `# dry-refactor · rewrite (UNVERIFIED — not run against a repository or tests)` followed by the rewritten code and an `Assumptions:` list.
