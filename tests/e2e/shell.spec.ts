import { test, expect } from '@playwright/test'
import { seedSave } from './helpers'

test('title offers Start, Select Level, and Settings', async ({ page }) => {
  await seedSave(page)
  await page.goto('/')
  for (const name of ['Start', 'Select Level', 'Settings']) await expect(page.getByRole('button', { name })).toBeVisible()
  await expect(page.locator('.placeholder')).toHaveCount(0)
})

test('level select: L1 open, the rest locked, six sections, only Chest expanded', async ({ page }) => {
  await seedSave(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Select Level' }).click()
  await expect(page.locator('section')).toHaveCount(6)
  for (const t of ['Chest', 'Upper extremity', 'Lower extremity', 'Abdomen', 'Skull', 'Refresher'])
    await expect(page.getByRole('heading', { name: new RegExp(`^${t}`) })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Level 1: Pulmonary edema' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Level 2: Pneumothorax (locked)' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Level 3: Scimitar syndrome (PAPVR) (locked)' })).toBeDisabled()
  await expect(page.getByRole('button', { name: /^Level 4:/ })).toHaveCount(0) // Upper extremity collapsed
  await expect(page.locator('.placeholder')).toHaveCount(0)
})

test('the card list scrolls to level 20 without the stage moving', async ({ page }) => {
  await seedSave(page, { unlocked: 20 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Select Level' }).click()
  const stage = page.getByTestId('stage')
  const before = await stage.boundingBox()
  await page.getByTestId('card-list').hover()
  await page.mouse.wheel(0, 4000)
  await expect(page.getByRole('button', { name: 'Level 20: Skull fracture' })).toBeInViewport()
  expect(await stage.boundingBox()).toEqual(before)
  expect(await stage.evaluate((el) => el.scrollTop)).toBe(0)
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0)
})

test('settings has exactly sound and reset progress, and no timer or hint toggle', async ({ page }) => {
  await seedSave(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings' }).click()
  const dialog = page.getByRole('dialog', { name: 'Settings' })
  await expect(dialog.getByRole('checkbox')).toHaveCount(1)
  await expect(dialog.getByRole('checkbox', { name: 'Sound' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Reset progress' })).toBeVisible()
  await expect(dialog.getByText(/timer|hint/i)).toHaveCount(0)
})

test('reset progress asks first, then relocks everything', async ({ page }) => {
  await seedSave(page, { unlocked: 5 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Reset progress' }).click()
  await page.getByRole('button', { name: 'Yes, reset' }).click()
  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Select Level' }).click()
  await expect(page.getByRole('button', { name: 'Level 2: Pneumothorax (locked)' })).toBeDisabled()
})
