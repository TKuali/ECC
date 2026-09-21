# Visual Verification and Geometry

Use for image/video provenance, public-scene geolocation, historical imagery,
or structured visual artifacts. The objective is an explanation that fits the
original scene, competing evidence, and exact requested viewpoint.
Do not infer a private person's whereabouts or reveal a private residence.

## Define the Target and Preserve the Original

Record requested granularity: country, city, public venue, street, object,
direction, coordinates, or time range. Specify the relationship: behind,
across from, adjacent, reflected, or viewed through. A venue address does not
answer every camera-direction question.

Preserve the original file and record name, dimensions, format, byte size,
relevant color/container metadata, and hash when available. Prefer originals
to screenshots. Inspect EXIF/XMP/IPTC and edit/export signals; metadata may be
missing, altered, inherited, or detached from the image's current caption.
For video preserve keyframe timestamps relative to the clip.

Missing metadata does not prove fabrication; a timestamp in metadata is not
automatically trustworthy. Separate provenance observations from conclusions.

## Inventory Before Committing to a Candidate

First describe the full scene without naming a place:

- Foreground, middle ground, and background.
- Environment and land use.
- Likely viewpoint, occlusion, reflection, cropping, and perspective.
- Permanent, seasonal, and transient features.

Then sweep a 3×3 or 4×4 grid and semantic regions. Crop information-bearing
areas instead of staring only at the most readable sign. Store raw observation,
alternate reading, interpretation, and external verification separately.
Use [visual-clue-inventory.csv](../templates/visual-clue-inventory.csv).

## Twelve Clue Families

### 1. Text and Writing System

Inspect partial words, scripts, diacritics, transliteration, letter shapes,
sign fonts, typography, postal/phone formats, domain suffixes, units, currency,
dates, and times. Preserve alternatives such as `NE?` or `[A/O]`.
A readable phrase may be common; a rare two-pixel character may be wrong.

### 2. Civic and Institutional Symbols

Inspect flag order, coats of arms, municipal seals, police/transit/postal/utility
branding, school or university symbols, heraldic arrangements, and plaque
sponsors. Generic symbols are weak; exact arrangements may be discriminative.
Symbols in a scene do not justify inferring a depicted person's beliefs.

### 3. Vehicles and Registration Systems

Inspect plate format, colors, separators, side bands, regional prefixes,
inspection stickers, fleet liveries, driving side, parking orientation, and
taxi/bus/emergency vehicle conventions. Use only regional fragments; do not
publish full private plates or link vehicles to private people.

### 4. Roads and Mobility Infrastructure

Inspect lane markings, curb paint, paving, tactile surfaces, guardrails,
bollards, barriers, sign/signal shapes, tram wires, rails, shelters, bike lanes,
drainage, snow equipment, and crossing design. Compare administrative systems,
not only one generic road feature.

### 5. Architecture and Construction

Inspect roof pitch/material, dormers, chimneys, gutters, window proportions,
shutters, balconies, air conditioners, masonry, insulation, floor count,
setbacks, plot width, party walls, and renovation period.
Match façade sequences and exact proportions rather than architectural style.

### 6. Street Furniture and Utilities

Inspect lamps, benches, bins, planters, tree grates, hydrants, cabinets,
meters, poles, manholes, fences, retaining walls, playgrounds, parking meters,
public Wi-Fi signs, and chargers. Procurement styles can help region inference,
but require independent corroboration.

### 7. Public Art and Distinctive Objects

Compare silhouette, pose, material, scale, carved details, clothing, emblems,
plaque position, damage, patina, grain, welds, base, and landscaping.
The same historical subject can have many statues; exact morphology matters.

### 8. Commerce and Institutions

Inspect business fragments, local chains, awnings, menus, opening-hour syntax,
storefront sequence, clinic/hotel/school/bank designs, delivery branding, and
unit numbers. Place public business addresses geometrically in the scene.
An address near the object is an anchor, not proof of the requested direction.

### 9. Physical Geography and Ecology

Inspect shoreline, terrain, geology, soil, water level, rock, erosion, trees,
plant species, pruning, crops, leaf state, bloom, snow, drought, and seasonal
maintenance. Common vegetation alone cannot support a precise location.

### 10. Light, Weather, and Temporal Signals

Inspect shadow direction/length, sun elevation, clouds, haze, rain, wet ground,
artificial lighting, clothing, construction, and temporary events or adverts.
Use these to constrain a time range, not manufacture an exact timestamp.

