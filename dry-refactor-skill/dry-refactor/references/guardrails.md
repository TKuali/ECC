# Editing guardrails

Adapted from Andrej Karpathy's public observations about how models fail when editing
code (they assume, overcomplicate, bloat abstractions, and touch code they were not
asked to touch), as popularized in the community "karpathy-guidelines" checklist, and
from the instructions of Anthropic's `code-simplifier` (pr-review-toolkit) ("preserve exact functionality;
only recently modified code unless instructed otherwise"). Applied here to refactoring.

## Surgical changes
- Every changed line must trace to one finding in the approved plan.
- Do not "improve" adjacent code, comments, formatting, or naming.
- Do not refactor things that are not in the plan, even if they are obviously bad.
  Mention them in the closing report under "noticed, not touched".
- Remove only the imports/variables that **your** edit made unused. Pre-existing dead
  code stays unless the user asks.

## Match the repository, not your taste
- Same file naming, export style (default vs named), module system, quote style,
  semicolons, and folder for shared code as the repo already uses.
- Put the shared piece where the repo already keeps shared code. If there is no such
  place, choose the smallest sensible one and say so in the plan.

## Contracts are frozen
- Never rename or remove an export, a prop, a route path, a function signature, or a
  log label that tests or other modules could depend on.
- Never change error messages, status codes, or response shapes while extracting.
- A new shared piece may be exported only if the plan said so and the user approved.

## Extraction is not improvement
- The extracted function does exactly what the copies did — including their quirks.
  Fixing a quirk is a separate change with its own approval.
- Preserve the per-copy differences as parameters (endpoint, label, collection,
  dependency), not as branches inside the shared piece.

## Simplicity
- No abstraction for a single use. No configurability that was not requested.
- If the shared piece is longer than the copies it replaces, stop and reconsider.
- If you write 60 lines and it could be 20, rewrite it.

## Tests
- Never edit a test to make it pass. If a test breaks, the refactor was wrong or the
  test pinned a contract you changed — revert the finding, say which.

## Honesty in wording
- "verified against available checks: <list>" — never "proved", never "safe".
- Missing tests, skipped normalization, unparsed files, and pre-existing failures are
  always visible in the report.
