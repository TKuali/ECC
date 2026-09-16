# When a match must be left alone

The scanner proves that text matches. It never proves that two blocks should share one
implementation. Run every candidate through this list before choosing `extract` or
`reuse`. If any rule applies, the decision is `leave-alone` or `report-only`, with the
rule named in `reason`.

## Coincidental duplication (same shape, different reasons to change)
Two blocks that look alike today but are owned by different rules — tax vs discount vs
shipping credit, validation for two unrelated forms, two reports that happen to group
the same way. Ask: *if the business changes one of these next month, should the other
change too?* If no, leave them. A shared function here couples owners who never agreed
to be coupled.

## Behavior drift
Copies that are near-identical but differ in behavior: one cancels a request on unmount
and one does not; one rounds half-up and one floors; one logs and one swallows. This is
either a bug in one copy or an intentional difference. Either way it is a human decision:
`report-only`, name the difference precisely, ask.

## Rule of three, and what two copies are allowed to do
- 3+ copies → may propose `extract`.
- 2 copies → may propose `reuse` only when one of them (or something else in the repo)
  is already the shared version. Two copies never justify a **new** abstraction.

## The flag test
If the shared version would need `mode`, `kind`, `isX`, or an options object whose
branches select different behavior, the copies are not duplicates of one thing — they
are different things with a shared skeleton. Leave them.

## Never merge
- Test files, fixtures, mocks, stories, generated code, migrations, lockfiles, config.
- Copies that live in different packages/services with independent release cycles
  (report as "cross-package duplication" and stop).
- Code the user has said is being deleted or rewritten.
- Matches inside comments or string/template literals (exact pass can produce these).
- Trivial structure: closing braces, import blocks, boilerplate the framework requires
  (`export default`, `module.exports`, prop-types stubs).

## Fine to leave, say so, move on
- A one-line guard repeated in several functions. Extracting it can be proposed but is
  optional and low value; never block the plan on it.
- Similar JSX markup. Markup that looks alike is usually a design system question, not
  a DRY question. Only merge markup when the *logic* around it is also duplicated.
