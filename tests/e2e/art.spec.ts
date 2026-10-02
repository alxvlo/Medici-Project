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
