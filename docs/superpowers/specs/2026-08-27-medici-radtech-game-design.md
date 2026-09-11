# Medici — Radtech Simulator: Design Spec

**Date:** 2026-08-27
**Revised:** 2026-09-10 — the client's case database folded in; the game grows from five levels to twenty. See §13.
**Status:** Approved
**Supersedes:** the client's brief (`docs/brief/client-brief-2026-08.pdf`, originally "WEBSITE DETAILS (SEND TO DEVELOPER).pdf") as the working design, and — since the 2026-09-01 revision — the level flow described in `docs/client/2026-08-27-client-briefing.md` §3, §5, and its FAQ. The PDF stays as the source brief; where any of them disagree with this file, this file wins. The client's style reference is `docs/brief/reference-characters.jpg` (originally `asset1.jpg`).

## 1. What we are building

A browser-based learning activity in which the student plays a radiologic technologist. Each of twenty levels presents one patient with one injury, and the student walks them through the real X-ray workflow: read the order, choose the position, set kVp and mAs, collimate, take the exposure, read the film. The twenty cases come from the client's own case database and are grouped into six sections — chest, upper extremity, lower extremity, abdomen, skull, and a six-case refresher set that revisits every region.

It is a teaching tool wearing a game's clothes, not a casual game. The student gets one attempt at each decision, the console does not tell them what the right answer was, and the radiograph they produced is the first honest feedback they see. Stars record how cleanly they worked; a debrief at the end of every case explains each decision they got wrong. There is no fail state and no way to lose — but there is also no way to fish for the right answer by retrying.

The look is a Flash-era job simulator (Papers Please, Good Pizza Great Pizza, Superhero Hospital): a fixed cartoon stage, everything on one screen, snappy tweens. The art is the client's; see §7.

**Audience:** radiography students, playing on laptops and phones.
**Client:** a friend of the developer who owns the medical content and the art. The developer (Vai) builds it solo with Claude Code.

## 2. Decisions already made

| Decision | Choice | Why |
|---|---|---|
| Platform | Browser, desktop + mobile touch, landscape | One build, shared by link; matches the brief |
| Engine | Vite + React 19 + TypeScript, DOM-first | The game is ~90% UI; DOM gives free text, touch, and instant hot reload; it is the stack Claude Code is most reliable in. Phaser can be embedded per-level later if a spatial level ever appears. |
| Framing | A learning activity, not a casual game | Client, 2026-09-01. Drives every decision below: no retries, no celebration, deferred feedback, a debrief |
| Level count | Twenty, in six sections | Client, 2026-09-10. Every case in their database is a level; the sections are theirs, read from the database's own left-hand column |
| Medical source | `docs/brief/case-database-2026-09.pdf`, transcribed to the `.md` beside it | Client, 2026-09-10. Replaces the AI-drafted cases entirely. The PDF is authoritative; the transcription exists only because the PDF's table cannot be quoted from reliably |
| Loop | Six playable stages plus a result screen; the brief's "assess the patient" step is cut | Client, 2026-09-01 |
| Feedback | One attempt per decision. Wrong choices are explained, never re-offered | Client, 2026-09-01. Retrying until correct teaches the student to guess |
| The radiograph | Determined solely by kVp/mAs, and hidden until the exposure is taken | Client, 2026-09-01. The film is the consequence of the technique, and a consequence you can preview is not one |
| Scoring | 3-star per case, no lives, no fail state | Replayable for a better score; the star count is the only thing a mistake costs |
| Timers | Always on, not configurable | Client, 2026-09-01 |
| Hints | None, anywhere | Client, 2026-09-01 |
| Persistence | `localStorage`, no accounts, no backend | Nothing to run or secure |
| Medical content | AI-drafted now, flagged `draft: true`; client fills a template later | Unblocks development; the client is the authority |
| Art | Split by group: client draws the patients, positions, and films; the rest is generated to `docs/art-direction.md` in a clearly labeled folder | Client has a style already (`reference-characters.jpg`), and only the identity-bearing and medical art actually needs them |
| Hosting | Cloudflare Pages (+ optional itch.io) | Free, unlimited bandwidth, preview URL per branch. Vercel Hobby is non-commercial only. |

## 3. Stack and libraries

- `vite`, `react`, `react-dom`, `typescript`
- `motion` — tweens (slide-in, pop, shake)
- `zod` — validates level JSON
- Dev: `vitest`, `@playwright/test`, `eslint`, `prettier`

No state library, no router library, no UI kit. Screen and level state live in one `useReducer` store. Anything else is added only when a concrete stage needs it.

`canvas-confetti` was in the pre-revision stack and is dropped — the result screen no longer celebrates.

## 4. Architecture

### 4.1 Stage

`<Stage>` renders a 960×640 box, letterboxed and CSS-`scale()`d to fill the viewport. All children are positioned in stage pixels, like a Flash stage. The stage sets `touch-action: none` and `user-select: none`; the page never scrolls. In portrait on a phone, an overlay asks the player to rotate.

