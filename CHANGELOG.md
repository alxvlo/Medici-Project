# Changelog

Dated project log, newest first. Code changes follow Conventional Commits in git; this file records decisions, deliverables, and milestones.

## 2026-10-01

Added prettier and motion, both at Vai's go-ahead (plan: docs/superpowers/plans/2026-10-01-motion-polish-plan.md). Screens
and stages now cross-fade, the results film develops and then the debrief and stars appear, and .btn presses
scale slightly. The wrong-answer shake and the intake slide stay CSS. motion costs +41.9 kB gzip on the client
bundle. A first version that waited for each exit broke the 300 ms input guard, so the transition is a cross-fade.


Spec reconciled with `LIST OF CASES.docx` and the client's 2026-09-28 art delivery, then the first
implementation plan written (`docs/superpowers/plans/2026-10-01-medici-v1-plan.md`). Decisions, all
Vai's: the client's filenames become the asset ids, superseding the §7.1 naming grammar and making the
`docs/client/assets/` checklists historical; the first milestone is all twenty levels playable with
"Awaiting client" shown for missing copy; placeholder values stand in for tolerances, collimation size,
and wrong positioning options; the radiologist's findings show on the results screen only. Level 1
is now pulmonary edema, level 6 moves to Upper extremity, and the refresher section has five cases.
New client questions are in spec §12.

First playable build: all twenty levels, the full loop, the debrief, and the save, on the client's delivered art.
The level content sheet is reissued for the twenty cases, asking only for what the case list lacks plus
eight questions from spec §12. Not yet deployed, and the branch is not pushed. Departures from the spec, all small: `motion` and
`prettier` were not installed (CSS keyframes do the tweens); the docked order card and the results debrief
scroll inside the stage; `npm run build` runs the unit tests first so a malformed level fails the build;
and each stage ignores clicks and taps for 300 ms after it appears so a double-click cannot skip it.

## 2026-09-28

Vai confirmed `Medici Project/LIST OF CASES.docx` as the authoritative case database, superseding
the earlier September PDF and transcription wherever they differ. Project guidance and the design
spec now record that precedence; the old transcription is marked as an archived reference.
Detailed reconciliation of the spec's case data and asset mappings remains pending.

Client asset comments recorded in the design spec §7 and §13. Positioning previews must have the
collimation light field and "+" marker removed. Patient drawings may be reused without matching
each case's heavier or thinner body habitus if time is limited, but all supplied patient information
must remain complete. This supersedes the requirement for distinct body-habitus drawings; asset
editing and the mapping of supplied figures are still pending.

## 2026-09-10

The client's case database arrived and the game grows from five levels to twenty. Spec revised in place with a revision log entry at §13; the client documents are reissued to match.

- **Twenty levels, not five.** The client supplied a twenty-case database (`docs/brief/case-database-2026-09.pdf`, their "LIST OF CASES") and confirmed every case is a level. They group into six sections — chest, upper extremity, lower extremity, abdomen, skull, and a six-case refresher set. Spec §1, §2, §4.2, §5, §7.1, §7.2, §11, and §12 revised accordingly; the level cap moved from five to twenty.
- **The database is transcribed** to `docs/brief/case-database-2026-09.md`, because the PDF is a wide table whose columns scramble on text extraction and cannot safely be quoted from. The PDF stays the source of truth. 180 field values across all twenty cases were checked against the PDF's own text inside each case's own block; all matched.
- **The database carries more than expected.** All twenty cases have correct kVp, mAs, and a collimation instruction, plus full patient identity, chief complaint, history, provisional diagnosis, doctor's order, and requested projection. Eleven carry a working reference link for the correct film.
- **Still owed by the client:** the two wrong positioning options per level with their one-sentence explanations, tolerance bands and dial limits for kVp/mAs, collimation as a measurable field size, the debrief text for the under- and overexposed films, the patient's opening line, and the visible-structures line for eighteen of twenty cases.
- **The client will supply the overexposed and underexposed films.** This holds spec §7.2's rule that films are never generated. At twenty levels that is 60 films rather than 15.
- **Vocabularies extended and film ids changed** (spec §7.1). Region gains `hand`, `elbow`, `humerus`, `tibfib`, `knee` and loses `ankle`; projection gains `caldwell` and `parietoacanthial`; a twenty-slug `pathology` vocabulary is new. Film ids take a pathology segment because four levels are PA chest and `xray-chest-pa-under` stopped being unique. Poses and collimation bases deliberately did not take it.
- **The manifest roughly doubled rather than quadrupling**, 70 files to about 173, the client's share 22 to 73. Patients went 6 → 12 and collimation views 5 → 12 because the §7.1 grammar lets levels share files; films went 15 → 60, which is the real cost.
- **Client documents reissued.** The level content sheet is rewritten around the twenty cases and now collects only the six things the database lacks, rather than asking the client to write cases they have already written. Asset lists 00, 01, 04, 05, and 06 regenerated; 02, 03, 07, and 08 were unaffected and left alone. List 04 deliberately names only the twenty correct poses — the forty wrong ones are a teaching judgement and are asked for, not invented.
- **Two counts corrected during the work:** eleven levels carry a working film reference, not thirteen (levels 10 and 11 have a caption and level 12 a dead link); and nine cases give a single technique value against eleven giving a range, not seven and thirteen.
- **Sixteen of twenty pose ids carry an inferred patient position.** The database names the projection everywhere but the patient's position in only four cases. Every inferred row is daggered in asset list 04 for the client to correct, and it is logged in spec §12.
- **Two conflicts sent back to the client:** level 15 requests AP Skull but is positioned PA Caldwell; level 19 requests AP Erect but is positioned AP Abdomen with no erect qualifier.

## 2026-09-07

Asset naming, art direction, and a division of labour. No gameplay change; spec §7 rewritten with a revision log entry at §13.

- **Every asset id follows a grammar now** — `group-subject-detail` over closed vocabularies (spec §7.1). An id is derivable from level data instead of looked up, so `schema.ts` validates the shape rather than membership of a hand-written list, and adding a patient or a second projection is a naming exercise rather than a manifest edit.
- **Patients are named by age group, sex, and body habitus**, not nicknames: `patient-geriatric-female-hyposthenic` replaces `patient-older-woman`. Those three change how the exam is done and are already on the level JSON. Values taken from `level-content-sheet.md`, still `draft`, and the client is asked to correct them.
- **Fifteen assets cut, 85 → 70.** The client asked to drop the six `patient-*-pain.png`; the same reasoning removed `radtech-portrait.png` and eight UI files the code produces for free (button hover/pressed states, the two console lamps, `star-empty`, `timer-ring`). 22 files are now genuinely the client's.
- **Production split by group.** Backgrounds, the radtech hand, the interface, and the sounds are generated; patients and films stay with the client; positions and collimation views are the client's if they have time. Each client list states who produces it.
- **`docs/art-direction.md` written** — a standing description of the look sampled from `reference-characters.jpg` (lineart `#3A2A22`, one cel shadow tone, a thirteen-colour palette, figure proportions, two reserved signal colours). It exists so client-drawn and generated assets sit in the same frame, and it is the prompt source for every generated file.
- **X-ray films are excluded from generation as a rule.** A fabricated radiograph teaches a fabricated finding and looks convincing enough that neither party would catch it; a labelled grey box is the honest failure mode.
- Open, both flagged and deferred to the medical reference material the client is providing: `pose-skull-ap-frontal` is described as a PA projection, and no patient on the sheet is hypersthenic.

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