### 11. Media Provenance and Manipulation

Inspect screenshot borders, UI, credits, watermarks, recompression, resampling,
inconsistent blur/noise/shadows, clone regions, generative artifacts, and crop
lineage. Trace earliest verified appearances and compare uncropped versions.
Visual oddities are leads; they do not by themselves prove synthetic media.

### 12. Negative and Relational Clues

Record what should be visible but is absent: water, terrain, building order,
vegetation, road systems, or seasonal features. Compare object-to-road,
camera-to-object, and foreground-to-background ordering. Impossible adjacency
can reject a near-match faster than more supporting text searches.

## Extract and Rank Without Inventing Detail

Try targeted crops, perspective correction, rotation, contrast, sharpening,
channel/grayscale views, or another original frame when useful. Treat OCR as
candidate readings and compare against the source. Search alternatives before
combining them. Generative restoration is never factual evidence.

For structured carriers preserve every reproducible payload. Test source- or
structure-signaled rotations, mirrors, inversion, thresholds, channels, or layers.
Record each transformation and output; the first valid QR/barcode decode need
not exhaust the artifact. Do not execute decoded content or brute-force changes.

Score clues 0–3 for readability, specificity, stability, independence, and
falsifiability when prioritization helps. Keep weak observations with lower
confidence rather than silently upgrading or discarding them.
At least three families should normally be considered before exact geolocation.

## Search Independent Lanes and Keep Candidates

Use separate lanes for text, exact object/reverse image, administrative systems,
built environment, landscape/time, and provenance. Select the next lane by the
current evidence gap, not a compulsory sequence. Search with original-language
fragments and local sources where useful.

Keep multiple plausible candidates, normally 2–5, plus unresolved/other.
Do not invent candidates if only one real lead exists; label the search gap.
For each, record generation reason, supporting families, unknowns,
contradictions, and the cheapest discriminator. A city guess is not a scene match.

Use [location-candidate-matrix.csv](../templates/location-candidate-matrix.csv):

| Score | Meaning |
|---|---|
| +2 | Exact or highly distinctive match |
| +1 | Compatible but non-unique |
| 0 | Unknown or untestable |
| -1 | Tension or weak mismatch |
| -2 | Direct contradiction |

Record source and reasoning for nonzero scores. Weighted totals organize work;
they cannot erase a contradiction or substitute for missing geometry.
Multiple reposts of one photograph or copies of a tourism article are one
source lineage. Seek different mechanisms, not merely different websites.

## Verify Exact Geometry and Time

Once a venue is plausible, compare exact object position, camera side, façade
sequence, roofline, roads/paths/water/fences/vegetation order, camera heading,
and field of view. Determine which street is behind, across from, or adjacent
to the camera. Multiple venue entrances can have different addresses.

Use official maps, parcel/building footprints, public address points,
satellite/aerial imagery, street imagery from multiple dates, business anchors,
other viewpoints, terrain, or sun-position tools as available.
The map must explain the photograph's spatial relationships.

Perform two deliberate falsification checks where feasible: compare a duplicate
object, exact damage/plaque/silhouette, incompatible regional system, opposite
viewpoint, older scene, or the runner-up with equal rigor. Ask what must be
visible if the hypothesis is true and check for it. Preserve mismatches.

Separate capture, upload/publication, event, and archive dates. Use construction
history, signage, weather, shadows, vegetation, schedules, and provenance to
bound the relevant interval. Current imagery does not establish a historical
scene. Prefer a range when precise dating lacks independent support.

## Answer Gate and Report

Before a definitive precise location, verify:

- The exact question and viewpoint relationship are answered.
- Whole-frame inventory and alternate readings were considered.
- City/region has independent clues or an exact authoritative source.
- Exact-object identity was tested against near-matches.
- Required camera/object/road geometry is reproducible.
- Relevant time and source lineage are checked.
- Falsification attempts, contradictions, and alternatives are recorded.
- No material original or signaled transformation remains unresolved.

An authoritative source identifying an exact object can reduce source count,
but cannot remove a geometry requirement. Confidence follows the weakest
necessary link: observation, identity, region, geometry, time, or independence.
If the gate fails or the budget ends, return candidates and missing checks.

Use [image-geolocation-report.md](../templates/image-geolocation-report.md).
The visual helper initializes that report and the two CSV templates; it scores
annotated candidate rows but does not verify images, sources, or conclusions.
