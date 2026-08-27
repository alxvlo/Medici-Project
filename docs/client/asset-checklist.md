# Radtech Simulator — Asset Checklist

**Date:** 27 August 2026
**For:** [Client name]
**From:** [Your name]

---

## How to use this checklist

This is every picture and sound the game needs. Tick off what you can provide; leave the rest and I'll make labelled stand-ins so the game keeps working. You can send things in any order and in batches — nothing here blocks me from building.

**Style.** Match your character sheet: soft cel-shading, dark-brown outlines, muted earthy colours, flat lighting, no heavy gradients. Backgrounds can be a little more painterly but should stay in the same palette.

**Format.**

- PNG with a transparent background (except full backgrounds, which can be opaque).
- Draw at **twice** the size listed — the sizes below are the on-screen size, and doubling keeps things sharp on phones. So "300 × 600" means send a 600 × 1200 file.
- Name the file exactly as shown in the *File name* column, lowercase, no spaces. That's how the game finds it.
- Sound: MP3 or OGG, short, under 2 seconds except the ambience loop.

**Sizes are guides, not rules.** A patient can be a bit taller or a background a bit wider — I'll fit it. Only the aspect ratio matters much.

The game screen is 960 × 640 (landscape, 3:2). Everything is drawn to fit that.

---

## 1. Patients

Six patients, one per level plus one spare, from your character sheet. Each needs two versions: standing normally, and the same pose with a pained expression and a hand on the injury. Front-facing, feet visible, as on your sheet.

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `patient-young-man-idle.png` | 300 × 600 | Young man, dark hair, black sweater, brown trousers. Standing, neutral. |
| ☐ | `patient-young-man-pain.png` | 300 × 600 | Same, wincing, left hand held to the left ribs. |
| ☐ | `patient-girl-idle.png` | 220 × 440 | Girl, pink hairband, pinafore dress. Standing, neutral. |
| ☐ | `patient-girl-pain.png` | 220 × 440 | Same, teary, holding her right wrist with her left hand. |
| ☐ | `patient-young-woman-idle.png` | 300 × 600 | Young woman, purple turtleneck, dark jeans. Standing, neutral. |
| ☐ | `patient-young-woman-pain.png` | 300 × 600 | Same, weight off the right foot, grimacing, reaching toward the ankle. |
| ☐ | `patient-older-man-idle.png` | 300 × 600 | Older man, grey hair, moustache, brown cardigan. Standing, neutral. |
| ☐ | `patient-older-man-pain.png` | 300 × 600 | Same, slightly hunched, both hands on the abdomen. |
| ☐ | `patient-older-woman-idle.png` | 300 × 600 | Older woman, grey hair, mauve cardigan, long skirt. Standing, neutral. |
| ☐ | `patient-older-woman-pain.png` | 300 × 600 | Same, hand cupped over the right cheek, visible swelling. |
| ☐ | `patient-boy-idle.png` | 220 × 440 | Boy, brown hair, olive t-shirt, shorts. Standing, neutral. (Spare — not used in the five levels yet.) |
| ☐ | `patient-boy-pain.png` | 220 × 440 | Same, wincing, holding the left forearm. (Spare.) |

## 2. The radtech (player)

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `radtech-hand-button.png` | 300 × 300 | A hand in a scrub sleeve hovering over a large round exposure button, seen from the side. This appears next to the X-ray viewer during the "take the exposure" step. |
| ☐ | `radtech-hand-button-pressed.png` | 300 × 300 | Same, finger pressing the button down. |
| ☐ | `radtech-portrait.png` | 200 × 200 | Head-and-shoulders of the radtech for the title screen and tutorial hints. Friendly, any gender, scrubs. |

## 3. Backgrounds

Full-screen scenes, 960 × 640 (send 1920 × 1280). These can be opaque.

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `bg-title.png` | 960 × 640 | Exterior or lobby of a small clinic, warm and welcoming. Leave the centre-left third fairly plain so the logo and menu buttons can sit on it. |
| ☐ | `bg-reception.png` | 960 × 640 | Reception / waiting area where the patient walks in. A doorway on the left, a counter on the right. The patient stands centre-left; the speech bubble goes above them. |
| ☐ | `bg-xray-room.png` | 960 × 640 | The X-ray room: table, wall stand, tube overhead. This is behind the assess and positioning steps. |
| ☐ | `bg-console.png` | 960 × 640 | The control console, close-up, seen from the operator's seat. Leave a flat panel area in the centre for the kVp/mAs dials and the collimation knobs to sit on. |
| ☐ | `bg-viewer.png` | 960 × 640 | A darkened reading room with a large lightbox / monitor in the centre where the X-ray film appears. Leave the centre clear. |

## 4. Positioning previews

