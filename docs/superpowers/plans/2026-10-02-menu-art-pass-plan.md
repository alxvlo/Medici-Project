# Menu and Art Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken main menu and put the client's delivered UI art to use where plain CSS boxes stand in for it today.

**Architecture:** The delivered art is blank plates (a tan button, a card with header and footer bands, a panel with a header band, a ring, a film frame) meant to carry text drawn on top. Two small components, `Button` and `Panel`, stack the plate art behind their content using the existing `.art` pattern (`OrderCard` already does this: parent `isolation: isolate`, child `<Img className="art">` with `z-index: -1`). Everything else is CSS and one JSX edit per screen. No new dependency.

**Tech Stack:** React 19, TypeScript, plain CSS in `src/styles.css`, `motion` (already installed, only `Results` touches it here), Playwright for the checks.

**Spec:** No new written spec. The design was presented in chat on 2026-10-02 and is restated in full by this plan. It sits under `docs/superpowers/specs/2026-08-27-medici-radtech-game-design.md` §7 (assets) and `docs/art-direction.md`. Stacked on `feat/motion-polish`, which is not yet merged.

## Global Constraints

- The stage is a fixed 960×640 `<Stage>`, DOM-first, landscape only; every layout number below is in stage pixels.
- No new dependency. No state library, router, or UI kit.
- Asset ids are the client's filenames without extension, lowercased (`btn-large`, `level-card`, `popup-panel`, `film-frame`, `timer-ring`, `icon-sound-on`, `icon-sound-off`, `btn-small-hover`, …). Image fields are ids, never paths. An unknown id renders a labelled placeholder.
- Client art in `src/assets/` is never edited, regenerated, cropped, or moved. The sixty X-ray films are never generated and never cropped.
- The film must not render anywhere before the results screen (spec §4.4). This plan only changes how the results screen frames it.
- Level JSON (`src/data/levels/*.json`) is not touched.
- Prettier is installed: run `npx prettier --write` only on the specific `.ts`/`.tsx`/`.css` files you changed. Never run it over `src/data` or `src/assets`.
- Conventional Commits, messages say why. Every commit message ends with the two attribution lines from the session reminder (`Co-Authored-By: …` and `Claude-Session: …`). Never push, force-push, or open a PR.
- `npm run qa` is the gate. Nothing is done until it passes on the final tree.
- Acceptance criteria come before code, and every new check must be seen failing for its predicted reason first. A check that passes before the change is a guard and is labelled so.

## Review Focus

Failure modes the design implies but a happy-path test would miss, most likely first. Each has a test in the task that owns the code.

- Level titles and exam strings in the narrower portrait cards could overflow or stretch a card. Expected: all twenty cards keep the art's proportions with every child inside the card. (Task 3)
- The client will supply longer "why this position is wrong" sentences than the placeholder. Expected: the popup panel stays inside the stage and the Continue button stays reachable by scrolling inside the panel. (Task 4)
- Keyboard users: art-backed buttons must stay focusable with a visible focus ring, and Enter must activate them. (Task 2)
- Mobile landscape scales the whole stage. Expected: every geometry check passes in both Playwright projects, since they all assert relative positions. (All tasks)
- A locked level card must stay disabled and keep its lock icon after the card is restyled. (Task 3)

## Not in this plan, on purpose

- `indicator-off`, `indicator-red`: the client's own checklist cut them because the code draws such lamps, and the spec has no console lamps. Nothing to attach them to.
- `radtech-portrait` (spec §7.2 marks it "(unused)"), `patient-teen-girl`, `pose-chest-oblique`, `pose-skull-smv`: no level references them; that is a content decision, not an art bug.
- Shrinking the 3 MB logo and the 3 MB backgrounds: a separate asset-weight plan.
- Project docs (README, spec, client documents) still say "Radtech Simulator". Only the in-game name changes here, to the logo's "Rad Arcade" (Vai: "just use the logo"); renaming the documents is a separate call.
- Level select stays five columns (already true); only the card shape changes, from 132 px landscape to the art's 320:440 portrait, about 173×238.

## File Structure

- Create `src/ui/Button.tsx`: a button drawn on the button art, with hover and pressed plates.
- Create `src/ui/Panel.tsx`: the popup panel art, a header-band title, and a scrolling body.
- Create `tests/e2e/art.spec.ts`: every check in this plan.
- Modify `src/styles.css`; `src/screens/Title.tsx`, `LevelSelect.tsx`, `Settings.tsx`, `Results.tsx`; `src/stages/Position.tsx`, `Intake.tsx`, `Order.tsx`, `Collimate.tsx`, `Technique.tsx`; `src/ui/TimerRing.tsx`.
- Docs at the end: `CHANGELOG.md`, `CLAUDE.md`, this file's Outcome section.

