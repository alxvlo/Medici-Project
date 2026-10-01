# Medici — Radtech Simulator: Design Spec

**Date:** 2026-08-27
**Revised:** 2026-10-01 — reconciled with `LIST OF CASES.docx` and the client's art delivery: level table, sections, asset ids, placeholder values, and open items. See §13.
**Status:** Approved
**Supersedes:** the client's brief (`docs/brief/client-brief-2026-08.pdf`, originally "WEBSITE DETAILS (SEND TO DEVELOPER).pdf") as the working design, and — since the 2026-09-01 revision — the level flow described in `docs/client/2026-08-27-client-briefing.md` §3, §5, and its FAQ. The PDF stays as the source brief; where any of them disagree with this file, this file wins. The client's style reference is `docs/brief/reference-characters.jpg` (originally `asset1.jpg`).

## 1. What we are building

A browser-based learning activity in which the student plays a radiologic technologist. Each of twenty levels presents one patient with one injury, and the student walks them through the real X-ray workflow: read the order, choose the position, set kVp and mAs, collimate, take the exposure, read the film. The twenty cases come from the client's own case database (`Medici Project/LIST OF CASES.docx`) and are grouped into six sections — chest, upper extremity, lower extremity, abdomen, and skull with three cases each, then a five-case refresher set that revisits every region.

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
| Medical source | `Medici Project/LIST OF CASES.docx` | Confirmed by Vai, 2026-09-28. Supersedes the earlier PDF, its Markdown transcription, and conflicting case data copied into this spec. The old transcription is retained as an archived reference. |
| Loop | Six playable stages plus a result screen; the brief's "assess the patient" step is cut | Client, 2026-09-01 |
| Feedback | One attempt per decision. Wrong choices are explained, never re-offered | Client, 2026-09-01. Retrying until correct teaches the student to guess |
| The radiograph | Determined solely by kVp/mAs, and hidden until the exposure is taken | Client, 2026-09-01. The film is the consequence of the technique, and a consequence you can preview is not one |
| Scoring | 3-star per case, no lives, no fail state | Replayable for a better score; the star count is the only thing a mistake costs |
| Timers | Always on, not configurable | Client, 2026-09-01 |
| Hints | None, anywhere | Client, 2026-09-01 |
| Persistence | `localStorage`, no accounts, no backend | Nothing to run or secure |
| Medical content | Client-authored case database; incomplete game-specific content stays `draft: true` | The client is the authority; do not fill remaining medical gaps from the superseded five-case draft sheet |
| Art | The client delivered every group on 2026-09-28 (`Medici Project/Asset_*`), under their own filenames, and those filenames are the asset ids (§7.1). Generation remains the fallback for a missing file, never for a film | Client delivery, 2026-09-28; adopted as-is by Vai, 2026-10-01 |
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
| 2 | `order` | Doctor's order card appears with the complete patient information from the case database: name, age/sex, body habitus, date of birth, patient ID, admission date and time, chief complaint, relevant history (where given), provisional diagnosis, examination requested, requested projections, the mission, and the structures to show (where given). The radiologist's findings are **not** on the card — they would give the case away — and appear on the results screen instead. Tap to dock it to a side panel, where it stays readable for the rest of the case | — | — |
| 3 | `position` | Pick one of three pose thumbnails; hover / long-press shows a large preview. 60 s timer | Advance | Red flash + shake, the popup explains why that pose is wrong, then **reveals the correct pose**, then advances. No retry. Mistake +1 |
| 4 | `technique` | Set kVp and mAs on two dials (drag or ±), then press Confirm once for both. 45 s timer | Advance | **Red shake on each wrong dial, and nothing else** — no explanation, no correct value, no lamp. Advances anyway. Mistake +1 per wrong value. **This stage alone decides the radiograph (§4.4).** |
| 5 | `collimate` | Two knobs (width, height) resize a translucent light field over the zoomed patient. A red target marker shows the required field. Untimed | Advances silently — no green flash | Red shake, and the player adjusts again until correct. Mistake +1, counted once no matter how many attempts |
| 6 | `expose` | Press and **hold** the exposure button: rotor prep, then the exposure fires, then release | — | Releasing early aborts with a prompt to hold; not a mistake |
| 7 | `result` | The radiograph resolves on the lightbox, then stars, then the debrief (§4.5) | — | — |