### 4.2 Screens

Top-level state machine:

```
title → levelSelect → level(n) → results(n) → levelSelect
settings is an overlay reachable from title and levelSelect
```

- **Title:** Start (continues at the highest unlocked level), Select Level, Settings.
- **Level select:** twenty cards (title, region, stars, locked/unlocked), Good-Pizza-style, grouped under the six section headings from §1. Twenty cards do not fit a 960×640 stage at the old card size, so the screen scrolls vertically within the stage — the one place the no-scroll rule of §4.1 is relaxed, and it scrolls the card list only, never the stage itself. A section is shown collapsed to a heading and a progress count until its first level is unlocked.
- **Results:** the radiograph, stars, the case debrief (§4.5), then "Next case" / "Repeat case" / "Level select".
- **Settings:** sound on/off, reset progress (confirm first). Nothing else — timers are not optional and there are no hints to toggle.

### 4.3 Level stage machine

A level is a sequence of stage components. Each receives `(level: Level, onComplete: (result) => void)` and knows nothing about the others.

| # | Stage | Player does | Correct | Wrong |
|---|---|---|---|---|
| 1 | `intake` | Patient slides in; chat bubble shows their line; tap to continue | — | — |
| 2 | `order` | Doctor's order card appears (name, age, sex, habitus, exam, structures, pathology). Tap to dock it to a side panel, where it stays readable for the rest of the case | — | — |
| 3 | `position` | Pick one of three pose thumbnails; hover / long-press shows a large preview. 60 s timer | Advance | Red flash + shake, the popup explains why that pose is wrong, then **reveals the correct pose**, then advances. No retry. Mistake +1 |
| 4 | `technique` | Set kVp and mAs on two dials (drag or ±), then press Confirm once for both. 45 s timer | Advance | **Red shake on each wrong dial, and nothing else** — no explanation, no correct value, no lamp. Advances anyway. Mistake +1 per wrong value. **This stage alone decides the radiograph (§4.4).** |
| 5 | `collimate` | Two knobs (width, height) resize a translucent light field over the zoomed patient. A red target marker shows the required field. Untimed | Advances silently — no green flash | Red shake, and the player adjusts again until correct. Mistake +1, counted once no matter how many attempts |
| 6 | `expose` | Press and **hold** the exposure button: rotor prep, then the exposure fires, then release | — | Releasing early aborts with a prompt to hold; not a mistake |
| 7 | `result` | The radiograph resolves on the lightbox, then stars, then the debrief (§4.5) | — | — |

**Timers.** `position` (60 s) and `technique` (45 s) always show a countdown ring; they cannot be switched off. Expiry is not a separate penalty — it *is* that stage's outcome, scored as if the player had answered wrongly with whatever was on screen, and the stage then behaves exactly as it does on a wrong answer. `collimate` is untimed because it is the one stage the player may keep adjusting.

**No hints anywhere.** No idle hints, no tutorial hints on level 1, no per-level hint text. The wrong-answer explanations are feedback, not hints, and they stay.

### 4.4 The radiograph

The film is sealed at `technique` and opened at `expose`. Three exist per case — `good`, `under`, `over` — and which one the player gets is a pure function of the two values they confirmed:

```
under   if either kVp or mAs is below its tolerance band
over    else if either is above its tolerance band
good    if both are within tolerance
```

Under wins a disagreement (kVp low, mAs high) deliberately: a noisy, non-diagnostic image is the error a student most needs to recognise, and it should never be masked by a conflicting value.

Two consequences worth stating outright, because they constrain everything else:

- **A wrong position does not change the film.** The image's basis stays correct through `position`; a mispositioned patient costs a star and gets an explanation, but the case still yields the radiograph the technique produced. This is also why only three films per case are ever needed.
- **Nothing after `technique` changes the film either.** `collimate` and `expose` have no input into it. The student sees no version of the radiograph — right or wrong — before the exposure is taken.

### 4.5 The debrief

The result screen carries the teaching the stages withheld. Under the film and the stars, one row per scored decision:

```
Position     ✓  PA erect
kVp          ✗  set 70 · correct 110
                "Too low a kVp will not penetrate the mediastinum."
mAs          ✓  2.5
Collimation  ✓
Film         UNDEREXPOSED
                "Not enough exposure — the ribs are lost in noise."
```

Every explanation the game did not show inline appears here: the technique note, the `wrongKvp` / `wrongMas` sentences, and the `underNote` / `overNote` for whichever film they produced. This is the only place a student learns what the correct kVp and mAs were, which is what makes the one-shot console honest rather than merely punishing.

### 4.6 Folder layout

