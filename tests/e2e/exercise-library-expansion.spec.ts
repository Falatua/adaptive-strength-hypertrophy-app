import { expect, test } from '@playwright/test'

async function enterCleanProfile(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /Quick Start/ }).click()
  await expect(page.getByRole('heading', { name: 'Your next useful win.' })).toBeVisible()
}

async function expectHealthyImages(page: import('@playwright/test').Page) {
  const images = page.locator('img')
  expect(await images.count()).toBeGreaterThan(0)
  await page.waitForFunction(() => [...document.images].every((image) => image.complete), undefined, { timeout: 5_000 })
  const results = await images.evaluateAll((elements) => elements.map((element) => ({
    src: element.getAttribute('src'), complete: element.complete,
    naturalWidth: element.naturalWidth, naturalHeight: element.naturalHeight
  })))
  expect(results.filter((image) => !image.complete || image.naturalWidth < 1 || image.naturalHeight < 1)).toEqual([])
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
    persisted.state.settings.activeEquipmentProfileId = 'equipment-commercial-gym'
    persisted.state.settings.equipmentLocation = 'Commercial Gym'
    persisted.state.athlete.equipmentProfile = 'Commercial Gym'
    const planned = persisted.state.sessions.find((session: { status: string }) => session.status === 'planned')
    planned.exercises[0].exerciseId = 'competition-squat'
    planned.exercises[0].purpose = 'Main lift'
    planned.exercises = planned.exercises.filter((exercise: { exerciseId: string }) => exercise.exerciseId !== 'squat-press')
    localStorage.setItem(key, JSON.stringify(persisted))
  })
  await page.reload()
  const trainingBlockBeforeSwap = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state.mesocycles))
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  await expect(page.locator('.exercise-card').first()).toContainText('Competition Back Squat')
  await page.getByRole('button', { name: 'Change' }).first().click()
  await expect(page.getByText('Scope: this workout only')).toBeVisible()
  await expect(page.getByText('Competition Back Squat stays in your training block.')).toBeVisible()
  await page.getByRole('button', { name: /Browse full library/ }).click()
  await page.getByLabel('Search replacement library').fill('leg press')
  await expect(page.getByRole('button', { name: /45-Degree Leg Press/ })).toBeVisible()
  await page.getByRole('button', { name: /45-Degree Leg Press/ }).click()
  await expect(page.getByText('Competition Back Squat', { exact: true }).last()).toBeVisible()
  await expect(page.getByText('45-Degree Leg Press', { exact: true }).last()).toBeVisible()
  await page.getByRole('checkbox', { name: 'Confirm main-lift change' }).check()
  await page.getByRole('button', { name: 'Change this workout only' }).click()
  await expect(page.locator('.exercise-card').first()).toContainText('45-Degree Leg Press')
  await expect(page.locator('.exercise-card').first()).toContainText('Baseline calibration')
  await expect(page.locator('.exercise-card').first()).toContainText("The replaced movement's load was not copied")

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.version).toBe(33)
  expect(persisted.state.exercises).toHaveLength(251)
  expect(persisted.state.substitutionEvents.at(-1)).toMatchObject({ originalExerciseId: 'competition-squat', selectedExerciseId: 'leg-press-45' })
  expect(JSON.stringify(persisted.state.mesocycles)).toBe(trainingBlockBeforeSwap)
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.getByLabel('45-Degree Leg Press movement notebook').screenshot({ path: 'output/playwright/leg-press-substitution-mobile.png' })
  expect(browserErrors).toEqual([])
})

