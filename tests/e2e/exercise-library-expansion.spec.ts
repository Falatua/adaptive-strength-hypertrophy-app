import { expect, test } from '@playwright/test'

async function enterCleanProfile(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /Quick Start/ }).click()
  await expect(page.getByRole('heading', { name: 'Your next useful win.' })).toBeVisible()
}

test('finds leg press in the expanded library and replaces a squat through full-library browse', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterCleanProfile(page)

  await page.getByRole('button', { name: 'Library', exact: true }).click()
  const librarySearch = page.getByPlaceholder('Search a movement or its other names...')
  await librarySearch.fill('leg press')
  await expect(page.getByRole('heading', { name: '45-Degree Leg Press' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Horizontal Leg Press' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Single-Leg Press' })).toBeVisible()

  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.evaluate(() => {
    const key = 'forgepath-private-alpha-v1'
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{}')
    const planned = persisted.state.sessions.find((session: { status: string }) => session.status === 'planned')
    planned.exercises[0].exerciseId = 'competition-squat'
    planned.exercises[0].purpose = 'Main lift'
    localStorage.setItem(key, JSON.stringify(persisted))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  await expect(page.locator('.exercise-card').first()).toContainText('Competition Back Squat')
  await page.getByRole('button', { name: 'Change' }).first().click()
  await page.getByRole('button', { name: /Browse full library/ }).click()
  await page.getByLabel('Search replacement library').fill('leg press')
  await expect(page.getByRole('button', { name: /45-Degree Leg Press/ })).toBeVisible()
  await page.getByRole('button', { name: /45-Degree Leg Press/ }).click()
  await expect(page.getByRole('alert')).toContainText('Confirm the protected-primary tradeoff')
  await page.getByRole('checkbox', { name: 'Confirm main-lift change' }).check()
  await page.getByRole('button', { name: /45-Degree Leg Press/ }).click()
  await expect(page.locator('.exercise-card').first()).toContainText('45-Degree Leg Press')
  await expect(page.locator('.exercise-card').first()).toContainText('Baseline calibration')
  await expect(page.locator('.exercise-card').first()).toContainText("The replaced movement's load was not copied")

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.version).toBe(24)
  expect(persisted.state.exercises).toHaveLength(242)
  expect(persisted.state.substitutionEvents.at(-1)).toMatchObject({ originalExerciseId: 'competition-squat', selectedExerciseId: 'leg-press-45' })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.getByLabel('45-Degree Leg Press movement notebook').screenshot({ path: 'output/playwright/leg-press-substitution-mobile.png' })
  expect(browserErrors).toEqual([])
})
