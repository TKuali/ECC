# Attribution and License

This skill adapts **THE HUNTER** (`awesome-osint-operator`, source version 1.4.0)
by shoyann, preserving its adaptive investigation, visual verification, evidence
handling, and investigation-trace audit methods.

- Source: [shoyann/RZK-The-Hunter](https://github.com/shoyann/RZK-The-Hunter)
- Pinned revision: [2ef02bcfd7f021b4b5287d0ff52f03aafa79e448](https://github.com/shoyann/RZK-The-Hunter/tree/2ef02bcfd7f021b4b5287d0ff52f03aafa79e448)
- Adapted material: upstream instructions, references, workflows, templates,
  examples, Python helpers, tests, and catalog entries.
- License: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).

THE HUNTER in turn credits **Awesome OSINT**, by jivoi and contributors,
also under CC BY-SA 4.0: [jivoi/awesome-osint](https://github.com/jivoi/awesome-osint).
The selected entries in `references/catalog.json` derive from that catalog via
the pinned Hunter revision. Linked tools retain their own licenses and terms.
Entries are discovery leads, not endorsements or claims of current availability;
verify access, terms, privacy fit, and relevance before use.

## ECC Adaptation

- Renamed the entrypoint to `osint-investigation` and consolidated overlapping
  instructions into references loaded only when needed.
- Included a small, selected tool index. The optional `--catalog` input accepts
  a compatible local catalog; the full directory, raw source snapshot, refresh
  machinery, and standalone release metadata are not bundled.
- Kept offline standard-library helpers for search, workflow selection, evidence
  logging, visual candidate comparison, and advisory trajectory checks. Added
  input validation, regression tests, and installed-path portability checks.
- Replaced the upstream private-person location exception with official-notice
  authenticity/status verification. Public professional research, account
  provenance, authorized exposure checks, and public-scene verification remain.
- Uses ECC's existing installation, registration, and test mechanisms. The source
  version identifies provenance, not a separate ECC release or a model benchmark.

This directory, including these adaptations, remains **CC BY-SA 4.0**, not MIT.
The full license is [LICENSE.txt](LICENSE.txt). This notice does not change the
license of other ECC files. No endorsement by upstream authors is implied.