**Timers.** `position` (60 s) and `technique` (45 s) always show a countdown ring; they cannot be switched off. Expiry is not a separate penalty — it *is* that stage's outcome. At `position`, tapping a thumbnail commits it, so expiry means nothing was chosen; that is scored as a wrong position and the stage behaves exactly as it does on one. At `technique`, expiry submits whatever kVp and mAs are on the dials, judged exactly as a Confirm press would be — so dials that happen to sit inside tolerance cost nothing, and the film is the one those values produce. `collimate` is untimed because it is the one stage the player may keep adjusting.

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

Below the rows sits the radiologist's findings for the case, from the database's pathology column. Only levels 1, 2, 3, 5, 6, 13, and 14 carry findings; elsewhere the block is omitted, not marked as owed, because the client was never asked for it. Every explanation the game did not show inline appears here: the technique note, the `wrongKvp` / `wrongMas` sentences, and the `underNote` / `overNote` for whichever film they produced. This is the only place a student learns what the correct kVp and mAs were, which is what makes the one-shot console honest rather than merely punishing.

### 4.6 Folder layout

```
src/
  app/          Stage.tsx, App.tsx (screen state), store.ts, save.ts
  screens/      Title.tsx, LevelSelect.tsx, Settings.tsx, Results.tsx
  stages/       Intake, Order, Position, Technique, Collimate, Expose, Result
  ui/           Button, Popup, TimerRing, Dial, Knob, ChatBubble, ShakeFlash, DebriefRow
  data/
    schema.ts   zod Level schema + TS type
    levels/     01-pulmonary-edema.json … 20-skull-fracture.json
  assets/       the client's files: patients/ radtech/ backgrounds/ poses/ films/ ui/ sounds/ generated/
  assets.ts     manifest built from src/assets/ by import.meta.glob: id = filename without extension;
                an unknown id renders a labeled placeholder
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
// Level 2, transcribed from LIST OF CASES.docx. Every null is a §12 gap: the database does not
// carry it and nobody here may invent it. The game renders "Awaiting client" in its place.
{
  "id": 2, "title": "Pneumothorax", "section": "chest", "draft": true,
  "patient": {
    "sprite": "patient-young-man", "name": "Miguel A. Zamora", "age": 20, "sex": "Male",
    "habitus": "Asthenic", "dob": "11-January-2006", "patientId": "011106-20458",
    "admitted": "25-August-2026 1645H", "line": null
  },
  "order": {
    "complaint": "Chest pain and shortness of breath", "history": null,
    "diagnosis": "Suspected Pneumothorax", "exam": "Chest X-ray",
    "requested": "PA, Lateral", "mission": "Perform PA", "structures": null
  },
  "findings": "Bilateral pneumothorax with a pleural line clearly visible without lung markings beyond. …",
  "position": { "options": [
    { "image": "pose-chest-ap",      "label": "AP chest",      "correct": false, "why": null },
    { "image": "pose-chest-lateral", "label": "Lateral chest", "correct": false, "why": null },
    { "image": "pose-chest-pa",      "label": "PA chest",      "correct": true,  "why": null }
  ] },
  "technique": {
    "kvp": { "target": 115, "tolerance": 12,  "min": 40,  "max": 150, "step": 1 },
    "mas": { "target": 2.5, "tolerance": 0.3, "min": 0.5, "max": 50,  "step": 0.1 },
    "note": null, "wrongKvp": null, "wrongMas": null
  },
  "collimate": { "instruction": "Collimate on four sides to area of lung fields",
                 "target": { "w": 60, "h": 70 }, "tolerance": 5 },
  "films": { "slug": "pneumothorax", "underNote": null, "overNote": null },
  "timers": { "position": 60, "technique": 45 }
}
```

