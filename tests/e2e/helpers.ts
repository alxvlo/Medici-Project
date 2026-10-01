import { expect } from '@playwright/test'
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

export async function setTechnique(page: Page, kvp: number, mas: number) {
  await page.getByLabel('kVp', { exact: true }).fill(String(kvp))
  await page.getByLabel('mAs', { exact: true }).fill(String(mas))
  await page.getByRole('button', { name: 'Confirm' }).click()
}

export async function collimate(page: Page, w = 60, h = 70) {
  await page.getByLabel('Width', { exact: true }).fill(String(w))
  await page.getByLabel('Height', { exact: true }).fill(String(h))
  await page.getByRole('button', { name: 'Set collimation' }).click()
}

/** Holds the exposure button until it fires. Pass `clock` when the test installed a fake clock. */
export async function expose(page: Page, clock = false) {
  await page.getByRole('button', { name: 'Hold to expose' }).hover()
  await page.mouse.down()
  if (clock) await page.clock.runFor(2_000)
  await expect(page.getByRole('status')).toHaveText(/Exposure taken/, { timeout: 5_000 })
  await page.mouse.up()
}

/** Plays level 1, right at every step unless told otherwise. */
export async function playL1(page: Page, o: { pose?: string; kvp?: number; mas?: number } = {}) {
  await throughOrder(page)
  await poseButton(page, o.pose ?? 'pose-chest-pa').click()
  if (o.pose && o.pose !== 'pose-chest-pa') await page.getByRole('button', { name: 'Continue' }).click()
  await setTechnique(page, o.kvp ?? 125, o.mas ?? 4)
  await collimate(page)
  await expose(page)
}
