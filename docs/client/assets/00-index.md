# Radtech Simulator — Asset Lists: Start Here

**Date:** 10 September 2026 · Replaces the 7 September version
**For:** Medici

---

## What this is

This is every picture and sound the game needs, split into eight separate lists so you can work
through them one at a time — or hand a list to someone else — without carrying the whole thing
around. Each list stands on its own and repeats the style, naming, and format rules, so you never
need this page open beside it.

Tick off what you can provide and leave the rest. Anything missing shows up in the game as a
labelled grey box, so we can both see what is still owed, and nothing here blocks me from building.
Send things in any order and in whatever batches suit you.

## What changed on 10 September 2026

**Your case database took the game from five levels to twenty.** That is the whole reason this list
has been reissued, and it changes four of the eight lists. Before the numbers alarm you, the useful
part: **the total roughly doubled rather than quadrupling**, because the naming scheme lets levels
share files.

**Only three lists actually grew.** The patients went from 6 to 12, the collimation views from 5 to
12, and the films from 15 to 60. The rooms, the buttons, the sounds, and the radiographer's hand did
not change at all — a game with twenty levels needs the same five rooms as a game with five.

**The patients barely grew, and that is the naming scheme paying for itself.** Twenty cases, twelve
drawings. A patient file is named for age group, sex, and body type, so any two of your cases that
share all three share one picture. Three of your cases are adult men with a slight build; they are
one drawing, not three.

**The films are the real cost, and there is no way around it.** Sixty images, up from fifteen. Films
cannot be shared the way patients can, because a pleural effusion film cannot stand in for a
pneumothorax even though both are a PA chest. Thank you for confirming you will supply the
overexposed and underexposed versions — that was the one open question that could have compromised
the teaching.

**One list is deliberately incomplete.** List 04, the positions, names only the twenty correct ones.
The forty wrong ones depend on a judgement that is yours to make, and it is asked for on the level
content sheet. I am not inventing them.

## What changed on 7 September 2026

Three things, and the first two both mean less work for you.

**The "in pain" patients are gone.** You asked to drop them and I agree — six extra drawings to
change a face for a few seconds of screen time. The patient now walks in and speaks in their normal
standing pose, and the clue to the injury comes from what they say and from the doctor's order.

**I am generating a lot of this myself.** Every list now has a *Who draws it* line at the top. Three
lists are yours because they are the game (the patients, the positions, the films), two are yours if
you have time and mine if you don't, and three I will simply make — the rooms, the buttons, the
sounds. If you would rather draw something I have claimed, say so and it is yours; the split is to
save you work, not to take it away. Everything I generate follows a written style guide taken from
your character sheet, so it will sit alongside your drawings rather than beside them.

**Every file has been renamed.** The names now describe the picture in proper radiographic terms,
in a fixed order, so the game can work out what a file is from its name alone. That matters as the
game grows: adding a sixth patient or a second view of a wrist becomes a matter of naming the file
correctly rather than me editing a list by hand. The scheme is below, and each list shows the exact
names.

As of 7 September the total was **70 files**, of which **22 were yours**. See the 10 September note above for the current figures.

## How the names work

Every file is lowercase, uses hyphens instead of spaces, and reads left to right from the general to
the specific:

```
group  -  subject  -  detail
```

The films are the one exception: they carry an extra part naming the condition, because four of your
levels are a PA chest and the region alone cannot tell those four films apart.

- `patient-geriatric-female-hyposthenic.png` — a patient, elderly, female, slender build
- `pose-chest-pa-erect.png` — a positioning preview, of a chest, PA projection, patient upright
- `xray-chest-pa-pneumothorax-under.png` — a film, of a chest, PA projection, of the pneumothorax case, underexposed

Patients are named by **age group**, **sex**, and **body habitus** rather than by nickname, because
those three are what actually change how the exam is done, and they are already on the level content
sheet. The vocabulary is fixed — please don't invent new words for these:

| Field | Allowed values |
|---|---|
| Age group | `pediatric` · `adult` · `geriatric` |
| Sex | `male` · `female` |
| Body habitus | `asthenic` · `hyposthenic` · `sthenic` · `hypersthenic` |
| Body region | `chest` · `hand` · `wrist` · `elbow` · `humerus` · `tibfib` · `knee` · `abdomen` · `skull` |
| Projection | `ap` · `pa` · `lateral` · `caldwell` · `parietoacanthial` |
| Exposure | `under` · `optimal` · `over` |

**Name each file exactly as its list shows it.** That is how the game finds it, so a typo means a
grey box.

## The eight lists

| List | What's in it | Files | Who draws it |
|---|---|---|---|
| [01 — Patients](01-patients.md) | The people who walk in, one drawing each | 12 | You |
| [02 — The radtech](02-radtech.md) | The hand on the exposure button | 2 | Me |
| [03 — Backgrounds](03-backgrounds.md) | The five rooms the game takes place in | 5 | Me |
| [04 — Positioning previews](04-positioning-previews.md) | Three positions per level, the student picks one | 20 named, up to 60 | You if you can |
| [05 — Collimation views](05-collimation-views.md) | The body region seen from the tube | 12 | You if you can |
| [06 — X-ray films](06-xray-films.md) | Under, optimal, and overexposed, per level | 60 | You |
| [07 — Interface](07-interface.md) | Buttons, cards, dials, stars | 17 | Me, except the logo |
| [08 — Sounds](08-sounds.md) | Clicks, the exposure, clinic ambience | 5 | Me |
| | **Everything** | **up to 173** | |

**If you only ever send two lists, send 01 and 06.** The patients and the films are what make it
*your* game, and the films are the one thing I will not generate — see list 06 for why.

**And if you only ever send part of one list, send one complete level of films.** All three exposures
for a single case is more useful than twenty correct films with no bad ones, because one complete
level can be played and checked from end to end.

## How a level plays

Worth reading once, because it tells you what each picture is actually for.

A patient walks into reception and says what happened. A card shows the doctor's order, then docks
to the side of the screen where the student can keep reading it. The student picks one of three
positions. They set the kVp and mAs on the console. They adjust the collimation light until it
matches the target field. Then they press and hold the exposure button — and only then does the
X-ray appear. Finally the case is reviewed: the film, a star rating, and a line-by-line account of
what they got right and wrong.

The student gets **one attempt** at the position and at the exposure settings, and the console never
tells them the right answer — they find out in the review at the end. That is why the three films
per level matter so much: **the film is the feedback.** A student who sets the kVp too low sees a
noisy, underexposed image and has to work out why.

## Style

Soft cel-shading, dark-brown outlines, muted earthy colours, flat lighting, no heavy gradients —
exactly your character sheet. Backgrounds can be a little more painterly but stay in the same
palette. I have written the whole thing down, including the colours sampled from your sheet, so that
what I generate matches what you draw; ask me for it if you want to see it.

## Format

- **PNG** with a transparent background. The five backgrounds are the exception — those can be opaque.
- **Draw at twice the size listed.** The sizes in each list are the on-screen size; doubling keeps
  things sharp on phones. So "300 × 600" means send a 600 × 1200 file.
- **Name the file exactly as shown**, lowercase, no spaces.
- Sound: MP3 or OGG.
- Sizes are guides, not rules. A patient can be taller, a background wider — I will fit it. Only the
  aspect ratio matters much.

The game screen is 960 × 640 (landscape, 3:2). Everything is drawn to fit that.

> Questions or notes for me:
>
>
