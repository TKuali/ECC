# Worked Example: A Plausible Venue That Fails Geometry

This is a synthetic teaching case. Places, documents, dates, filenames, and
observations below are invented; no live retrieval or successful investigation
is claimed. The packet is described so the reasoning can be checked without
external services. Do not reuse its invented answer in a real case.

## Question and Packet

Question: "Which street was behind the camera in this public-square photograph,
and does the image establish that a festival happened there in May 2025?"

The supplied packet contains:

- E1 `square-original.jpg`: a royal statue, partly readable plaque, water,
  parked cars, and a row of three red-roofed storefronts; no reliable capture date.
- E2 `caption.txt`: "King's Garden festival, May 2025" with a public tourism URL.
- E3 `tourism-export.html`: the tourism page and two syndicated copies, all using
  the same cropped photograph and caption.
- E4 `municipal-plan.pdf`: a dated municipal map with two royal-statue sites,
  King's Garden and Riverside Square.
- E5 `archive-record.txt`: a trustworthy archive record containing E1's exact
  image bytes in August 2023.

Scope: verify scene and claim from this packet plus any specifically authorized
public checks; do not identify people. Stop if geometry or the historical
claim cannot be resolved with available evidence.

## Inventory and Competing Hypotheses

Preserve E1 and its hash, then record observations before searching:

| Clue | Raw observation | Family | Interpretation or uncertainty |
|---|---|---|---|
| C1 | Plaque begins `King ...` | Text | Several statues could fit |
| C2 | Statue has a notch on the left shield edge | Exact object | Potentially distinctive |
| C3 | Water behind a low fence | Geography | Lake, river, or artificial pond |
| C4 | Statue → road → three storefronts | Relational geometry | Must match site orientation |
| C5 | Storefronts form a stepped roofline | Architecture | More useful than generic red roofs |

H1: King's Garden, suggested by E2/E3. H2: Riverside Square, the alternative in
E4. H3: another/unresolved scene. Keep confidence low while E4/E5 remain unread.
The three tourism pages are one source lineage, not three confirmations.

## Cheapest Decisive Test

Before gathering more supporting descriptions for H1, compare its map geometry
against C3/C4: can water, road, and storefronts appear in the observed order?
This is cheaper and more discriminating than another search for royal statues.

| Candidate action | Expected discriminator | Decision |
|---|---|---|
| Read E4's King's Garden layout | Road/frontage order agrees or contradicts | Execute first |
| Search the plaque phrase again | Likely repeated tourism lineage | Defer |
| Inspect E5's archive date | Image predates the festival claim or not | Execute for time claim |

E4 places King's Garden's statue inside a walled garden, with no road between
the statue and adjacent buildings. H1 fails C4. Record the contradiction rather
than interpreting the road away. E2's caption does not override the original.

## Representation Pivot and Geometry

Move from narrative captions to E4's map and the uncropped image E1. Suppose the
packet's map shows Riverside Square's statue west of a road and the stepped
storefronts east of it. Its documented alternate view also shows the shield notch.

These are two mechanisms: exact-object morphology and spatial layout.
From the verified camera side, the map places Harbor Street behind the camera;
the square's postal entrance is on Market Lane. Returning Market Lane would
answer the address question, not the requested viewpoint question.

Falsification 1: H1's tempting near-match fails road/building order.
Falsification 2: compare the opposite camera side at H2; it would put the water
and storefronts in incompatible positions. Only the stated viewpoint fits.
If the packet lacked the alternate view or adequate map detail, report H2 as
provisional instead of inventing the missing geometry.

## Separate the Historical Claim

E5 establishes that the same image existed by August 2023. It cannot by itself
show a May 2025 festival. Archive time is not capture time, so the exact capture
date remains unknown. The festival's existence is a separate question requiring
a dated programme, official event record, or independent contemporary evidence.

Do not search progressively modified festival captions to rescue E2. Mark its
use of this image as misleading and reopen the event branch if further records
become available. When the budget ends, leave the event itself unresolved.

## Example Report

**Scene:** Harbor Street is behind the camera, supported in this synthetic packet
by the original image's object/road/frontage order, exact shield detail, and
municipal geometry. Confidence is high under those stipulated observations.

**Time claim:** The image does not establish a May 2025 festival. E5 shows the
same bytes existed by August 2023; exact capture date and whether a festival
occurred in May 2025 remain unknown.

**Source lineage:** E2/E3 and their copies share one caption/image lineage.
E1/E4 support the scene; E5 supplies a separate time bound.

**Next discriminator:** A primary May 2025 event record. The task can finish
with that unresolved branch; geometry certainty must not spill into event certainty.

The transferable method is whole-frame inventory → cheapest geometric falsifier
→ representation pivot → exact-scene check → separate historical test. It is
not a memorized venue, street name, or fixed search engine sequence.
