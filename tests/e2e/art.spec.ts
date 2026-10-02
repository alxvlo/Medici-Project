import { test, expect } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { seedSave, startLevel, throughOrder, poseButton } from "./helpers";

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
  const stage = await box(page.locator(".stage"));
  const logo = await box(page.locator('[data-asset="logo"]'));
  expect(inside(logo, stage), "logo is outside the stage").toBe(true);
  for (const name of ["Start", "Select Level", "Settings"]) {
    const b = await box(page.getByRole("button", { name }));
    expect(overlaps(logo, b), `${name} overlaps the logo`).toBe(false);
    expect(inside(b, stage), `${name} is outside the stage`).toBe(true);
  }
});

test("the game is named after its logo: tab title and logo text say Rad Arcade", async ({
  page,
}) => {
  await seedSave(page);
  await page.goto("/");
  await expect(page).toHaveTitle("Rad Arcade");
  await expect(page.getByRole("img", { name: "Rad Arcade" })).toBeVisible();
});

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
  expect(inside(panel, await box(page.locator(".stage")))).toBe(true);
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
  expect(inside(panel, await box(page.locator(".stage")))).toBe(true);
  const cont = dialog.getByRole("button", { name: "Continue" });
  await cont.scrollIntoViewIfNeeded();
  expect(inside(await box(cont), panel)).toBe(true);
});