Conventions:

- **Image fields are asset ids** — the client's filename without its extension (§7.1). `assets.ts`
  resolves them; a test checks that every id a level names exists in the manifest.
- **Film ids are derived, not typed:** `xray-<films.slug>-<good|under|over>`. The slug is the client's
  own, read off the delivered filenames.
- **Options are listed alphabetically by image id**, and that is the order they are shown in. It puts
  the correct pose in a different place from level to level without any shuffling code.
- **`tolerance` is inclusive** and compared in whole dial steps, not raw floats:
  `round(|value − target| / step) ≤ round(tolerance / step)`. With a 0.1 mAs step, level 6's
  |1.4 − 1.6| is 0.20000000000000018 in floating point; a naive `≤ 0.2` would call a correct value wrong.
- `patient.sprite` is chosen from the eight delivered figures by age and sex: child under 13, teen
  13–19, young 20–59, old 60 and over. `teen-girl` has no case yet. Body habitus stays on the order card
  word for word — the client accepted that the drawings need not show it (§7, 2026-09-28).
- `note`, `wrongKvp`, `wrongMas`, `underNote`, `overNote`, and `findings` are never rendered during
  play; they are the debrief's copy.

**Placeholder values.** Three things the game needs a number or a choice for are not in the case
database (§12). Each level carries an explicit value so that a client answer is a one-field edit, and
every level stays `"draft": true` until the client confirms them:

| Field | Placeholder rule | Why this rule |
|---|---|---|
| `technique.*.tolerance` | 10% of target — kVp rounded to a whole number, mAs to 0.1 | A visible density change needs roughly a 30% mAs change, so ±10% sits inside "looks the same" |
| `technique.*.min/max/step` | kVp 40–150 step 1; mAs 0.5–50 step 0.1, the same for every level | A range centred on the target would put the answer at the dial's midpoint. A real console's range does not move with the patient |
| Dial start | Both dials start at their minimum | Any fixed mid-range start lands on some level's target and answers it for free |
| `collimate.target` / `tolerance` | 60% × 70% of the collimation view, ±5 points; knobs start fully open at 100% | No database entry gives a dimension. The view is the correct pose image shown large — no separate collimation art was delivered |
| Wrong position options | Two other delivered poses of the same region, per the table below | Uses only art the client drew; each `why` sentence stays null |

**Level content (`LIST OF CASES.docx`, reconciled 2026-10-01).** Sections are the database's own
left-hand column. Every pose and film id below exists in the delivery.

