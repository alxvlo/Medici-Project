# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Medici — a browser game where the player is a radiologic technologist. Twenty levels, one patient/injury each, through the real X-ray workflow (intake → order → position → kVp/mAs → collimate → exposure → debrief). Client project: the client owns the medical content and the art.

**Source of truth:** `docs/superpowers/specs/2026-08-27-medici-radtech-game-design.md`. Where the client's original brief (`docs/brief/`) disagrees with the spec, the spec wins. Do not re-litigate decisions recorded in spec §2.

**Medical source of truth:** `Medici Project/LIST OF CASES.docx`, confirmed by Vai on 2026-09-28. It supersedes the earlier `docs/brief/case-database-2026-09.pdf` and its Markdown transcription wherever they differ, including medical values and case grouping copied into the design spec. The older transcription is historical only. All twenty levels come from the new DOCX. Do not invent medical facts; mark gaps and ask.

## Current phase

First playable build, 2026-10-01: all twenty levels play end to end on the client's delivered art, with placeholder values (spec §5) and "Awaiting client" where copy is missing. The plan `docs/superpowers/plans/2026-10-01-medici-v1-plan.md` was executed on branch `feat/v1-playable` (not yet pushed or deployed). Waiting on the client's answers via `docs/client/level-content-sheet.md`; until they arrive every level stays `"draft": true`. The spec was reconciled with `LIST OF CASES.docx` and the art delivery the same day (spec §13).

The **2026-09-10 revision is the largest since the spec was written**: the client's case database took the game from five levels to twenty. Read spec §5 for the level table and §13 for what moved. Crucially it changed the *size* of the game, not the shape of its loop — §4.3, §4.4, §4.5, and §6 are untouched. It also extended the §7.1 vocabularies, gave film ids a pathology segment (four levels are PA chest, so region+projection stopped being unique), and took the manifest from 70 files to about 173.

The 2026-09-01 revision changed the shape of the game rather than its values. The loop lost a stage and all its retries, the radiograph is now a sealed consequence of kVp/mAs revealed only at the exposure, and the teaching moved to an end-of-case debrief. Read spec §4.3–§4.5 before touching level flow.

`docs/art-direction.md` governs the look of anything generated.

## Stack (locked)

Vite + React 19 + TypeScript, DOM-first. A fixed 960×640 `<Stage>` letterboxed and CSS-scaled to the viewport, landscape only. `motion` for tweens, `zod` for level validation. No state library, no router, no UI kit. Tests: vitest (pure logic) + Playwright (end-to-end, desktop and mobile-landscape viewports). Package manager: npm; `package-lock.json` is canonical. Hosting: Cloudflare Pages (Vercel Hobby is non-commercial and was rejected).

As built (2026-10-01, pending Vai's sign-off): `motion` and `prettier` are not installed — CSS keyframes cover the tweens; the docked order card and the results debrief scroll inside the stage; `npm run build` runs the unit tests first; each stage ignores clicks for 300 ms after it appears.

Phaser, Godot, and Unity were evaluated and rejected for this game (`docs/research/2026-08-27-tooling-research.md`). If a level ever needs spatial gameplay, embed a Phaser scene in a component — do not rewrite.

## Commands

- `npm run dev` — local play with hot reload
- `npm run qa` — the gate: typecheck + lint + vitest + playwright. **Nothing is done until this passes.**
- `npx vitest run tests/unit/<file>.test.ts` — one unit file; `npx playwright test tests/e2e/<file>.spec.ts` — one e2e file
- `npm run build` — production build to `dist/` (Cloudflare Pages: build command `npm run build`, output `dist`)

## Workflow

Spec → plan → implement, using the superpowers skills (`brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`). Acceptance criteria come from the spec (§9) and are written before the code; a check that never failed proves nothing. Report criteria and outcome separately — never the bare word "verified".

## Architecture (target, spec §4)

- `src/app/` — `Stage`, screen state machine (`title → levelSelect → level(n) → results(n)`), one `useReducer` store, `save.ts` (single `localStorage` key `medici.save.v1`, versioned). The title, level select, settings, and Results screens live in `src/screens/`.
- `src/stages/` — one component per level stage (Intake, Order, Position, Technique, Collimate, Expose). Each takes `(level, onComplete(result))` and knows nothing about its siblings.
- `src/data/levels/*.json` + `schema.ts` — all level content is data, validated by zod at build and load. Image fields are asset ids, never paths.
- `src/assets.ts` — the asset id → URL manifest, built from `src/assets/` by `import.meta.glob`; an unknown id renders a labelled placeholder box.
- Scoring/feedback rules (spec §6): mistakes only from position (max 1), kVp, mAs, and collimation (max 1, however many attempts); timer expiry folds into its own stage and never double-counts; `expose` cannot be failed; stars 0→3, 1–2→2, 3+→1; no fail state.
- The film is a pure function of kVp/mAs alone (spec §4.4) and must not render anywhere before the `expose` stage. Position and collimation never affect it. `under` wins when one value is low and the other high.

## Content and asset rules

- Medical values in level JSON come from the case database (see above) and stay `"draft": true` until the client answers the spec §12 open items via `docs/client/level-content-sheet.md`. Spec §5 lists the placeholder values the game runs on meanwhile; a missing sentence renders "Awaiting client". Do not invent new medical facts — mark gaps and ask.
- Asset ids are the client's own filenames without extension (spec §7.1, since 2026-10-01), lowercased, with ` (1)` suffixes dropped and `Web Game Logo.png` as `logo`. The old `group-subject-detail` grammar and the `docs/client/assets/*.md` checklists are historical. Film ids are the one derived id: `xray-<films.slug>-<good|under|over>`.
- AI-generated art goes only in `src/assets/generated/` and never moves out; client art goes in the group folders under `src/assets/`. **The sixty X-ray films are never generated** — a fabricated radiograph teaches a fabricated finding. A labelled grey box is the correct failure mode there. The films carry Radiopaedia credits burned in; never crop them.
- `docs/art-direction.md` is the look: palette, lineart, proportions, and the exact three-part prompt recipe for generating an asset. Read it before generating anything; do not embellish a prompt beyond what it specifies.
- Documents in `docs/client/` are for a non-technical client: no jargon, no stack names, formatted for pasting into Google Docs (no bare `____` lines — Markdown renders them as rules).

## Documentation rules

- `CHANGELOG.md`: dated entries, newest first; update in the same task whenever a decision, deliverable, or scope changes.
- `README.md` Status section: keep the phase line current.
- Specs and plans are dated `YYYY-MM-DD-<topic>-{design,plan}.md`. When a doc supersedes another, say so in both.

## Git

Conventional Commits (`feat:` `fix:` `docs:` `chore:` …), messages say why. Branches `<type>/<short-desc>`. Never push, force-push, or open a PR without asking.
