# Radtech Simulator — Project Briefing

**Date:** 27 August 2026
**Prepared for:** [Client name]
**Prepared by:** [Your name]

---

> ## ✅ Answered — 1 September 2026
>
> **This document has been answered and parts of it are now out of date. Keep it as the record of what was asked; do not build from it.**
>
> Your replies changed the game in ways this briefing does not describe. **Sections 3, 5, and several answers in Section 9 are superseded** — the level no longer has eight steps, timers are no longer optional, there are no hints, and nothing can be retried. What is being built now is described in the current design document, and the two asset and content sheets you have been sent match it.
>
> What changed, in short:
>
> - **"Assess the patient" is gone.** A case is now: patient arrives → doctor's order → position → exposure settings → collimation → take the exposure → review.
> - **Nothing is retried.** One attempt at the position, one at the exposure settings. Wrong positioning is explained and the correct answer shown; wrong settings get a red flash and nothing else.
> - **The X-ray is hidden until the exposure is taken**, and depends only on the kVp and mAs. The exposure step itself is now just press-and-hold — there is no longer a timing challenge.
> - **Timers are always on** and **there are no hints anywhere**, so those two settings are gone.
> - **The case ends with a review** — every decision, what was correct, and why — instead of confetti.
>
> Section 10 below is the questionnaire you already returned. It is left in place unchanged so we both have a record of what was asked and answered.

---

## 1. Why you're reading this

Thank you for the design document and the reference images. I've gone through everything — the flowchart, the written game design, the handwritten notes, and the inspiration screenshots — and turned it into a concrete build plan.

This briefing explains, in plain language, **what I intend to build, how it will play, and what I need from you** so the game is medically accurate and looks the way you want it to. Please read it through, then use **Section 9** at the end to answer a few questions and add anything I've missed. Once you send that back, I start building.

Nothing here is final until you say so. If something in this document doesn't match what you had in mind, tell me — it is far cheaper to change now than after it's built.

---

## 2. The game in one paragraph

A browser game where the player is a radiologic technologist. Each of five levels brings in one patient with one injury. The player reads the doctor's order, finds the injury, chooses the correct position, sets the exposure (kVp and mAs), adjusts the collimation light, and presses the exposure button at the right moment. Wrong choices are explained rather than punished: the screen shakes red, a note says *why* it was wrong, and the player tries again. Finishing a level earns one to three stars and unlocks the next one.

It plays in any web browser on a laptop, tablet, or phone — no download, no account. You share a link and students play.

The look and feel follows the references you sent: a cartoon "job simulator" in the style of *Good Pizza, Great Pizza*, *Papers, Please*, and the hospital games — everything on one screen, bright and snappy.

---

## 3. How a level plays

Every level follows the same eight steps. Only the patient, injury, and correct answers change.

| Step | What the player sees | What the player does |
|---|---|---|
| **1. Patient arrives** | The patient walks in with a speech bubble ("I fell off my bike… my chest hurts.") | Taps to continue |
| **2. Doctor's order** | A card with the patient's name, age, sex, body habitus, the exam requested, the structures that must be visible, and the suspected pathology | Reads it, taps to close. The card stays visible at the side of the screen for the rest of the level |
| **3. Assess the patient** | The patient's body | Taps the injured area. It zooms in and highlights red. Tapping the wrong spot just gives a gentle hint — no penalty |
| **4. Positioning** | Three positioning options. Hovering or holding one shows a large preview | Picks the correct one. Wrong pick = red shake + a note explaining why that position is wrong, then retry |
| **5. Exposure settings** | Two dials: kVp first, then mAs. A side note explains how to balance them | Sets each value and presses Enter. Correct = green light. Wrong = red light + explanation, retry |
| **6. Collimation** | The zoomed patient with the collimation light over them, a red target marker, and two knobs (width and height) | Turns the knobs until the light matches the target. When it fits, the marker flashes green and the game moves on |
| **7. Take the exposure** | The X-ray viewer with a hand on the exposure button and a moving bar coloured red / yellow / green | Presses the button when the bar is in the green. Yellow = underexposed film (too dark), red = overexposed film (washed out) — each shows the bad image and an explanation, then retry |
| **8. Result** | The finished X-ray, confetti, and a star rating | Continues to the next level, replays, or returns to the level menu |

