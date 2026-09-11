# Medici — Art Direction

**Date:** 7 September 2026 · Living document, not dated-superseded
**Source of truth for:** the look of every asset, client-drawn or AI-generated
**Derived from:** `docs/brief/reference-characters.jpg` (the client's character sheet)

---

## Why this exists

Some of the artwork will come from the client and some will be generated. That only works if both
streams land in the same world, so this file describes the look precisely enough that a generated
background can sit behind a client-drawn patient without either looking wrong. It is also the
prompt source: every generated asset is prompted from the vocabulary here plus the character sheet
as an image reference, never from a fresh description invented on the spot.

Everything below is observed from the character sheet. Colours are sampled by eye and are targets,
not exact matches — the client's own files always win where they disagree.

## The look in one paragraph

Soft cel-shaded storybook illustration. Dark-brown lineart of a single uniform weight, never black.
Flat lighting from the front with one soft shadow tone per colour and no highlights, no gradients,
no ambient occlusion, no rim light. A muted earthy palette — browns, olives, warm creams, dusty
rose, one desaturated purple — with nothing fully saturated and nothing pure white or pure black.
Faces are simple and warm: large dark eyes, a minimal nose, a thin mouth, freckles on the young
characters. Calm, unhurried, clinical without being cold.

## Lineart

- Colour `#3A2A22` (dark warm brown). Never `#000000`.
- Uniform weight, roughly 2 px at the 1× on-screen size, scaled with the drawing.
- Closed outlines around every form; interior detail lines (folds, pockets, hair strands) are drawn
  in the same brown, sparingly. A garment gets three or four fold lines, not fifteen.
- No line tapering, no sketchy double strokes, no visible construction lines.

## Shading

One shadow tone per base colour, roughly 12–15% darker, applied as a hard-edged cel shape on the
underside of forms — under a chin, beneath a sleeve, inside a fold. No second shadow tone, no
gradient, no specular highlight. The light reads as flat and frontal, which is why characters can be
recomposited onto any background without relighting.

## Palette

Sampled from the character sheet. Use these as anchors; interpolate within the family rather than
introducing a new hue.

| Role | Hex | Where it appears |
|---|---|---|
| Lineart | `#3A2A22` | Every outline |
| Skin base | `#E8B98F` | All six characters |
| Skin shadow | `#C99268` | Under chin, sleeves |
| Hair dark | `#2E2320` | Young man, girl, boy |
| Hair grey | `#A9A29B` | Older man, older woman |
| Earth brown | `#8A5A34` | Cardigan, trousers |
| Deep brown | `#6B4230` | Skirt, pinafore |
| Charcoal | `#3B3F42` | Sweater, jeans, shorts |
| Muted purple | `#56397F` | Turtleneck |
| Mauve | `#9C7E8E` | Older woman's cardigan |
| Olive | `#7A8355` | Boy's t-shirt |
| Dusty rose | `#E8A0A0` | Girl's top, hairband |
| Warm cream | `#EDE3D3` | Shirts, shoes, paper |

Two colours are reserved and appear nowhere in the artwork, because the interface needs them to mean
something: a signal red for the wrong-answer flash and the collimation target marker, and the pale
yellow of the collimation light rectangle. Do not use either as a costume or prop colour.

## Characters

- Front-facing, feet visible, standing on nothing — no ground shadow, no baseline.
- Adults are roughly 8 heads tall; the two children are roughly 6 heads and stand at about 62–65%
  of adult height. Keep that ratio when a child and an adult appear in the same scene.
- Faces: large dark almond eyes with no visible white at the corners, a two-stroke nose, a thin
  closed mouth. Ears are implied, not detailed. Freckles on the young man, the boy, and the girl.
- Body habitus is part of the medical content, not a style choice — see the patient list. The sheet
  as drawn reads sthenic to hyposthenic throughout; if a level ever calls for a hypersthenic
  patient, that is new artwork, not a recolour.

## Backgrounds

The one place the style loosens. Backgrounds may be more painterly than the characters — softer
edges, a little texture — but they stay in the same palette and keep the same flat frontal light.
Two rules that matter more than the detail:

- **Lower contrast than the characters.** A character must read instantly against any background.
  Keep background values in the middle of the range; no deep blacks, no blown highlights.
- **Leave the stated area clear.** Each background's entry in the asset list names the part of the
  frame the game draws on top of. Detail put there is detail thrown away.

Perspective is straight-on or very slightly angled. No dramatic camera, no vanishing point that
fights the flat characters.

## Interface

Rounded corners (8–12 px at 1×), the same brown lineart at a slightly lighter weight, flat fills
from the palette, one soft shadow tone. Panels and buttons ship blank — every word in the game is
drawn as text by the code, so no asset contains lettering except the logo.

## Radiographs are exempt

The fifteen X-ray films follow radiographic convention, not this document: greyscale on black,
correct anatomy, and a genuine difference between the under-, optimally, and overexposed versions.
They are the only assets that must be medically accurate, which is why they are the only ones that
will never be generated. See the films list.

## Generating an asset

When a file is missing and the game is showing a labelled grey box, the fallback pipeline in spec
§7.2 fills it. The prompt is assembled from three parts, in this order:

1. `docs/brief/reference-characters.jpg` attached as the style reference image.
2. The style paragraph and the relevant palette rows from this file, verbatim.
3. The asset's own description from its checklist, verbatim.

Nothing else. Do not embellish the description, do not add mood words, do not ask for "highly
detailed" or "4k" — this style is defined by restraint and those words break it. Generated files go
to `public/assets/generated/` and never move out, so the client can always see what is standing in
for what.

Consistency across a generated set matters more than the quality of any one file. Generate a group
in a single session with the same reference and settings; if one image drifts, regenerate it rather
than accepting a near-match.
