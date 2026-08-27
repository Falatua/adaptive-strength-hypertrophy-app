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
  expect(persisted.version).toBe(25)
  expect(persisted.state.exercises).toHaveLength(242)
  expect(persisted.state.substitutionEvents.at(-1)).toMatchObject({ originalExerciseId: 'competition-squat', selectedExerciseId: 'leg-press-45' })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.getByLabel('45-Degree Leg Press movement notebook').screenshot({ path: 'output/playwright/leg-press-substitution-mobile.png' })
  expect(browserErrors).toEqual([])
})

test('seeds exact incline performance from the movement Library without inventing missing evidence', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') browserErrors.push(`${message.type()}: ${message.text()}`) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterCleanProfile(page)

  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByPlaceholder('Search a movement or its other names...').fill('Incline Barbell Bench Press')
  await page.getByRole('button', { name: 'View details for Incline Barbell Bench Press' }).click()
  await expect(page.getByRole('heading', { name: 'Add a past performance' })).toBeVisible()
  await page.getByRole('button', { name: 'Enter past sets' }).click()

  const historicalDate = await page.evaluate(() => {
    const date = new Date(Date.now() - 86_400_000)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
  })
  await page.getByLabel('Past performance date').fill(historicalDate)
  await page.getByLabel('Past performance sets').fill('3')
  await page.getByLabel('Past performance repetitions').fill('8')
  await page.getByLabel('Past performance weight', { exact: true }).fill('135')
  await page.getByLabel('Past performance effort value').fill('0')
  await page.getByLabel('Past performance bench angle').fill('45')
  await page.getByLabel('Past performance session name').fill('Upper day')
  await page.getByLabel('Past performance note').fill('Same bench and grip across every set.')
  await expect(page.locator('.history-entry-preview')).toContainText('3 × 8 at 135 lb')
  await expect(page.locator('.history-entry-preview')).toContainText('45° bench')
  await expect(page.locator('.history-entry-preview')).toContainText('RIR 0')
  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('.history-entry-panel').evaluate((panel) => panel.scrollIntoView({ block: 'start' }))
    await page.screenshot({ path: 'output/playwright/library-history-entry-form-mobile.png' })
  }
  await page.getByRole('button', { name: 'Add 3 past sets' }).click()

  await expect(page.getByText('Athlete-entered history · Upper day · Same bench and grip across every set.')).toHaveCount(3)
  await expect(page.getByText('quality not confirmed')).toHaveCount(3)
  await expect(page.getByText('3 past Incline Barbell Bench Press sets added from the Library.')).toBeVisible()

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state)
  const inclineSets = saved.history.filter((workSet: { exerciseId: string }) => workSet.exerciseId === 'incline-barbell-press')
  expect(inclineSets).toHaveLength(3)
  expect(inclineSets[0]).toMatchObject({ load: 135, reps: 8, rir: 0, rirKnown: true, benchAngleDeg: 45, qualityConfirmed: false, numbersEntered: true, historyEntrySource: 'library', historyEntryEffortScale: 'rir', historyEntryEffortValue: 0 })
  expect(saved.historyMutations.at(-1)).toMatchObject({ type: 'history-entered', affectedSetIds: expect.any(Array) })
  expect(saved.records.length).toBeGreaterThan(0)

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.getByRole('dialog').screenshot({ path: 'output/playwright/library-history-entry-mobile.png' })
  expect(browserErrors).toEqual([])
})