```
src/
  app/          Stage.tsx, App.tsx (screen state), store.ts, save.ts
  screens/      Title.tsx, LevelSelect.tsx, Settings.tsx, Results.tsx
  stages/       Intake, Order, Position, Technique, Collimate, Expose, Result
  ui/           Button, Popup, TimerRing, Dial, Knob, ChatBubble, ShakeFlash, DebriefRow
  data/
    schema.ts   zod Level schema + TS type
    levels/     01-pleural-effusion.json … 20-skull-fracture.json
  assets.ts     manifest: id → path; missing file → labeled placeholder
public/assets/
  characters/ backgrounds/ poses/ xray/ ui/ sfx/ generated/
docs/
  superpowers/specs/   this file
  client/assets/       the asset checklists sent to the client
  client/level-content-sheet.md
tests/
  unit/         vitest
  e2e/          playwright
```

## 5. Data model

One JSON file per level, validated by `schema.ts` at build and at load. A malformed file fails the build with the field name.

```jsonc
// Level 1, from the client's case database. Fields marked TODO are the §12 gaps:
// the database does not carry them and nobody here may invent them.
{
  "id": 1, "title": "Pleural effusion", "section": "chest", "region": "chest",
  "pathology": "pleural-effusion", "draft": true,
  "patient": { "sprite": "patient-geriatric-male-hypersthenic", "name": "Fernando R. Castillo",
               "age": 70, "sex": "M", "habitus": "hypersthenic",
               "line": null },                                        // TODO: client
  "order": { "exam": "Chest X-ray", "projection": "PA",
             "structures": [],                                        // TODO: client
             "complaint": "Increasing shortness of breath",
             "history": "Recently diagnosed with colon cancer",
             "pathology": "Dyspnea; patient with recent diagnosis of colon cancer" },
  "position": {
    "options": [
      { "id": "pa-erect", "image": "pose-chest-pa-erect", "correct": true,
        "label": "PA chest, erect" }
      // TODO: client — two wrong options, each with a `why` sentence
    ]
  },
  "technique": {
    "kvp": { "target": 125, "tolerance": null, "min": null, "max": null, "step": 5 },
    "mas": { "target": 3, "tolerance": null, "min": null, "max": null, "step": 0.5 },
    "note": null, "wrongKvp": null, "wrongMas": null                  // TODO: client
  },
  "collimate": { "target": null, "tolerance": 20,                     // TODO: client, in cm
                 "instruction": "Collimate on four sides to area of lung fields",
                 "baseImage": "collim-chest-pa" },
  "films": {
    "good":  "xray-chest-pa-pleural-effusion-optimal",
    "under": "xray-chest-pa-pleural-effusion-under",
    "over":  "xray-chest-pa-pleural-effusion-over",
    "underNote": null, "overNote": null                               // TODO: client
  },
  "timers": { "position": 60, "technique": 45 }
}
```

Conventions: image fields are asset ids resolved by `assets.ts`, never paths, and every id follows
the naming grammar in §7.1 — so `patient.sprite` is derivable from `age`, `sex`, and `habitus`, and a
film id from `region`, the correct option's projection, the level's `pathology` slug, and the
exposure outcome. `schema.ts` validates ids against the grammar, not just against a hand-written
list. The top-level `pathology` field exists to make that film id derivable; it is the one field
added by the 2026-09-10 revision. `tolerance` is inclusive: `|value − target| ≤ tolerance` is correct. `note`, `wrongKvp`, `wrongMas`, `underNote`, and `overNote` are never rendered during play — they are the debrief's copy.

Removed in the 2026-09-01 revision: the `assess` block (stage cut), `position.hint` (hints cut), and the whole `expose` block with its `sweepMs` / `yellowEnd` / `greenEnd` sweep timing (the exposure is no longer a timed challenge). The three film ids moved out of `expose` into the new top-level `films`, because they are now produced by `technique`.

