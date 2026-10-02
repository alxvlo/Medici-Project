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