Work on a new branch off the motion branch: `git checkout feat/motion-polish; git checkout -b feat/menu-art-pass`.

---

### Task 1: Title layout, logo as a poster with the menu beside it

**Files:**
- Create: `tests/e2e/art.spec.ts`
- Modify: `src/styles.css` (`.title .logo`, `.menu`)
- Modify: `index.html` (`<title>`), `src/screens/Title.tsx` (logo `alt`)

**Interfaces:**
- Produces: the `box`, `overlaps`, `inside`, `Box` helpers at the top of `art.spec.ts`, which every later task's tests reuse.

- [ ] **Step 1: Create the spec file with the helpers and the title test**

```ts
import { test, expect } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { seedSave } from "./helpers";

type Box = { x: number; y: number; width: number; height: number };

const box = async (l: Locator): Promise<Box> => {
  const b = await l.boundingBox();
  if (!b) throw new Error("element has no box");
  return b;
};
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;
const inside = (inner: Box, outer: Box, slack = 1) =>
  inner.x >= outer.x - slack &&
  inner.y >= outer.y - slack &&
  inner.x + inner.width <= outer.x + outer.width + slack &&
  inner.y + inner.height <= outer.y + outer.height + slack;

test("the title logo and the three menu buttons do not overlap, and all sit inside the stage", async ({
  page,
}) => {
  await seedSave(page);
  await page.goto("/");
  const stage = await box(page.locator(".app"));
  const logo = await box(page.locator('[data-asset="logo"]'));
  expect(inside(logo, stage), "logo is outside the stage").toBe(true);
  for (const name of ["Start", "Select Level", "Settings"]) {
    const b = await box(page.getByRole("button", { name }));
    expect(overlaps(logo, b), `${name} overlaps the logo`).toBe(false);
    expect(inside(b, stage), `${name} is outside the stage`).toBe(true);
  }
});
```

Also append this check to the file:

```ts
test("the game is named after its logo: tab title and logo text say Rad Arcade", async ({ page }) => {
  await seedSave(page);
  await page.goto("/");
  await expect(page).toHaveTitle("Rad Arcade");
  await expect(page.getByRole("img", { name: "Rad Arcade" })).toBeVisible();
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx playwright test tests/e2e/art.spec.ts --project=desktop`
Expected: the overlap test FAILS with `Start overlaps the logo`; the naming test FAILS with `Expected: "Rad Arcade", Received: "Radtech Simulator"` (the logo spans y 40–460 and the menu starts at y 330; this is an assertion failure, not an import or typo).

- [ ] **Step 3: Replace the two CSS rules**

Replace the whole `.title .logo { … }` rule and the whole `.menu { … }` rule in `src/styles.css` with:

```css
.title .logo {
  position: absolute;
  left: 80px;
  top: 100px;
  width: 440px;
  height: 440px;
  border-radius: 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}
.menu {
  position: absolute;
  left: 560px;
  top: 169px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

In `index.html` change `<title>Radtech Simulator</title>` to `<title>Rad Arcade</title>`, and in `src/screens/Title.tsx` change the logo's `alt="Radtech Simulator"` to `alt="Rad Arcade"`.

The logo is a square with a black background, so it reads as a framed poster on the left (x 80–520, vertically centred on the 640 stage). The menu column sits to its right (x from 560).

- [ ] **Step 4: Run it and watch it pass, on both projects**

Run: `npx playwright test tests/e2e/art.spec.ts`
Expected: PASS (4 passed, two tests on desktop and mobile-landscape).

- [ ] **Step 5: Commit**

```powershell
npx prettier --write src/styles.css src/screens/Title.tsx tests/e2e/art.spec.ts
git add src/styles.css src/screens/Title.tsx index.html tests/e2e/art.spec.ts
git commit -m "fix: lay the title out as a logo poster beside the menu, and name the game after its logo"
```

---

### Task 2: Buttons drawn on the delivered button art

**Files:**
- Create: `src/ui/Button.tsx`
- Modify: `src/styles.css` (`.btn` rules, add `.art`-state rules, `.menu .btn`, `.btn.small`)
- Modify: `src/screens/Title.tsx`, `src/screens/Results.tsx`, `src/screens/Settings.tsx`, `src/stages/Position.tsx`, `src/stages/Intake.tsx`, `src/stages/Order.tsx`, `src/stages/Collimate.tsx`, `src/stages/Technique.tsx`
- Test: `tests/e2e/art.spec.ts`

**Interfaces:**
- Produces: `Button({ small?: boolean, className?: string, ...buttonProps })`. It renders `<button class="btn [small] [className]">` with three stacked plates: `btn-large` (or `btn-small`), `-hover`, `-pressed`. Text goes in as children. Task 4 relies on `small`.

- [ ] **Step 1: Write the failing test and the keyboard guard**

Append to `tests/e2e/art.spec.ts`:

```ts
test("title buttons are drawn on the button art and swap plates on hover and press", async ({
  page,
}) => {
  await seedSave(page);
  await page.goto("/");
  const start = page.getByRole("button", { name: "Start" });
  const art = (id: string) => start.locator(`[data-asset="${id}"]`);
  await expect(art("btn-large")).toBeVisible();
  await expect(art("btn-large-hover")).toHaveCSS("opacity", "0");
  await expect(art("btn-large-pressed")).toHaveCSS("opacity", "0");
  await start.hover();
  await expect(art("btn-large-hover")).toHaveCSS("opacity", "1");
  await page.mouse.down();
  await expect(art("btn-large-pressed")).toHaveCSS("opacity", "1");
  await page.mouse.move(5, 5); // slide off before release, so the click never fires
  await page.mouse.up();
});

