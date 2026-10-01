# Motion polish plan

Date: 2026-10-01. Branch `feat/motion-polish` (after `chore/prettier`). Approved by Vai in chat the same day.
Does not change the spec: §4.3–§4.5 and §6 are untouched. It changes the "As built" stack line in `CLAUDE.md`.

## Scope

Add `motion` and use it for four things: screen transitions, stage-to-stage changes, the film reveal on the
results screen, and the debrief stars. Out of scope, on purpose:

- The wrong-answer shake and red flash stay CSS. Spec §6 fixes them at 400 ms and the e2e tests step through them
  with a fake clock.
- The intake patient slide and speech bubble stay CSS; they already work and nothing replaces them.
- Button press feedback is one CSS `:active` rule, not `motion.button` on every button.

## Acceptance criteria (written before the code)

Each is observable behaviour, not an implementation name.

1. **Screens cross-fade.** After a button press that changes screen, the outgoing screen is still in the DOM two
   animation frames later, and is gone within 1 s. The next screen is mounted at once and fades in as the old one fades out.
2. **An exiting screen is inert.** While it is still in the DOM it has `pointer-events: none` (and `inert`, `aria-hidden`),
   so a double click cannot act on it twice and it is not read or focused as a second screen.
3. **Stages do the same.** Moving from one stage to the next in a level follows 1 and 2.
4. **Reduced motion means instant.** With `prefers-reduced-motion: reduce`, the outgoing screen is gone within two
   animation frames: no exit, no delay.
5. **The film stays sealed.** The existing e2e test "film and findings stay sealed until the results screen" still
   passes, so no film element exists at any stage, including mid-transition. This is a regression guard: it passes
   today and must keep passing.
6. **The film reveals, then the debrief.** On results the film is visible; stars and debrief are visible within 2 s;
   nothing is permanently hidden. (Existing visibility assertions cover this.)
7. **No existing behaviour regresses.** `npm run qa` and `npm run build` pass; the 300 ms input guard and the fake-clock
   tests are untouched.
8. **Cost is reported as a number**: bundle size before and after.

## Checks that must fail first

Criteria 1, 2, and 3 get new Playwright tests in `tests/e2e/motion.spec.ts`. They must fail on current code with
the predicted reason: the outgoing element is absent after two frames (assertion failure, not an import or typo).
Observed 2026-10-01: both failed with `Expected: "none", Received: null`, as predicted.
Criterion 4 is a guard, like 5 to 7: today's screens vanish instantly, so its test passes before any change (observed).
It exists to catch the new animation ignoring reduced motion. Correction made after writing the first version of
this plan, which wrongly listed criterion 4 as failing first.

## Not verifiable by a test

Whether it feels better. Vai plays it and judges. Reported as unchecked.

## Outcome (2026-10-01)

Built as planned except for one design change, made on evidence. The first version waited for the outgoing screen to
finish (`AnimatePresence mode="wait"`). That delayed the next stage's mount by about 200 ms, which broke the 300 ms
input guard (it counts from the step change, so a click aimed at the new console's first moments landed after it had
expired and moved a dial), started the stage timers late relative to the fake-clock tests, and put two "Doctor's order"
landmarks on screen at once. Nine existing e2e tests failed. Rather than edit those tests, the transition became a
cross-fade: the next stage mounts at once and the old one fades out beneath it, inert. No existing test was changed.

What ran, against the criteria:

- 1 to 3: three new tests in `tests/e2e/motion.spec.ts`. Observed failing on the old `src` with
  `Expected: "none", Received: null`, passing on the new. One setup fix after the first run (wait for an idle main
  thread before clicking, because a 1.4 s long task at page load swallowed the fade); the assertions did not change.
- 4: guard test, passes before and after, as expected.
- 5 to 7: `npm run qa` green (70 unit, 70 e2e, 4 skipped as before); the e2e suite also passed three times in a row
  with `--repeat-each=3` (210 passed, no flakes).
- 8: client JS 365.12 kB to 494.43 kB (107.45 kB to 149.32 kB gzip): +129 kB raw, +41.9 kB gzip. This is above the
  15 to 35 kB estimate given beforehand. `LazyMotion` with the `m` component would cut most of it if it matters.

Unchecked: how it feels, and whether 200 ms and the 1.2 s film develop are the right numbers. Vai to play it.