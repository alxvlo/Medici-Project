import { test, expect } from '@playwright/test'
import { startLevel, throughOrder, poseButton, stageOf } from './helpers'

test('intake shows the patient and "Awaiting client" for the missing line', async ({ page }) => {
  await startLevel(page, 1)
  await expect(page.locator('[data-asset="patient-old-man"]')).toBeVisible()
  await expect(page.getByText('Awaiting client')).toBeVisible()
})

test('the order card carries every patient field and no findings', async ({ page }) => {
  await startLevel(page, 1)
  await page.getByRole('button', { name: 'Continue' }).click()
  const card = page.getByRole('complementary', { name: "Doctor's order" })
  for (const value of ['Fernando R. Castillo', '70/Male', 'Hypersthenic', '09-May-1956', '050956-70418',
    '01-September-2026 1045H', 'Increasing shortness of breath', 'Recently diagnosed with colon cancer',
    'Chest X-ray', 'PA, Lateral', 'Perform PA'])
    await expect(card).toContainText(value)
  await expect(page.getByText('Large volume left-sided pleural effusion')).toHaveCount(0)
})

test('pose thumbnails carry no text label during play', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await expect(page.locator('.poses')).not.toContainText(/chest/i)
})

test('a correct pose advances with no popup', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'technique')
})

test('a wrong pose explains, reveals the correct pose, and offers no retry', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-ap').click()
  const dialog = page.getByRole('dialog', { name: 'Wrong position' })
  await expect(dialog).toContainText('Awaiting client') // the "why" sentence is a §12 gap
  await expect(dialog.locator('[data-asset="pose-chest-pa"]')).toBeVisible()
  await expect(dialog.getByRole('button')).toHaveCount(1) // Continue, and nothing to pick again
  await dialog.getByRole('button', { name: 'Continue' }).click()
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'technique')
})

test('a wrong pose shakes for 400 ms before the explanation appears', async ({ page }) => {
  await page.clock.install()
  await startLevel(page, 1)
  await throughOrder(page)
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'position')
  // Freeze time a second into the stage, past any input guard, so the 400 ms is ours to step through.
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 1000)
  await poseButton(page, 'pose-chest-ap').click()
  const dialog = page.getByRole('dialog', { name: 'Wrong position' })
  await expect(dialog).toHaveCount(0)
  await page.clock.runFor(399)
  await expect(dialog).toHaveCount(0)
  await page.clock.runFor(1)
  await expect(dialog).toBeVisible()
})

test('a double click on a stage button advances exactly one stage', async ({ page }) => {
  await startLevel(page, 1)
  await page.getByRole('button', { name: 'Continue' }).dblclick()
  await expect(page.getByRole('button', { name: 'Dock the order' })).toBeVisible()
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'order')
})

test('the position timer running out is scored as a wrong position', async ({ page }) => {
  await page.clock.install()
  await startLevel(page, 1)
  await throughOrder(page)
  await page.clock.runFor(61_000)
  await expect(page.getByRole('dialog', { name: 'Wrong position' })).toContainText("Time's up")
})

test('on touch, a long-press previews a pose without choosing it', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch gesture')
  await startLevel(page, 1)
  await throughOrder(page)
  const pose = poseButton(page, 'pose-chest-pa') // the correct pose: a commit would move the case on to technique
  await pose.dispatchEvent('pointerdown', { pointerType: 'touch' })
  await expect(page.getByTestId('pose-preview')).toBeVisible()
  await pose.dispatchEvent('pointerup', { pointerType: 'touch' })
  await pose.dispatchEvent('click')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'position')
})

test('on touch, a quick tap chooses the pose', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch gesture')
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').tap()
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'technique')
})

test('the docked order card is readable: at least 14px', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  const card = page.getByRole('complementary', { name: "Doctor's order" })
  const size = await card.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  expect(size).toBeGreaterThanOrEqual(14)
})

test('on touch, a cancelled press never shows the preview', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch gesture')
  await page.clock.install()
  await startLevel(page, 1)
  await throughOrder(page)
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 1000)
  const pose = poseButton(page, 'pose-chest-pa')
  await pose.dispatchEvent('pointerdown', { pointerType: 'touch' })
  await page.clock.runFor(200)
  await pose.dispatchEvent('pointercancel', { pointerType: 'touch' }) // the browser took the gesture (a scroll, say)
  await page.clock.runFor(500)
  await expect(page.getByTestId('pose-preview')).toHaveCount(0)
})