// Guard: passes before and after. It exists so the restyle cannot cost keyboard users their focus ring.
test("the title buttons work from the keyboard and show a focus ring", async ({
  page,
}) => {
  await seedSave(page);
  await page.goto("/");
  await page.keyboard.press("Tab");
  const start = page.getByRole("button", { name: "Start" });
  await expect(start).toBeFocused();
  const ring = await start.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  expect(ring.style).not.toBe("none");
  expect(ring.width).toBeGreaterThan(0);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
});
```

- [ ] **Step 2: Run them**

Run: `npx playwright test tests/e2e/art.spec.ts -g "button art|keyboard" --project=desktop`
Expected: the first FAILS (`[data-asset="btn-large"]` not found: no art on the buttons yet). The keyboard test PASSES today; that is the guard.

- [ ] **Step 3: Create `src/ui/Button.tsx`**

```tsx
import type { ComponentProps } from "react";
import { Img } from "./Img";

type Props = ComponentProps<"button"> & { small?: boolean };

/** A button drawn on the client's button art: base, hover, and pressed plates stacked, the live one shown by CSS. */
export function Button({
  small = false,
  className,
  children,
  ...rest
}: Props) {
  const art = small ? "btn-small" : "btn-large";
  return (
    <button
      {...rest}
      className={["btn", small && "small", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Img id={art} className="art" />
      <Img id={`${art}-hover`} className="art hover" />
      <Img id={`${art}-pressed`} className="art pressed" />
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Replace the `.btn` CSS**

In `src/styles.css`, replace the whole `.btn { … }` rule (keep `.btn:active:not(:disabled)` that follows it) with:

```css
.btn {
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  width: 240px;
  height: 72px;
  padding: 0;
  border: 0;
  background: none;
  color: #3a2a22;
  font-size: 20px;
  font-weight: 700;
}
.btn.small {
  width: 160px;
  height: 64px;
  font-size: 18px;
}
.menu .btn {
  width: 300px;
  height: 90px;
  font-size: 26px;
}
.btn .art.hover,
.btn .art.pressed {
  opacity: 0;
}
.btn:hover:not(:disabled) {
  filter: none;
}
.btn:hover:not(:disabled) .art.hover {
  opacity: 1;
}
.btn:active:not(:disabled) .art.pressed {
  opacity: 1;
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn:focus-visible {
  outline: 3px solid #3a2a22;
  outline-offset: 3px;
}
```

Why: the global `button:hover` brightness filter would stack on the hover plate, so `.btn` opts out of it. `.next` (defined later in the file, same specificity) still wins `position: absolute`.

- [ ] **Step 5: Swap every `.btn` for `<Button>`**

Add `import { Button } from "../ui/Button";` to each file, then change the opening and the matching closing tag (`</button>` → `</Button>`). Do not touch other `<button>` elements (`.pose`, `.icon-btn`, `.card`, the expose button, the dial buttons).

| File | Old opening tag | New opening tag |
|---|---|---|
| `src/screens/Title.tsx` (all 3) | `<button className="btn" …>` | `<Button …>` |
| `src/screens/Results.tsx` (all 3) | `<button className="btn" …>` | `<Button …>` |
| `src/screens/Settings.tsx` (all 4) | `<button className="btn" …>` | `<Button small …>` |
| `src/stages/Position.tsx` (only the Continue in the wrong-position dialog) | `<button className="btn" onClick={() => onComplete(wrong.pose)}>` | `<Button small onClick={() => onComplete(wrong.pose)}>` |
| `src/stages/Intake.tsx`, `Order.tsx`, `Collimate.tsx` | `<button className="btn next" …>` | `<Button className="next" …>` |
| `src/stages/Technique.tsx` | `<button className="btn next" onClick={submit} disabled={submitted}>` | `<Button className="next" onClick={submit} disabled={submitted}>` |

Then confirm none are left:

Run: `Get-ChildItem src -Recurse -Filter *.tsx | Select-String -Pattern 'className="btn' | Where-Object { $_.Path -notmatch 'Button.tsx' }`
Expected: no output.

- [ ] **Step 6: Run the new checks and the whole e2e suite**

Run: `npx tsc --noEmit; npx playwright test`
Expected: typecheck clean; all pass (the existing tests locate buttons by role and name, which the art does not change).

- [ ] **Step 7: Commit**

```powershell
npx prettier --write src/ui/Button.tsx src/styles.css src/screens/Title.tsx src/screens/Results.tsx src/screens/Settings.tsx src/stages/Position.tsx src/stages/Intake.tsx src/stages/Order.tsx src/stages/Collimate.tsx src/stages/Technique.tsx tests/e2e/art.spec.ts
git add src tests
git commit -m "feat: draw buttons on the delivered button art, with its hover and pressed plates"
```

---

### Task 3: Level select, card art and a header the icons can be seen on

**Files:**
- Modify: `src/screens/LevelSelect.tsx` (the `.card` markup)
- Modify: `src/styles.css` (`.card*`, `.level-select header`)
- Test: `tests/e2e/art.spec.ts`

**Interfaces:**
- Consumes: `box` helper from Task 1.

- [ ] **Step 1: Write the failing checks**

Append to `tests/e2e/art.spec.ts`:

```ts
const rgb = (css: string) => css.match(/[\d.]+/g)!.map(Number);
const channel = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: number[]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// The dark brown of icon-back.png and icon-settings.png, measured from the delivered files.
const ICON_BROWN = [91, 66, 47];

test("all twenty level cards are drawn on the card art at its proportions, with every child inside", async ({
  page,
}) => {
  await seedSave(page, { unlocked: 20 });
  await page.goto("/");
  await page.getByRole("button", { name: "Select Level" }).click();
  const cards = page.locator("button[aria-label^='Level ']");
  await expect(cards).toHaveCount(20);
  for (let i = 0; i < 20; i++) {
    const card = cards.nth(i);
    await expect(
      card.locator('[data-asset="level-card"]'),
      `card ${i + 1} has no card art`,
    ).toHaveCount(1);
    const b = await box(card);
    expect(b.width / b.height, `card ${i + 1} proportions`).toBeCloseTo(
      320 / 440,
      1,
    );
    const stray = await card.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return [...el.querySelectorAll("*")].filter((c) => {
        const q = c.getBoundingClientRect();
        return (
          q.width > 0 &&
          (q.left < r.left - 1 ||
            q.right > r.right + 1 ||
            q.top < r.top - 1 ||
            q.bottom > r.bottom + 1)
        );
      }).length;
    });
    expect(stray, `card ${i + 1} has children outside it`).toBe(0);
  }
});

test("the level-select header is opaque and light enough to show the dark back and settings icons", async ({
  page,
}) => {
  await seedSave(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Select Level" }).click();
  const bg = rgb(
    await page
      .locator(".level-select header")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  );
  expect(bg[3] ?? 1, "header background is see-through").toBe(1);
  expect(contrast(bg.slice(0, 3), ICON_BROWN)).toBeGreaterThanOrEqual(4.5);
});

// Guard: passes before and after. A restyled locked card must stay disabled and keep its lock.
test("a locked card stays disabled and shows the lock", async ({ page }) => {
  await seedSave(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Select Level" }).click();
  const locked = page.getByRole("button", { name: /^Level 2:/ });
  await expect(locked).toBeDisabled();
  await expect(locked.locator('[data-asset="icon-lock"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /^Level 1:/ })).toBeEnabled();
});
```

- [ ] **Step 2: Run them and watch the first two fail**

Run: `npx playwright test tests/e2e/art.spec.ts -g "level card|header|locked card" --project=desktop`
Expected: the cards test FAILS (`card 1 has no card art`); the header test FAILS (`Expected: 1, Received: 0.88`, the header background is `rgba(58, 42, 34, 0.88)`); the locked-card guard PASSES.

- [ ] **Step 3: Change the card markup**

In `src/screens/LevelSelect.tsx`, replace the body of the card `<button>` (everything between its opening tag and `</button>`) with:

```tsx
<Img id="level-card" className="art" />
<span className="num">{l.id}</span>
<span className="body">
  <span className="name">{l.title}</span>
  <span className="exam">{l.order.exam}</span>
</span>
<span className="foot">
  {locked ? (
    <Img id="icon-lock" className="lock" />
  ) : (
    <Stars n={save.stars[l.id] ?? 0} />
  )}
</span>
```

- [ ] **Step 4: Replace the card and header CSS**

In `src/styles.css`, replace the whole `.card { … }`, `.card .num`, `.card .name`, `.card .exam` and `.card .lock` rules with:

```css
.card {
  position: relative;
  isolation: isolate;
  aspect-ratio: 320 / 440;
  padding: 0;
  display: grid;
  grid-template-rows: 20% 1fr 16%;
  justify-items: center;
  align-items: center;
  border: 0;
  background: none;
  color: #3a2a22;
}
.card .num {
  font-size: 22px;
  font-weight: 800;
}
.card .body {
  display: grid;
  gap: 4px;
  padding: 0 10px;
  text-align: center;
}
.card .name {
  font-size: 14px;
  font-weight: 700;
}
.card .exam {
  font-size: 11px;
}
.card .foot {
  display: flex;
  align-items: center;
  justify-content: center;
}
.card .lock {
  width: 24px;
  height: 24px;
  min-width: 0;
  min-height: 0;
}
```

Keep the existing `.card:disabled { opacity: 0.55; … }` rule. Then in the `.level-select header` rule change `background: rgba(58, 42, 34, 0.88);` to `background: #f3e7d3;` and `color: #efe6d8;` to `color: #3a2a22;`, and add `border-bottom: 3px solid #3a2a22;`. (The cream header against the dark-brown icons measures about 7:1, above the 4.5:1 floor.)

- [ ] **Step 5: Run the checks and the whole suite**

Run: `npx tsc --noEmit; npx playwright test`
Expected: PASS everywhere, including the existing "card list scrolls to level 20 without the stage moving". If the cards test reports `children outside` for a long title, shorten `.card .name` to `font-size: 13px` and rerun; do not loosen the assertion.

- [ ] **Step 6: Commit**

```powershell
npx prettier --write src/screens/LevelSelect.tsx src/styles.css tests/e2e/art.spec.ts
git add src tests
git commit -m "feat: draw level cards on the card art and make the level-select header legible"
```

---

### Task 4: Popup panel art and the sound icon

**Files:**
- Create: `src/ui/Panel.tsx`
- Modify: `src/screens/Settings.tsx`, `src/stages/Position.tsx`, `src/styles.css`
- Test: `tests/e2e/art.spec.ts`

**Interfaces:**
- Consumes: `Button` (with `small`) from Task 2; `box`, `inside` from Task 1.
- Produces: `Panel({ title: ReactNode, children })`.

- [ ] **Step 1: Write the failing checks**

Append to `tests/e2e/art.spec.ts` (and add `startLevel, throughOrder, poseButton` to the `./helpers` import at the top):

```ts
test("settings is drawn on the popup panel, with a speaker icon that follows the sound toggle", async ({
  page,
}) => {
  await seedSave(page); // sound is off in the seeded save
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog.locator('[data-asset="popup-panel"]')).toBeVisible();
  await expect(dialog.locator('[data-asset="icon-sound-off"]')).toBeVisible();
  await expect(dialog.locator('[data-asset="icon-sound-on"]')).toHaveCount(0);
  await dialog.getByRole("checkbox", { name: "Sound" }).check();
  await expect(dialog.locator('[data-asset="icon-sound-on"]')).toBeVisible();
  await expect(dialog.locator('[data-asset="icon-sound-off"]')).toHaveCount(0);
});

test("settings buttons use the small button art and its hover plate", async ({
  page,
}) => {
  await seedSave(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  const close = page
    .getByRole("dialog", { name: "Settings" })
    .getByRole("button", { name: "Close" });
  await expect(close.locator('[data-asset="btn-small"]')).toBeVisible();
  await close.hover();
  await expect(close.locator('[data-asset="btn-small-hover"]')).toHaveCSS(
    "opacity",
    "1",
  );
});

async function wrongPositionDialog(page: import("@playwright/test").Page) {
  await startLevel(page, 1);
  await throughOrder(page);
  await poseButton(page, "pose-chest-ap").click(); // level 1 is a PA chest, so this is wrong
  const dialog = page.getByRole("dialog", { name: "Wrong position" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("the wrong-position dialog sits on the popup panel and fits inside it and the stage", async ({
  page,
}) => {
  const dialog = await wrongPositionDialog(page);
  const panel = await box(dialog.locator('[data-asset="popup-panel"]'));
  expect(inside(panel, await box(page.locator(".app")))).toBe(true);
  for (const part of [
    dialog.getByRole("button", { name: "Continue" }),
    dialog.locator('[data-asset="pose-chest-pa"]'),
  ])
    expect(inside(await box(part), panel)).toBe(true);
});

// The client will supply real "why this is wrong" sentences, much longer than the placeholder.
test("long explanatory copy scrolls inside the panel instead of overflowing it", async ({
  page,
}) => {
  const dialog = await wrongPositionDialog(page);
  await dialog
    .locator("p")
    .first()
    .evaluate((el) => {
      el.textContent = "A long explanation of the error. ".repeat(40);
    });
  const panel = await box(dialog.locator('[data-asset="popup-panel"]'));
  expect(inside(panel, await box(page.locator(".app")))).toBe(true);
  const cont = dialog.getByRole("button", { name: "Continue" });
  await cont.scrollIntoViewIfNeeded();
  expect(inside(await box(cont), panel)).toBe(true);
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx playwright test tests/e2e/art.spec.ts -g "popup panel|small button|long explanatory" --project=desktop`
Expected: all four FAIL on `[data-asset="popup-panel"]` / `icon-sound-off` / `btn-small` not found (the art is not used yet).

- [ ] **Step 3: Create `src/ui/Panel.tsx`**

```tsx
import type { ReactNode } from "react";
import { Img } from "./Img";

/** The client's popup panel: the title sits in its header band, and a long body scrolls inside it. */
export function Panel({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="panel">
      <Img id="popup-panel" className="art" />
      <h2>{title}</h2>
      <div className="panel-body">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Use `Panel` in Settings, with the speaker icon beside the checkbox**

In `src/screens/Settings.tsx` add `import { Panel } from "../ui/Panel";` and `import { Img } from "../ui/Img";`, replace `<div className="panel"><h2>Settings</h2>` … `</div>` with `<Panel title="Settings">` … `</Panel>` (the body is the label row, the reset block, and the Close button, unchanged), and change the sound row to:

```tsx
<label className="row">
  <input
    type="checkbox"
    checked={save.settings.sound}
    onChange={() => dispatch({ type: "toggleSound" })}
  />
  <Img
    id={save.settings.sound ? "icon-sound-on" : "icon-sound-off"}
    className="sound-icon"
  />
  Sound
</label>
```

The checkbox stays, so the existing "exactly one checkbox named Sound" test keeps working.

- [ ] **Step 5: Use `Panel` in the wrong-position dialog**

In `src/stages/Position.tsx` add `import { Panel } from "../ui/Panel";`. Replace the `<div className="panel">` / `<h2>…</h2>` wrapper with `<Panel title={chosen ? `${chosen.label} is not the right position` : "Time's up: no position was chosen"}>` and close with `</Panel>`. The `<p>` for `chosen.why`, the "The correct position is …" `<p>`, the `correct-pose` `<Img>`, and the Continue button stay as children.

- [ ] **Step 6: Replace the panel CSS**

In `src/styles.css` replace the whole `.panel { … }` rule with the following, keep `.panel .row`, and add the rest:

```css
.panel {
  position: relative;
  isolation: isolate;
  width: 640px;
  height: 460px;
  display: grid;
  grid-template-rows: 80px 1fr;
  padding: 0 36px 28px;
  box-sizing: border-box;
  color: #3a2a22;
}
.panel h2 {
  margin: 0;
  display: grid;
  place-items: center;
  font-size: 22px;
}
.panel-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-top: 12px;
  text-align: center;
  overflow-y: auto;
  min-height: 0;
}
.panel .sound-icon {
  width: 32px;
  height: 32px;
  min-width: 0;
  min-height: 0;
}
.correct-pose {
  max-height: 130px;
  width: auto;
}
```

(The panel's header band is 17% of the art's height, about 80 px at 460.)

- [ ] **Step 7: Run the checks and the whole suite**

Run: `npx tsc --noEmit; npx playwright test`
Expected: PASS. The existing wrong-position and settings tests locate by role and label, which `Panel` keeps (`role="dialog"` and `aria-label` stay on the `.overlay` wrapper).

- [ ] **Step 8: Commit**

```powershell
npx prettier --write src/ui/Panel.tsx src/screens/Settings.tsx src/stages/Position.tsx src/styles.css tests/e2e/art.spec.ts
git add src tests
git commit -m "feat: draw popups on the panel art, scroll long copy inside it, and show the sound icon"
```

---

### Task 5: Film frame on the results screen and the timer ring

**Files:**
- Modify: `src/screens/Results.tsx` (lightbox markup), `src/ui/TimerRing.tsx`, `src/styles.css`
- Test: `tests/e2e/art.spec.ts`

**Interfaces:**
- Consumes: `box`, `inside` from Task 1; `playL1` helper from `tests/e2e/helpers.ts` (add to the import).

- [ ] **Step 1: Write the failing checks**

Append to `tests/e2e/art.spec.ts`:

```ts
test("the results film sits inside the film frame's opening", async ({
  page,
}) => {
  await startLevel(page, 1);
  await playL1(page);
  const frame = await box(page.locator('[data-asset="film-frame"]'));
  const film = await box(page.locator('[data-asset^="xray-"]'));
  // The frame art's solid border is 60 px of 880 wide and 60 px of 1080 high (measured from the PNG).
  const mx = (frame.width * 60) / 880;
  const my = (frame.height * 60) / 1080;
  expect(film.x).toBeGreaterThanOrEqual(frame.x + mx - 2);
  expect(film.y).toBeGreaterThanOrEqual(frame.y + my - 2);
  expect(film.x + film.width).toBeLessThanOrEqual(frame.x + frame.width - mx + 2);
  expect(film.y + film.height).toBeLessThanOrEqual(frame.y + frame.height - my + 2);
});

test("the countdown ring is drawn on the timer-ring art and still reads the seconds", async ({
  page,
}) => {
  await startLevel(page, 1);
  await throughOrder(page);
  const timer = page.getByRole("timer");
  await expect(timer.locator('[data-asset="timer-ring"]')).toBeVisible();
  await expect(timer).toHaveAttribute("aria-label", /^\d+ seconds left$/);
  await expect(timer).toContainText(/\d+/);
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx playwright test tests/e2e/art.spec.ts -g "film frame|countdown ring" --project=desktop`
Expected: both FAIL (`film-frame` / `timer-ring` art not found).

- [ ] **Step 3: Frame the film, and keep the develop effect on the film only**

The film-frame art is a dark border with a translucent cream interior (alpha about 35%), so it goes behind the film. In `src/screens/Results.tsx` replace the `<motion.div className="lightbox" …>` block with the same props moved onto an inner box:

```tsx
<div className="lightbox">
  <Img id="film-frame" className="art" />
  <motion.div
    className="filmbox"
    initial={{ opacity: 0, filter: "brightness(3)" }}
    animate={{ opacity: 1, filter: "brightness(1)" }}
    transition={{ duration: secs(1.2), ease: "easeOut" }}
  >
    <Img
      id={filmId(level.films.slug, film)}
      className="film"
      alt={`${FILM_LABEL[film]} radiograph`}
    />
  </motion.div>
</div>
```

In `src/styles.css` replace the `.results .lightbox { … }` rule with:

```css
.results .lightbox {
  position: absolute;
  left: 24px;
  top: 24px;
  width: 400px;
  height: 592px;
  isolation: isolate;
}
.results .filmbox {
  position: absolute;
  inset: 34px 30px;
  display: grid;
  place-items: center;
  background: #111;
}
```

Keep `.results .film`. (The brightness flash now plays on the film area only, not on the frame.)

- [ ] **Step 4: Put the ring art around the countdown**

Replace `TimerRing` in `src/ui/TimerRing.tsx` (and add `import { Img } from "./Img";`):

```tsx
export function TimerRing({ left, total }: { left: number; total: number }) {
  return (
    <div
      className="timer"
      role="timer"
      aria-label={`${left} seconds left`}
      style={{ "--p": left / total } as CSSProperties}
    >
      <Img id="timer-ring" className="ring" />
      <span className="face">{left}</span>
    </div>
  );
}
```

Replace both `.timer { … }` and `.timer span { … }` in `src/styles.css` with the following. The ring art has a transparent hole, so the red progress wedge shows through it; the digits sit on a cream disc inside.

```css
.timer {
  position: absolute;
  right: 20px;
  top: 8px;
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 800;
  color: #3a2a22;
}
.timer .ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
.timer .face {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle closest-side, #f3e7d3 66%, transparent 67%),
    conic-gradient(#b8432f calc(var(--p) * 360deg), #e8d9c0 0);
}
```

- [ ] **Step 5: Run the checks and the whole suite**

Run: `npx tsc --noEmit; npx playwright test`
Expected: PASS, including "film and findings stay sealed until the results screen" (the film still exists only on results).

- [ ] **Step 6: Commit**

```powershell
npx prettier --write src/screens/Results.tsx src/ui/TimerRing.tsx src/styles.css tests/e2e/art.spec.ts
git add src tests
git commit -m "feat: frame the results film in the film frame and ring the countdown in the timer-ring art"
```

---

### Task 6: Look at it, document it, run the gate

**Files:**
- Modify: `CHANGELOG.md`, `CLAUDE.md`, this file (append an Outcome section)

- [ ] **Step 1: Take screenshots for Vai to judge**

A test cannot say whether it looks good. Write `$env:CLAUDE_JOB_DIR\tmp\shots.mjs`:

```js
import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const save = { version: 1, unlocked: 20, stars: { 1: 3, 2: 2 }, settings: { sound: false } };
await p.addInitScript((s) => localStorage.setItem("medici.save.v1", s), JSON.stringify(save));
await p.goto("http://localhost:5174/");
await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/1-title.png` });
await p.getByRole("button", { name: "Select Level" }).click();
await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/2-select.png` });
await p.getByRole("button", { name: "Settings" }).click();
await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/3-settings.png` });
await b.close();
```

Run (PowerShell), from the repo root so `@playwright/test` resolves:

```powershell
$p = Start-Process -PassThru -WindowStyle Hidden npx "vite --port 5174 --strictPort"
Start-Sleep 6
Copy-Item "$env:CLAUDE_JOB_DIR\tmp\shots.mjs" .\zz-shots.mjs
node zz-shots.mjs "$env:CLAUDE_JOB_DIR\tmp"
Remove-Item .\zz-shots.mjs
Get-NetTCPConnection -LocalPort 5174 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

Read the three PNGs. For a wrong-position dialog and a results screen, play them in `npm run dev` yourself or add two more screenshots the same way; report whatever you could not see as unchecked.

- [ ] **Step 2: Update the docs**

In `CHANGELOG.md`, add under the newest `## 2026-10-02` heading (create it above `## 2026-10-01` if absent):

```markdown
## 2026-10-02

Menu and art pass (plan: `docs/superpowers/plans/2026-10-02-menu-art-pass-plan.md`). The title is now a logo
poster with the menu beside it instead of overlapping it. The delivered button, level-card, popup-panel,
film-frame, timer-ring, and sound-icon art is used where plain CSS boxes stood in for it; the level-select
header is now light so its dark icons can be seen. Still unused on purpose: `indicator-off`, `indicator-red`
(no lamps in the spec), `radtech-portrait`, `patient-teen-girl`, `pose-chest-oblique`, `pose-skull-smv` (no
level references them). The tab title and the logo's alt text now say "Rad Arcade", as the logo does; the project documents still say "Radtech Simulator".
```

In `CLAUDE.md`, append to the "As built" paragraph: `On 2026-10-02 the delivered UI art went into use through two small components, `src/ui/Button.tsx` and `src/ui/Panel.tsx`; the film frame sits behind the film and never over it.`

- [ ] **Step 3: Run the whole gate and the build**

Run: `npm run qa; npm run build`
Expected: typecheck, lint, unit tests, and e2e (both viewports) all pass; build succeeds. Note the client JS size next to the previous 494.43 kB.

- [ ] **Step 4: Append an Outcome section to this file**

Record, with the real numbers from Step 3: which new checks failed first and with what message (copy the output), which were guards, the final pass counts, the bundle size, and what is still unchecked (the look of every screen, until Vai plays it).

- [ ] **Step 5: Commit**

```powershell
git add CHANGELOG.md CLAUDE.md docs
git commit -m "docs: record the menu and art pass"
```

---

## Self-review

- **Spec coverage.** Title overlap: Task 1. Button art with hover and pressed plates: Task 2. Level cards and the invisible header icons: Task 3. Popup panels and sound icons: Task 4. Film frame and timer ring: Task 5. Docs, screenshots, gate: Task 6. Every previously unused art id now has a task, except the ones listed under "Not in this plan", with the reason for each.
- **Placeholders.** None. Every code step has the code; the one conditional (Task 3 Step 5, a long title) names the exact fallback and forbids loosening the assertion.
- **Type consistency.** `Button` takes `small?: boolean` and is used with `small` only in Tasks 2 and 4; `Panel` takes `title` and `children`; the test helpers `box`, `inside`, `overlaps` are defined once in Task 1 and reused; art ids match the filenames measured on disk.
- **Review Focus.** Cards: Task 3 loop over all 20. Long copy: Task 4 stress test. Keyboard: Task 2 guard. Both viewports: every geometry check runs in both Playwright projects. Locked cards: Task 3 guard.
- **Known guards (cannot fail first):** the keyboard test and the locked-card test. They are labelled in the spec file.