test('finds the Freak Athlete home-gym movements and offers ABX angle presets', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterCleanProfile(page)

  await page.getByRole('button', { name: 'Library', exact: true }).click()
  const librarySearch = page.getByPlaceholder('Search a movement or its other names...')
  await librarySearch.fill('Freak Athlete ABX')
  await page.getByRole('button', { name: 'View details for ABX Chest-Supported Dumbbell Row' }).click()
  await page.getByRole('button', { name: 'Enter past sets' }).click()
  await expect(page.getByLabel('ABX back-pad presets')).toBeVisible()
  await page.getByRole('button', { name: '37°' }).click()
  await expect(page.getByLabel('Past performance bench angle')).toHaveValue('37')
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByLabel('ABX back-pad presets').scrollIntoViewIfNeeded()
    await page.getByLabel('ABX back-pad presets').locator('..').screenshot({ path: 'output/playwright/abx-history-presets-mobile.png' })
  }

  await page.getByRole('button', { name: 'Close ABX Chest-Supported Dumbbell Row', exact: true }).click()
  await librarySearch.fill('Freak Athlete Leg Developer')
  await expect(page.getByRole('heading', { name: 'Leg Extension', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Lying Leg Curl', exact: true })).toBeVisible()

  await librarySearch.fill('Cybex Squat Press')
  await expect(page.getByRole('heading', { name: 'Squat Press', exact: true })).toBeVisible()
  await librarySearch.fill('Freak Athlete ABX Cambered Row')
  await page.getByRole('button', { name: 'View details for ABX Cambered-Bar Chest-Supported Row' }).click()
  await page.getByRole('button', { name: 'Enter past sets' }).click()
  await expect(page.getByLabel('ABX back-pad presets')).toBeVisible()
  await page.getByRole('button', { name: 'Close ABX Cambered-Bar Chest-Supported Row', exact: true }).click()

  await librarySearch.fill('Cambered Bar Bench Press')
  await page.getByRole('button', { name: 'View details for Cambered Bar Bench Press' }).click()
  await page.getByRole('button', { name: 'Enter past sets' }).click()
  await expect(page.getByLabel('ABX back-pad presets')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close Cambered Bar Bench Press', exact: true }).click()

  await librarySearch.fill('red band pull apart')
  await expect(page.getByRole('heading', { name: 'Red-Band Pull-Apart', exact: true })).toBeVisible()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('uses the generated ForgePath destination and movement-family icon system', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterCleanProfile(page)

  const destinations = ['today', 'plan', 'progress', 'library', 'you']
  for (const destination of destinations) {
    await expect(page.locator(`.bottom-nav img[src*="/icons/navigation/${destination}.png"]`)).toHaveCount(1)
  }
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.bottom-nav').screenshot({ path: 'output/playwright/generated-bottom-navigation-mobile.png' })

  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await expect(page.locator('.library-categories img[src*="/icons/body-regions/all.png"]')).toBeVisible()
  await expect(page.locator('.library-categories').getByText('My preferences').locator('..').locator('svg.lucide-thumbs-up')).toBeVisible()
  await page.getByRole('button', { name: 'Body part' }).click()
  await expect(page.locator('.filter-chips img[src*="/icons/body-regions/"]')).toHaveCount(13)
  for (const region of ['all', 'chest', 'back', 'traps', 'shoulders', 'quadriceps', 'hamstrings', 'glutes', 'biceps', 'triceps', 'forearms', 'calves', 'trunk']) {
    await expect(page.locator(`.filter-chips img[src*="/icons/body-regions/${region}.png"]`)).toHaveCount(1)
  }
  await page.getByRole('button', { name: 'Traps', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Barbell Shrug', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dumbbell Shrug', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Chest-Supported Dumbbell Shrug', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Prone Trap Raise', exact: true })).toBeVisible()
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.library-browser').screenshot({ path: 'output/playwright/traps-library-mobile.png' })
  const movementArt = page.locator('.exercise-grid .movement-art img[src*="/icons/movements/"]')
  await expect(movementArt.first()).toBeVisible()
  expect(await movementArt.count()).toBeGreaterThan(10)
  await expect(movementArt.first()).toHaveAttribute('alt', '')
  await expect(movementArt.first().locator('..')).toHaveAttribute('role', 'img')
  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('.library-categories').screenshot({ path: 'output/playwright/library-body-preferences-mobile.png' })
    await page.locator('.filter-stack').screenshot({ path: 'output/playwright/body-region-filters-mobile.png' })
    await page.locator('.exercise-grid').screenshot({ path: 'output/playwright/generated-library-movements-mobile.png' })
  }

  await page.getByLabel('Body part and weak point filter').getByRole('button', { name: 'All', exact: true }).click()

  const librarySearch = page.getByPlaceholder('Search a movement or its other names...')
  for (const [movement, asset] of [
    ['Push-Up', 'push-up'], ['Weighted Dip', 'dip'], ['Reverse Pec Deck', 'rear-delt-fly'],
    ['45-Degree Back Extension', 'back-extension'], ['Kettlebell Swing', 'kettlebell-swing'],
    ['Smith Machine Split Squat', 'split-squat'], ['Walking Lunge', 'lunge'], ['Dumbbell Step-Up', 'step-up'],
    ['Hack Squat', 'hack-squat'], ['Seated Hip Abduction', 'hip-abduction'], ['Hip Adduction Machine', 'hip-adduction'],
    ['Nordic Hamstring Curl', 'nordic-curl'], ['Pull-Up', 'pull-up'], ['Dumbbell Pullover', 'pullover'],
    ['Cable Upright Row', 'upright-row'], ['Cable Face Pull', 'face-pull'], ['Barbell Shrug', 'shrug'],
    ['Sled Push', 'sled-push'], ['Seated Calf Raise', 'seated-calf'], ['Tibialis Raise', 'tibialis-raise']
  ] as const) {
    await librarySearch.fill(movement)
    const card = page.getByRole('heading', { name: movement, exact: true }).locator('..')
    await expect(card.locator(`img[src*="/icons/movements/${asset}.png"]`), movement).toBeVisible()
  }
  await expectHealthyImages(page)

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('loads image art cleanly through onboarding and every primary destination', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(page.locator('img[src*="/athlete-forms/apprentice.png"]')).toBeVisible()
  await expectHealthyImages(page)
  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('button', { name: /Continue/ }).click()
  await expect(page.locator('.onboarding-equipment img[src*="/locations/"]')).toHaveCount(3)
  await expectHealthyImages(page)
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.onboarding-equipment').screenshot({ path: 'output/playwright/onboarding-location-art-mobile.png' })

  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /Quick Start/ }).click()
  for (const [destination, heading] of [
    ['Today', 'Your next useful win.'], ['Plan', 'The plan bends. The goal stays visible.'],
    ['Progress', 'Your training, made legible.'], ['Library', 'Find it. Rate it. Train it.'],
    ['You', 'The app learns. You stay in charge.']
  ] as const) {
    await page.getByRole('button', { name: destination, exact: true }).click()
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expectHealthyImages(page)
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
    expect(dimensions.scrollWidth, destination).toBeLessThanOrEqual(dimensions.clientWidth)
  }
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
