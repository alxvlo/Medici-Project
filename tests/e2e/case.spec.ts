import { test, expect } from '@playwright/test'
import { startLevel, throughOrder, poseButton, stageOf, setTechnique, collimate, expose, playL1 } from './helpers'

const film = (page: import('@playwright/test').Page) => page.locator('[data-asset^="xray-"]')

test('a clean case: the good film only after the exposure, 3 stars, no ✗, and L2 unlocked across a reload', async ({ page }) => {
  await startLevel(page, 1)
  await playL1(page)
  await expect(page.locator('[data-asset="xray-pulmonaryedema-good"]')).toBeVisible()
  await expect(page.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  await expect(page.locator('tr.bad')).toHaveCount(0)
  // Four scored decisions (spec §6); the film row is a plain report, never marked or counted (spec §4.5).
  await expect(page.locator('tr.ok')).toHaveCount(4)
  await expect(page.locator('tr', { hasText: 'Film' })).not.toContainText(/[✓✗]/)
  await expect(page.getByText('Awaiting client')).toHaveCount(1) // level 1's technique note is a §12 gap
  await expect(page.getByText('Large volume left-sided pleural effusion')).toBeVisible()
  await page.getByRole('button', { name: 'Level select' }).click()
  await expect(page.getByRole('button', { name: 'Level 2: Pneumothorax' })).toBeEnabled()
  await page.reload()
  await page.getByRole('button', { name: 'Select Level' }).click()
  await expect(page.getByRole('button', { name: 'Level 2: Pneumothorax' })).toBeEnabled()
})

test('film and findings stay sealed until the results screen', async ({ page }) => {
  await startLevel(page, 1)
  const sealed = async () => {
    await expect(film(page)).toHaveCount(0)
    await expect(page.getByText('Large volume left-sided pleural effusion')).toHaveCount(0)
  }
  await sealed()
  await throughOrder(page)
  await sealed()
  await poseButton(page, 'pose-chest-pa').click()
  await sealed()
  await setTechnique(page, 100, 4)
  await sealed()
  await collimate(page)
  await sealed()
  await expose(page)
  await expect(film(page)).toHaveCount(1)
})

test('a level with no findings omits the findings section', async ({ page }) => {
  await startLevel(page, 4)
  await throughOrder(page)
  await poseButton(page, 'pose-hand-pa').click()
  await setTechnique(page, 60, 4)
  await collimate(page)
  await expose(page)
  await expect(page.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
  await expect(page.getByText("Radiologist's findings")).toHaveCount(0)
})

test('a wrong position still yields the good film, with 2 stars and one ✗', async ({ page }) => {
  await startLevel(page, 1)
  await playL1(page, { pose: 'pose-chest-ap' })
  await expect(page.locator('[data-asset="xray-pulmonaryedema-good"]')).toBeVisible()
  await expect(page.getByRole('img', { name: '2 of 3 stars' })).toBeVisible()
  await expect(page.locator('tr.bad')).toHaveCount(1)
})

test('a low kVp shakes the console and says nothing; the film is underexposed and the debrief names 125', async ({ page }) => {
  await page.clock.install()
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await page.getByLabel('kVp', { exact: true }).fill('100')
  await page.getByLabel('mAs', { exact: true }).fill('4')
  // Freeze time a second into the stage, past the input guard, so the 400 ms shake holds while we look.
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 1000)
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.locator('.dial.wrong')).toHaveCount(1)
  await expect(page.locator('.dial.wrong')).toContainText('kVp')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.technique')).not.toContainText(/correct|125/)
  await expect(film(page)).toHaveCount(0)
  await page.clock.resume()
  await collimate(page)
  await expose(page)
  await expect(page.locator('[data-asset="xray-pulmonaryedema-under"]')).toBeVisible()
  await expect(page.locator('tr.bad', { hasText: 'kVp' })).toContainText('set 100 · correct 125')
  await expect(page.locator('tr.bad')).toHaveCount(1) // the underexposed film is not a second ✗ (spec §4.5)
})

test('three failed collimations then a good one cost one mistake, not three', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await setTechnique(page, 125, 4)
  for (let i = 0; i < 3; i++) await collimate(page, 100, 100)
  await collimate(page)
  await expose(page)
  await expect(page.getByRole('img', { name: '2 of 3 stars' })).toBeVisible()
  await expect(page.locator('tr.bad')).toHaveCount(1)
})

test('the position timer running out costs exactly one mistake', async ({ page }) => {
  await page.clock.install()
  await startLevel(page, 1)
  await throughOrder(page)
  await page.clock.runFor(61_000)
  await page.getByRole('button', { name: 'Continue' }).click()
  await setTechnique(page, 125, 4)
  await collimate(page)
  await expose(page, true)
  await expect(page.getByRole('img', { name: '2 of 3 stars' })).toBeVisible()
  await expect(page.locator('tr.bad')).toHaveCount(1)
})

test('the technique timer submits the dials as they stand', async ({ page }) => {
  await page.clock.install()
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await page.getByLabel('kVp', { exact: true }).fill('125')
  await page.getByLabel('mAs', { exact: true }).fill('4')
  await page.clock.runFor(46_000)
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'collimate')
  await collimate(page)
  await expose(page, true)
  await expect(page.getByRole('img', { name: '3 of 3 stars' })).toBeVisible()
})

test('a double click on Confirm advances once, and its second click never reaches collimation', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await page.getByLabel('kVp', { exact: true }).fill('125')
  await page.getByLabel('mAs', { exact: true }).fill('4')
  await page.getByRole('button', { name: 'Confirm' }).dblclick()
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'collimate')
  await expect(page.locator('.collim-view.wrong')).toHaveCount(0)
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('100')
  await expect(page.getByLabel('Height', { exact: true })).toHaveValue('100')
  await collimate(page)
  await expose(page)
  await expect(page.getByRole('img', { name: '3 of 3 stars' })).toBeVisible() // no stray collimation mistake
})

test('sliding off the exposure button during prep aborts and never fires', async ({ page }) => {
  await startLevel(page, 1)
  await throughOrder(page)
  await poseButton(page, 'pose-chest-pa').click()
  await setTechnique(page, 125, 4)
  await collimate(page)
  await page.getByRole('button', { name: 'Hold to expose' }).hover()
  await page.mouse.down()
  await page.mouse.move(5, 5)
  await expect(page.getByRole('status')).toHaveText(/Released too early/)
  await page.waitForTimeout(2_000) // longer than the 1.5 s prep: the exposure must not fire anyway
  await page.mouse.up()
  await expect(stageOf(page)).toHaveAttribute('data-stage', 'expose')
  await expect(film(page)).toHaveCount(0)
})
