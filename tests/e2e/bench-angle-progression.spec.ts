import { expect, test } from '@playwright/test'

test('tracks an incline angle ladder without mixing setup-specific progress', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /Quick Start/ }).click()
  await page.evaluate(() => {
    const key = 'forgepath-private-alpha-v1'
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{}')
    const planned = persisted.state.sessions.find((session: { status: string }) => session.status === 'planned')
    planned.exercises[0].exerciseId = 'incline-db-press'
    planned.exercises[0].purpose = 'Angle-aware incline progression'
    localStorage.setItem(key, JSON.stringify(persisted))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  const incline = page.locator('.exercise-card').first()
  await expect(incline).toContainText('Incline Dumbbell Press')
  await incline.getByText('Bench angle', { exact: true }).click()
  await incline.getByRole('button', { name: 'High → low' }).click()
  await expect(incline.getByLabel('Set 1 bench angle in degrees')).toHaveValue('45')
  await expect(incline.getByLabel('Set 2 bench angle in degrees')).toHaveValue('30')
  await expect(incline.getByLabel('Set 3 bench angle in degrees')).toHaveValue('15')
  await incline.getByLabel('Set 2 bench angle in degrees').fill('33')
  await expect(incline).toContainText('45° → 33° → 15°')

  for (let remaining = await incline.getByRole('button', { name: 'Log set' }).count(); remaining > 0; remaining = await incline.getByRole('button', { name: 'Log set' }).count()) {
    await incline.getByRole('button', { name: 'Log set' }).first().click()
  }
  await page.getByRole('button', { name: 'Finish workout' }).click()
  await page.getByRole('button', { name: 'Finish workout without survey' }).click()
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByPlaceholder('Search a movement or its other names...').fill('Incline Dumbbell Press')
  await page.getByRole('button', { name: 'View details for Incline Dumbbell Press' }).click()
  await expect(page.getByRole('heading', { name: 'Progress by bench angle' })).toBeVisible()
  await expect(page.getByText('45° bench', { exact: true })).toBeVisible()
  await expect(page.getByText('33° bench', { exact: true })).toBeVisible()
  await expect(page.getByText('15° bench', { exact: true })).toBeVisible()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.angle-history').screenshot({ path: 'output/playwright/bench-angle-history-mobile.png' })
  expect(browserErrors).toEqual([])
})
