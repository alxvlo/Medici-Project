# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Medici — a browser game where the player is a radiologic technologist. Five levels, one patient/injury each, through the real X-ray workflow (order → assess → position → kVp/mAs → collimate → exposure QTE). Client project: the client owns the medical content and the art.

**Source of truth:** `docs/superpowers/specs/2026-08-27-medici-radtech-game-design.md`. Where the client's original brief (`docs/brief/`) disagrees with the spec, the spec wins. Do not re-litigate decisions recorded in spec §2.

## Current phase

Design complete, no app code yet. Waiting on the client's answers to `docs/client/2026-08-27-client-briefing.md` §10. Next steps in order: fold answers into the spec → write the implementation plan (`docs/superpowers/plans/`) with the `superpowers:writing-plans` skill → execute task by task. The first plan task scaffolds the app; update this file's Commands section then.

## Stack (locked)

Vite + React 19 + TypeScript, DOM-first. A fixed 960×640 `<Stage>` letterboxed and CSS-scaled to the viewport, landscape only. `motion` for tweens, `canvas-confetti`, `zod` for level validation. No state library, no router, no UI kit. Tests: vitest (pure logic) + Playwright (end-to-end, desktop and mobile-landscape viewports). Package manager: npm; `package-lock.json` is canonical. Hosting: Cloudflare Pages (Vercel Hobby is non-commercial and was rejected).

Phaser, Godot, and Unity were evaluated and rejected for this game (`docs/research/2026-08-27-tooling-research.md`). If a level ever needs spatial gameplay, embed a Phaser scene in a component — do not rewrite.

## Commands (once scaffolded)

- `npm run dev` — local play with hot reload
- `npm run qa` — the gate: typecheck + lint + vitest + playwright. **Nothing is done until this passes.**
- `npx vitest run tests/unit/<file>.test.ts` — one unit file; `npx playwright test tests/e2e/<file>.spec.ts` — one e2e file

## Workflow

Spec → plan → implement, using the superpowers skills (`brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`). Acceptance criteria come from the spec (§9) and are written before the code; a check that never failed proves nothing. Report criteria and outcome separately — never the bare word "verified".

## Architecture (target, spec §4)

- `src/app/` — `Stage`, screen state machine (`title → levelSelect → level(n) → results(n)`), one `useReducer` store, `save.ts` (single `localStorage` key `medici.save.v1`, versioned).
- `src/stages/` — one component per level stage (Intake, Order, Assess, Position, Technique, Collimate, Expose, Result). Each takes `(level, onComplete(mistakes))` and knows nothing about its siblings.
- `src/data/levels/*.json` + `schema.ts` — all level content is data, validated by zod at build and load. Image fields are asset ids, never paths.
- `src/assets.ts` — the single asset id → path list; a missing file renders a labelled placeholder box.
- Scoring/feedback rules (spec §6): mistakes only from position, technique, exposure, and timer expiry; `assess` and `collimate` never count; stars 0→3, 1–2→2, 3+→1; no fail state.

## Content and asset rules

- Medical values in level JSON are AI drafts until the client's `docs/client/level-content-sheet.md` is transcribed; keep `"draft": true` until then. Do not invent new medical facts — mark gaps and ask.
- Asset ids must match the filenames in `docs/client/asset-checklist.md`. That checklist is the naming contract with the client.
- AI-generated art goes only in `public/assets/generated/` and never moves out; client art goes in the group folders.
- Documents in `docs/client/` are for a non-technical client: no jargon, no stack names, formatted for pasting into Google Docs (no bare `____` lines — Markdown renders them as rules).

## Documentation rules

- `CHANGELOG.md`: dated entries, newest first; update in the same task whenever a decision, deliverable, or scope changes.
- `README.md` Status section: keep the phase line current.
- Specs and plans are dated `YYYY-MM-DD-<topic>-{design,plan}.md`. When a doc supersedes another, say so in both.

## Git

Conventional Commits (`feat:` `fix:` `docs:` `chore:` …), messages say why. Branches `<type>/<short-desc>`. Never push, force-push, or open a PR without asking.
