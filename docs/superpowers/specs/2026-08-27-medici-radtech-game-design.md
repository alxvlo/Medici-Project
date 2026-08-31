# Medici — Radtech Simulator: Design Spec

**Date:** 2026-08-27
**Revised:** 2026-09-01 — the client's answers to the briefing folded in; see §13.
**Status:** Approved
**Supersedes:** the client's brief (`docs/brief/client-brief-2026-08.pdf`, originally "WEBSITE DETAILS (SEND TO DEVELOPER).pdf") as the working design, and — since the 2026-09-01 revision — the level flow described in `docs/client/2026-08-27-client-briefing.md` §3, §5, and its FAQ. The PDF stays as the source brief; where any of them disagree with this file, this file wins. The client's style reference is `docs/brief/reference-characters.jpg` (originally `asset1.jpg`).

## 1. What we are building

A browser-based learning activity in which the student plays a radiologic technologist. Each of five levels presents one patient with one injury, and the student walks them through the real X-ray workflow: read the order, choose the position, set kVp and mAs, collimate, take the exposure, read the film.

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
| Loop | Six playable stages plus a result screen; the brief's "assess the patient" step is cut | Client, 2026-09-01 |
| Feedback | One attempt per decision. Wrong choices are explained, never re-offered | Client, 2026-09-01. Retrying until correct teaches the student to guess |
| The radiograph | Determined solely by kVp/mAs, and hidden until the exposure is taken | Client, 2026-09-01. The film is the consequence of the technique, and a consequence you can preview is not one |
| Scoring | 3-star per case, no lives, no fail state | Replayable for a better score; the star count is the only thing a mistake costs |
| Timers | Always on, not configurable | Client, 2026-09-01 |
| Hints | None, anywhere | Client, 2026-09-01 |
| Persistence | `localStorage`, no accounts, no backend | Nothing to run or secure |
| Medical content | AI-drafted now, flagged `draft: true`; client fills a template later | Unblocks development; the client is the authority |
| Art | Client-drawn from an asset checklist; AI-generated fallback in a clearly labeled folder | Client has a style already (`reference-characters.jpg`) |
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
- **Level select:** five cards (title, region, stars, locked/unlocked), Good-Pizza-style.
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
    levels/     01-chest.json … 05-skull.json
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
{
  "id": 1, "title": "Chest", "region": "chest", "draft": true,
  "patient": { "sprite": "patient-young-man", "name": "Miguel", "age": 24, "sex": "M",
               "habitus": "sthenic", "line": "I came off my bike and landed on my left side." },
  "order": { "exam": "Chest X-ray, PA erect", "structures": ["left ribs 4-9", "lung fields"],
             "pathology": "suspected left rib fracture" },
  "position": {
    "options": [
      { "id": "pa-erect",  "image": "pose-chest-pa-erect", "correct": true,
        "label": "PA erect, arms rolled forward" },
      { "id": "ap-supine", "image": "pose-chest-ap-supine", "label": "AP supine",
        "why": "AP supine magnifies the heart and blurs the lung bases." },
      { "id": "lateral",   "image": "pose-chest-lateral",   "label": "Lateral only",
        "why": "A lateral alone cannot show the left rib series." }
    ]
  },
  "technique": {
    "kvp": { "target": 110, "tolerance": 10, "min": 40, "max": 130, "step": 5 },
    "mas": { "target": 3, "tolerance": 1, "min": 0.5, "max": 20, "step": 0.5 },
    "note": "The chest is high-contrast; favour high kVp and low mAs.",
    "wrongKvp": "Too low a kVp will not penetrate the mediastinum.",
    "wrongMas": "Too high an mAs overexposes the lungs and adds dose."
  },
  "collimate": { "target": { "w": 340, "h": 420 }, "tolerance": 20, "baseImage": "collim-chest" },
  "films": {
    "good": "xray-chest-good", "under": "xray-chest-under", "over": "xray-chest-over",
    "underNote": "Not enough exposure - the ribs are lost in noise.",
    "overNote": "Overexposed - the film is burnt out."
  },
  "timers": { "position": 60, "technique": 45 }
}
```

Conventions: image fields are asset ids resolved by `assets.ts`, never paths. `tolerance` is inclusive: `|value − target| ≤ tolerance` is correct. `note`, `wrongKvp`, `wrongMas`, `underNote`, and `overNote` are never rendered during play — they are the debrief's copy.

Removed in the 2026-09-01 revision: the `assess` block (stage cut), `position.hint` (hints cut), and the whole `expose` block with its `sweepMs` / `yellowEnd` / `greenEnd` sweep timing (the exposure is no longer a timed challenge). The three film ids moved out of `expose` into the new top-level `films`, because they are now produced by `technique`.

**Draft level content (AI-drafted, client to correct):**

| Level | Region | Injury |
|---|---|---|
| 1 | Chest | Left rib fracture (bike fall) |
| 2 | Upper limb | Distal radius (Colles) fracture |
| 3 | Lower limb | Lateral malleolus (ankle) fracture |
| 4 | Abdomen | Small-bowel obstruction |
| 5 | Skull | Facial trauma, zygomatic arch |

## 6. Scoring, feedback, save

- **Mistake sources**, four at most per case: wrong position (max 1), wrong kVp (1), wrong mAs (1), wrong collimation (max 1, however many attempts it takes). Timer expiry is folded into the stage it happens in and never counts separately. `intake`, `order`, and `expose` cannot produce a mistake.
- **Stars:** 0 mistakes → 3, 1–2 → 2, 3+ → 1. Finishing at all unlocks the next level. Best stars are kept.
- **Feedback on a mistake:** 400 ms red flash + shake. At `position` the shake is followed by a blocking popup carrying the wrong option's `why` and then the correct pose; at `technique` and `collimate` the shake is all the player gets. Everything withheld is delivered by the debrief (§4.5).
- **Save key** `medici.save.v1`: `{ version: 1, unlocked: number, stars: Record<number, 0|1|2|3>, settings: { sound } }`. Missing or corrupt save → fresh save, no crash. A future version bumps the key and migrates. The `timers` and `hints` settings are gone; a v1 save written before this revision still loads, and the extra keys are ignored.

## 7. Assets

### 7.1 Manifest

`src/assets.ts` is the single list of every asset id the game loads; `docs/client/assets/` holds the same list rendered for the client as eight standalone checklists — one per group, plus an index — each self-contained so any one can be sent on its own. Groups and counts:

| Group | Count | Notes |
|---|---|---|
| Patients | 6 × 2 poses | Standing idle + "in pain" expression; the roster in the character sheet |
| Radtech | 3 | Hand on the exposure button (up and pressed) + a portrait for the title screen |
| Backgrounds | 5 | Title, reception, X-ray room, console close-up, film viewer |
| Position thumbnails | 15 | 3 per level |
| Collimation base | 5 | Zoomed region the light field sits over |
| X-ray films | 15 | Good / under / over per level |
| UI | 25 | Button states, order card, chat bubble, dial, knob, light field, star, timer ring, popup panel, level card |
| SFX | 5 | Click, wrong buzz, correct chime, exposure, clinic ambience loop |

**85 files.** The 2026-09-01 revision removed six: the five `assess-*.png` injury zoom-ins (the stage that used them is cut) and `sfx-confetti.mp3` (no celebration). `indicator-green.png` also goes, since no dial ever lights green. The two-stage exposure button needs no new art — it reuses `radtech-hand-button.png`, `radtech-hand-button-pressed.png`, and `sfx-xray.mp3`, whose "beep then thunk" already matches a fixed-length prep-and-fire.

Style, taken from the character sheet: soft cel-shading, dark-brown lineart, muted earth palette, front-facing, transparent background, ~600 px tall figures at 1×.

### 7.2 Fallback pipeline

Any manifest id with no file renders as a grey box labeled with the id, so both parties see what is still owed. To fill a gap, Claude Code generates an image with an image-gen MCP (Nano Banana Pro via `shinpr/mcp-image`; GPT Image as second choice) using the character sheet as the style reference and the checklist paragraph as the prompt, saving to `public/assets/generated/`. SFX from the ElevenLabs free tier. Generated files are never moved out of `generated/`, so the client can always tell what to replace. No API keys are committed.

## 8. Client deliverables

Both live in `docs/client/` and are formatted for pasting into Google Docs.

1. **`level-content-sheet.md`** — one sheet per level in plain language. Fields map 1:1 to the level JSON: patient details and line; the doctor's order; the correct position and, for each wrong option, why it is wrong; kVp and mAs targets with acceptable range; collimation field size; the technique note and the under/over explanations that the debrief reads out. The client returns it; the developer transcribes it into JSON and flips `draft` to `false`.
2. **`assets/00-index.md` … `assets/08-sounds.md`** — the §7.1 list as eight tick-box checklists plus an index.

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
- Level schema rejects: a level with two `correct: true` positions; one with none; `tolerance` negative; an unknown asset id; a level still carrying a removed `assess`, `position.hint`, or `expose` block.
- Every shipped level file passes the schema.

**End-to-end (Playwright, desktop and a mobile-landscape viewport):**
- Boot → Title shows Start / Select Level / Settings; Level Select shows L1 unlocked, L2–5 locked.
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

Accounts, backend, leaderboards; more than five levels or more than one injury per level; localisation; native app builds; voice acting; a level editor.

## 12. Open items

- All medical values in the level files are drafts until the client returns the content sheet.
- The kVp scale conflict between the client's handwritten notes (1–20) and real-world values (40–130) is still unresolved; the content sheet asks.
- Whether to ship on itch.io in addition to Cloudflare Pages is deferred until the client has seen the game.

## 13. Revision log

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
