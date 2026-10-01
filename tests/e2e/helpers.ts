import type { Page } from '@playwright/test'

export const SAVE_KEY = 'medici.save.v1'

/** Seeds a save before the app loads, only if none exists, so a reload keeps what the game wrote. */
export async function seedSave(page: Page, save: Record<string, unknown> = {}) {
  const value = JSON.stringify({ version: 1, unlocked: 1, stars: {}, settings: { sound: false }, ...save })
  await page.addInitScript(([key, v]) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, v)
  }, [SAVE_KEY, value] as const)
}