| L | Section | Case | Correct pose | Wrong poses | Film slug | Figure | kVp / mAs |
|---|---|---|---|---|---|---|---|
| 1 | Chest | Pulmonary edema | `pose-chest-pa` | `-ap`, `-lateral` | `pulmonaryedema` | old-man | 125 / 4 |
| 2 | Chest | Pneumothorax | `pose-chest-pa` | `-ap`, `-lateral` | `pneumothorax` | young-man | 115 / 2.5 |
| 3 | Chest | Scimitar syndrome (PAPVR) | `pose-chest-pa` | `-ap`, `-lateral` | `scimitar` | young-woman | 120 / 3 |
| 4 | Upper ext | Boxer's fracture | `pose-hand-pa` | `-ap`, `-lateral` | `boxerfx` | young-man | 60 / 4 |
| 5 | Upper ext | Colles' fracture | `pose-wrist-pa` | `-lateral`, `-oblique` | `collesfx` | young-woman | 55 / 2.5 |
| 6 | Upper ext | Supracondylar fracture | `pose-elbow-lateral` | `-ap`, `-apoblique` | `elbowfx` | child-boy | 55 / 1.6 |
| 7 | Lower ext | Tibial stress fracture | `pose-lowerext-apleg` | `-lateralleg`, `-apknee` | `stressfx` | young-man | 60 / 3.2 |
| 8 | Lower ext | Oblique fibular shaft fracture | `pose-lowerext-lateralleg` | `-apleg`, `-lateralknee` | `obliquefibulafx` | young-woman | 62 / 4 |
| 9 | Lower ext | Comminuted tibia-fibula fracture | `pose-lowerext-apleg` | `-lateralleg`, `-apknee` | `communitedfx` | young-man | 65 / 6.3 |
| 10 | Abdomen | Foreign body (button battery) | `pose-abd-ap` | `-lateral`, `-oblique` | `fbi` | child-girl | 70 / 4 |
| 11 | Abdomen | Renal calculi | `pose-abd-ap` | `-lateral`, `-oblique` | `renalcalculi` | young-man | 75 / 16 |
| 12 | Abdomen | Sigmoid volvulus | `pose-abd-ap` | `-lateral`, `-oblique` | `volvulus` | old-man | 75 / 14 |
| 13 | Skull | Mild scalp contusion | `pose-skull-lateral` | `-ap`, `-pa` | `contusion` | young-man | 75 / 16 |
| 14 | Skull | Nasal bone fracture | `pose-skull-lateral` | `-ap`, `-pa` | `nasalfx` | young-man | 70 / 12.5 |
| 15 | Skull | Paget's disease | `pose-skull-ap` | `-pa`, `-lateral` | `pagets` | old-woman | 80 / 20 |
| 16 | Refresher | Pulmonary tuberculosis | `pose-chest-pa` | `-ap`, `-lateral` | `ptb` | young-man | 115 / 2.5 |
| 17 | Refresher | Osteochondroma | `pose-humerus-ap` | `-lateral`, `-transthoracic` | `osteochondroma` | teen-boy | 60 / 3.2 |
| 18 | Refresher | Osteoporosis | `pose-lowerext-apknee` | `-lateralknee`, `-obliqueknee` | `osteoporosis` | old-woman | 65 / 5 |
| 19 | Refresher | Cholelithiasis | `pose-abd-ap` | `-lateral`, `-oblique` | `chole` | old-woman | 80 / 25 |
| 20 | Refresher | Skull fracture | `pose-skull-pa` | `-ap`, `-lateral` | `skullfx` | young-man | 75 / 16 |

Wrong poses abbreviate the correct pose's prefix: `-ap` on level 1 is `pose-chest-ap`. `communitedfx`
is the client's spelling and is kept, because the id must match the file. The new database settles the
2026-09-10 table's conflicts: level 6 (elbow) is now filed under Upper extremity, level 15 is an AP
skull, level 19 an AP upright abdomen, and level 20 a PA skull.

## 6. Scoring, feedback, save

- **Mistake sources**, four at most per case: wrong position (max 1), wrong kVp (1), wrong mAs (1), wrong collimation (max 1, however many attempts it takes). Timer expiry is folded into the stage it happens in and never counts separately. `intake`, `order`, and `expose` cannot produce a mistake.
- **Stars:** 0 mistakes → 3, 1–2 → 2, 3+ → 1. Finishing at all unlocks the next level. Best stars are kept.
- **Feedback on a mistake:** 400 ms red flash + shake. At `position` the shake is followed by a blocking popup carrying the wrong option's `why` and then the correct pose; at `technique` and `collimate` the shake is all the player gets. Everything withheld is delivered by the debrief (§4.5).
- **Save key** `medici.save.v1`: `{ version: 1, unlocked: number, stars: Record<number, 0|1|2|3>, settings: { sound } }`. Missing or corrupt save → fresh save, no crash. A future version bumps the key and migrates. The `timers` and `hints` settings are gone; a v1 save written before this revision still loads, and the extra keys are ignored.

## 7. Assets

### Client clarification — 2026-09-28

Positioning previews must not show the collimation light field or its "+" marker; they belong to the
collimation stage. About 21 of the 28 delivered previews still show it (the four chest previews do
not). **The game uses the delivered images as they are**, and cleaned files returned under the same
filenames drop in with no code change (Vai, 2026-10-01). Who does the edit is an open item (§12).