**Level content (the client's case database, 2026-09-10).** The five AI-drafted cases this table used
to list are gone; every level below is the client's. Values are transcribed in
`docs/brief/case-database-2026-09.md` and stay `draft: true` only until the gaps in §12 are filled,
since the database does not yet carry the wrong positioning options, tolerances, or field sizes.

| Level | Section | Region | Projection | Pathology |
|---|---|---|---|---|
| 1 | Chest | chest | PA | Pleural effusion |
| 2 | Chest | chest | PA | Pneumothorax |
| 3 | Chest | chest | PA | Scimitar syndrome (PAPVR) |
| 4 | Upper extremity | hand | PA | Boxer's fracture |
| 5 | Upper extremity | wrist | PA | Colles' fracture |
| 6 | Lower extremity | elbow | Lateral | Supracondylar fracture |
| 7 | Lower extremity | tibfib | AP | Tibial stress fracture |
| 8 | Lower extremity | tibfib | Lateral | Oblique fibular shaft fracture |
| 9 | Lower extremity | tibfib | AP | Comminuted tibia-fibula fracture |
| 10 | Abdomen | abdomen | AP | Foreign body ingestion (button battery) |
| 11 | Abdomen | abdomen | AP | Renal calculi |
| 12 | Abdomen | abdomen | AP | Sigmoid volvulus |
| 13 | Skull | skull | Lateral | Mild scalp contusion |
| 14 | Skull | skull | Lateral | Nasal bone fracture |
| 15 | Refresher | skull | Caldwell | Paget's disease |
| 16 | Refresher | chest | PA | Pulmonary tuberculosis |
| 17 | Refresher | humerus | AP | Osteochondroma |
| 18 | Refresher | knee | AP | Osteoporosis |
| 19 | Refresher | abdomen | AP | Cholelithiasis |
| 20 | Refresher | skull | Parietoacanthial | Skull fracture |

Level 6 is an elbow examination filed by the client under Lower extremity. That is their grouping and
it is kept as-is; the section label is a chapter heading, not a claim about anatomy.

## 6. Scoring, feedback, save

- **Mistake sources**, four at most per case: wrong position (max 1), wrong kVp (1), wrong mAs (1), wrong collimation (max 1, however many attempts it takes). Timer expiry is folded into the stage it happens in and never counts separately. `intake`, `order`, and `expose` cannot produce a mistake.
- **Stars:** 0 mistakes → 3, 1–2 → 2, 3+ → 1. Finishing at all unlocks the next level. Best stars are kept.
- **Feedback on a mistake:** 400 ms red flash + shake. At `position` the shake is followed by a blocking popup carrying the wrong option's `why` and then the correct pose; at `technique` and `collimate` the shake is all the player gets. Everything withheld is delivered by the debrief (§4.5).
- **Save key** `medici.save.v1`: `{ version: 1, unlocked: number, stars: Record<number, 0|1|2|3>, settings: { sound } }`. Missing or corrupt save → fresh save, no crash. A future version bumps the key and migrates. The `timers` and `hints` settings are gone; a v1 save written before this revision still loads, and the extra keys are ignored.

## 7. Assets

### 7.1 Naming grammar

Every asset id is `group-subject-detail`, lowercase, hyphen-separated, drawn from closed vocabularies. The point is that an id is *derivable* from level data rather than looked up: adding a patient or a second projection becomes a naming exercise, not a manifest edit, and `schema.ts` can reject a malformed id without knowing which files exist.

| Group | Pattern | Example |
|---|---|---|
| Patients | `patient-<age>-<sex>-<habitus>` | `patient-geriatric-female-hyposthenic` |
| Radtech | `radtech-hand-<up\|down>` | `radtech-hand-down` |
| Backgrounds | `bg-<room>` | `bg-console` |
| Positions | `pose-<region>-<projection>-<variant>` | `pose-chest-pa-erect` |
| Collimation | `collim-<region>-<projection>` | `collim-chest-pa` |
| Films | `xray-<region>-<projection>-<pathology>-<exposure>` | `xray-chest-pa-pneumothorax-under` |
| Interface | `ui-<component>` / `icon-<name>` / `logo` | `ui-dial-needle` |
| Audio | `sfx-<name>` | `sfx-ambience-clinic` |

Closed vocabularies, extended on 2026-09-10 to cover the client's twenty cases:

| Field | Allowed values |
|---|---|
| age | `pediatric` (under 18) · `adult` (18–64) · `geriatric` (65 and over) |
| sex | `male` · `female` |
| habitus | `asthenic` · `hyposthenic` · `sthenic` · `hypersthenic` |
| region | `chest` · `hand` · `wrist` · `elbow` · `humerus` · `tibfib` · `knee` · `abdomen` · `skull` |
| projection | `ap` · `pa` · `lateral` · `caldwell` · `parietoacanthial` |
| exposure | `under` · `optimal` · `over` |
| pathology | one slug per level, listed in §5 — `pleural-effusion`, `pneumothorax`, `scimitar`, `boxers-fracture`, `colles-fracture`, `supracondylar`, `tibial-stress`, `fibular-oblique`, `comminuted-tibfib`, `foreign-body`, `renal-calculi`, `sigmoid-volvulus`, `scalp-contusion`, `nasal-fracture`, `pagets`, `tuberculosis`, `osteochondroma`, `osteoporosis`, `cholelithiasis`, `skull-fracture` |

The age bands are stated here because the database gives an exact age and the id needs a band; 18 and
65 are the cut points, so the 18-year-old of level 17 is `adult` and the 65-year-old of level 12 is
`geriatric`. `ankle` left the region list because the one ankle complaint in the database, level 8, is
ordered as a tibia-fibula lateral. `optimal` replaces the old `good` in filenames; the `films.good`
JSON key keeps its name, because it describes the outcome rather than the file.

Patients are keyed on age/sex/habitus because those three are the variables that change the exam, they already exist on the level JSON, and a nickname (`patient-young-man`) carries no information the game can use. Habitus is medical content owned by the client — the current values come from the case database and are still `draft`.

**Films carry a pathology segment; nothing else does.** At five levels a film id was unique on region
and projection alone. At twenty it is not: levels 1, 2, 3, and 16 are all `chest-pa` with four
different pathologies, and one `xray-chest-pa-under` cannot stand for all four. The pathology slug is
level data like any other field, so the id stays derivable and `schema.ts` still validates shape
rather than membership. Poses and collimation bases deliberately do **not** take the segment — a
correct PA chest pose is one drawing whichever pathology is behind it, and duplicating it four times
would be four times the work for the client and four chances to drift.

### 7.2 Manifest

`src/assets.ts` is the single list of every asset id the game loads; `docs/client/assets/` holds the same list rendered for the client as eight standalone checklists — one per group, plus an index — each self-contained so any one can be sent on its own. The *Source* column is who produces the file, which is now part of the plan rather than a fallback:

| Group | Count | Source | Notes |
|---|---|---|---|
| Patients | 12 | Client | Standing idle only; the twenty cases collapse to twelve unique age/sex/habitus combinations |
| Radtech | 2 | Generated | Hand on the exposure button, up and pressed |
| Backgrounds | 5 | Generated | Title, reception, X-ray room, console close-up, film viewer |
| Position thumbnails | ≤60 | Client preferred | 3 per level, before duplicates collapse; generated only as a fallback, and every set goes back to the client to check |
| Collimation base | 12 | Client preferred | One per region/projection pair, shared across levels that repeat one |
| X-ray films | 60 | **Client only** | Under / optimal / over per level, all twenty. Never generated — see below |
| UI | 17 | Generated | Except `logo`, which is the client's |
| SFX | 5 | Generated | Click, wrong buzz, correct chime, exposure, clinic ambience loop |

**Up to 173 files**, 73 of them genuinely the client's (12 patients + 60 films + logo). That is up
from 70 and 22 at five levels.

Three of those counts deserve their arithmetic shown, because none of them is the four-fold increase
a jump from five levels to twenty would suggest.

**Patients: 12, not 20.** The naming grammar keys a patient on age band, sex, and habitus, so cases
sharing all three share a drawing. Level 2's twenty-year-old asthenic man, level 16's fifty-year-old
and level 20's forty-three-year-old are one `patient-adult-male-asthenic`. This is §7.1 paying for
itself, and it is why the client draws twelve rather than twenty.

**Collimation bases: 12, not 20.** One per region/projection pair. The four PA chest levels share
`collim-chest-pa`; levels 7 and 9 share `collim-tibfib-ap`; levels 13 and 14 share
`collim-skull-lateral`; levels 10, 11, 12, and 19 share `collim-abdomen-ap`.

**Position thumbnails: an upper bound, not a count.** Three per level is 60, but the two wrong
options per level are exactly what the client has not supplied yet (§12), and wrong options will
repeat across levels the way correct ones do. The real number lands below 60 and cannot be fixed
until those options exist. Sixty is the ceiling to plan against, not a figure to send the client.

The 2026-09-07 revision removed fifteen from the previous 85: the six `patient-*-pain.png` (the client's request — six drawings for a few seconds of screen time each, and the pose gave the diagnosis away before the order had been read), `radtech-portrait.png` (one appearance, nothing referring back to it), and eight from the UI group that the code produces for free — four button hover/pressed states (a CSS filter and a 1 px translate), two indicator lamps (a CSS circle), `star-empty` (`star-full` filtered), and `timer-ring` (a conic-gradient sweep). Nothing was added.

**Films are the one hard exclusion.** Elsewhere a wrong generated stand-in is cosmetic; a generated radiograph would be a convincing image of anatomy that does not exist, teaching a student to recognise a fabricated finding, and neither party is qualified to catch it. A labelled grey box is the honest failure mode. This is a rule, not a preference.

Twenty levels multiply what that rule costs, so it was put to the client directly on 2026-09-10: sixty
films, of which the database supplies a working reference for only eleven correct ones and none of the
forty under- and overexposed pairs. **The client confirmed they will supply the overexposed and
underexposed films.** The rule therefore stands unweakened and no tone-curve simulation of an
exposure error is needed. Until the files arrive, every missing film renders as a labelled grey box
under §7.4, which is a playable game with honest gaps rather than a blocked one.

### 7.3 Art direction

`docs/art-direction.md` is the standing description of the look, derived from `docs/brief/reference-characters.jpg`: lineart `#3A2A22` at uniform weight, one cel shadow tone per base colour, flat frontal light, a thirteen-colour muted earth palette, adults ~8 heads and children ~6 heads at 62–65% of adult height, and two reserved signal colours (wrong-answer red, collimation yellow) that appear in no artwork. It exists because client-drawn and generated assets have to sit in the same frame, and it is the prompt source for every generated file.

### 7.4 Fallback pipeline

Any manifest id with no file renders as a grey box labeled with the id, so both parties see what is still owed. To fill a gap, Claude Code generates an image with an image-gen MCP (Nano Banana Pro via `shinpr/mcp-image`; GPT Image as second choice), prompted from exactly three parts in order: the character sheet as the style reference image, the style paragraph and relevant palette rows from `art-direction.md` verbatim, and the asset's own checklist description verbatim. No embellishment — the style is defined by restraint, and "highly detailed / 4k" breaks it. A group is generated in one session with the same reference and settings; a drifting image is regenerated, not accepted. SFX from the ElevenLabs free tier. Generated files are never moved out of `public/assets/generated/`, so the client can always tell what to replace. No API keys are committed.

## 8. Client deliverables

Both live in `docs/client/` and are formatted for pasting into Google Docs.

1. **`level-content-sheet.md`** — one sheet per level in plain language. Fields map 1:1 to the level JSON: patient details and line; the doctor's order; the correct position and, for each wrong option, why it is wrong; kVp and mAs targets with acceptable range; collimation field size; the technique note and the under/over explanations that the debrief reads out. The client returns it; the developer transcribes it into JSON and flips `draft` to `false`.
2. **`assets/00-index.md` … `assets/08-sounds.md`** — the §7.2 manifest as eight tick-box checklists plus an index. Each list states who produces it, so the client can see at a glance that only three lists are really theirs.

`docs/art-direction.md` is internal but shareable: the client is welcome to it, and the index offers it.

## 9. Acceptance criteria and testing

Criteria are written before the code they test. The gate is `npm run qa` = typecheck + lint + vitest + playwright; nothing is done until it passes.

**Unit (vitest, pure functions):**
- `stars(mistakes)` returns 3 / 2 / 2 / 1 / 1 for 0 / 1 / 2 / 3 / 4.
- `checkTechnique(value, spec)` is true at `target ± tolerance` inclusive, false one step outside.
- `filmFor(kvp, mas, spec)` returns `good` when both are in tolerance; `under` when either is below; `over` when neither is below and at least one is above; and **`under` when kVp is below tolerance while mAs is above** — the tie-break in §4.4.
- `filmFor` depends on nothing but kVp and mAs: the same pair returns the same film for every position and collimation outcome.
- `checkCollimation({w,h}, spec)` requires both dimensions within tolerance.
- `mistakes()` counts a repeatedly-failed collimation as 1, and counts a timer expiry at `position` as the same 1 mistake a wrong pose would cost — not 2.
- `loadSave()` returns a fresh save on missing key, on invalid JSON, and on a wrong `version`, and drops the retired `timers` / `hints` settings from a pre-revision save without crashing.
- Level schema rejects: a level with two `correct: true` positions; one with none; `tolerance` negative; an asset id that does not parse against the §7.1 grammar (wrong group prefix, a word outside its vocabulary, wrong field count); a level still carrying a removed `assess`, `position.hint`, or `expose` block.
- Every shipped level file passes the schema.
- **The twenty levels produce sixty distinct film ids.** Collecting `films.good`, `films.under`, and `films.over` across every level yields no duplicate — the regression that the pathology segment of §7.1 exists to prevent, and the one that would silently show a pneumothorax film for a pleural effusion case.
- A level whose `films.*` ids do not match its own `region`, its correct option's projection, and its `pathology` slug is rejected. A film id is derived, not typed, so a mismatch is a data error rather than a naming preference.
- Level ids are exactly 1–20 with no gap or repeat, and every `section` is one of the six in §1.

**End-to-end (Playwright, desktop and a mobile-landscape viewport):**
- Boot → Title shows Start / Select Level / Settings; Level Select shows L1 unlocked and L2–20 locked, under six section headings, with only the Chest section expanded.
- Level Select scrolls its card list to reach L20 without the stage itself scrolling or letterboxing shifting, on both viewports.
- Settings shows exactly two controls — sound and reset progress — and no timer or hint toggle.
- Play L1 with every answer correct → the good film appears only after the exposure button is held; Results shows 3 stars and a debrief with no ✗ rows; Level Select now shows L2 unlocked; reload keeps it.
- Play L1 with a wrong position → the popup explains why and shows the correct pose, there is no retry, and the **good** film still appears at the end. Results shows 2 stars and one ✗ row.
- Play L1 with kVp below tolerance → the console shakes and says nothing else, no image appears at that stage, and the underexposed film appears only at the exposure. The debrief names the correct kVp.
- No screen at any point before `expose` renders an `xray-*` asset.
- Fail collimation three times, then succeed → Results shows one mistake, not three.

## 10. Build and deploy

- `npm run dev` for local play; `npm run build` emits `dist/`.
- GitHub repo (private) → Cloudflare Pages: production on `main`, a preview URL per branch for the client to try.
- Optional later: upload `dist/` to itch.io as a second front door.

## 11. Out of scope for v1

Accounts, backend, leaderboards; more than twenty levels or more than one injury per level; localisation; native app builds; voice acting; a level editor.

The level cap was five until 2026-09-10, when the client's case database set it at twenty. Twenty is
now the ceiling for v1, and a twenty-first case is a v2 conversation.

## 12. Open items

Six things the case database does not carry. Levels stay `draft: true` until the first four are
answered, because each one is a value the game needs and nobody here is qualified to invent.

- **The two wrong positioning options per level, and one sentence each on why they are wrong.** The database gives only the correct projection. This is the whole positioning stage — without it there is nothing to choose between.
- **Tolerance bands and dial limits for kVp and mAs.** Nine cases give a single value and eleven give a range, and it is not stated whether a range is the acceptable band or the client's own uncertainty about the right value. The two readings produce different games.
- **Collimation as a measurable field size.** Every entry is prose, such as "collimate on four sides to area of lung fields", which does not convert to the on-screen target of §5 without a dimension in centimetres or inches.
- **Debrief copy** — what the underexposed film and the overexposed film each fail to show, per level.
- The patient's opening line of dialogue, twenty of them.
- The visible-structures list for eighteen of the twenty cases; only levels 10 and 11 carry one, marked `SS:` in the source.
- **The patient position in sixteen of the twenty pose ids is inferred, not sourced.** The database names the projection for every case but states the patient's position for only four (levels 10, 11, 12, and 19). The `<variant>` segment of a `pose-*` id therefore carries a standard-practice assumption on the other sixteen — `erect` for chest and skull work, `table` for the extremities. Every inferred row is daggered in asset list 04 for the client to correct. Filenames change if an assumption is wrong, so this is worth settling before the client draws.

Two conflicts inside the database itself, sent back to the client on 2026-09-10:

- **Level 15** requests AP Skull but is positioned PA Caldwell. Different projections; §5 currently records Caldwell.
- **Level 19** requests AP Erect but is positioned AP Abdomen with no erect qualifier. Erect versus supine changes the exam.

Resolved by the case database, kept here as a record:

- The kVp scale conflict between the client's handwritten notes (1–20) and real-world values is **settled**. Every one of the twenty cases gives real-world kVp — 55 to 125 — so the handwritten 1–20 scale was a note about something else and is dropped.
- The absence of a hypersthenic patient is **settled**. Five cases are hypersthenic, so the habitus that most obviously demands a technique change is now teachable.
- **`pose-skull-ap-frontal` may be misnamed.** Its description — facing the wall stand, forehead and nose touching — is a PA projection, not AP. Still open, but narrower now: the database's skull work is lateral, Caldwell, and parietoacanthial, so the pose may simply be unused.
- Whether to ship on itch.io in addition to Cloudflare Pages is deferred until the client has seen the game.

## 13. Revision log

### 2026-09-10 — the case database: five levels become twenty

The client delivered their case database (`docs/brief/case-database-2026-09.pdf`, their "LIST OF
CASES") and confirmed that every case in it is a level. This is the largest change since the spec was
written, and unlike the 2026-09-01 revision it changes the size of the game rather than the shape of
its loop. **The loop itself is untouched** — six stages, one attempt each, film sealed until the
exposure, debrief at the end. Nothing in §4.3, §4.4, §4.5, or §6 moved.

1. **Twenty levels, in six of the client's own sections** (§1, §2, §5, §11). The five AI-drafted
   cases are gone, replaced by the client's twenty. The out-of-scope cap moved from five to twenty.

2. **The medical source of truth changed.** It was `level-content-sheet.md`, filled in by the client
   from AI drafts. It is now the case database, which the client wrote themselves. The sheet's job
   narrows to collecting only what the database lacks. The PDF is authoritative; the transcription
   beside it exists because the PDF is a wide table whose columns scramble on extraction, and it
   carries a standing instruction that the PDF wins on any disagreement.

3. **Vocabularies extended and age bands defined** (§7.1). Region gains `hand`, `elbow`, `humerus`,
   `tibfib`, and `knee` and loses `ankle`; projection gains `caldwell` and `parietoacanthial`; a
   `pathology` vocabulary of twenty slugs is new. Age bands are now stated numerically, because the
   database gives exact ages and the id needs a band.

4. **Film ids take a pathology segment** (§7.1). Four levels are PA chest with four different
   pathologies, so `xray-chest-pa-under` stopped being unique. Poses and collimation bases
   deliberately did not take the segment; a correct PA chest pose is one drawing regardless of the
   pathology behind it.

5. **The manifest roughly doubles rather than quadrupling** (§7.2): 70 files to about 173, and the
   client's own share from 22 to 73. Patients go 6 → 12 and collimation bases 5 → 12, both because
   the §7.1 grammar lets levels share a file. Films go 15 → 60, which is the real cost of the change.

6. **The film exclusion held.** Sixty films with no source for forty of them was the one thing that
   could have forced generation, and generating a radiograph teaches a fabricated finding. Put to the
   client directly; they confirmed they will supply the overexposed and underexposed films. The rule
   stands unweakened.

7. **§12 rewritten.** Two long-standing open items are closed by the database: the kVp scale conflict
   (every case gives real-world values, so the handwritten 1–20 scale is dropped) and the missing
   hypersthenic patient (five cases are hypersthenic). Six new gaps replace them, of which the
   wrong positioning options are the one that blocks a playable positioning stage.

Two conflicts inside the database were found during transcription and sent back to the client rather
than resolved by guesswork: level 15 requests AP Skull but is positioned PA Caldwell, and level 19
requests AP Erect but is positioned AP Abdomen. Both are recorded in §12.

### 2026-09-07 — asset naming, art direction, and who draws what

Three changes, all in §7 and none of them touching gameplay.

1. **Every asset id was renamed to a grammar** (§7.1). Ids are now `group-subject-detail` over closed
   vocabularies, so a film id follows from the region, projection, and exposure outcome rather than
   from a hand-maintained list, and `schema.ts` validates the shape rather than the membership.
   Patients in particular are keyed on age group, sex, and body habitus — the three variables that
   actually change the exam, all of them already on the level JSON — instead of nicknames.
2. **Fifteen assets were cut** (§7.2), taking 85 to 70. The client asked to drop the six "in pain"
   patients; on the same reasoning the title-screen portrait and eight UI files the code can produce
   for free went with them.
3. **Production was split between client and generation** (§7.2), with `docs/art-direction.md`
   written to keep the two streams cohesive (§7.3). Films are excluded from generation as a rule, not
   a preference: a fabricated radiograph teaches a fabricated finding and nobody here would catch it.

Two things noted rather than decided, both waiting on the medical reference material the client is
providing: the `pose-skull-ap-frontal` projection label, and the absence of a hypersthenic patient.
Both are in §12.

### 2026-09-01 — client answers to the briefing

The client returned the briefing's §10 and asked for changes that pull the project away from "casual game" and toward "alternative learning activity". Folded in:

1. **"Assess the patient" is cut.** It was step 3 of eight; the loop is now six playable stages plus the result screen. Its five `assess-*.png` assets are dropped.
2. **Positioning loses its retry.** A wrong pose gives a red shake, the explanation, then the correct answer, then advances.
3. **Exposure settings lose their retry**, and a wrong value produces the over- or under-exposed radiograph. Per the follow-up on 2026-09-01, that image is *not* shown at the console — it is produced there and revealed at the exposure.
4. **Collimation loses its green flash.** Success advances silently; failure shakes red and the player adjusts again until correct. It now costs a star, once, where previously it never counted.
5. **The exposure loses its timed sweep entirely.** No red/yellow/green bar, no way to mistime it. It is now a two-stage press-and-hold — prep, fire, release — with no scoring.
6. **Timers are mandatory and hints are gone**, including the level-1 tutorial hints and the settings toggles for both.
7. **The framing is educational**, so the confetti and its sound effect are gone and the result screen gained the per-case debrief in §4.5.

Follow-up decisions taken the same day, in response to a "make it feel like a simulation" note: the radiograph is hidden until the exposure (§4.4); a positioning mistake never changes it; only `technique` decides it; under wins a low/high disagreement; and the console says nothing at all beyond a red shake, deferring every explanation to the debrief.

One judgment call worth flagging: `technique.note`, the sentence explaining the kVp/mAs balance, used to sit beside the dials during play. It has moved to the debrief. A live crib sheet on the console reads as a hint, and a real console does not carry one. Moving it back is a one-line change if the client disagrees.

## Appendix — tooling research summary (2026-08)

Engines: Phaser 4 (Apr 2026) is the best canvas option and has an official agent skill file, but text/UI/touch are harder than DOM and models still mostly know Phaser 3. Godot 4.6 exports to web as a multi-MB WASM blob with iOS Safari caveats. Unity 6 WebGL empty builds are ~10 MB and editor-driven. For a UI-heavy job sim, React DOM wins; Phaser can be embedded in a React app if a spatial level ever appears (Phaser's official `template-react-ts`).

AI art: Nano Banana Pro (Gemini image) and GPT Image hold character consistency from a reference sheet; FLUX.2 for backgrounds; Scenario ($45/mo) for a style LoRA only if drift becomes a problem. SFX: ElevenLabs free tier. Music: Suno Pro ($10/mo) for commercial rights.

Sources: phaser.io/news/2026/04 (framework comparison), jslegenddev.substack.com (independent test), phaser.io/news/2026/07 (Phaser Agent MCP), vivecuervo7.github.io (Claude Code + Godot), gist aras-p (Unity web build sizes), vibedex.ai (2026 game-art model benchmark), github.com/shinpr/mcp-image, vercel.com/docs/plans/hobby.
