# Medici — Radtech Simulator

A browser-based learning activity in which the student is a radiologic technologist. Twenty levels, one patient and one injury each, walking through the real X-ray workflow: read the order, position the patient, set kVp/mAs, collimate, take the exposure, read the film. One attempt per decision, no retries, and a debrief at the end of every case. Built for a client (a radiography educator) who owns the medical content and the art.

## Status — 2026-09-10

**Phase: design complete and revised. No app code yet; the implementation plan is next.**

- Design spec approved and revised: `docs/superpowers/specs/2026-08-27-medici-radtech-game-design.md` (§13 logs the 2026-09-01, 2026-09-07, and 2026-09-10 revisions)
- **The client's case database sets the game at twenty levels**, in six sections of their own grouping. Their twenty cases replace the five AI-drafted ones entirely; the database is the medical source of truth
- Client answered the briefing; the answers reframed this from a casual game to a teaching tool — the loop lost a stage and all its retries, the radiograph became a sealed consequence of the technique, and the teaching moved to an end-of-case debrief. **Twenty levels did not change any of that**; the loop is untouched
- Assets follow a parseable grammar (spec §7.1), now ~173 files, 73 of them the client's. Patients and collimation views barely grew because levels share files; the films went 15 → 60 and are the real cost. X-ray films are never generated, and the client has confirmed they will supply the over- and underexposed ones
- Client documents ready to send: `docs/client/level-content-sheet.md` (reissued — it now collects only the six things the database lacks) and the eight asset lists in `docs/client/assets/`
- Blocking the first playable level: the two wrong positioning options per level, which are a teaching judgement only the client can make
- Engine decided: Vite + React + TypeScript, DOM-first (see spec §2 and `docs/research/`)
- Next: implementation plan (`docs/superpowers/plans/`) → build task by task

See `CHANGELOG.md` for the dated log.

## Repository layout

```text
CLAUDE.md                     instructions for Claude Code (conventions, gate, workflow)
CHANGELOG.md                  dated project log, newest first
docs/
  art-direction.md            the look: palette, lineart, proportions, prompt recipe
  brief/                      the client's original brief (PDF) and style reference
  client/                     documents sent to the client: briefing, content sheet
  client/assets/              the eight asset checklists, one per group, plus an index
  research/                   tooling research that informed the spec
  superpowers/specs/          approved design specs
  superpowers/plans/          implementation plans (written from a spec, executed task by task)
```

The application (`src/`, `public/`, `tests/`) is scaffolded as the first task of the implementation plan; its layout is defined in the spec §4.6.

## Working on it

The build is AI-assisted with Claude Code. The flow is spec → plan → implement, with acceptance criteria written before code. Read `CLAUDE.md` first.
