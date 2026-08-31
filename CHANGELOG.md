# Changelog

Dated project log, newest first. Code changes follow Conventional Commits in git; this file records decisions, deliverables, and milestones.

## 2026-09-01

Client returned the briefing. Their answers reframe the project from a casual game to an alternative learning activity, and that changed the loop rather than just its content. Spec revised in place with a revision log at §13.

- **The loop lost a stage and all its retries.** "Assess the patient" is cut, so a case is now intake → order → position → technique → collimate → expose → result. Position and technique give one attempt each; collimation is the only stage that may be re-attempted, and it now costs a star (once, however many tries).
- **The radiograph became a sealed consequence.** It is decided solely by kVp/mAs at the technique stage and is not rendered anywhere before the exposure — no preview, no inline bad-film feedback. Position and collimation never affect it. Where one value is low and the other high, `under` wins; the rationale is in spec §4.4.
- **The exposure lost its timed sweep entirely.** No red/yellow/green bar and no way to mistime it; it is now a two-stage press-and-hold, unscored. `expose` can no longer produce a mistake.
- **The console went silent.** A wrong kVp or mAs gets a red shake and nothing else — no explanation, no correct value, no green lamp.
- **Teaching moved to an end-of-case debrief** on the result screen: every scored decision, what was correct, and why. This is now the only place a student learns the correct technique values.
- **Timers are mandatory and hints are gone entirely** — including the level-1 tutorial hints, the collimation idle hint, the per-level `hint` field, and both settings toggles. Settings is down to sound and reset progress.
- Schema: `assess`, `position.hint`, and the whole `expose` block removed; film ids moved to a new top-level `films`. Stack: `canvas-confetti` dropped.
- **Deliverables:** `docs/client/asset-checklist.md` split into `docs/client/assets/` — an index plus eight standalone per-group lists, each self-contained for sending or pasting separately. Six assets dropped (five `assess-*.png`, `sfx-confetti.mp3`), `indicator-green.png` retired, nothing added; 85 files total. Level content sheet relabelled so the client writes for the debrief rather than for hints. The briefing is marked answered and superseded in place.
- **Judgment call, flagged for the client:** `technique.note` (the kVp/mAs balance sentence) moved off the console into the debrief, on the grounds that a live crib sheet reads as a hint. One line to reverse.
- Open: still the kVp scale conflict (client's handwritten 1–20 vs real-world 40–130), and all medical values remain `draft: true` pending the content sheet.

## 2026-08-27

- Repository initialised. Client brief and style reference moved into `docs/brief/`.
- Design spec written and approved: `docs/superpowers/specs/2026-08-27-medici-radtech-game-design.md`.
  - Engine: Vite + React + TypeScript, DOM-first, fixed 960×640 scaled stage. Phaser/Godot/Unity rejected for this game (see `docs/research/`).
  - Scope: full 7-stage level loop with "red shake + explain" feedback, 3-star scoring, no fail state, localStorage save, timers as a setting.
  - Content: AI-drafted level data flagged `draft: true` until the client returns the content sheet.
  - Art: client-drawn from an asset checklist; AI-generated stand-ins kept in `public/assets/generated/`.
  - Hosting: Cloudflare Pages.
- Client documents drafted in `docs/client/`: project briefing (with FAQ and a decisions section), level content sheet (five pre-filled draft levels), asset checklist (~92 files with names, sizes, art direction).
- Open: client's answers to briefing §10; kVp scale conflict between the client's handwritten notes (1–20) and real-world values (40–130) flagged in the content sheet.