If time is limited, patient artwork does not have to depict a heavier or thinner body matching each
case's body-habitus description. Reusing the supplied patient figures is acceptable, but all supplied
patient information must remain complete and available to the player, including body habitus. This
is an artwork concession only; it does not permit dropping or changing case information. The order
card (§4.3) carries every patient field from the database, and §5 states how the twenty patients map
onto the eight delivered figures.

### 7.1 Asset ids are the client's filenames

**Superseded on 2026-10-01:** the `group-subject-detail` grammar over closed vocabularies that this
section used to define (`patient-<age>-<sex>-<habitus>`, `xray-<region>-<projection>-<pathology>-<exposure>`,
and so on). The client drew to the earlier 1 September asset lists and named the files their own way.
Vai chose to adopt those names rather than rename 134 files away from what the client sees, so a
conversation about `xray-ptb-under` refers to the same file on both sides.

An asset id is the delivered filename, lowercased, without its extension, with two normalisations:
a duplicate-download suffix ` (1)` is dropped (`btn-small (1).png` → `btn-small`), and
`Web Game Logo.png` becomes `logo`. The interface folder's own `logo.png` — which is actually a
600×200 JPEG — is not used. Ids are unique across groups; a test enforces it.

What this costs: ids are no longer derivable from level data, except films (§5), so a level names
each pose and patient explicitly, and the schema checks that the id exists rather than that it parses.
Membership is the stronger check anyway — a well-formed id for a file nobody delivered was the gap the
grammar could not catch.

### 7.2 Manifest

`src/assets.ts` builds the manifest from the files under `src/assets/` with Vite's
`import.meta.glob`, so there is no hand-maintained list to drift from the disk. The delivered inventory,
2026-09-28:

| Group | Files | Notes |
|---|---|---|
| Patients | 8 | `patient-{child,teen,young,old}-{boy,girl,man,woman}` as delivered; standing idle |
| Radtech | 3 | `radtech-hand-button`, `-pressed`, `radtech-portrait` (unused) |
| Backgrounds | 5 | `bg-title`, `bg-reception`, `bg-xray-room`, `bg-console`, `bg-viewer` |
| Positioning previews | 28 | 3–5 per region; 26 are used across the twenty levels (§5). These double as the collimation view — no collimation art was delivered |
| X-ray films | 60 | `xray-<slug>-{good,under,over}`, all twenty cases complete |
| Interface | 25 | Includes hover/pressed states and lamps the 2026-09-07 revision said CSS would produce; the delivered files are used where they exist |
| Sounds | 5 | `ambience-clinic`, `sfx-click`, `-correct`, `-wrong`, `-xray` |

**134 files, about 45 MB**, of which the films are 25 MB and the five backgrounds 10 MB. A level loads
only its own three films and one is ever shown, so first load is dominated by the backgrounds;
compressing them is deferred until it is measured as a problem on a phone.