Three per level: the correct position and two wrong ones. Show the patient for that level on the table or at the wall stand in that position, seen clearly. These are shown small as buttons (240 × 240) and enlarged when hovered, so keep them readable at both sizes. Square.

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `pose-chest-pa-erect.png` | 240 × 240 | Young man standing at the wall stand, chest against it, arms rolled forward. |
| ☐ | `pose-chest-ap-supine.png` | 240 × 240 | Young man lying on his back on the table. |
| ☐ | `pose-chest-lateral.png` | 240 × 240 | Young man standing sideways at the wall stand, arms raised. |
| ☐ | `pose-wrist-pa.png` | 240 × 240 | Girl seated, forearm on the table, palm down, fingers slightly curled. |
| ☐ | `pose-wrist-ap.png` | 240 × 240 | Girl seated, forearm on the table, palm up. |
| ☐ | `pose-wrist-lateral.png` | 240 × 240 | Girl seated, hand on its side, thumb up. |
| ☐ | `pose-ankle-mortise.png` | 240 × 240 | Young woman lying, leg straight, foot pointing up and turned slightly inward. |
| ☐ | `pose-ankle-external.png` | 240 × 240 | Same but the foot turned clearly outward. |
| ☐ | `pose-ankle-lateral.png` | 240 × 240 | Young woman on her side, outer ankle flat on the table. |
| ☐ | `pose-abdomen-ap-supine.png` | 240 × 240 | Older man on his back, arms at his sides. |
| ☐ | `pose-abdomen-lateral.png` | 240 × 240 | Older man on his side, knees slightly bent. |
| ☐ | `pose-abdomen-pa-chest.png` | 240 × 240 | Older man standing at the wall stand, chest against it (the "wrong exam" option). |
| ☐ | `pose-skull-waters.png` | 240 × 240 | Older woman facing the wall stand, chin raised, nose lifted off the surface. |
| ☐ | `pose-skull-ap.png` | 240 × 240 | Older woman facing the wall stand straight on, forehead and nose touching. |
| ☐ | `pose-skull-lateral.png` | 240 × 240 | Older woman with the side of her head against the wall stand. |

## 5. Injury zoom-ins (assess step)

One per level. The body region, close up, in the cartoon style, with the injured area drawn so a red highlight can be placed over it. No red in the drawing itself — I add that.

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `assess-chest.png` | 480 × 480 | Young man's torso, front, left side slightly bruised. |
| ☐ | `assess-wrist.png` | 480 × 480 | Girl's right forearm and hand, wrist swollen and slightly bent. |
| ☐ | `assess-ankle.png` | 480 × 480 | Young woman's lower leg and foot, outer ankle swollen. |
| ☐ | `assess-abdomen.png` | 480 × 480 | Older man's abdomen, front, visibly distended. |
| ☐ | `assess-skull.png` | 480 × 480 | Older woman's face, three-quarter view, right cheek swollen. |

## 6. Collimation views

One per level. The same region as above but as it looks positioned on the table or wall stand, seen from the tube's point of view (straight down or straight on). The game draws the collimation light rectangle over this.

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `collim-chest.png` | 480 × 480 | Young man's back at the wall stand, straight on. |
| ☐ | `collim-wrist.png` | 480 × 480 | Girl's forearm and hand on the table, from above, palm down. |
| ☐ | `collim-ankle.png` | 480 × 480 | Young woman's lower leg and foot on the table, from above. |
| ☐ | `collim-abdomen.png` | 480 × 480 | Older man's torso and pelvis lying on the table, from above. |
| ☐ | `collim-skull.png` | 480 × 480 | Older woman's face at the wall stand, chin raised, straight on. |

## 7. X-ray films

Three per level: correct, underexposed (too dark / grainy), overexposed (washed out / white). These can be **illustrated in the cartoon style** or **real anonymised films** — tell me which in the briefing questions. Portrait, on a black background is fine.

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `xray-chest-good.png` | 400 × 500 | PA chest, clear left rib 6 fracture, lungs well shown. |
| ☐ | `xray-chest-under.png` | 400 × 500 | Same view, too dark and grainy, fracture hard to see. |
| ☐ | `xray-chest-over.png` | 400 × 500 | Same view, lungs burnt out white, bones faint. |
| ☐ | `xray-wrist-good.png` | 400 × 500 | PA wrist, distal radius fracture with slight angulation. |
| ☐ | `xray-wrist-under.png` | 400 × 500 | Same, dark and grainy. |
| ☐ | `xray-wrist-over.png` | 400 × 500 | Same, bones washed out. |
| ☐ | `xray-ankle-good.png` | 400 × 500 | AP mortise ankle, lateral malleolus fracture, mortise open. |
| ☐ | `xray-ankle-under.png` | 400 × 500 | Same, dark and grainy. |
| ☐ | `xray-ankle-over.png` | 400 × 500 | Same, soft tissue gone, bones pale. |
| ☐ | `xray-abdomen-good.png` | 400 × 500 | AP supine abdomen, dilated small-bowel loops in a stepladder pattern. |
| ☐ | `xray-abdomen-under.png` | 400 × 500 | Same, too dark, gas pattern lost. |
| ☐ | `xray-abdomen-over.png` | 400 × 500 | Same, everything grey and flat. |
| ☐ | `xray-skull-good.png` | 400 × 500 | Waters view, depressed right zygomatic arch fracture, sinuses clear. |
| ☐ | `xray-skull-under.png` | 400 × 500 | Same, too dark, arch buried. |
| ☐ | `xray-skull-over.png` | 400 × 500 | Same, thin bones burnt through. |

