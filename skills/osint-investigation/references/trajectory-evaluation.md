# Advisory Trajectory Audit

The optional helper audits an annotated investigation log for repetition,
stalls, delayed contradiction handling, and premature finalization.
It does not execute actions, verify sources, approve an answer, or measure
a model's actual solve rate. Successful tests demonstrate auditor behavior only.

## When to Use It

Use after recording a longer investigation or when repeated searches may be
hiding lack of progress. Do not create detailed logs for every simple lookup.
Keep raw evidence and interpretations in the case records; the trace links them.
Annotation is self-report until an independent assessor checks the originals.

## Input and Invocation

Save a UTF-8 JSON trace in the user's case workspace. Replace `<skill-dir>`
with the installed skill directory; the input path refers to the case file.

```bash
python "<skill-dir>/scripts/trajectory_eval.py" case/trajectory.json
python "<skill-dir>/scripts/trajectory_eval.py" case/trajectory.json --window 5 --strict
```

This minimal valid trace shows a reported primary check, not a real retrieval.
Copy it to `case/trajectory.json` only for a smoke test; use observed actions
and actual artifact references for a real investigation.

```json
{
  "schema_version": 1,
  "case_id": "synthetic-example",
  "requirements": ["temporal"],
  "actions": [
    {
      "id": "A1",
      "kind": "verify",
      "objective": "Check whether the image predates the claimed event",
      "representation": "archived image",
      "habitat": "supplied archive record",
      "query_family": "",
      "hypothesis": "H1",
      "expected_discriminator": "Earlier matching bytes refute this image as event evidence",
      "outcome": "The synthetic record contains matching bytes two years earlier",
      "source_clusters": ["archive-origin"],
      "evidence_refs": ["E5: synthetic archive record"],
      "progress": ["contradiction"],
      "hypothesis_status": "contradicted",
      "contradicts": ["H1"]
    }
  ]
}
```

## Schema and Meaning

Top-level fields are exactly `schema_version`, `case_id`, `requirements`, and
`actions`. Version is integer `1`. Requirements may include `geometry`,
`temporal`, and `carrier_complete`; an empty array is valid. An assessor chooses
applicable requirements from the question, not from the proposed answer.

Every action requires the fields through `progress` shown above. IDs are unique.
Kinds: `search`, `verify`, `falsify`, `pivot`, `meta_search`, `transform`, `finalize`.
A search requires a nonempty `query_family`. `hypothesis` may be empty.
Source clusters identify underlying lineages, not just hostnames.

Allowed progress: `new_primary`, `new_identifier`, `candidate_narrowed`,
`confidence_changed`, `contradiction`, `new_discriminator`, `decisive`.
Progress requires an outcome and evidence references. A new tool, query,
representation, or habitat alone is procedural change, not progress.

Optional fields:

- `hypothesis_status`: open/leading/contradicted/verified, with a hypothesis ID.
- `contradicts`: affected IDs, requiring evidenced contradiction progress.
- `resolves`: IDs of outstanding contradictions explicitly resolved by evidence;
  requires confidence-changed progress. A verified label or reopening as `open`
  clears nothing. Marking a candidate `contradicted` abandons it and clears its
  outstanding contradiction from the active candidate set.
- `checks`: booleans on a finalize action. Base checks are `primary_resolved`,
  `direct_support`, and `falsification`, plus applicable case requirements.

For example, a temporal case needs all three base checks and `temporal` true
before its annotated finalization can pass. This still does not prove truth.
Never fabricate checks to silence warnings or store credentials/private data.

## Output and Limits

Metrics include progress ratio, repeated-search ratio, first decisive action,
leading-to-contradicted distances, unresolved leading hypotheses, contradiction
response distances, representation/habitat changes, and unsupported finalizations.

`STALLED` flags the configurable no-progress window, default 3. It is advisory:
a long extraction may be worthwhile. Repetition means the same query family,
representation, and habitat with no new source cluster or progress.
`UNSUPPORTED_FINALIZATION` flags missing checks or unresolved contradictions.
Empty traces return `INSUFFICIENT_DATA`, zero counts, and null ratios.

Exit 0 means the audit ran, not that a case was solved. `--strict` exits 1 when
warnings exist. Invalid JSON/schema/fields/booleans/duplicate IDs exit 2.
Review warnings against the actual evidence rather than blindly changing methods.

For genuine behavioral evaluation, fix model, tools, source snapshots, budgets,
and retry policy; run fresh contexts; preserve complete observed outputs; have
an independent assessor inspect artifacts and temporal/geometry/carrier checks.
Report unresolved cases, source loss, unsupported conclusions, and overhead.
Synthetic annotated traces are not observed model investigations or benchmarks.