**Every film carries a Radiopaedia credit line burned into the image** (e.g. "Niknejad M, Bilateral
spontaneous pneumothorax. Case study, Radiopaedia.org"). Radiopaedia case images are generally
licensed CC BY-NC-SA. The credit stays visible and is never cropped. The non-commercial term matters
if the game is ever sold; it is recorded in §12 rather than decided here.

**Films are the one hard exclusion from generation.** A generated radiograph would be a convincing
image of anatomy that does not exist, teaching a student to recognise a fabricated finding. A labelled
grey box is the honest failure mode. With all sixty delivered, the rule now costs nothing, and it stays.

### 7.3 Art direction

`docs/art-direction.md` is the standing description of the look, derived from `docs/brief/reference-characters.jpg`: lineart `#3A2A22` at uniform weight, one cel shadow tone per base colour, flat frontal light, a thirteen-colour muted earth palette, adults ~8 heads and children ~6 heads at 62–65% of adult height, and two reserved signal colours (wrong-answer red, collimation yellow) that appear in no artwork. With every group delivered it now governs only a generated replacement for a missing file. The positioning previews are photographic and do not follow it; that is the client's choice.

### 7.4 Fallback pipeline

Any id with no file renders as a grey box labeled with the id, so both parties see what is still owed. To fill a gap, Claude Code generates an image with an image-gen MCP (Nano Banana Pro via `shinpr/mcp-image`; GPT Image as second choice), prompted from exactly three parts in order: the character sheet as the style reference image, the style paragraph and relevant palette rows from `art-direction.md` verbatim, and the asset's own checklist description verbatim. No embellishment — the style is defined by restraint, and "highly detailed / 4k" breaks it. Generated files live only in `src/assets/generated/` and never move out, so the client can always tell what to replace. No API keys are committed.

## 8. Client deliverables

Both live in `docs/client/` and are formatted for pasting into Google Docs.

1. **`level-content-sheet.md`** — rewritten for the twenty cases to ask only for what the database
   lacks (§12), and to show each placeholder from §5 as a value to confirm or correct rather than a
   blank. Fields map 1:1 to the level JSON. The client returns it; the developer transcribes it into
   JSON and flips `draft` to `false`.
2. **`assets/00-index.md` … `assets/08-sounds.md`** — the asset checklists. **Historical since
   2026-10-01:** the client delivered against the earlier 1 September lists, and §7.2 records what
   arrived. The checklists are not reissued; their §7.1-grammar filenames no longer apply.

`docs/art-direction.md` is internal but shareable: the client is welcome to it, and the index offers it.

## 9. Acceptance criteria and testing

Criteria are written before the code they test. The gate is `npm run qa` = typecheck + lint + vitest + playwright; nothing is done until it passes.

**Unit (vitest, pure functions):**
- `stars(mistakes)` returns 3 / 2 / 2 / 1 / 1 for 0 / 1 / 2 / 3 / 4.
- `checkTechnique(value, spec)` is true at `target ± tolerance` inclusive, false one step outside — including on the 0.1 mAs step, where `1.4` against level 6's `1.6 ± 0.2` is correct (a naive `≤` comparison rejects it) and `1.3` is not.
- `filmFor(kvp, mas, spec)` returns `good` when both are in tolerance; `under` when either is below; `over` when neither is below and at least one is above; and **`under` when kVp is below tolerance while mAs is above** — the tie-break in §4.4.
- `filmFor` depends on nothing but kVp and mAs: the same pair returns the same film for every position and collimation outcome.
- `checkCollimation({w,h}, spec)` requires both dimensions within tolerance.
- `mistakes()` counts a repeatedly-failed collimation as 1, and counts a timer expiry at `position` as the same 1 mistake a wrong pose would cost — not 2. A `technique` expiry with both dials in tolerance costs 0.
- `loadSave()` returns a fresh save on missing key, on invalid JSON, and on a wrong `version`, and drops the retired `timers` / `hints` settings from a pre-revision save without crashing.
- Level schema rejects: a level with two `correct: true` positions; one with none; a `tolerance` that is negative; a target outside its dial's `min`–`max`; a level still carrying a removed `assess`, `position.hint`, or `expose` block.
- Every shipped level file passes the schema.
- Every asset id a level names — patient sprite, every pose, and its three derived film ids — exists in the manifest. Manifest ids are unique.
- **The twenty levels produce sixty distinct film ids** — the regression that would silently show a pneumothorax film for a pulmonary edema case.
- Level ids are exactly 1–20 with no gap or repeat; every `section` is one of the six in §1, with levels 1–3, 4–6, 7–9, 10–12, 13–15, and 16–20 in each in turn.
- The transcription spot-check: levels 1, 10, and 20 carry the database's kVp/mAs (125/4, 70/4, 75/16) and patient names, typed into the test from the DOCX rather than read from the JSON.

**End-to-end (Playwright, desktop and a mobile-landscape viewport):**
- Boot → Title shows Start / Select Level / Settings; Level Select shows L1 unlocked and L2–20 locked, under six section headings, with only the Chest section expanded.
- Level Select scrolls its card list to reach L20 without the stage itself scrolling or letterboxing shifting, on both viewports.
- Settings shows exactly two controls — sound and reset progress — and no timer or hint toggle.
- Play L1 with every answer correct → the good film appears only after the exposure button is held; Results shows 3 stars, the findings, and a debrief with no ✗ rows; Level Select now shows L2 unlocked; reload keeps it.
- Play L1 with a wrong position → the popup explains why (or shows "Awaiting client" while `why` is null) and shows the correct pose, there is no retry, and the **good** film still appears at the end. Results shows 2 stars and one ✗ row.
- Play L1 with kVp below tolerance → the console shakes and says nothing else, no image appears at that stage, and the underexposed film appears only at the exposure. The debrief names the correct kVp.
- No screen at any point before `expose` renders an `xray-*` asset, and the findings text appears nowhere before Results.
- Fail collimation three times, then succeed → Results shows one mistake, not three.
- Let the position timer run out → it is scored as a wrong position, with no second mistake.
- The order card shows every patient field for L1, including body habitus, date of birth, patient ID, and admission time.

## 10. Build and deploy

- `npm run dev` for local play; `npm run build` emits `dist/`.
- GitHub repo (private) → Cloudflare Pages: production on `main`, a preview URL per branch for the client to try.
- Optional later: upload `dist/` to itch.io as a second front door.

## 11. Out of scope for v1

Accounts, backend, leaderboards; more than twenty levels or more than one injury per level; localisation; native app builds; voice acting; a level editor.

The level cap was five until 2026-09-10, when the client's case database set it at twenty. Twenty is
now the ceiling for v1, and a twenty-first case is a v2 conversation.

## 12. Open items

Reconciled against `LIST OF CASES.docx` on 2026-10-01. Every level stays `draft: true` until the first
three are answered; the game is fully playable meanwhile on the §5 placeholders, and every missing
sentence renders as "Awaiting client".

**Values the game runs on placeholders for** — the client confirms or corrects:

- **The two wrong positioning options per level, and one sentence each on why they are wrong.** The
  options are chosen from the client's own previews (§5 table); the `why` sentences are blank.
- **Tolerance bands and dial limits for kVp and mAs.** The database now gives one value per case;
  the ±10% band and the fixed console range are placeholders.
- **Collimation as a measurable field.** Every entry is prose, such as "collimate on four sides to
  area of lung fields". The placeholder target is 60% × 70% of the view on every level.

**Copy the database does not carry** — rendered as "Awaiting client" until supplied:

- Debrief copy: the technique note, why a wrong kVp or mAs is wrong, and what the underexposed and
  overexposed films each fail to show, per level.
- The patient's opening line of dialogue, twenty of them.
- Structures to show: only levels 10, 11, and 12 carry one (`SS:` in the source).

**Questions for the client:**

- **Level 1 is titled "Pulmonary Edema" but its findings describe pleural effusions**, and its
  reference link is a re-expansion pulmonary oedema case. The title and film slug follow the database
  (`pulmonaryedema`); the client should confirm which it is.
- **Level 19 is an AP upright abdomen**, and **levels 10–12 are AP supine**, but one `pose-abd-ap`
  preview serves all four. Erect versus supine changes the exam; an upright preview may be needed.
- **Level 12's "SS:" entry reads as a finding**, not a structure to show ("…the sigmoid colon
  distended and demonstrating the coffee-bean sign"). It is transcribed as written and so appears on
  the order card, where it gives the diagnosis away. The client should confirm or move it to findings.
- **The order card's "Mission" names the correct projection** ("Perform PA") on every level, as the
  database does. The positioning stage therefore tests recognising the pose rather than choosing the
  projection. Kept, because the client requires complete patient information; worth confirming.
- **Level 14 is a nasal-bone lateral** shown with the whole-skull lateral preview.
- **Levels 2, 4, 5, 6, 11, 14, and 17 give no "Relevant History"**; the card omits the row rather
  than inventing one. That is a faithful transcription, not a gap. Level 15's row in the DOCX has its fields run together; it was transcribed by
  reading the labels.
- **Who removes the collimation light and "+"** from the ~21 previews that still show it (§7).
- **Radiopaedia licensing.** The films are Radiopaedia case images with credits burned in; their
  licence is generally CC BY-NC-SA. Fine for a free learning activity; a question if it is ever sold.

Settled, kept as a record:

- Level 6 (elbow) is filed under Upper extremity; levels 15, 19, and 20 have one projection each.
  The 2026-09-10 conflicts are closed by the new database.
- The kVp scale conflict (handwritten 1–20 versus real-world values) is settled: every case gives
  real-world kVp, 55 to 125.
- The `pose-skull-ap-frontal` naming question is moot; the client's previews are named their own way.
- Whether to ship on itch.io in addition to Cloudflare Pages is deferred until the client has seen the game.

## 13. Revision log

### 2026-10-01 — reconciled with the new case database and the art delivery

Brainstormed with Vai before the implementation plan. The loop, scoring, and stack are untouched;
this changes data and assets only.

1. **Level table rebuilt from `LIST OF CASES.docx`** (§1, §5). Level 1 is pulmonary edema, not
   pleural effusion, with 4 mAs rather than 3. Sections are now three cases each plus a five-case
   refresher, with level 6 moved to Upper extremity. Levels 15, 19, and 20 lost their projection
   conflicts.
2. **Asset ids are the client's filenames** (§7.1, Vai's choice). The `group-subject-detail` grammar
   and its closed vocabularies are superseded; the schema checks membership instead of shape. Film
   ids stay derived, from a per-level slug.