## 8. Interface pieces

These are the buttons, cards, and panels. If drawing UI isn't your thing, skip this whole section — I can build clean UI in your palette without artwork and it'll still look like part of the game. If you *do* want to draw them, here's the list.

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `logo.png` | 600 × 200 | The game's title / logo for the title screen. (What's the game called? See the briefing.) |
| ☐ | `btn-large.png` | 240 × 72 | Main button (Start, Select Level, Next Level). Rounded, warm colour, no text — I add the text. |
| ☐ | `btn-large-hover.png` | 240 × 72 | Same, slightly lighter, for when the mouse is over it. |
| ☐ | `btn-large-pressed.png` | 240 × 72 | Same, slightly darker and squashed. |
| ☐ | `btn-small.png` | 120 × 48 | Small button (OK, Retry, Back). Same three states as above if possible. |
| ☐ | `icon-back.png` | 64 × 64 | Back arrow. |
| ☐ | `icon-settings.png` | 64 × 64 | Gear. |
| ☐ | `icon-sound-on.png` / `icon-sound-off.png` | 64 × 64 | Speaker with and without a slash. |
| ☐ | `icon-lock.png` | 64 × 64 | Padlock, for locked levels. |
| ☐ | `star-full.png` / `star-empty.png` | 64 × 64 | Gold star and grey outline star. |
| ☐ | `level-card.png` | 160 × 220 | Blank card for the level-select screen, like the mission cards in *Good Pizza, Great Pizza*. I place the picture, title, and stars on it. |
| ☐ | `chat-bubble.png` | 320 × 140 | Speech bubble with the tail bottom-left. Plain inside — I add the text. |
| ☐ | `order-card.png` | 360 × 480 | The doctor's order form: a clipboard or paper with a header strip and blank lines. |
| ☐ | `popup-panel.png` | 560 × 360 | Panel for explanations ("Why that's wrong"). Rounded, with a header band. |
| ☐ | `dial.png` | 200 × 200 | Round dial face with tick marks, no numbers — used twice, for kVp and mAs. |
| ☐ | `dial-needle.png` | 200 × 200 | The needle alone, pointing straight up, on a transparent background so I can rotate it. |
| ☐ | `indicator-off.png` / `indicator-green.png` / `indicator-red.png` | 48 × 48 | The small lamp that goes green when a value is correct and red when wrong. |
| ☐ | `knob.png` | 96 × 96 | Round knob with a pointer mark, for the collimation width and height. |
| ☐ | `timer-ring.png` | 96 × 96 | Optional — a ring frame for the countdown. I can draw the countdown itself. |
| ☐ | `film-frame.png` | 440 × 540 | Border/lightbox frame the X-ray film sits inside on the viewer screen. |

## 9. Sounds

| ✓ | File name | Length | Description |
|---|---|---|---|
| ☐ | `sfx-click.mp3` | < 0.3 s | Soft UI click. |
| ☐ | `sfx-wrong.mp3` | < 1 s | Gentle "buzz" — not harsh; students will hear it a lot. |
| ☐ | `sfx-correct.mp3` | < 1 s | Bright chime. |
| ☐ | `sfx-xray.mp3` | < 1.5 s | The exposure sound: a short beep then a "thunk" / hum. |
| ☐ | `sfx-confetti.mp3` | < 1.5 s | Party pop for the level-complete screen. |
| ☐ | `ambience-clinic.mp3` | 30–60 s, seamless loop | Quiet clinic background: distant murmur, a soft hum. |

---

## Totals

| Group | Files |
|---|---|
| Patients | 12 |
| Radtech | 3 |
| Backgrounds | 5 |
| Positioning previews | 15 |
| Injury zoom-ins | 5 |
| Collimation views | 5 |
| X-ray films | 15 |
| Interface pieces | ~26 |
| Sounds | 6 |
| **Everything** | **~92** |

Don't let that number worry you. The patients, positioning previews, and X-ray films are what make it *your* game; everything else I can stand in for. If you only ever send sections 1, 4, and 7, it'll look great.

> Questions or notes for me:
>
>
