# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Medici — a browser game where the player is a radiologic technologist. Five levels, one patient/injury each, through the real X-ray workflow (order → assess → position → kVp/mAs → collimate → exposure QTE). Client project: the client owns the medical content and the art.

**Source of truth:** `docs/superpowers/specs/2026-08-27-medici-radtech-game-design.md`. Where the client's original brief (`docs/brief/`) disagrees with the spec, the spec wins. Do not re-litigate decisions recorded in spec §2.

## Current phase

Design complete and revised, no app code yet. The client answered the briefing on 2026-09-01 and the answers are folded into the spec (see its §13 revision log). Next steps in order: write the implementation plan (`docs/superpowers/plans/`) with the `superpowers:writing-plans` skill → execute task by task. The first plan task scaffolds the app; update this file's Commands section then.

The 2026-09-01 revision matters more than a normal spec tweak — it changed the shape of the game, not just its values. The loop lost a stage and all its retries, the radiograph is now a sealed consequence of kVp/mAs revealed only at the exposure, and the teaching moved to an end-of-case debrief. Read spec §4.3–§4.5 before touching level flow.

## Stack (locked)

Vite + React 19 + TypeScript, DOM-first. A fixed 960×640 `<Stage>` letterboxed and CSS-scaled to the viewport, landscape only. `motion` for tweens, `zod` for level validation. No state library, no router, no UI kit. Tests: vitest (pure logic) + Playwright (end-to-end, desktop and mobile-landscape viewports). Package manager: npm; `package-lock.json` is canonical. Hosting: Cloudflare Pages (Vercel Hobby is non-commercial and was rejected).

Phaser, Godot, and Unity were evaluated and rejected for this game (`docs/research/2026-08-27-tooling-research.md`). If a level ever needs spatial gameplay, embed a Phaser scene in a component — do not rewrite.

## Commands (once scaffolded)

- `npm run dev` — local play with hot reload
- `npm run qa` — the gate: typecheck + lint + vitest + playwright. **Nothing is done until this passes.**
- `npx vitest run tests/unit/<file>.test.ts` — one unit file; `npx playwright test tests/e2e/<file>.spec.ts` — one e2e file

## Workflow

Spec → plan → implement, using the superpowers skills (`brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`). Acceptance criteria come from the spec (§9) and are written before the code; a check that never failed proves nothing. Report criteria and outcome separately — never the bare word "verified".

## Architecture (target, spec §4)

- `src/app/` — `Stage`, screen state machine (`title → levelSelect → level(n) → results(n)`), one `useReducer` store, `save.ts` (single `localStorage` key `medici.save.v1`, versioned).
- `src/stages/` — one component per level stage (Intake, Order, Position, Technique, Collimate, Expose, Result). Each takes `(level, onComplete(result))` and knows nothing about its siblings.
- `src/data/levels/*.json` + `schema.ts` — all level content is data, validated by zod at build and load. Image fields are asset ids, never paths.
- `src/assets.ts` — the single asset id → path list; a missing file renders a labelled placeholder box.
- Scoring/feedback rules (spec §6): mistakes only from position (max 1), kVp, mAs, and collimation (max 1, however many attempts); timer expiry folds into its own stage and never double-counts; `expose` cannot be failed; stars 0→3, 1–2→2, 3+→1; no fail state.
- The film is a pure function of kVp/mAs alone (spec §4.4) and must not render anywhere before the `expose` stage. Position and collimation never affect it. `under` wins when one value is low and the other high.

## Content and asset rules

- Medical values in level JSON are AI drafts until the client's `docs/client/level-content-sheet.md` is transcribed; keep `"draft": true` until then. Do not invent new medical facts — mark gaps and ask.
- Asset ids must match the filenames in `docs/client/assets/*.md` (eight per-group checklists plus `00-index.md`). Those files are the naming contract with the client; `asset-checklist.md` was split into them on 2026-09-01 and no longer exists.
- AI-generated art goes only in `public/assets/generated/` and never moves out; client art goes in the group folders.
- Documents in `docs/client/` are for a non-technical client: no jargon, no stack names, formatted for pasting into Google Docs (no bare `____` lines — Markdown renders them as rules).

## Documentation rules

- `CHANGELOG.md`: dated entries, newest first; update in the same task whenever a decision, deliverable, or scope changes.
- `README.md` Status section: keep the phase line current.
- Specs and plans are dated `YYYY-MM-DD-<topic>-{design,plan}.md`. When a doc supersedes another, say so in both.

## Git

Conventional Commits (`feat:` `fix:` `docs:` `chore:` …), messages say why. Branches `<type>/<short-desc>`. Never push, force-push, or open a PR without asking.
