import type { Page } from '@playwright/test'

export const SAVE_KEY = 'medici.save.v1'

/** Seeds a save before the app loads, only if none exists, so a reload keeps what the game wrote. */
export async function seedSave(page: Page, save: Record<string, unknown> = {}) {
  const value = JSON.stringify({ version: 1, unlocked: 1, stars: {}, settings: { sound: false }, ...save })
  await page.addInitScript(([key, v]) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, v)
  }, [SAVE_KEY, value] as const)
}

/** Seeds a save with `id` unlocked and presses Start, which opens the highest unlocked level. */
export async function startLevel(page: Page, id = 1) {
  await seedSave(page, { unlocked: id })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()
}

export async function throughOrder(page: Page) {
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Dock the order' }).click()
}

export const poseButton = (page: Page, imageId: string) => page.locator(`button.pose:has([data-asset="${imageId}"])`)
export const stageOf = (page: Page) => page.locator('[data-stage]')
