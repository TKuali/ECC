# Duplication patterns in React / Node.js code

One pattern per section: what it looks like, what the scanner shows, the suggested move,
and the risk to name. These are **strategies to consider**, not transformations to apply.
The organization (one rule, one explanation, one example) follows Vercel's public
React best-practices skill layout.

---

## R1 — Repeated fetch lifecycle in components
**Looks like:** several components each hold `data / loading / error` state and an
effect that fetches, guards with a `cancelled` flag, sets state, and cleans up.
**Scanner shows:** exact pass finds the state lines; normalized pass finds a cluster of
fragments split by the endpoint literal, the setter name, and the dependency.
**Suggested move:** one custom hook `useResource(url)` (or the repo's existing data
hook) returning `{ data, loading, error }`; components keep their rendering.
**Risk to name:** cleanup/cancellation semantics must be identical across copies (see
do-not-dry → behavior drift); the hook's dependency array must carry every input.
**Do not:** merge the render markup; hard-code labels or endpoints inside the hook.

## R2 — Near-identical components differing in copy, class, or endpoint
**Looks like:** `UserCard`, `OrderCard` … same structure, different strings.
**Suggested move:** one component with props for the differing values, *only if the
logic is duplicated too*. Markup-only similarity is a design-system question.
**Risk:** default export names are public contracts; keep the old files as thin
wrappers if other modules import them by name.

## R3 — Repeated JSX blocks inside one component
**Looks like:** the same `<li>…</li>` / `<tr>…</tr>` block written out three times.
**Suggested move:** extract a child component or map over data. Low risk when the
block has no local state.

## R4 — Repeated form-field wiring
**Looks like:** `value={form.x} onChange={(e) => setForm({...form, x: e.target.value})}`
plus the same error display, repeated per field.
**Suggested move:** a field component or a `bind(name)` helper; keep validation where
it is.
**Risk:** controlled/uncontrolled mix-ups; field-specific parsing (numbers, dates).

## R5 — Repeated async action state
**Looks like:** `busy / error` state + `try { await action() } catch finally` in every
button/handler.
**Suggested move:** `useAsyncAction(fn)` hook or an `ActionButton` component taking the
action and labels as props.

## R6 — Repeated derived-data computation
**Looks like:** the same filter/sort/group chain in several components or selectors.
**Suggested move:** one selector/helper in `utils/` or `lib/`; memoize only if it was
memoized before.

## N1 — Repeated handler shell (Express / Fastify / NestJS controllers)
**Looks like:** every handler repeats `try { lookup; if (!x) 404; return 200 } catch
{ log; 500 }`.
**Scanner shows:** normalized pass finds the shell; the collection name and log label
split it.
**Suggested move:** `asyncHandler(fn)` for the try/catch + 500, and/or a
`findOrFail(collection, label)` for lookup + 404. Keep per-route log labels as
parameters.
**Risk:** error body shape and status codes are contracts; per-route labels must
survive; middleware order must not change.

## N2 — Repeated validation
**Looks like:** the same "required, trimmed, max length" checks inline in several
routes/services.
**Suggested move:** one validator (or the repo's schema library if already used).
**Risk:** subtly different rules per route are *coincidental duplication* — check
before merging.

## N3 — Repeated response shaping
**Looks like:** `res.json({ data, meta: { page, total } })` assembled by hand in many
places.
**Suggested move:** `respond(res, data, meta)` helper.

## N4 — Duplicated middleware / auth checks
**Looks like:** the same header/token check copied into several routers.
**Suggested move:** one middleware mounted where the copies were; never widen or narrow
what it protects while extracting.

## N5 — Copy-pasted utility (formatters, slug/key builders, date math)
**Looks like:** `formatMoney` in a component when `utils/format.js` already exports
`formatCurrency`.
**Suggested move:** `reuse` — delete the copy, import the existing one. This is the
common "changes scope" finding.
**Risk:** the copy may have drifted (different rounding, locale default); diff them
before deleting.

---

## Reading a cluster
When the scanner reports a cluster (`C-n`) across the same files, open the enclosing
functions/components in each file, line up the fragments, and list the tokens in the
gaps. Those gaps are the parameters of the shared piece (R1: endpoint, setter,
dependency; N1: collection, label). If the gaps contain *logic* rather than values,
the cluster is probably coincidental — go back to do-not-dry.
