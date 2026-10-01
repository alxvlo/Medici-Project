# Medici — Radtech Simulator

A browser-based learning activity in which the student is a radiologic technologist. Twenty levels, one patient and one injury each, walking through the real X-ray workflow: read the order, position the patient, set kVp/mAs, collimate, take the exposure, read the film. One attempt per decision, no retries, and a debrief at the end of every case. Built for a client (a radiography educator) who owns the medical content and the art.

## Status — 2026-10-01

**Phase: implementation plan written. No app code yet.**

- Design spec reconciled with the client's `LIST OF CASES.docx` and their art delivery: `docs/superpowers/specs/2026-08-27-medici-radtech-game-design.md` (§13 logs every revision)
- The client delivered every asset group, all sixty X-ray films included. Their filenames are the asset ids
- Twenty levels in six sections: chest, upper extremity, lower extremity, abdomen, and skull with three cases each, then a five-case refresher
- The game will run on placeholder values (spec §5) for what the database lacks: wrong-pose reasons, kVp/mAs tolerances, collimation size, debrief copy, and patient lines. Every level stays `draft` until the client confirms them; open questions are in spec §12
- Plan: `docs/superpowers/plans/2026-10-01-medici-v1-plan.md` — all twenty levels playable on the real art, shippable to a preview URL for the client
- Engine decided: Vite + React + TypeScript, DOM-first (see spec §2 and `docs/research/`)

See `CHANGELOG.md` for the dated log.

## Repository layout

```text
CLAUDE.md                     instructions for Claude Code (conventions, gate, workflow)
CHANGELOG.md                  dated project log, newest first
docs/
  art-direction.md            the look: palette, lineart, proportions, prompt recipe
  brief/                      the client's original brief (PDF) and style reference
  client/                     documents sent to the client: briefing, content sheet
  client/assets/              the asset checklists (historical since 2026-10-01; see spec §7)
  research/                   tooling research that informed the spec
  superpowers/specs/          approved design specs
  superpowers/plans/          implementation plans (written from a spec, executed task by task)
```

The application (`src/`, `tests/`) is scaffolded as the first task of the implementation plan; its layout is defined in the spec §4.6.

## Working on it

The build is AI-assisted with Claude Code. The flow is spec → plan → implement, with acceptance criteria written before code. Read `CLAUDE.md` first.
