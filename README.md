# Medici — Radtech Simulator

A browser game in which the player is a radiologic technologist. Five levels, one patient and one injury each, walking through the real X-ray workflow: read the order, find the injury, position, set kVp/mAs, collimate, time the exposure. Educational, low-stakes, Flash-era job-sim feel. Built for a client (a radiography educator) who owns the medical content and the art.

## Status — 2026-08-27

**Phase: design complete, awaiting client answers. No app code yet.**

- Design spec approved: `docs/superpowers/specs/2026-08-27-medici-radtech-game-design.md`
- Client documents drafted, ready to send: `docs/client/`
- Engine decided: Vite + React + TypeScript, DOM-first (see spec §2 and `docs/research/`)
- Next: client returns the briefing's Section 10 → spec updated → implementation plan written → build

See `CHANGELOG.md` for the dated log.

## Repository layout

```text
CLAUDE.md                     instructions for Claude Code (conventions, gate, workflow)
CHANGELOG.md                  dated project log, newest first
docs/
  brief/                      the client's original brief (PDF) and style reference
  client/                     documents sent to the client: briefing, content sheet, asset checklist
  research/                   tooling research that informed the spec
  superpowers/specs/          approved design specs
  superpowers/plans/          implementation plans (written from a spec, executed task by task)
```

The application (`src/`, `public/`, `tests/`) is scaffolded as the first task of the implementation plan; its layout is defined in the spec §4.4.

## Working on it

The build is AI-assisted with Claude Code. The flow is spec → plan → implement, with acceptance criteria written before code. Read `CLAUDE.md` first.
