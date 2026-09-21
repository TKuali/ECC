# Monitoring Workflow

Use when the user explicitly asks for monitoring or a monitoring plan. A one-time
investigation does not imply permission to create a recurring job, subscribe to
a service, contact anyone, or publish findings. A plan alone has no scheduled
side effects. Use the host's supported scheduling tools only when the user asks
for actual recurring checks; keep cadence, subjects, sources, and delivery within
the requested scope.

1. Define entities, aliases, keywords, negative keywords, geographies, and languages.
2. Prioritize official feeds, RSS, regulator/CERT feeds, and page-change detection.
3. Select search/news alerts and relevant public organization or professional sources. Configure subscriptions only if requested.
4. Set cadence based on risk; avoid unnecessary high-frequency checks.
5. Deduplicate by canonical URL, title similarity, content hash, and event identity.
6. Define alert thresholds: source authority, novelty, severity, and corroboration.
7. Preserve important pages and record first-seen time.
8. Produce concise updates with what changed, why it matters, confidence, and next action. Deliver them through the user's requested channel; sending to other people or external services requires explicit instructions.

Keep a baseline and distinguish a genuine event from a changed URL, syndicated
repost, content edit, or temporary fetch failure. Record first-seen time,
publication/event time when known, and source availability separately. Do not
interpret a disappeared page as proof of a factual status change.

Unless the user asks for routine status updates, report meaningful changes,
material failures, or a decision that needs their input. Define the end date or
stop condition and how false positives or duplicate reports are handled. Do not
silently expand keywords or entities into unrelated personal research.

Do not use monitoring to locate a private individual or track their movements or
routines. Do not infer sensitive traits or aggregate unrelated personal accounts.
