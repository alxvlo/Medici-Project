import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { seedSave, startLevel } from "./helpers";

/**
 * Waits for an idle moment, clicks the button labelled `label` from inside the page, waits `frames` animation frames, then reports whether
 * that same button is still in the DOM: its computed pointer-events if so (inherited from the exiting screen),
 * null if it is gone. Measuring in-page keeps Playwright's own round trips out of a window a few frames wide.
 */
const afterClick = (page: Page, label: string, frames: number) =>
  page.evaluate(
    async ([text, n]) => {
      // A long task at page load can swallow the whole fade; click only once the main thread is idle.
      await new Promise((r) => requestIdleCallback(r));
      const button = [...document.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === text,
      );
      if (!button) throw new Error(`no button "${text}"`);
      button.click();
      for (let i = 0; i < (n as number); i++)
        await new Promise((r) => requestAnimationFrame(r));
      return button.isConnected ? getComputedStyle(button).pointerEvents : null;
    },
    [label, frames] as const,
  );

test("the outgoing screen exits first, inert, then the next screen appears", async ({
  page,
}) => {
  await seedSave(page);
  await page.goto("/");
  expect(await afterClick(page, "Select Level", 2)).toBe("none");
  await expect(page.locator(".level-select")).toBeVisible();
  await expect(page.getByRole("button", { name: "Select Level" })).toHaveCount(
    0,
  );
});

test("the outgoing stage exits first, inert, then the next stage appears", async ({
  page,
}) => {
  await startLevel(page, 1);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Dock the order" }).waitFor();
  await page.waitForTimeout(500); // past the stage's 300 ms input guard
  expect(await afterClick(page, "Dock the order", 2)).toBe("none");
  await expect(page.locator("button.pose:visible")).not.toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Dock the order" }),
  ).toHaveCount(0);
});

test("with reduced motion the outgoing screen is gone almost at once", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedSave(page);
  await page.goto("/");
  expect(await afterClick(page, "Select Level", 5)).toBeNull();
  await expect(page.locator(".level-select")).toBeVisible();
});
