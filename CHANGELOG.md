# Changelog

Dated project log, newest first. Code changes follow Conventional Commits in git; this file records decisions, deliverables, and milestones.

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
