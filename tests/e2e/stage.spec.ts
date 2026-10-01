import { test, expect } from '@playwright/test'

test('the stage is letterboxed at 3:2 and centred', async ({ page }) => {
  await page.goto('/')
  const box = (await page.getByTestId('stage').boundingBox())!
  const vp = page.viewportSize()!
  expect(box.width / box.height).toBeCloseTo(1.5, 2)
  expect(Math.min(vp.width - box.width, vp.height - box.height)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.x - (vp.width - box.width) / 2)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.y - (vp.height - box.height) / 2)).toBeLessThanOrEqual(1)
})

test('portrait asks the player to rotate', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 })
  await page.goto('/')
  await expect(page.getByText('Turn your device sideways to play.')).toBeVisible()
})

test('landscape does not', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Turn your device sideways to play.')).toBeHidden()
})
