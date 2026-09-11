# Asset List 07 — Interface

**Date:** 7 September 2026 · **17 files** · One of eight lists; see `00-index.md`
**Who draws it:** Me — except the logo, which needs a decision from you rather than a drawing.

---

## You can ignore this whole list

This is the one list you can hand back untouched, and by default you already have. I will build the
interface in your palette. If drawing buttons and panels *is* your thing, take any row back and I
will drop mine — but nothing here is waiting on you.

The one thing I need from you is at the bottom: **what the game is called.**

---

## Before you start

**Style.** Soft cel-shading, dark-brown outlines, muted earthy colours, flat lighting, no heavy
gradients. Rounded corners.

**Format.** PNG, transparent background. **Draw at twice the size listed** — "240 × 72" means a
480 × 144 file. Name each file exactly as shown, lowercase, no spaces. **Leave all text off** — I
add every word, so buttons and panels ship blank.

The game screen is 960 × 640, landscape.

---

## What got cut

Eight files, all of them things the code can do for free rather than things worth drawing:

- **The hover and pressed button states** (four files). The game lightens the button on hover and
  nudges it down a pixel when pressed. Two blank buttons instead of six.
- **The two console lamps.** A small coloured circle, drawn by the code.
- **The empty star.** The gold star, drawn faded, is the empty star.
- **The timer ring.** The code draws the sweep and the ring together.

## Title and menus

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `logo.png` | 600 × 200 | The game's title. **This one really is yours** — see the question at the bottom. |
| ☐ | `ui-btn-large.png` | 240 × 72 | Main button (Start, Select Level, Next Case). Rounded, warm colour, no text. |
| ☐ | `ui-btn-small.png` | 120 × 48 | Small button (OK, Back, Continue). |
| ☐ | `icon-back.png` | 64 × 64 | Back arrow. |
| ☐ | `icon-settings.png` | 64 × 64 | Gear. |
| ☐ | `icon-sound-on.png` | 64 × 64 | Speaker. |
| ☐ | `icon-sound-off.png` | 64 × 64 | Speaker with a slash. |
| ☐ | `icon-lock.png` | 64 × 64 | Padlock, for levels not yet unlocked. |
| ☐ | `ui-level-card.png` | 160 × 220 | Blank card for the level-select screen, like the mission cards in *Good Pizza, Great Pizza*. I place the picture, title, and stars on it. |

## In the case

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `ui-chat-bubble.png` | 320 × 140 | Speech bubble with the tail bottom-left, for what the patient says. Plain inside. |
| ☐ | `ui-order-card.png` | 360 × 480 | The doctor's order form: a clipboard or paper with a header strip and blank lines. This stays on screen for most of the case, docked to the side, so it should read well small. |
| ☐ | `ui-popup-panel.png` | 560 × 360 | Panel for explanations and for the end-of-case review. Rounded, with a header band. **This one carries most of the teaching**, so give it room — the review lists every decision the student made. |

## The console

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `ui-dial-face.png` | 200 × 200 | Round dial face with tick marks, no numbers — used twice, for kVp and mAs. |
| ☐ | `ui-dial-needle.png` | 200 × 200 | The needle alone, pointing straight up, on a transparent background so I can rotate it. |
| ☐ | `ui-knob.png` | 96 × 96 | Round knob with a pointer mark, used twice for collimation width and height. |

There is no green lamp and no lamp artwork at all. The student finds out what was right in the review
at the end, not at the console.

## The viewer

| ✓ | File name | Size | Description |
|---|---|---|---|
| ☐ | `ui-film-frame.png` | 440 × 540 | Border or lightbox frame the X-ray sits inside on the viewer screen. |
| ☐ | `ui-star.png` | 64 × 64 | Gold star, for the case rating. Drawn faded for an unearned star. |

> **What's the game called?** This is the only thing on this page I can't do without you:
>
> Other questions or notes for me:
>
>