**Optional timers.** Positioning (1 minute) and exposure settings (45 seconds) can have countdown timers, as in your flowchart. Running out of time counts as one mistake and restarts the timer — it never ends the level. Timers can be switched off in Settings for students who want to learn without pressure.

---

## 4. The five levels

The body regions come from your notes. The specific injuries below are **my placeholders** so I can build and test — you will replace them with whatever cases you want to teach (see Section 6).

| Level | Region | Placeholder case |
|---|---|---|
| 1 | Chest | Left rib fracture after a bike fall (from your notes) |
| 2 | Upper limb | Wrist (distal radius) fracture |
| 3 | Lower limb | Ankle fracture |
| 4 | Abdomen | Small-bowel obstruction |
| 5 | Skull | Facial trauma (cheekbone) |

Each level gets harder through the content itself: tighter exposure ranges, closer-looking position options, a smaller collimation target, a faster exposure bar.

---

## 5. Stars, progress, and settings

- **Stars.** No mistakes = 3 stars. One or two mistakes = 2 stars. Three or more = 1 star. There is no "game over" — students always finish; the stars show how cleanly they did it and encourage replaying.
- **Progress.** Finishing a level unlocks the next. Stars and progress are saved in the student's browser on that device, so they can close the tab and come back. There are no accounts or logins.
- **Screens.** Title screen (Start / Select Level / Settings), a level-select screen showing stars and locked levels, and a settings screen (sound on/off, timers on/off, hints on/off, reset progress).

---

## 6. What I need from you — part one: the medical content

This is the most important thing you own. I can build the whole game with placeholder facts, but a radiography teaching tool has to be right, and **you are the authority, not me.**

I will send you a **Level Content Sheet** — one page per level, in plain language, where you fill in:

- The patient (name, age, sex, body habitus) and a line of dialogue for them
- The doctor's order: exam requested, structures that must be seen, suspected pathology
- The **correct** position, and for each of the two **wrong** options, one sentence on why it's wrong
- The kVp and mAs targets, and how much leeway is acceptable
- The collimation field size
- One sentence each explaining an underexposed and an overexposed result

You don't need to write anything technical or formatted — just fill in the blanks in your own words. I take it from there.

Until your sheets come back, every level is marked as a draft inside the game, so we never mistake my placeholders for real content.

---

## 7. What I need from you — part two: the artwork

The character sheet you shared (six patients, soft cartoon style, earthy colours) sets the look. I'll send an **Asset Checklist** listing every picture the game needs, with a short description of each so you can draw it in that same style. Roughly:

| What | How many | Notes |
|---|---|---|
| Patients | 6 characters × 2 (standing, and "in pain") | The roster from your sheet |
| The radtech | 1 | Partial figure / hand on the exposure button |
| Backgrounds | 5 | Title, reception, X-ray room, console, film viewer |
| Position previews | 15 | 3 options per level |
| Injury zoom-ins | 5 | One body region per level |
| X-ray films | 15 | Good, underexposed, and overexposed per level |
| Interface pieces | ~20 | Buttons, order card, speech bubble, dials, knobs, stars, popup panel, etc. |
| Sounds | 6 | Click, wrong buzz, correct chime, X-ray sound, confetti, clinic background |

**If you can't provide something,** that's fine. The game shows a labelled grey box wherever a picture is missing so we can both see what's left. For anything you'd rather not draw, I can generate a stand-in image in your style using AI, using your character sheet as the reference. Those stand-ins are kept in a separate, clearly marked folder so you can always tell which images are yours and swap them out later.

**Delivery format:** PNG files with transparent backgrounds. I'll give exact sizes in the checklist.

---

## 8. How we'll work together

