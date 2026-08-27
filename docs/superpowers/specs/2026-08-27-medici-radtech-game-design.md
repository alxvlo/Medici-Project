# Medici — Radtech Simulator: Design Spec

**Date:** 2026-08-27
**Status:** Draft for review
**Supersedes:** the client's brief (`docs/brief/client-brief-2026-08.pdf`, originally "WEBSITE DETAILS (SEND TO DEVELOPER).pdf") as the working design. The PDF stays as the source brief; where the two disagree, this spec wins. The client's style reference is `docs/brief/reference-characters.jpg` (originally `asset1.jpg`).

## 1. What we are building

A browser game in which the player is a radiologic technologist. Each of five levels presents one patient with one injury, and the player walks them through the real X-ray workflow: read the order, find the injury, choose the position, set kVp and mAs, collimate, and time the exposure. Wrong choices are explained, not punished; the player retries until correct and earns one to three stars per level.

The look is a Flash-era job simulator (Papers Please, Good Pizza Great Pizza, Superhero Hospital): a fixed cartoon stage, everything on one screen, snappy tweens. The art is the client's; see §8.

**Audience:** radiography students, playing on laptops and phones.
**Client:** a friend of the developer who owns the medical content and the art. The developer (Vai) builds it solo with Claude Code.

## 2. Decisions already made

| Decision | Choice | Why |
|---|---|---|
| Platform | Browser, desktop + mobile touch, landscape | One build, shared by link; matches the brief |
| Engine | Vite + React 19 + TypeScript, DOM-first | The game is ~90% UI; DOM gives free text, touch, and instant hot reload; it is the stack Claude Code is most reliable in. Phaser can be embedded per-level later if a spatial level ever appears. |
| Loop | Full 7-stage loop from the brief's §B, with the feedback rules from its §A flowchart | Client wants the full workflow; the "red shake + explain" rule is clearer teaching than a fail state |
| Scoring | 3-star per level, no lives, no fail state | Educational tool, replayable for a better score |
| Persistence | `localStorage`, no accounts, no backend | Nothing to run or secure |
| Medical content | AI-drafted now, flagged `draft: true`; client fills a template later | Unblocks development; the client is the authority |
| Art | Client-drawn from an asset manifest; AI-generated fallback in a clearly labeled folder | Client has a style already (`asset1.jpg`) |
| Hosting | Cloudflare Pages (+ optional itch.io) | Free, unlimited bandwidth, preview URL per branch. Vercel Hobby is non-commercial only. |

## 3. Stack and libraries

- `vite`, `react`, `react-dom`, `typescript`
- `motion` — tweens (slide-in, pop, shake)
- `canvas-confetti` — success burst
- `zod` — validates level JSON
- Dev: `vitest`, `@playwright/test`, `eslint`, `prettier`

No state library, no router library, no UI kit. Screen and level state live in one `useReducer` store. Anything else is added only when a concrete stage needs it.

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
- **Results:** final film, stars, "Next level" / "Replay" / "Level select".
- **Settings:** sound on/off, timers on/off (default on), hints on/off, reset progress (confirm first).

### 4.3 Level stage machine

A level is a sequence of stage components. Each receives `(level: Level, onComplete: (mistakes: number) => void)` and knows nothing about the others.

| # | Stage | Player does | Correct | Wrong |
|---|---|---|---|---|
| 1 | `intake` | Patient slides in; chat bubble shows their line; tap to continue | — | — |
| 2 | `order` | Doctor's order card appears (name, age, sex, habitus, exam, structures, pathology). Tap to dock it to a side panel, where it stays readable for the rest of the level | — | — |
| 3 | `assess` | Tap the injured area on the patient figure | Zoom + red highlight, continue | Gentle hint text; no mistake counted |
| 4 | `position` | Pick one of three pose thumbnails; hover / long-press shows a large preview. Optional timer | Advance | Red flash + shake + popup with that option's `why` text; retry. Mistake +1 |
| 5 | `technique` | Set kVp, then mAs, on two dials (drag or ±). Press Enter to check each | Green light on the dial; both green advances | Red light + shake + `wrongKvp`/`wrongMas` popup; retry. Mistake +1. A side note explains the kVp/mAs balance. Optional timer |
| 6 | `collimate` | Two knobs (width, height) resize a translucent light field over the zoomed patient. A red target marker shows the required field | When both dimensions are within tolerance the marker flashes green and the stage auto-advances | No explicit wrong state; hint appears after 20 s idle |
| 7 | `expose` | A cursor sweeps a red/yellow/green bar next to the X-ray viewer; press the exposure button (or tap anywhere) | Press in green: correct film fades in | Yellow: underexposed film + `underNote`; red: overexposed (white) film + `overNote`; retry. Mistake +1 |
| 8 | `result` | Film zooms in, confetti, star screen | — | — |

Timers: when the setting is on, `position` and `technique` show a countdown ring from the level's `timers` values. Expiry counts as one mistake, shows the stage hint, and restarts the timer. Timers are never fatal.

### 4.4 Folder layout