3. **The manifest is built from disk** by `import.meta.glob` over `src/assets/` rather than kept by
   hand (§4.6, §7.2). 134 files were delivered, all sixty films among them.
4. **Placeholders for what the database lacks** (§5): ±10% tolerance, a fixed console range with dials
   starting at minimum, a 60% × 70% collimation target over the correct pose image, and wrong options
   chosen from the same region's previews. "Awaiting client" renders for every missing sentence. All
   twenty levels stay `draft`.
5. **Order card and findings** (§4.3, §4.5). The order card carries the complete patient information
   (the client's 2026-09-28 condition); the radiologist's findings appear on the results screen only.
6. **Timer expiry made exact** (§4.3): at `position` it is a wrong answer; at `technique` it submits
   the dials as they stand.
7. **First milestone:** all twenty levels playable with the real art, shippable to a preview URL for the
   client to review.

*Correction, 2026-10-01 (final review):* the float example in §5 and §9 was wrong. In JavaScript
2.5 − 2.2 is 0.2999999999999998, so that case never failed a naive comparison. The discriminating case
from shipped data is level 6's mAs, 1.4 against 1.6 ± 0.2 (|1.4 − 1.6| is 0.20000000000000018); both
sections now name it, and the unit test keeps the 2.2 case alongside.

### 2026-09-28 — new case database confirmed as authoritative

Vai confirmed that `Medici Project/LIST OF CASES.docx` replaces the earlier September case database
wherever they differ. The older transcription is marked as an archived reference. Reconciliation
of the spec's case table, values, asset ids, and remaining gaps is pending; the source decision is
settled. The supplied five-case Level Content Sheet does not replace the new twenty-case database.

### 2026-09-28 — positioning previews and patient information

Client comments relayed by Vai:

> positioning previews: patanggal nung light na may + sign, ayun kasi yung collimation

> patients: kahit wag mo na sila gawing mataba or payat based sa description kung hindi kaya ng time, basta need na complete yung nasa patient information

Recorded in §7: remove the collimation light and "+" marker from positioning previews; body-habitus
variations in patient art are optional if time is limited, while complete patient information stays
required. The separate source confirmation above settles which case database is authoritative.

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