1. **You return Section 9** of this document with your answers and any changes.
2. **I send the Level Content Sheet and Asset Checklist.** You fill them in at your own pace; I don't need them to start.
3. **I build.** You'll get a **private web link** that updates as I go — open it on your phone or laptop any time and see the current state. No installing anything.
4. **You give feedback** on what you see, in whatever form is easiest (messages, voice notes, screenshots with scribbles).
5. **Your real content and art go in** as they arrive.
6. **Launch:** the final link goes wherever you like — your own address, a school page, or a game site such as itch.io.

---

## 9. Frequently asked questions

**Do students need to install anything or make an account?**
No. It's a web link. It works in Chrome, Safari, Edge, and Firefox on laptops, tablets, and phones.

**Does it work on phones?**
Yes, in landscape (sideways). If a student holds the phone upright, the game asks them to rotate it.

**Is progress saved?**
Yes, in the browser on the device they're using. If they switch devices or clear their browser data, they start over. Accounts that sync progress everywhere are possible later but not part of this version.

**Can a student fail a level?**
No. Every mistake is explained and retried. The star rating is the "score". You told me the goal is learning in a low-stakes way, so I've designed it without a game-over.

**What if the medical information I give you changes later?**
Easy. All the level content lives in simple data files, separate from the game itself. Updating a value or an explanation doesn't require rebuilding the game.

**Can we add more levels or more injuries later?**
Yes. The game is built so a new level is a new content sheet plus its pictures. This first version is five levels with one case each.

**Can I see it before it's finished?**
Yes — that's the point of the private link. You'll see it grow from the first week.

**Will you use AI-generated images?**
Only as stand-ins for things you don't provide, always in your style, and always kept separate and labelled so they can be replaced. Nothing AI-generated goes in without you knowing.

**Who owns the game?**
You do — the content, the art, and the finished game. I'll hand over everything at the end.

**Will there be a tutorial?**
The first level walks the player through each step with short hints. Hints can be switched off in Settings for students who already know the workflow.

**What about sound?**
Simple sound effects and a quiet clinic background loop, with an on/off switch. No voice acting in this version.

**What does it cost to run?**
Nothing ongoing. Hosting a game like this on the web is free at this size.

---

## 10. Your questions and clarifications

Please answer what you can and leave the rest. Anything you're unsure about, just say so and we'll talk it through.

### Decisions I need from you

1. **The five placeholder cases** (Section 4) — keep any of them, or tell me the cases you want per level:
   - Level 1 (Chest): ______________________________
   - Level 2 (Upper limb): ______________________________
   - Level 3 (Lower limb): ______________________________
   - Level 4 (Abdomen): ______________________________
   - Level 5 (Skull): ______________________________

2. **Timers on by default?** ☐ Yes, on by default (students can turn off) ☐ No, off by default ☐ No timers at all

3. **Tapping the wrong spot when assessing the patient** — currently a hint with no penalty. ☐ Keep it free ☐ Count it as a mistake

4. **Number of positioning options per level** — currently 3. ☐ 3 is right ☐ I'd prefer: ____

5. **Star rule** — currently 0 mistakes = 3 stars, 1–2 = 2, 3+ = 1. ☐ Fine ☐ Change to: ______________________________

6. **Patient names and dialogue** — should I invent them, or will you? ☐ You invent, I'll edit ☐ I'll write them in the content sheets

7. **Language** — ☐ English only ☐ Other / both: ____________

8. **Artwork** — roughly which of these can you provide? (Tick all that apply)
   ☐ Patients ☐ Radtech ☐ Backgrounds ☐ Position previews ☐ Injury zoom-ins ☐ X-ray films ☐ Interface pieces ☐ Sounds
   ☐ I'd rather you generate stand-ins for everything except: ____________

9. **X-ray images** — do you have real (anonymised / licensed) films you can supply, or should they be illustrated in the cartoon style? ☐ Real films ☐ Illustrated ☐ Mix

10. **Where should it live at launch?** ☐ A link I give you ☐ A school/department website ☐ itch.io ☐ Don't know yet

11. **Is there a date this needs to be ready by?** ______________________________

### Anything else

Use this space for questions, concerns, ideas, or anything in this document that doesn't match what you pictured:

> Your notes:
>
>
>
>

---

Thank you — once I have this back, I'll send the Level Content Sheet and Asset Checklist and get started on the build.