```
src/
  app/          Stage.tsx, App.tsx (screen state), store.ts, save.ts
  screens/      Title.tsx, LevelSelect.tsx, Settings.tsx, Results.tsx
  stages/       Intake, Order, Assess, Position, Technique, Collimate, Expose, Result
  ui/           Button, Popup, TimerRing, Dial, Knob, ChatBubble, ShakeFlash
  data/
    schema.ts   zod Level schema + TS type
    levels/     01-chest.json … 05-skull.json
  assets.ts     manifest: id → path; missing file → labeled placeholder
public/assets/
  characters/ backgrounds/ poses/ xray/ ui/ sfx/ generated/
docs/
  superpowers/specs/   this file
  asset-manifest.md    for the client (checklist)
  client-content-template.md
tests/
  unit/         vitest
  e2e/          playwright
```

## 5. Data model

One JSON file per level, validated by `schema.ts` at build and at load. A malformed file fails the build with the field name.

```jsonc
{
  "id": 1, "title": "Chest", "region": "chest", "draft": true,
  "patient": { "sprite": "patient-boy", "name": "Miguel", "age": 12, "sex": "M",
               "habitus": "sthenic", "line": "I fell off my bike… my chest hurts." },
  "order": { "exam": "Chest X-ray, PA erect", "structures": ["left ribs 4–9", "lung fields"],
             "pathology": "suspected left rib fracture" },
  "assess": { "hitbox": { "x": 420, "y": 250, "w": 120, "h": 140 }, "zoomImage": "assess-chest" },
  "position": {
    "options": [
      { "id": "pa-erect",  "image": "pose-chest-pa-erect", "correct": true },
      { "id": "ap-supine", "image": "pose-chest-ap-supine", "why": "AP supine magnifies the heart and blurs the lung bases." },
      { "id": "lateral",   "image": "pose-chest-lateral",   "why": "A lateral alone cannot show the left rib series." }
    ],
    "hint": "Rib series are taken erect, PA, to keep the heart shadow small."
  },
  "technique": {
    "kvp": { "target": 110, "tolerance": 10, "min": 40, "max": 130, "step": 5 },
    "mas": { "target": 2.5, "tolerance": 0.5, "min": 0.5, "max": 20, "step": 0.5 },
    "note": "The chest is high-contrast; favour high kVp and low mAs.",
    "wrongKvp": "Too low a kVp will not penetrate the mediastinum.",
    "wrongMas": "Too high an mAs overexposes the lungs and adds dose."
  },
  "collimate": { "target": { "w": 340, "h": 420 }, "tolerance": 20, "baseImage": "collim-chest" },
  "expose": {
    "sweepMs": 1800, "yellowEnd": 0.55, "greenEnd": 0.70,
    "images": { "correct": "xray-chest-good", "under": "xray-chest-under", "over": "xray-chest-over" },
    "underNote": "Not enough exposure — the ribs are lost in noise.",
    "overNote": "Overexposed — the film is burnt out."
  },
  "timers": { "position": 60, "technique": 45 }
}
```

Conventions: image fields are asset ids resolved by `assets.ts`, never paths. Bar zones are fractions of the sweep: `[0, yellowEnd)` yellow, `[yellowEnd, greenEnd]` green, `(greenEnd, 1]` red. `tolerance` is inclusive: `|value − target| ≤ tolerance` is correct.

**Draft level content (AI-drafted, client to correct):**

| Level | Region | Injury |
|---|---|---|
| 1 | Chest | Left rib fracture (bike fall) |
| 2 | Upper limb | Distal radius (Colles) fracture |
| 3 | Lower limb | Lateral malleolus (ankle) fracture |
| 4 | Abdomen | Small-bowel obstruction |
| 5 | Skull | Facial trauma, zygomatic arch |

## 6. Scoring, feedback, save

- **Mistake** = wrong position, wrong kVp or mAs check, non-green exposure, or timer expiry. `assess` and `collimate` never count.
- **Stars:** 0 mistakes → 3, 1–2 → 2, 3+ → 1. Finishing at all unlocks the next level. Best stars are kept.
- **Feedback on a mistake:** 400 ms red flash + shake, then a popup with the level-authored explanation and a Retry button. The popup blocks input until dismissed.
- **Save key** `medici.save.v1`: `{ version: 1, unlocked: number, stars: Record<number, 0|1|2|3>, settings: { sound, timers, hints } }`. Missing or corrupt save → fresh save, no crash. A future version bumps the key and migrates.

## 7. Assets

### 7.1 Manifest

`src/assets.ts` is the single list of every asset id the game loads; `docs/asset-manifest.md` is the same list rendered for the client as a checklist with filename, size in px (delivered at 2× for retina), format, screen it appears on, and a one-paragraph art direction. Groups and counts:

| Group | Count | Notes |
|---|---|---|
| Patients | 6 × 2 poses | Standing idle + "in pain" expression; the roster in `asset1.jpg` |
| Radtech | 1 | Partial figure / hand for the exposure button |
| Backgrounds | 5 | Title, reception, X-ray room, console close-up, film viewer |
| Position thumbnails | 15 | 3 per level |
| Assess zooms | 5 | Body region with injury highlight area |
| Collimation base | 5 | Zoomed region the light field sits over |
| X-ray films | 15 | Good / under / over per level |
| UI | ~20 | Button states, order card, chat bubble, case file, dial, knob, light field, star, timer ring, popup panel, level card |
| SFX | 6 | Click, wrong buzz, correct chime, X-ray thunk, confetti, clinic ambience loop |

Style, taken from `asset1.jpg`: soft cel-shading, dark-brown lineart, muted earth palette, front-facing, transparent background, ~600 px tall figures at 1×.

### 7.2 Fallback pipeline

Any manifest id with no file renders as a grey box labeled with the id, so both parties see what is still owed. To fill a gap, Claude Code generates an image with an image-gen MCP (Nano Banana Pro via `shinpr/mcp-image`; GPT Image as second choice) using `asset1.jpg` as the style reference and the manifest paragraph as the prompt, saving to `public/assets/generated/`. SFX from the ElevenLabs free tier. Generated files are never moved out of `generated/`, so the client can always tell what to replace. No API keys are committed.

## 8. Client deliverables

Both live in `docs/` and are exported to .docx / PDF when sent.

1. **`client-content-template.md`** — one sheet per level in plain language. Fields map 1:1 to the level JSON: patient details and line; the doctor's order; the correct position and, for each wrong option, why it is wrong; kVp and mAs targets with acceptable range; collimation field size; exposure notes. The client returns it; the developer transcribes it into JSON and flips `draft` to `false`.
2. **`asset-manifest.md`** — the §7.1 list as a tick-box checklist.

## 9. Acceptance criteria and testing

Criteria are written before the code they test. The gate is `npm run qa` = typecheck + lint + vitest + playwright; nothing is done until it passes.

**Unit (vitest, pure functions):**
- `stars(mistakes)` returns 3 / 2 / 2 / 1 / 1 for 0 / 1 / 2 / 3 / 7.
- `checkTechnique(value, spec)` is true at `target ± tolerance` inclusive, false one step outside.
- `checkCollimation({w,h}, spec)` requires both dimensions within tolerance.
- `exposeOutcome(t, spec)` returns `under` / `correct` / `over` at 0.3 / 0.6 / 0.9 for the L1 spec, and `correct` exactly at `yellowEnd` and `greenEnd`.
- `loadSave()` returns a fresh save on missing key, on invalid JSON, and on a wrong `version`.
- Level schema rejects: a level with two `correct: true` positions; one with none; `tolerance` negative; an unknown asset id.
- Every shipped level file passes the schema.

**End-to-end (Playwright, desktop and a mobile-landscape viewport):**
- Boot → Title shows Start / Select Level / Settings; Level Select shows L1 unlocked, L2–5 locked.
- Play L1 with all correct answers → Results shows 3 stars; Level Select now shows L2 unlocked; reload keeps it.
- Play L1 with one wrong position → the explanation popup appears, retry works, Results shows 2 stars.
- Settings → timers off → the `position` stage shows no timer ring.

## 10. Build and deploy

- `npm run dev` for local play; `npm run build` emits `dist/`.
- GitHub repo (private) → Cloudflare Pages: production on `main`, a preview URL per branch for the client to try.
- Optional later: upload `dist/` to itch.io as a second front door.

## 11. Out of scope for v1

Accounts, backend, leaderboards; more than five levels or more than one injury per level; localisation; native app builds; voice acting; a level editor.

## 12. Open items

- All medical values in the level files are drafts until the client returns the content template.
- Default for timers (on) may be flipped after the client plays a build.
- Whether to ship on itch.io in addition to Cloudflare Pages is deferred until the client has seen the game.

## Appendix — tooling research summary (2026-08)

Engines: Phaser 4 (Apr 2026) is the best canvas option and has an official agent skill file, but text/UI/touch are harder than DOM and models still mostly know Phaser 3. Godot 4.6 exports to web as a multi-MB WASM blob with iOS Safari caveats. Unity 6 WebGL empty builds are ~10 MB and editor-driven. For a UI-heavy job sim, React DOM wins; Phaser can be embedded in a React app if a spatial level ever appears (Phaser's official `template-react-ts`).

AI art: Nano Banana Pro (Gemini image) and GPT Image hold character consistency from a reference sheet; FLUX.2 for backgrounds; Scenario ($45/mo) for a style LoRA only if drift becomes a problem. SFX: ElevenLabs free tier. Music: Suno Pro ($10/mo) for commercial rights.

Sources: phaser.io/news/2026/04 (framework comparison), jslegenddev.substack.com (independent test), phaser.io/news/2026/07 (Phaser Agent MCP), vivecuervo7.github.io (Claude Code + Godot), gist aras-p (Unity web build sizes), vibedex.ai (2026 game-art model benchmark), github.com/shinpr/mcp-image, vercel.com/docs/plans/hobby.
