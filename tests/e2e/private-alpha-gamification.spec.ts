import { expect, test, type Page } from '@playwright/test'
import { history as establishedHistory, mesocycles as establishedMesocycles, records as establishedRecords, sessions as establishedSessions } from '../../src/domain/seed'

// Finishing now surfaces a review whenever work is unlogged or missing the athlete's numbers.
// These journeys deliberately leave work unlogged, so they acknowledge the review and continue.
async function finishWorkout(page: import('@playwright/test').Page, name: RegExp | string = 'Finish workout') {
  await page.getByRole('button', { name }).click()
  const confirm = page.getByRole('button', { name: 'Finish anyway' })
  if (await confirm.isVisible().catch(() => false)) await confirm.click()
}


async function enterRecommendedProfile(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  // The product now starts genuinely blank. Most scenarios in this file intentionally exercise an
  // established athlete, so load that test-only history before onboarding instead of leaking demo
  // records into every real first run.
  await page.evaluate(({ history, mesocycles, records, sessions }) => {
    const key = 'forgepath-private-alpha-v1'
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{"state":{}}')
    persisted.state = {
      ...persisted.state,
      history,
      mesocycles,
      records,
      sessions,
      activeMesocycleId: mesocycles[0]?.id ?? null
    }
    localStorage.setItem(key, JSON.stringify(persisted))
  }, { history: establishedHistory, mesocycles: establishedMesocycles, records: establishedRecords, sessions: establishedSessions })
  await page.reload()
  await page.getByRole('button', { name: /Quick Start/ }).click()
  await expect(page.getByRole('heading', { name: 'Your next useful win.' })).toBeVisible()
  await expect(page.locator('.skip-link')).toHaveCSS('top', '-80px')
  const fieldGuide = page.getByLabel('Current training field guide')
  await expect(fieldGuide).toContainText('Finding Your Working Weights')
  await expect(fieldGuide).toContainText(/confidence · \d+ prescribed sets? from the latest exact exposure/)
}

async function enterFirstMovementSetValues(page: import('@playwright/test').Page) {
  const movement = page.locator('.exercise-card').first()
  const firstRow = movement.locator('.set-row').first()
  const loadField = firstRow.locator('input[inputmode="decimal"]')
  const repsField = firstRow.locator('input[inputmode="numeric"]')
  await loadField.fill(String(Number(await loadField.inputValue()) + 1))
  await repsField.fill(String(Number(await repsField.inputValue()) + 1))
  const effortField = firstRow.locator('select')
  const displayedEffort = await effortField.inputValue()
  const alternateEffort = displayedEffort === '2' ? '3' : '2'
  await effortField.selectOption(alternateEffort)
  await effortField.selectOption(displayedEffort)
  const enteredSet = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state
    return state.sessions.find((session: { id: string }) => session.id === state.activeSessionId)?.exercises[0]?.sets[0]
  })
  expect(enteredSet?.entryOrigins).toMatchObject({ load: 'manual', reps: 'manual', rir: 'manual' })
}

// Movement-specific placement questions only unlock once the movement they ask about is finished,
// so every check journey has to enter its first set and log that movement's full set list.
async function completeFirstMovementSets(page: import('@playwright/test').Page) {
  await enterFirstMovementSetValues(page)
  const movement = page.locator('.exercise-card').first()
  const logSets = movement.getByRole('button', { name: 'Log set' })
  // count() does not auto-wait, so the first set has to be on screen before the loop reads it.
  await expect(logSets.first()).toBeVisible()
  for (let remaining = await logSets.count(); remaining > 0; remaining = await logSets.count()) {
    await logSets.first().click()
  }
}


// Progress and You fold their sections by default. Open the one a test reads, by the same words the
// athlete sees on the toggle. Already-open panels expose "Hide ...", so this only clicks closed ones.
const openPanel = async (page: Page, label: string) => {
  const toggle = page.getByRole('button', { name: new RegExp(`^(Show|Hide) ${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first()
  await toggle.waitFor({ state: 'visible' })
  if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click()
}

test('turns the current prescription into an original, evidence-backed field guide', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  const fieldGuide = page.getByLabel('Current training field guide')
  await expect(fieldGuide).toContainText('Field guide')
  await expect(fieldGuide).toContainText('Next win')
  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('.skip-link').evaluate((element) => { (element as HTMLElement).style.display = 'none' })
    await page.locator('.hero-workout').screenshot({ path: 'output/playwright/training-field-guide-mobile.png' })
  }
  await fieldGuide.getByRole('button', { name: 'Why this session?' }).click()
  await expect(page.getByRole('dialog')).toContainText('Finding Your Working Weights route')
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('previews the next workout from Today and the future queue without changing training', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  const stateBefore = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state.sessions))

  await page.getByRole('button', { name: 'Preview workout' }).click()
  const todayPreview = page.getByRole('dialog', { name: /Preview .+/ })
  await expect(todayPreview).toContainText('Planned:')
  await expect(todayPreview).toContainText('Last:')
  await expect(todayPreview).toContainText('Preview only')
  if (testInfo.project.name === 'mobile-chromium') await todayPreview.screenshot({ path: 'output/playwright/workout-preview-mobile.png' })
  await todayPreview.getByRole('button', { name: 'Close preview', exact: true }).click()

  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByRole('button', { name: 'Show the upcoming session queue' }).click()
  await page.locator('.queue-item').nth(1).getByRole('button', { name: 'Preview' }).click()
  const futurePreview = page.getByRole('dialog', { name: /Preview .+/ })
  await expect(futurePreview).toContainText('Planned:')
  await expect(futurePreview).toContainText('Preview only')
  await futurePreview.getByRole('button', { name: 'Close preview', exact: true }).click()

  const stateAfter = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state.sessions))
  expect(stateAfter).toBe(stateBefore)
  expect(browserErrors).toEqual([])
})

test('shows an evidence-backed movement path without a bulk-edit action', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await expect(page.getByLabel('Schedule-aware training momentum')).toContainText('Training momentum')
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  const path = page.locator('.movement-progress-path').first()
  await expect(path).toContainText('ForgePath suggestion')
  await expect(path).toContainText('Last')
  await expect(path).toContainText('Today')
  await expect(path).toContainText('Next')
  await expect(path).toContainText('What earns it')
  await expect(path).toContainText('Load → reps → sets')
  const before = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state.sessions.find((session: { status: string }) => session.status === 'active')))
  await expect(path.getByRole('button', { name: 'Apply to unfinished sets' })).toHaveCount(0)
  await expect(path).toContainText(/Guide only|guidance is paused/)
  const after = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state.sessions.find((session: { status: string }) => session.status === 'active')))
  expect(after).toBe(before)
  if (testInfo.project.name === 'mobile-chromium') await path.screenshot({ path: 'output/playwright/movement-progress-path-mobile.png' })
  expect(browserErrors).toEqual([])
})

test('starts a new workout with every inherited set state cleared', async ({ page }) => {
  await enterRecommendedProfile(page)
  await page.evaluate(() => {
    const key = 'forgepath-private-alpha-v1'
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{}')
    const session = persisted.state.sessions.find((candidate: { status: string }) => candidate.status === 'planned')
    session.exercises.forEach((planned: { sets: Array<Record<string, unknown>> }) => planned.sets.forEach((workSet) => Object.assign(workSet, {
      completed: true,
      skipped: true,
      completedLoad: 999,
      completedReps: 99,
      actualRir: 0,
      valuesEntered: true
    })))
    localStorage.setItem(key, JSON.stringify(persisted))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  const workout = page.getByRole('main')
  await expect(workout.getByRole('button', { name: 'Done' })).toHaveCount(0)
  await expect(workout.getByRole('button', { name: 'Log set' }).first()).toBeVisible()
  const activeSets = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state
    return state.sessions.find((session: { status: string }) => session.status === 'active').exercises.flatMap((planned: { sets: Array<Record<string, unknown>> }) => planned.sets)
  })
  expect(activeSets.every((workSet: Record<string, unknown>) => workSet.completed === false
    && workSet.skipped === undefined
    && workSet.completedLoad === undefined
    && workSet.completedReps === undefined
    && workSet.actualRir === undefined
    && workSet.valuesEntered === undefined)).toBe(true)
})

test('reports scoped records, schedule momentum, round evidence, and the progress ledger', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByLabel('Progress direction and training round report')).toContainText('Schedule-aware momentum')
  await expect(page.getByLabel('Progress direction and training round report')).toContainText('Training round 1 field report')
  await openPanel(page, 'the progress event ledger')
  await expect(page.locator('.progress-event-ledger')).toContainText('Append-only evidence')
  await page.locator('#progress-records').scrollIntoViewIfNeeded()
  await openPanel(page, 'records for this period')
  const scopes = page.getByLabel('Record scope')
  await expect(scopes.getByRole('button')).toHaveCount(5)
  await scopes.getByRole('button', { name: 'current block' }).click()
  await expect(scopes.getByRole('button', { name: 'current block' })).toHaveAttribute('aria-pressed', 'true')
  await scopes.getByRole('button', { name: 'current phase' }).click()
  await expect(scopes.getByRole('button', { name: 'current phase' })).toHaveAttribute('aria-pressed', 'true')
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.progress-operating-grid').screenshot({ path: 'output/playwright/progress-operating-system-mobile.png' })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('logs pull-ups as bodyweight repetitions while preserving separate set completion', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.evaluate(() => {
    const key = 'forgepath-private-alpha-v1'
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{}')
    const session = persisted.state.sessions.find((candidate: { status: string }) => candidate.status === 'planned')
    const planned = session.exercises[1]
    planned.exerciseId = 'pull-up'
    planned.purpose = 'Build repeatable bodyweight pull-up strength.'
    planned.sets = Array.from({ length: 3 }, (_, index) => ({ id: `browser-bodyweight-${index + 1}`, targetLoad: 0, targetReps: 5, targetRir: 2, loadMode: 'bodyweight', completed: false }))
    localStorage.setItem(key, JSON.stringify(persisted))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  const movement = page.locator('.exercise-card').filter({ has: page.getByRole('heading', { name: 'Pull-Up' }) })
  await expect(movement.getByRole('button', { name: 'Bodyweight' })).toHaveAttribute('aria-pressed', 'true')
  await expect(movement.getByRole('button', { name: 'BW + lb' })).toBeVisible()
  await expect(movement.getByRole('button', { name: 'Assisted' })).toBeVisible()
  await expect(movement.getByRole('button', { name: 'External lb' })).toBeVisible()
  await expect(movement.locator('.bodyweight-load')).toHaveCount(3)
  const rows = movement.locator('.set-row')
  await rows.first().locator('input[inputmode="numeric"]').fill('8')
  await expect(rows.nth(1).locator('input[inputmode="numeric"]')).toHaveValue('8')
  await expect(rows.nth(2).locator('input[inputmode="numeric"]')).toHaveValue('8')
  await expect(movement.getByRole('button', { name: 'Done' })).toHaveCount(0)
  if (testInfo.project.name === 'mobile-chromium') await movement.screenshot({ path: 'output/playwright/bodyweight-pull-up-mobile.png' })
  await rows.first().getByRole('button', { name: 'Log set' }).click()
  await expect(movement.getByRole('button', { name: 'Done' })).toHaveCount(1)

  const firstSet = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state
    return state.sessions.find((candidate: { status: string }) => candidate.status === 'active').exercises.find((planned: { exerciseId: string }) => planned.exerciseId === 'pull-up').sets[0]
  })
  expect(firstSet).toMatchObject({ loadMode: 'bodyweight', targetLoad: 0, completedLoad: 0, completedReps: 8, completed: true })
  expect(browserErrors).toEqual([])
})

test('previews and preserves an athlete-edited training-block blueprint', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Plan', exact: true }).click()

  const blueprint = page.getByRole('region', { name: 'See the whole route before you train it.' })
  await expect(blueprint).toContainText('Round 4')
  await expect(blueprint).toContainText('Block review')
  await expect(blueprint).toContainText('Primary')
  await expect(blueprint).toContainText('Secondary')
  await expect(blueprint).toContainText('Accessory')
  await expect(blueprint).toContainText('ABX Cambered-Bar Chest-Supported Row')
  await expect(blueprint).toContainText('Incline Barbell Bench Press')
  await expect(blueprint).toContainText(/Two-Board Press|Close-Grip Bench Press|Spoto Press/)
  await expect(blueprint).toContainText('Pull-Up')
  await expect(blueprint).toContainText('3 × 5')
  await expect(blueprint).toContainText('Deload is proposed from evidence')
  const blockBeforePreview = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state.mesocycles))
  await blueprint.getByRole('button', { name: 'Preview full block' }).click()
  const blockPreview = page.getByRole('dialog', { name: 'Full training-block preview' })
  await expect(blockPreview).toContainText('Round 1 of 4')
  await expect(blockPreview).toContainText('About 4 training weeks')
  await expect(blockPreview).toContainText('Load, then repetitions, then sets')
  await expect(blockPreview).toContainText('No fixed deload date')
  await expect(blockPreview).toContainText('A deload is a proposal, not a calendar command.')
  await blockPreview.getByRole('button', { name: 'Close preview' }).click()
  await expect(blockPreview).not.toBeVisible()
  const blockAfterPreview = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state.mesocycles))
  expect(blockAfterPreview).toBe(blockBeforePreview)
  const dayToggles = blueprint.getByRole('button', { name: /day \d+:/i })
  await expect(dayToggles).toHaveCount(3)
  await expect(dayToggles.first()).toHaveAttribute('aria-expanded', 'true')
  await expect(dayToggles.nth(1)).toHaveAttribute('aria-expanded', 'false')
  await dayToggles.nth(1).click()
  await expect(dayToggles.nth(1)).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: 'Show the upcoming session queue' })).toHaveAttribute('aria-expanded', 'false')

  await blueprint.getByRole('button', { name: 'Review and edit blueprint' }).click()
  const dialog = page.getByRole('dialog', { name: 'Preview training-block version 2' })
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate((element) => element.scrollTop)).toBe(0)
  if (testInfo.project.name !== 'desktop-chromium') {
    const previewTop = await dialog.locator('.plan-preview').evaluate((element) => element.getBoundingClientRect().top)
    const formTop = await dialog.locator('.plan-editor__form').evaluate((element) => element.getBoundingClientRect().top)
    expect(previewTop).toBeLessThan(formTop)
  }

  await dialog.getByLabel('Incline Dumbbell Press back-pad angle').fill('45')
  await dialog.getByLabel('Why are you changing the plan?').fill('Use one repeatable incline setup for this block.')
  await expect(dialog).toContainText('Scope: future workouts in this block')
  await expect(dialog).toContainText('Completed workouts do not change')
  await dialog.getByRole('checkbox', { name: /Apply these changes to future planned workouts/i }).check()
  await dialog.getByRole('button', { name: 'Apply version 2' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(blueprint).toContainText('Incline Dumbbell Press')
  await expect(blueprint).toContainText('45° bench')
  await expect(blueprint).toContainText('Your choice')

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state)
  const activePlan = persisted.mesocycles.find((plan: { id: string }) => plan.id === persisted.activeMesocycleId)
  expect(activePlan.movementOverrides).toContainEqual({ sessionIndex: 0, slotIndex: 3, exerciseId: 'incline-db-press', benchAngleDeg: 45, source: 'athlete' })
  const benchDay = persisted.sessions.find((session: { mesocycleId: string; exercises: Array<{ role: string; exerciseId: string }> }) => session.mesocycleId === activePlan.id && session.exercises[0]?.exerciseId === 'competition-bench')
  const selectedIncline = benchDay.exercises.find((exercise: { exerciseId: string }) => exercise.exerciseId === 'incline-db-press')
  expect(selectedIncline.sets.every((workSet: { benchAngleDeg?: number }) => workSet.benchAngleDeg === 45)).toBe(true)

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await blueprint.screenshot({ path: 'output/playwright/training-block-blueprint-mobile.png' })
  expect(browserErrors).toEqual([])
})

test('keeps destination context and primary mobile actions in view', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Dismiss message' }).click()

  const primaryStartAction = page.getByRole('button', { name: 'Choose check-in & start' })
  if (testInfo.project.name === 'mobile-chromium') await expect(primaryStartAction).toBeInViewport()

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your training, made legible.' })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 1800))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500)
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Find it. Rate it. Train it.' })).toBeVisible()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  if (testInfo.project.name === 'mobile-chromium') await expect(page.getByPlaceholder('Search a movement or its other names...')).toBeInViewport()

  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  const finishAction = page.getByRole('button', { name: 'Finish workout' })
  await expect(finishAction).toHaveClass(/button--secondary/)
  await expect(page.locator('.workout-footer')).toContainText('0 of 9 sets complete.')

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('keeps heading, subheading, and supporting copy rhythm readable across destinations', async ({ page }) => {
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Dismiss message' }).click()

  const destinations = [
    ['Today', 'Your next useful win.'],
    ['Plan', 'The plan bends. The goal stays visible.'],
    ['Progress', 'Your training, made legible.'],
    ['Library', 'Find it. Rate it. Train it.'],
    ['You', 'The app learns. You stay in charge.']
  ] as const

  for (const [destination, pageHeading] of destinations) {
    const destinationButton = page.getByRole('button', { name: destination, exact: true })
    await destinationButton.click()
    await expect(destinationButton).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { name: pageHeading })).toBeVisible({ timeout: 15_000 })
    const metrics = await page.evaluate(() => {
      const visible = (element: Element | null) => {
        if (!(element instanceof HTMLElement)) return false
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
      }

      return [...document.querySelectorAll<HTMLElement>('h1, h2, h3')]
        .filter(visible)
        .map((heading) => {
          const style = getComputedStyle(heading)
          const rect = heading.getBoundingClientRect()
          const previous = heading.previousElementSibling
          const next = heading.nextElementSibling
          return {
            label: heading.textContent?.trim() ?? heading.tagName,
            lineHeightRatio: parseFloat(style.lineHeight) / parseFloat(style.fontSize),
            eyebrowGap: previous?.classList.contains('eyebrow') && visible(previous)
              ? rect.top - previous.getBoundingClientRect().bottom
              : null,
            supportingCopyGap: next?.tagName === 'P' && visible(next)
              ? next.getBoundingClientRect().top - rect.bottom
              : null
          }
        })
    })

    expect(metrics.length).toBeGreaterThan(0)
    for (const metric of metrics) {
      expect(metric.lineHeightRatio, `${destination}: ${metric.label} line height`).toBeGreaterThanOrEqual(1.03)
      if (metric.eyebrowGap !== null) expect(metric.eyebrowGap, `${destination}: ${metric.label} eyebrow gap`).toBeGreaterThanOrEqual(8)
      if (metric.supportingCopyGap !== null) expect(metric.supportingCopyGap, `${destination}: ${metric.label} supporting-copy gap`).toBeGreaterThanOrEqual(8)
    }
  }

  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.getByRole('button', { name: 'Choose check-in & start' }).click()
  const modalRhythm = await page.locator('dialog[open] .modal__header').evaluate((header) => {
    const title = header.querySelector('h2')!
    const description = title.nextElementSibling!
    const titleStyle = getComputedStyle(title)
    return {
      lineHeightRatio: parseFloat(titleStyle.lineHeight) / parseFloat(titleStyle.fontSize),
      supportingCopyGap: description.getBoundingClientRect().top - title.getBoundingClientRect().bottom
    }
  })
  expect(modalRhythm.lineHeightRatio).toBeGreaterThanOrEqual(1.1)
  expect(modalRhythm.supportingCopyGap).toBeGreaterThanOrEqual(8)
})

test('shows an honest local test boundary without weakening backup or responsive containment', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Dismiss message' }).click()
  await page.getByRole('button', { name: 'You', exact: true }).click()

  const cloudPanel = page.getByLabel('Cloud account')
  await expect(cloudPanel).toBeVisible()
  await expect(cloudPanel.getByRole('heading', { name: 'Cloud access is unavailable' })).toBeVisible()
  await expect(cloudPanel).toContainText('This build is not cloud-authoritative')
  await expect(cloudPanel).toContainText(/The local test override is active\.|Private cloud access is not enabled in this build\./)
  await expect(cloudPanel.getByRole('button')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Backup and recovery' })).toBeVisible()
  await openPanel(page, 'backup and recovery')
  await expect(page.getByRole('button', { name: 'Export verified backup' })).toBeEnabled()
  await expect(page.getByText('Local test state v33')).toBeVisible()

  await cloudPanel.screenshot({ path: `output/playwright/cloud-foundation-${testInfo.project.name === 'mobile-chromium' ? 'mobile' : 'desktop'}.png` })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('organizes the exercise library and saves programming preferences', async ({ page }) => {
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Library', exact: true }).click()

  await page.getByRole('button', { name: /My preferences/ }).click()
  await expect(page.getByText('0 movements', { exact: true })).toBeVisible()
  await expect(page.locator('#library-filter-panel').getByRole('button', { name: 'Preferred', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Nothing matches this search yet.')).toBeVisible()

  await page.getByRole('button', { name: /Body part/ }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.locator('.library-card').first()).toBeVisible()

  await page.getByRole('button', { name: 'Hide filters' }).click()
  await expect(page.locator('#library-filter-panel')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show filters' }).click()
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByText('251 movements', { exact: true }).first()).toBeVisible()
  await page.getByPlaceholder('Search a movement or its other names...').fill('Conventional Deadlift')

  const conventional = page.locator('.library-card').filter({ has: page.getByRole('heading', { name: 'Conventional Deadlift', exact: true }) }).first()
  await expect(conventional).toBeVisible()
  await conventional.getByRole('button', { name: 'Avoid' }).click()
  await expect(conventional).toHaveClass(/is-disliked/)
  const detailButton = conventional.locator('.library-card__open')
  expect((await detailButton.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  await detailButton.click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Conventional Deadlift', exact: true })).toBeVisible()
  await expect(page.getByText('Avoided movements are excluded')).toBeVisible()
  await page.getByRole('button', { name: 'Close Conventional Deadlift' }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  const filterToggle = page.getByRole('button', { name: /^(Show|Hide) filters$/ })
  await filterToggle.waitFor({ state: 'visible' })
  if (await filterToggle.getAttribute('aria-expanded') === 'false') await filterToggle.click()
  await page.locator('#library-filter-panel').getByRole('button', { name: 'Avoid', exact: true }).click()
  await expect(page.locator('.library-card').filter({ has: page.getByRole('heading', { name: 'Conventional Deadlift', exact: true }) })).toBeVisible()
  await page.locator('#library-filter-panel').getByRole('button', { name: 'Reset' }).click()

  // Every movement carries its own drawing rather than one shared arrow.
  await expect(page.locator('.library-card .movement-art').first()).toBeVisible()
  const sceneVariety = await page.evaluate(() => new Set([...document.querySelectorAll('.library-card .movement-art')]
    .map((art) => [...art.classList].find((name) => name.startsWith('movement-art--')))).size)
  expect(sceneVariety).toBeGreaterThan(8)

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
})

test('opens touch-safe workout reasoning and preserves an active workout across leave, pin, and resume', async ({ page }) => {
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  // The session clock has to be readable on a phone, where the other header stats are hidden.
  const clock = page.getByRole('timer', { name: 'Time elapsed in this workout' })
  await expect(clock).toBeInViewport()
  await expect(clock).toContainText(/\d\d:\d\d/)

  // Stopping the clock holds the reading and survives a reload, because a stop is stored on the
  // session rather than in screen state.
  await page.getByRole('button', { name: 'Stop the workout clock' }).click()
  await expect(clock).toContainText('Stopped')
  // Let the final in-flight timer render settle before recording the frozen value. A stop can land
  // exactly on a second boundary on slower WebKit runners, where the label legitimately advances
  // once while React commits the persisted stopped timestamp.
  await page.waitForTimeout(250)
  const stopped = String(await clock.textContent()).match(/\d\d:\d\d/)?.[0]
  await page.waitForTimeout(1500)
  await expect(clock).toContainText(String(stopped))
  await page.reload()
  await expect(page.getByRole('timer', { name: 'Time elapsed in this workout' })).toContainText(String(stopped))
  await page.getByRole('button', { name: 'Start the workout clock' }).click()
  await expect(page.getByRole('timer', { name: 'Time elapsed in this workout' })).toContainText('Elapsed')

  // A rep or load cell clears to empty instead of snapping back to a zero the athlete has to delete.
  const reps = page.locator('.set-row input[inputmode="numeric"]').first()
  await reps.fill('')
  await expect(reps).toHaveValue('')
  await reps.fill('7')
  await expect(reps).toHaveValue('7')

  await page.getByRole('button', { name: 'More information about Competition Bench Press' }).click()
  await expect(page.getByRole('dialog')).toContainText('Hold before adding load, repetitions, or dose')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Log set' }).first().click()
  await page.getByRole('button', { name: 'Leave workout open' }).click()
  await expect(page.getByRole('button', { name: 'Resume active workout' })).toBeVisible()
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByRole('button', { name: 'Show the upcoming session queue' }).click()
  await page.getByRole('button', { name: /Pin Hinge Calibration Session as next priority/ }).click()
  const pinned = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state
    return state.sessions.filter((session: { status: string }) => ['planned', 'deferred'].includes(session.status)).map((session: { title: string }) => session.title)
  })
  expect(pinned[0]).toBe('Hinge Calibration Session')

  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.getByRole('button', { name: 'Resume active workout' }).click()
  await expect(page.getByRole('button', { name: 'Done' })).toHaveCount(1)
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state)
  expect(persisted.activeSessionId).toBeTruthy()
  expect(persisted.workoutVisible).toBe(true)
})

test('uses Set 1 to prefill untouched sets without logging or overwriting athlete edits', async ({ page }, testInfo) => {
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  const movement = page.locator('.exercise-card--primary').first()
  await expect(movement).not.toContainText('Set 1 fills the untouched sets below')
  const rows = movement.locator('.set-row')
  await expect(rows.nth(2)).toBeVisible()

  // A later athlete edit becomes an exception to the shared Set 1 template.
  await rows.nth(2).locator('input[inputmode="numeric"]').fill('7')
  await rows.first().locator('input[inputmode="decimal"]').fill('135')
  await rows.first().locator('input[inputmode="numeric"]').fill('10')
  await rows.first().locator('select').selectOption('4')

  await expect(rows.nth(1).locator('input[inputmode="decimal"]')).toHaveValue('135')
  await expect(rows.nth(1).locator('input[inputmode="numeric"]')).toHaveValue('10')
  await expect(rows.nth(1).locator('select')).toHaveValue('4')
  await expect(rows.nth(2).locator('input[inputmode="decimal"]')).toHaveValue('135')
  await expect(rows.nth(2).locator('input[inputmode="numeric"]')).toHaveValue('7')
  await expect(rows.nth(2).locator('select')).toHaveValue('4')
  await expect(movement.getByRole('button', { name: 'Done' })).toHaveCount(0)
  if (testInfo.project.name === 'mobile-chromium') await movement.screenshot({ path: 'output/playwright/set-entry-autofill-mobile.png' })

  await rows.first().getByRole('button', { name: 'Log set' }).click()
  await expect(movement.getByRole('button', { name: 'Done' })).toHaveCount(1)

  const savedSets = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state
    return state.sessions.find((session: { status: string }) => session.status === 'active').exercises[0].sets
  })
  expect(savedSets[1]).toMatchObject({ completedLoad: 135, completedReps: 10, actualRir: 4, completed: false, valuesEntered: true, entryOrigins: { load: 'top-set-autofill', reps: 'top-set-autofill', rir: 'top-set-autofill' } })
  expect(savedSets[2]).toMatchObject({ completedLoad: 135, completedReps: 7, actualRir: 4, completed: false, entryOrigins: { load: 'top-set-autofill', reps: 'manual', rir: 'top-set-autofill' } })
})

test('asks for exact-movement feedback immediately after the final set and preserves it for progression', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  const movement = page.locator('.exercise-card--primary').first()
  await completeFirstMovementSets(page)

  const feedback = movement.getByLabel('Competition Bench Press movement feedback')
  await expect(feedback).toBeVisible()
  await expect(feedback.getByText('How did this movement go?')).toBeVisible()
  await expect(feedback).toContainText('never changes today’s work or a future plan without your approval')
  await feedback.getByRole('button', { name: 'No irritation' }).click()
  await feedback.getByRole('button', { name: 'Solid throughout' }).click()
  await feedback.getByRole('button', { name: 'Strong' }).click()
  await feedback.getByRole('button', { name: 'On target' }).click()
  await feedback.getByRole('button', { name: 'At my limit' }).click()
  await feedback.getByRole('button', { name: 'Recovered early' }).click()
  await expect(feedback).toContainText('Keep the set count capped')
  if (testInfo.project.name === 'mobile-chromium') await feedback.screenshot({ path: 'output/playwright/movement-completion-feedback-mobile.png' })
  await feedback.getByRole('button', { name: 'Save movement feedback' }).click()
  await expect(feedback).toContainText('Movement feedback saved')

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state)
  const saved = persisted.surveys.find((survey: { type: string }) => survey.type === 'movement')
  expect(saved).toMatchObject({
    type: 'movement', ruleVersion: 'movement-feedback-v1', exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press',
    skipped: false, answeredCount: 6, unknownCount: 0
  })
  expect(saved.sourceSetIds).toHaveLength(3)
  expect(saved.answers).toContainEqual({ id: 'volumeFit', value: 3, status: 'answered' })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('autosaves exact-movement workout notes and recalls them in the Exercise Library', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  const note = 'Thirty-degree incline. Four-second eccentric. Keep feet farther forward.'
  await page.getByLabel('Competition Bench Press movement notebook').locator('summary').click()
  const noteField = page.getByLabel('Competition Bench Press workout note')
  await noteField.fill(note)
  await expect(noteField).toHaveValue(note)
  await expect(page.locator('.exercise-card--primary .movement-note-editor__meta')).toContainText(`${note.length}/1000`)
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.exercise-card--primary .movement-note-editor').screenshot({ path: 'output/playwright/movement-note-editor-mobile.png' })

  await page.getByRole('button', { name: 'Leave workout open' }).click()
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  const benchCard = page.locator('.library-card').filter({ hasText: 'Competition Bench Press' })
  await benchCard.getByRole('button', { name: 'View details for Competition Bench Press' }).click()
  const notebook = page.locator('.movement-note-history')
  await expect(notebook).toContainText('Movement notebook')
  await expect(notebook).toContainText(note)
  await expect(page.getByText('Saved notes').locator('..')).toContainText('1')

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.version).toBe(33)
  expect(persisted.state.movementNotes).toHaveLength(1)
  expect(persisted.state.movementNotes[0]).toMatchObject({
    ruleVersion: 'movement-note-v1', exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', body: note
  })
  if (testInfo.project.name === 'mobile-chromium') await notebook.screenshot({ path: 'output/playwright/movement-notebook-mobile.png' })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('validates an athlete-controlled PR without changing the prescription', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Why this session?' }).click()
  await expect(page.getByRole('dialog')).toContainText('Finding Your Working Weights route')
  if (testInfo.project.name === 'mobile-chromium') await page.getByRole('dialog').screenshot({ path: 'output/playwright/route-session-explanation-mobile.png' })
  await page.getByRole('button', { name: 'Understood' }).click()
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  await expect(page.getByRole('heading', { name: 'Bench Calibration Session' })).toBeVisible()
  await expect(page.locator('.pr-opportunity').first()).toContainText('This is already prescribed. Do not add work to chase it.')
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.exercise-card--primary').screenshot({ path: 'output/playwright/route-generated-workout-mobile.png' })

  const firstLoad = page.getByLabel('Set 1 load').first()
  await firstLoad.fill('185')
  await page.getByLabel('Set 1 repetitions').first().fill('9')
  await page.getByLabel('Set 1 repetitions in reserve').first().selectOption('2')
  await expect(page.locator('.pr-opportunity').first()).toContainText('This is already prescribed. Do not add work to chase it.')
  await page.getByRole('button', { name: 'Log set' }).first().click()
  await expect(page.getByText('Provisional until the workout is finished and saved.').first()).toBeVisible()

  await finishWorkout(page)
  await page.getByRole('button', { name: /Full.*Complete session and trained-muscle feedback/ }).click()
  await page.getByRole('button', { name: 'How consistent was your technique?: 4' }).click()
  await page.getByRole('button', { name: 'Did any movement create joint pain or irritation?: 0' }).click()
  await page.getByRole('button', { name: 'Save feedback & finish' }).click()
  await expect(page.getByRole('heading', { name: 'PRs and micro wins' })).toBeVisible()
  await openPanel(page, 'the wins timeline')
  await expect(page.getByText('Strength PR').first()).toBeVisible()
  await openPanel(page, 'records for this period')
  await expect(page.getByText('185 heaviest completed load', { exact: false }).first()).toBeVisible()
  const enteredSet = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state.history.find((workSet: { load: number; reps: number; numbersEntered?: boolean }) => workSet.load === 185 && workSet.reps === 9 && workSet.numbersEntered === true))
  expect(enteredSet).toMatchObject({ rir: 2, rirKnown: true, numbersEntered: true })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/progress-achievements-mobile.png', fullPage: true })
  expect(browserErrors).toEqual([])
})

test('keeps achievement controls optional and mobile layouts contained', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'You', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Achievement controls' })).toBeVisible()
  const sounds = page.getByRole('checkbox', { name: 'Pocket-console sounds' })
  await openPanel(page, 'achievement controls')
  await page.getByRole('button', { name: 'Preview sounds' }).click()
  await sounds.check()
  const quietMode = page.getByRole('checkbox', { name: 'Quiet mode' })
  await quietMode.check()
  await expect(page.getByRole('button', { name: 'Preview sounds' })).toBeDisabled()
  await page.reload()
  await page.getByRole('button', { name: 'You' }).click()
  await openPanel(page, 'achievement controls')
  await expect(page.getByRole('checkbox', { name: 'Pocket-console sounds' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Quiet mode' })).toBeChecked()

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/gamification-mobile.png', fullPage: true })
  expect(browserErrors).toEqual([])
})

test('explains a protected-primary substitution and preserves its outcome evidence', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  const placementBeforeSwap = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}')?.state?.placementVerifications ?? [])
  expect(placementBeforeSwap).toHaveLength(1)
  expect(placementBeforeSwap[0]).toMatchObject({ status: 'active', movementPlacement: { exerciseId: 'competition-bench' } })
  await page.getByRole('button', { name: 'Change' }).first().click()
  await expect(page.getByText('Scope: this workout only')).toBeVisible()
  await expect(page.getByText('stays in your training block', { exact: false })).toBeVisible()
  await page.getByLabel('Substitution reason').selectOption('equipment')
  await page.getByRole('button', { name: /Coffin Press/ }).click()
  await page.getByRole('checkbox', { name: 'Confirm main-lift change' }).check()
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/substitution-picker-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Change this workout only' }).click()
  await expect(page.getByText('Baseline calibration', { exact: true })).toBeVisible()
  await expect(page.getByText("The replaced movement's load was not copied", { exact: false })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('this workout no longer tells ForgePath how Competition Bench Press should progress')
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/primary-substitution-verification-cancel-mobile.png', fullPage: true })
  await page.getByLabel('Set 1 load').first().fill('40')
  await page.getByRole('button', { name: 'Log set' }).first().click()
  await finishWorkout(page)
  await finishWorkout(page, 'Finish workout without survey')
  await page.getByRole('button', { name: 'Library' }).click()
  await expect(page.getByRole('heading', { name: 'Swaps you have made' })).toBeVisible()
  await expect(page.getByText('Competition Bench Press', { exact: false }).last()).toBeVisible()
  await expect(page.getByText('Coffin Press', { exact: false }).last()).toBeVisible()
  await expect(page.getByText('1 completed set', { exact: false })).toBeVisible()
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.state.placementVerifications).toHaveLength(0)
  expect(persisted.state.history.some((workSet: { exerciseId: string; originalExerciseId?: string }) => workSet.exerciseId === 'coffin-press' && workSet.originalExerciseId === 'competition-bench')).toBe(true)
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/substitution-ledger-mobile.png', fullPage: true })
  expect(browserErrors).toEqual([])
})

test('honors minimal and off survey preferences without inventing answers', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'You' }).click()
  await openPanel(page, 'survey preferences')
  await page.getByLabel('Pre-session check-in mode').selectOption('minimal')
  await page.getByLabel('Post-session feedback mode').selectOption('off')
  await page.getByRole('button', { name: 'Today' }).click()
  await page.getByRole('button', { name: 'Minimal check-in & start' }).click()
  await expect(page.getByRole('heading', { name: 'Minimal check-in' })).toBeVisible()
  await expect(page.locator('.survey-question')).toHaveCount(3)
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/minimal-readiness-mobile.png', fullPage: true })
  await page.locator('.survey-question').first().getByRole('button', { name: 'Not sure' }).click()
  await page.getByRole('button', { name: 'Any soreness, aches, or pain affecting movement?: 0' }).click()
  await page.getByLabel('How many minutes do you actually have?').fill('45')
  await page.getByRole('button', { name: 'Use my check-in' }).click()
  await expect(page.getByText('Few check-in answers')).toBeVisible()
  await expect(page.getByText('45 minute version')).toBeVisible()
  await page.getByRole('button', { name: 'Log set' }).first().click()
  await finishWorkout(page)
  await expect(page.getByRole('heading', { name: 'PRs and micro wins' })).toBeVisible()
  await page.getByRole('button', { name: 'You' }).click()
  await openPanel(page, 'survey preferences')
  await expect(page.getByLabel('Post-session feedback mode')).toHaveValue('off')
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  const surveys = persisted?.state?.surveys ?? []
  expect(surveys.at(-2)).toMatchObject({ type: 'pre', mode: 'minimal', answeredCount: 2, unknownCount: 1, confidence: 'low' })
  expect(surveys.at(-1)).toMatchObject({ type: 'post', mode: 'off', skipped: true, answeredCount: 0, unknownCount: 0, confidence: 'low' })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/survey-preferences-mobile.png', fullPage: true })
  expect(browserErrors).toEqual([])
})

test('defers optional feedback without blocking training and replays quality evidence later', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  await page.getByLabel('Set 1 load').first().fill('185')
  await page.getByLabel('Set 1 repetitions').first().fill('9')
  await page.getByLabel('Set 1 repetitions in reserve').first().selectOption('2')
  await page.getByRole('button', { name: 'Log set' }).first().click()
  await finishWorkout(page)
  await page.getByRole('button', { name: /Minimal.*Difficulty, technique, and pain only/ }).click()
  await page.getByRole('button', { name: 'Remind me later' }).click()
  await expect(page.getByRole('heading', { name: 'PRs and micro wins' })).toBeVisible()
  await openPanel(page, 'the wins timeline')
  await expect(page.getByText('Unverified number best').first()).toBeVisible()

  await page.getByRole('button', { name: 'Today' }).click()
  await expect(page.getByLabel('Optional session feedback')).toBeVisible()
  await expect(page.getByRole('button', { name: /check-in & start|Start workout now/ })).toBeVisible()
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/deferred-feedback-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Add feedback' }).click()
  await expect(page.getByRole('heading', { name: 'Optional Minimal session feedback' })).toBeVisible()
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/deferred-feedback-form-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'How difficult was the session overall?: 7' }).click()
  await page.getByRole('button', { name: 'How consistent was your technique?: 4' }).click()
  await page.getByRole('button', { name: 'Did any movement create joint pain or irritation?: 0' }).click()
  await page.getByRole('button', { name: 'Save feedback' }).click()
  await expect(page.getByLabel('Optional session feedback')).toHaveCount(0)
  await page.getByRole('button', { name: 'Progress' }).click()
  await openPanel(page, 'the wins timeline')
  await expect(page.getByText('Strength PR').first()).toBeVisible()
  await openPanel(page, 'records for this period')
  await expect(page.getByText('185 heaviest completed load', { exact: false }).first()).toBeVisible()

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted?.version).toBe(33)
  expect(persisted?.state?.deferredFeedback?.at(-1)).toMatchObject({ mode: 'minimal', status: 'completed' })
  expect(persisted?.state?.deferredFeedback?.at(-1)?.surveyId).toBeTruthy()
  expect(persisted?.state?.history?.filter((workSet: { sessionId: string }) => workSet.sessionId === persisted.state.deferredFeedback.at(-1).sessionId).every((workSet: { qualityConfirmed?: boolean }) => workSet.qualityConfirmed === true)).toBe(true)
  expect(persisted?.state?.placementVerifications?.at(-1)?.sessionEvidence).toMatchObject({ difficulty: 7, technique: 4, pain: 0, timeFit: null, postSurveySkipped: false })
  expect(persisted?.state?.placementVerifications?.at(-1)?.firstSet?.sourceSetId).toBeTruthy()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('shows calendar-quarter progress, exact movement mix, and honest priority attention', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Progress' }).click()
  await page.getByLabel('More progress ranges').selectOption('quarter')
  await expect(page.getByRole('heading', { name: 'Monthly volume load' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What filled this window' })).toBeVisible()
  await openPanel(page, 'the movement mix')
  await expect(page.getByRole('heading', { name: 'Completed work against your goal' })).toBeVisible()
  await openPanel(page, 'priority attention')
  await expect(page.getByText('share of selected-period volume load, not share of hypertrophy stimulus or enjoyment', { exact: false })).toBeVisible()
  await openPanel(page, 'the plan comparison')
  await expect(page.getByText('neither one treats a light period as debt to make up', { exact: false })).toBeVisible()
  await expect(page.locator('.progress-range button')).toHaveCount(3)
  await expect(page.getByLabel('More progress ranges')).toHaveValue('quarter')
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/quarter-movement-mix-mobile.png', fullPage: true })
  expect(browserErrors).toEqual([])
})

test('shows separate ongoing-confidence lanes and a three-horizon life-aware decision', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  const dismissMessage = page.getByRole('button', { name: 'Dismiss message' })
  if (await dismissMessage.isVisible()) await dismissMessage.click()

  const lifePlan = page.locator('section.panel').filter({ has: page.getByRole('heading', { name: 'Schedule changed?' }) })
  await expect(lifePlan).toContainText('Today')
  await expect(lifePlan).toContainText('This round')
  await expect(lifePlan).toContainText('Block review')
  await expect(lifePlan).toContainText(/No unfinished set is treated as work you owe|No volume debt/i)
  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('.skip-link').evaluate((element) => { (element as HTMLElement).style.display = 'none' })
    await lifePlan.screenshot({ path: 'output/playwright/life-aware-horizons-mobile.png' })
  }

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await openPanel(page, 'what ForgePath knows')
  const confidence = page.locator('.confidence-panel')
  await expect(confidence).toContainText('Main-lift targets')
  await expect(confidence).toContainText('Schedule fit')
  await expect(confidence).toContainText('Recovery response')
  await expect(confidence).toContainText('Volume tolerance')
  await expect(confidence).toContainText('Exact main-lift knowledge')
  await expect(confidence).toContainText('Missing answers lower certainty only')
  await expect(confidence.locator('.confidence-lanes article')).toHaveCount(4)
  await expect(confidence.locator('.confidence-meter').first().locator('i')).toHaveCount(5)
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  await confidence.screenshot({ path: `output/playwright/ongoing-confidence-${testInfo.project.name}.png` })
  expect(browserErrors).toEqual([])
})

test('links calendar dates to exact completed-exposure order without creating missed-work debt', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Progress' }).click()
  await expect(page.getByRole('heading', { name: 'When you trained versus what moved forward' })).toBeVisible()
  await expect(page.getByLabel('Fixed event countdown')).toContainText('No fixed event declared')
  await expect(page.getByLabel('Calendar and what you actually trained')).toBeVisible()
  const completedDay = page.locator('.calendar-grid > button.has-completion:not(.outside-month)').first()
  await expect(completedDay).toBeVisible()
  await completedDay.click()
  await expect(page.locator('.calendar-day-detail')).toContainText('completed sets')
  await expect(page.locator('.calendar-day-detail')).toContainText('Completed training')
  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('.skip-link').evaluate((element) => { (element as HTMLElement).style.display = 'none' })
    await page.locator('.training-timeline').screenshot({ path: 'output/playwright/calendar-history-mobile.png' })
  }

  await openPanel(page, 'the calendar view')
  await page.getByRole('button', { name: 'By workout' }).click()
  await page.locator('.exposure-picker').getByRole('button', { name: 'Competition Bench Press' }).click()
  await expect(page.locator('.exposure-summary')).toContainText('exact completed exposures')
  await expect(page.locator('.exposure-sequence')).toContainText('calendar-day gap')
  await expect(page.locator('.exposure-sequence')).toContainText('heaviest load')
  await expect(page.getByText('Family movements and neighboring variations are not borrowed.', { exact: false })).toHaveCount(0)
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.training-timeline').screenshot({ path: 'output/playwright/exposure-order-mobile.png' })

  await page.evaluate(() => {
    const key = 'forgepath-private-alpha-v1'
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{}')
    const eventDate = new Date()
    eventDate.setDate(eventDate.getDate() + 10)
    const isoDate = [eventDate.getFullYear(), String(eventDate.getMonth() + 1).padStart(2, '0'), String(eventDate.getDate()).padStart(2, '0')].join('-')
    persisted.state.athlete.placement.inputs.fixedEvent = `Powerlifting meet · ${isoDate}`
    localStorage.setItem(key, JSON.stringify(persisted))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Progress' }).click()
  await expect(page.getByLabel('Fixed event countdown')).toContainText('Powerlifting meet')
  await expect(page.getByLabel('Fixed event countdown')).toContainText('10 calendar days remain')
  expect(browserErrors).toEqual([])
})

test('records a missed opportunity and rebuilds only the open exposure queue from completed truth', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'You' }).click()
  await openPanel(page, 'your training locations')
  await page.getByRole('button', { name: /^Home Gym home gym/ }).click()
  await page.getByRole('button', { name: 'Today' }).click()
  const before = await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}')
    const pinSession = persisted.state.sessions.find((session: { title: string; status: string }) => session.title.includes('Bench') && ['planned', 'deferred'].includes(session.status))
    return { sessions: persisted.state.sessions.length, history: persisted.state.history.length, pinSessionId: pinSession.id }
  })

  await page.getByRole('button', { name: 'I missed this opportunity' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('never pretends a missed workout happened or adds the missed sets to a later day')
  await expect(dialog).toContainText('never prescribes catch-up volume')
  await dialog.getByRole('button', { name: /Different training, not logged/ }).click()
  await dialog.getByLabel('What got in the way?').selectOption('family')
  await dialog.getByLabel('Minutes likely available').selectOption('30')
  await dialog.getByLabel('Which session should lead?').selectOption(before.pinSessionId)
  await dialog.getByRole('button', { name: /Uncertain/ }).click()
  await dialog.getByLabel('Optional context').fill('Kids changed the week. Saturday morning should give me a focused 30-minute window.')
  if (testInfo.project.name === 'mobile-chromium') {
    await dialog.evaluate((element) => { element.scrollTop = 0 })
    await dialog.screenshot({ path: 'output/playwright/missed-opportunity-checkin-mobile.png' })
    await dialog.getByLabel('Which session should lead?').scrollIntoViewIfNeeded()
    await dialog.getByLabel('Which session should lead?').locator('..').screenshot({ path: 'output/playwright/missed-opportunity-eligibility-mobile.png' })
    await dialog.getByLabel('Optional context').scrollIntoViewIfNeeded()
  }
  await dialog.getByRole('button', { name: 'Rebuild my plan' }).click()

  const proof = page.getByLabel('Latest schedule change')
  await expect(proof).toContainText('Queue rebuilt from completed work')
  await expect(proof).toContainText('Completed sets')
  await expect(proof).toContainText('Open planned sets')
  await expect(proof).toContainText('Your check-in')
  await expect(proof).toContainText('Not answered · nothing held against you')
  await expect(proof).toContainText('Muscles chosen first')
  await expect(proof).toContainText('reviewed · no override')
  await proof.getByText('Why this order?').click()
  await expect(proof).toContainText('Reported training without completed set records earns no progression')
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Dismiss message' }).click()
    await page.locator('.skip-link').evaluate((element) => { (element as HTMLElement).style.display = 'none' })
    await proof.screenshot({ path: 'output/playwright/missed-opportunity-rebuild-mobile.png' })
  }

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.version).toBe(33)
  expect(persisted.state.sessions).toHaveLength(before.sessions)
  expect(persisted.state.history).toHaveLength(before.history)
  expect(persisted.state.missedOpportunityEvents).toHaveLength(1)
  expect(persisted.state.missedOpportunityEvents[0]).toMatchObject({
    ruleVersion: 'missed-opportunity-v5', consecutiveMisses: 1, mode: 'defer-one',
    input: { reason: 'family', trainingOutcome: 'different-training-unlogged', nextMinutes: 30, constraintState: 'uncertain', preferredNextSessionId: before.pinSessionId }
  })
  expect(persisted.state.missedOpportunityEvents[0].completedSetCountAfter).toBe(persisted.state.missedOpportunityEvents[0].completedSetCountBefore)
  expect(persisted.state.missedOpportunityEvents[0].openSetCountAfter).toBeLessThanOrEqual(persisted.state.missedOpportunityEvents[0].openSetCountBefore)
  expect(persisted.state.missedOpportunityEvents[0].eligibility).toMatchObject({ ruleVersion: 'schedule-eligibility-v1', equipmentProfileId: 'equipment-home-gym', safetyGateState: 'clear' })
  expect(persisted.state.missedOpportunityEvents[0].readiness).toMatchObject({ ruleVersion: 'schedule-readiness-v1', freshness: 'missing', effectiveOutcome: 'unknown', action: 'unknown' })
  expect(persisted.state.missedOpportunityEvents[0].priorityDose).toMatchObject({ ruleVersion: 'schedule-priority-dose-v1', windowDays: 28, appliedAsTieBreak: false, selectedSessionId: before.pinSessionId })
  const completedSetIds = new Set(persisted.state.history.map((workSet: { id: string }) => workSet.id))
  expect(persisted.state.missedOpportunityEvents[0].priorityDose.regions.flatMap((region: { sourceSetIds: string[] }) => region.sourceSetIds).every((id: string) => completedSetIds.has(id))).toBe(true)
  expect(persisted.state.missedOpportunityEvents[0].eligibility.removedExerciseNames).toEqual([])
  const firstOpen = persisted.state.sessions.find((session: { status: string }) => ['planned', 'deferred'].includes(session.status))
  expect(firstOpen.id).toBe(persisted.state.missedOpportunityEvents[0].nextSessionId)

  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  const planDecision = page.getByLabel('Latest missed opportunity decision')
  await expect(planDecision).toContainText('Latest queue rebuild')
  await expect(planDecision).toContainText('No catch-up debt')
  await expect(planDecision).toContainText('athlete pinned')
  await expect(planDecision).toContainText('Home Gym')
  await expect(planDecision).toContainText('fully executable at the recorded location')
  await expect(planDecision).toContainText('Not enough answers · Not answered')
  await expect(planDecision).toContainText('readiness remains unknown')
  await expect(planDecision).toContainText('28-day priority dose · reviewed')
  if (testInfo.project.name === 'mobile-chromium') await planDecision.screenshot({ path: 'output/playwright/schedule-change-plan-mobile.png' })
  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  const missedDay = page.locator('.calendar-grid > button.has-moved:not(.outside-month)').first()
  await expect(missedDay).toBeVisible()
  await missedDay.click()
  await expect(page.locator('.calendar-day-detail')).toContainText('Missed opportunity · moved')
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.calendar-layout').screenshot({ path: 'output/playwright/missed-opportunity-calendar-mobile.png' })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)

  await page.reload()
  await expect(page.getByLabel('Latest schedule change')).toContainText('Queue rebuilt from completed work')
  expect(browserErrors).toEqual([])
})

test('shows transparent muscle by muscle with overlap-safe area rollups and source drilldown', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Progress' }).click()
  await page.getByLabel('More progress ranges').selectOption('all')
  await expect(page.getByRole('heading', { name: 'Direct work and assisting work' })).toBeVisible()
  await openPanel(page, 'muscle by muscle')
  await expect(page.getByText('These rows do not add up to a single total', { exact: false })).toBeVisible()
  await expect(page.getByLabel('Work by body area')).toContainText('Whole body')
  await page.getByRole('button', { name: 'arms', exact: true }).click()
  await expect(page.getByLabel('arms muscle by muscle')).toBeVisible()
  const triceps = page.getByLabel('arms muscle by muscle').getByRole('button', { name: /Triceps/ })
  await triceps.click()
  await expect(page.getByText('Where this came from')).toBeVisible()
  const sourceIdentifiers = page.locator('.muscle-dose-exercises summary').first()
  await expect(sourceIdentifiers).toContainText('set records')
  await sourceIdentifiers.click()
  await expect(page.locator('.muscle-dose-exercises code').first()).not.toBeEmpty()
  await expect(page.getByRole('heading', { name: 'What the plan asked for versus what you finished' })).toBeVisible()
  await openPanel(page, 'planned muscle work')
  await expect(page.getByLabel('arms planned work per muscle')).toContainText('Triceps')
  await expect(page.getByText('Sets outside a saved plan are still real progress', { exact: false })).toBeVisible()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('.muscle-plan-panel').screenshot({ path: 'output/playwright/muscle-plan-dose-mobile.png' })
    await page.screenshot({ path: 'output/playwright/muscle-dose-mobile.png', fullPage: true })
  }
  expect(browserErrors).toEqual([])
})

test('edits a custom movement without splitting history and blocks alias collisions', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Library' }).click()
  await page.getByRole('button', { name: 'Add movement' }).click()
  await page.getByLabel('Movement name').fill('Ring Press Arc')
  await page.getByLabel('Custom movement equipment').fill('rings, cable')
  await page.getByRole('button', { name: 'Create separate history' }).click()
  await page.getByPlaceholder('Search a movement or its other names...').fill('Ring Press Arc')
  await page.getByRole('button', { name: 'View details for Ring Press Arc' }).click()
  await page.getByRole('button', { name: 'Edit catalog' }).click()
  await expect(page.getByRole('heading', { name: 'Edit custom movement' })).toBeVisible()
  const openModalDimensions = await page.getByRole('dialog').evaluate((dialog) => ({ scrollWidth: dialog.scrollWidth, clientWidth: dialog.clientWidth }))
  expect(openModalDimensions.scrollWidth).toBeLessThanOrEqual(openModalDimensions.clientWidth)
  await page.getByLabel('Catalog movement name').fill('Low Incline Ring Press')
  await page.getByLabel('Catalog exercise family').fill('Incline Press')
  await page.getByLabel('Catalog equipment').fill('rings, cable')
  await page.getByLabel('Catalog aliases').fill('Bench')
  await page.getByLabel('Use athlete-reviewed muscle mapping').check()
  await page.getByLabel('Catalog direct muscle').selectOption('pectorals')
  await page.getByLabel('Catalog secondary Triceps').check()
  await page.getByLabel('Catalog edit reason').fill('Standardized the movement name and equipment')
  await page.getByRole('button', { name: 'Save without splitting history' }).click()
  await expect(page.getByRole('alert')).toContainText('already belongs to Competition Bench Press')
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('dialog').evaluate((element) => { element.scrollTop = 0 })
    await page.getByRole('dialog').screenshot({ path: 'output/playwright/catalog-edit-mobile.png' })
    await page.locator('.muscle-map-editor').screenshot({ path: 'output/playwright/custom-muscle-mapping-mobile.png' })
  }
  await page.getByLabel('Catalog aliases').fill('Ring Incline')
  await page.getByRole('button', { name: 'Save without splitting history' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Low Incline Ring Press' })).toBeVisible()
  await expect(page.getByText('Muscles you mapped')).toBeVisible()
  await expect(page.getByText('Direct · Pectorals')).toBeVisible()
  await expect(page.getByText('Secondary · Triceps')).toBeVisible()
  await page.getByRole('button', { name: 'Close Low Incline Ring Press' }).click()
  await expect(page.getByRole('heading', { name: 'History and movement changes' })).toBeVisible()
  await expect(page.getByText('muscle-dose mapping reviewed and updated', { exact: false })).toBeVisible()
  await expect(page.getByText('+0 volume', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Undo latest change' }).click()
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted?.state?.historyMutations?.at(-1)).toMatchObject({ type: 'exercise-edited' })
  expect(persisted?.state?.historyMutations?.at(-1)?.undoneAt).toBeTruthy()
  const restoredCustom = persisted?.state?.exercises?.find((exercise: { name: string; muscleMapping?: unknown }) => exercise.name === 'Ring Press Arc')
  expect(restoredCustom).toBeTruthy()
  expect(restoredCustom?.muscleMapping).toBeUndefined()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('documents intentional duplicates and merges a connected group in one decision', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Library' }).click()

  await page.getByRole('button', { name: 'Add movement' }).click()
  await page.getByLabel('Movement name').fill('Flat Barbell Bench')
  await page.getByLabel('Custom movement equipment').fill('barbell, bench, rack')
  await expect(page.getByRole('button', { name: 'Create documented variation' })).toBeDisabled()
  await page.getByLabel('Distinct movement reason').fill('Fixed touch point and setup from an older notebook')
  await page.getByRole('button', { name: 'Create documented variation' }).click()

  await page.getByRole('button', { name: 'Add movement' }).click()
  await page.getByLabel('Movement name').fill('Bench')
  await page.getByLabel('Custom movement equipment').fill('barbell, bench, rack')
  await expect(page.getByRole('button', { name: 'Create documented variation' })).toBeDisabled()
  await page.getByLabel('Distinct movement reason').fill('Temporary imported name that still needs cleanup')
  await page.getByRole('button', { name: 'Create documented variation' }).click()

  await page.getByRole('button', { name: 'Data quality (1)' }).click()
  await expect(page.getByText('3 connected identities')).toBeVisible()
  await page.getByRole('button', { name: 'Review group' }).click()
  await expect(page.getByRole('heading', { name: 'Merge duplicate movements' })).toBeVisible()
  await page.getByRole('radio', { name: /Keep Competition Bench Press/ }).click()
  await expect(page.getByRole('radio', { name: /Keep Competition Bench Press/ })).toHaveAttribute('aria-checked', 'true')
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('dialog').evaluate((element) => { element.scrollTop = 0 })
    await page.getByRole('dialog').screenshot({ path: 'output/playwright/batch-duplicate-merge-mobile.png' })
  }
  await page.getByRole('button', { name: 'Merge 3 identities' }).click()
  await page.getByRole('button', { name: 'Data quality' }).click()
  await expect(page.getByText('No probable duplicates found')).toBeVisible()
  await page.getByRole('button', { name: 'Close Exercise data quality' }).click()

  const merged = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  const mergedCustom = merged?.state?.exercises?.filter((exercise: { custom?: boolean; name: string }) => exercise.custom && ['Bench', 'Flat Barbell Bench'].includes(exercise.name)) ?? []
  expect(mergedCustom).toHaveLength(2)
  expect(mergedCustom.every((exercise: { retired?: boolean; mergedIntoId?: string }) => exercise.retired && exercise.mergedIntoId === 'competition-bench')).toBe(true)
  expect(merged?.state?.historyMutations?.at(-1)).toMatchObject({ type: 'exercise-merged' })

  await page.getByRole('button', { name: 'Undo latest change' }).click()
  await expect(page.getByRole('button', { name: 'Data quality (1)' })).toBeVisible()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('separates linked plan completion from completed history with no stored plan', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  await page.getByRole('button', { name: 'Log set' }).first().click()
  await finishWorkout(page)
  await finishWorkout(page, 'Finish workout without survey')
  await page.getByRole('button', { name: 'Progress' }).click()

  const dosePanel = page.locator('.dose-panel')
  await expect(dosePanel.getByRole('heading', { name: 'What you planned, what you finished' })).toBeVisible()
  await openPanel(page, 'the plan comparison')
  await expect(dosePanel.getByText('1 / 9', { exact: true })).toBeVisible()
  await expect(dosePanel.getByText('7 planned · 1 linked completed', { exact: false })).toBeVisible()
  await expect(dosePanel.getByText('Completed without stored plan')).toBeVisible()
  await expect(dosePanel.getByText('they just have no plan to match', { exact: false })).toBeVisible()
  await expect(dosePanel.getByText('not a scolding or a cue to add catch-up work', { exact: false })).toBeVisible()
  const panelDimensions = await dosePanel.evaluate((panel) => ({ scrollWidth: panel.scrollWidth, clientWidth: panel.clientWidth }))
  expect(panelDimensions.scrollWidth).toBeLessThanOrEqual(panelDimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await dosePanel.screenshot({ path: 'output/playwright/planned-dose-mobile.png' })
  expect(browserErrors).toEqual([])
})

test('imports source-dated history only after canonical identity review and blocks re-import duplication', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Library' }).click()
  const baselineHistoryCount = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state.history.length)
  await page.getByRole('button', { name: 'Import history' }).click()
  const csv = 'date,exercise,load,reps,rir,session\n2025-04-02,Bench,205,5,2,Upper A\n2025-04-02,Bench,205,5,2,Upper A\n2025-04-02,Legacy Coffin,95,12,,Upper A\n'
  await page.getByLabel('Training history CSV').setInputFiles({ name: 'jb-notebook.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expect(page.getByText('3', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('exact name or nickname match')).toBeVisible()
  await expect(page.getByText('no clear match')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Import validated sets' })).toBeDisabled()
  await page.getByLabel('Map Legacy Coffin').selectOption('coffin-press')
  await expect(page.getByRole('button', { name: 'Import validated sets' })).toBeEnabled()
  const dialogDimensions = await page.getByRole('dialog').evaluate((dialog) => ({ scrollWidth: dialog.scrollWidth, clientWidth: dialog.clientWidth }))
  expect(dialogDimensions.scrollWidth).toBeLessThanOrEqual(dialogDimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('dialog').screenshot({ path: 'output/playwright/history-import-preview-mobile.png' })
    await page.getByRole('dialog').evaluate((dialog) => dialog.scrollTo({ top: dialog.scrollHeight }))
    await page.getByRole('dialog').screenshot({ path: 'output/playwright/history-import-review-mobile.png' })
  }
  await page.getByRole('button', { name: 'Import validated sets' }).click()
  await expect(page.getByText('3 source sets imported and replayed.')).toBeVisible()
  await expect(page.getByText('3 completed sets imported from jb-notebook.csv.')).toBeVisible()

  let persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.state.history).toHaveLength(baselineHistoryCount + 3)
  expect(persisted.state.history.slice(-3).every((workSet: { qualityConfirmed: boolean }) => workSet.qualityConfirmed === false)).toBe(true)
  expect(persisted.state.history.at(-1)).toMatchObject({ exerciseId: 'coffin-press', originalExerciseName: 'Legacy Coffin', importSourceName: 'jb-notebook.csv', importRow: 4, rirKnown: false })

  await page.getByRole('button', { name: 'Import history' }).click()
  await page.getByLabel('Training history CSV').setInputFiles({ name: 'jb-notebook.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expect(page.getByText('Already imported').locator('..').getByText('3', { exact: true })).toBeVisible()
  await page.getByLabel('Map Legacy Coffin').selectOption('coffin-press')
  await page.getByRole('button', { name: 'Import validated sets' }).click()
  await expect(page.getByText('No sets added. All 3 rows already exist from an earlier import.')).toBeVisible()
  persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.state.history).toHaveLength(baselineHistoryCount + 3)

  await page.getByRole('button', { name: 'Undo latest change' }).click()
  persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.state.history).toHaveLength(baselineHistoryCount)
  expect(persisted.state.historyMutations.at(-1)).toMatchObject({ type: 'history-imported' })
  expect(persisted.state.historyMutations.at(-1).undoneAt).toBeTruthy()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('turns imported exact history into athlete-reviewed placement evidence without silent inference', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}')
    persisted.state.history = []
    persisted.state.records = []
    persisted.state.historyMutations = []
    localStorage.setItem('forgepath-private-alpha-v1', JSON.stringify(persisted))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Library' }).click()
  await page.getByRole('button', { name: 'Import history' }).click()
  const csv = [
    'date,exercise,load,reps,rir,session',
    '2026-08-01,Bench,185,5,2,Upper A', '2026-08-01,Bench,185,5,2,Upper A',
    '2026-08-04,Bench,190,5,2,Upper A', '2026-08-04,Bench,190,5,2,Upper A',
    '2026-08-07,Bench,195,5,2,Upper A', '2026-08-07,Bench,195,5,2,Upper A'
  ].join('\n')
  await page.getByLabel('Training history CSV').setInputFiles({ name: 'recent-bench.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await page.getByRole('button', { name: 'Import validated sets' }).click()
  const evidencePanel = page.locator('.placement-history-panel')
  await expect(evidencePanel).toContainText('Competition Bench Press')
  await expect(evidencePanel).toContainText('6 sets · 3 dates in 42 days')
  await expect(evidencePanel).toContainText('Evidence 4/5')
  await expect(evidencePanel).toContainText('Tolerance 3/5')
  await expect(evidencePanel).toContainText('6 recent imported sets remain numeric-only.')
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Dismiss message' }).click()
    await page.locator('.bottom-nav').evaluate((element) => { (element as HTMLElement).style.display = 'none' })
    await evidencePanel.screenshot({ path: 'output/playwright/history-placement-evidence-mobile.png' })
  }

  await page.getByRole('button', { name: 'Review my starting plan' }).click()
  await expect(page.getByRole('heading', { name: 'Past experience is not current tolerance.' })).toBeVisible()
  const benchReview = page.locator('.movement-placement-inputs article').filter({ hasText: 'Competition Bench Press' })
  // Usable history is counted from exact logged sets. It is not presented as an athlete self-rating.
  await expect(benchReview).toContainText('Competition Bench Press')
  await expect(page.getByRole('button', { name: 'Use evidence 4/5' })).toHaveCount(0)
  // Heavy-work readiness remains an athlete judgement and is not silently inferred from imported numbers.
  await expect(page.getByRole('button', { name: 'Use tolerance 3/5' })).toHaveCount(0)
  if (testInfo.project.name === 'mobile-chromium') {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.locator('.skip-link').evaluate((element) => { (element as HTMLElement).style.display = 'none' })
    await page.locator('.movement-placement-inputs').screenshot({ path: 'output/playwright/history-placement-review-mobile.png' })
  }
  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('button', { name: /Stable.*Consistent useful training/ }).click()
  await page.getByRole('button', { name: 'Schedule stability: 4' }).click()
  await page.getByRole('button', { name: /Continue/ }).click()
  await expect(page.locator('.movement-placement-preview')).toContainText('usable history 4/5')
  await page.getByRole('button', { name: /This looks right.*Enter ForgePath/ }).click()
  await page.getByRole('button', { name: 'You' }).click()
  await openPanel(page, 'your starting profile')
  await expect(page.locator('.profile-movement-lanes')).toContainText('History reviewed')
  await expect(page.locator('.profile-movement-lanes')).toContainText('6 recent sets of this lift')
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Dismiss message' }).click()
    await page.locator('.profile-movement-lanes details').filter({ hasText: 'Competition Bench Press' }).locator('summary').click()
    await page.locator('.placement-profile-evidence').screenshot({ path: 'output/playwright/history-placement-profile-mobile.png' })
  }

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.version).toBe(33)
  expect(persisted.state.athlete.placement.ruleVersion).toBe('placement-v3')
  const benchInput = persisted.state.athlete.placement.inputs.movementProfiles.find((profile: { exerciseId: string }) => profile.exerciseId === 'competition-bench')
  const benchPlacement = persisted.state.athlete.placement.movementPlacements.find((placement: { exerciseId: string }) => placement.exerciseId === 'competition-bench')
  expect(benchInput).toMatchObject({ dataConfidence: 4, strengthTolerance: 4, historyReview: { acceptedFields: ['dataConfidence'], evidence: { ruleVersion: 'placement-history-v1', recentSetCount: 6, recentImportedSetCount: 6, suggestedDataConfidence: 4, suggestedStrengthTolerance: 3 } } })
  expect(benchPlacement).toMatchObject({ ruleVersion: 'movement-placement-v2', dataConfidence: 4, strengthTolerance: 4, historyReview: { evidence: { sourceSetIds: expect.arrayContaining(persisted.state.history.map((workSet: { id: string }) => workSet.id)) } } })
  const activePlan = persisted.state.mesocycles.find((plan: { id: string }) => plan.id === persisted.state.activeMesocycleId)
  const benchSession = persisted.state.sessions.find((session: { mesocycleId: string; exercises: Array<{ role: string; exerciseId: string }> }) => session.mesocycleId === activePlan.id && session.exercises.some((exercise) => exercise.role === 'primary' && exercise.exerciseId === 'competition-bench'))
  expect(activePlan.movementPlacements.find((placement: { exerciseId: string }) => placement.exerciseId === 'competition-bench')).toEqual(benchPlacement)
  expect(benchSession.generation.movementPlacement).toEqual(benchPlacement)
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('uses a saved location profile to gate unavailable work and executable load jumps', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)

  await page.getByRole('button', { name: 'You' }).click()
  await expect(page.getByRole('heading', { name: 'Training locations' })).toBeVisible()
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('Equipment profile name').fill('Garage Rack')
  await page.getByLabel('Equipment profile type').selectOption('home-gym')
  await page.getByLabel('Available equipment').fill('barbell, bench, rack, plates, dumbbells')
  await page.getByLabel('Equipment constraints').fill('No cables\nNo selectorized machines')
  await page.getByLabel('barbell load increment').fill('2.5')
  await page.getByRole('button', { name: 'Save location' }).click()
  await openPanel(page, 'your training locations')
  await page.getByRole('button', { name: /Garage Rack.*Use here/ }).click()
  await expect(page.getByRole('button', { name: /Garage Rack.*Active/ })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'You' }).click()
  await openPanel(page, 'your training locations')
  await expect(page.getByRole('button', { name: /Garage Rack.*Active/ })).toBeVisible()
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.equipment-profile-panel').screenshot({ path: 'output/playwright/equipment-profiles-mobile.png' })

  await page.getByRole('button', { name: 'Today' }).click()
  await expect(page.getByText('3 movements need equipment review')).toBeVisible()
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  await expect(page.getByRole('heading', { name: 'Resolve equipment before logging' })).toBeVisible()
  await expect(page.getByRole('dialog').locator('.equipment-gap-list > div')).toHaveCount(3)
  await expect(page.getByRole('dialog').locator('.equipment-gap-list')).toContainText('plausible available alternatives')
  await page.getByRole('button', { name: 'Start and resolve movements' }).click()
  await expect(page.getByRole('heading', { name: 'Bench Calibration Session' })).toBeVisible()
  await expect(page.getByText('Garage Rack · 3 to resolve')).toBeVisible()
  await expect(page.getByLabel('Set 1 load').first()).toHaveAttribute('step', '2.5')
  await expect(page.locator('.equipment-block')).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Blocked' }).first()).toBeDisabled()
  await page.locator('.equipment-block button').first().click()
  await expect(page.getByRole('heading', { name: 'Change movement' })).toBeVisible()
  await expect(page.getByText('Garage Rack', { exact: false }).first()).toBeVisible()
  const workoutScope = page.getByRole('button', { name: /This workout/ })
  const blockScope = page.getByRole('button', { name: /Entire training block/ })
  await expect(workoutScope).toHaveAttribute('aria-pressed', 'true')
  await blockScope.click()
  await expect(blockScope).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('dialog')).toContainText('creates a new athlete-approved block version')
  if (testInfo.project.name === 'mobile-chromium') await page.getByRole('dialog').screenshot({ path: 'output/playwright/movement-change-scope-mobile.png' })
  await workoutScope.click()
  await expect(workoutScope).toHaveAttribute('aria-pressed', 'true')
  const bestAvailableReplacement = page.getByRole('dialog').locator('.swap-option').first()
  await expect(bestAvailableReplacement).toBeVisible()
  await bestAvailableReplacement.click()
  const primaryConfirmation = page.getByRole('checkbox', { name: 'Confirm main-lift change' })
  if (await primaryConfirmation.isVisible()) await primaryConfirmation.check()
  await page.getByRole('button', { name: 'Change this workout only' }).click()
  await expect(page.locator('.equipment-block')).toHaveCount(2)
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/equipment-gated-workout-mobile.png', fullPage: true })
  expect(browserErrors).toEqual([])
})

test('filters the initial route queue through the selected training location', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('button', { name: /Travel Setup/ }).click()
  await page.getByRole('button', { name: /Continue/ }).click()
  await expect(page.getByText('Generated for Travel Setup')).toBeVisible()
  await expect(page.locator('.route-equipment-preview')).toContainText('Competition Bench Press: barbell, bench, rack')
  await expect(page.locator('.route-equipment-preview')).toContainText('Your main lifts stay visible and need your review.')
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.route-equipment-preview').screenshot({ path: 'output/playwright/equipment-anchor-conflicts-mobile.png' })
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: /Home Gym/ }).click()
  await page.getByRole('button', { name: /Continue/ }).click()
  await expect(page.getByText('Generated for Home Gym')).toBeVisible()
  await expect(page.getByText('Loads use its lb increments.')).toBeVisible()
  await expect(page.getByText('Your starting sessions will actually change', { exact: false })).toBeVisible()
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.route-equipment-preview').screenshot({ path: 'output/playwright/equipment-aware-generation-preview-mobile.png' })
  await page.getByRole('button', { name: /This looks right.*Enter ForgePath/ }).click()
  await expect(page.getByRole('heading', { name: 'Your next useful win.' })).toBeVisible()
  await expect(page.getByText(/movements? need equipment review/)).toHaveCount(0)

  const generated = await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}')
    const state = persisted.state
    const profile = state.equipmentProfiles.find((candidate: { id: string }) => candidate.id === 'equipment-home-gym')
    const available = new Set(profile.equipment)
    const exerciseById = new Map(state.exercises.map((exercise: { id: string }) => [exercise.id, exercise]))
    const supportFits = state.sessions.every((session: { exercises: Array<{ exerciseId: string; role: string }> }) => session.exercises.filter((planned) => planned.role !== 'primary').every((planned) => {
      const exercise = exerciseById.get(planned.exerciseId) as { equipment: string[] }
      return exercise.equipment.every((item) => available.has(item))
    }))
    return {
      persistenceVersion: persisted.version,
      supportFits,
      ruleVersions: state.sessions.map((session: { generation?: { ruleVersion: string } }) => session.generation?.ruleVersion),
      profileIds: state.sessions.map((session: { generation?: { equipment?: { profileId: string } } }) => session.generation?.equipment?.profileId),
      planProfileId: state.mesocycles.find((plan: { id: string }) => plan.id === state.activeMesocycleId)?.generationEquipment?.profileId
    }
  })
  expect(generated).toMatchObject({ persistenceVersion: 33, supportFits: true, planProfileId: 'equipment-home-gym' })
  expect(generated.ruleVersions.every((value: string) => value === 'route-session-v4')).toBe(true)
  expect(generated.profileIds.every((value: string) => value === 'equipment-home-gym')).toBe(true)
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('builds an explainable multi-dimensional placement and preserves athlete control', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: 'Powerlifting', exact: true }).click()
  await page.getByLabel('Years of structured training').fill('8')
  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('button', { name: 'Technique consistency / skill: 5', exact: true }).click()
  await page.getByRole('button', { name: 'Comfort with heavy weight: 4', exact: true }).click()
  await page.getByRole('button', { name: 'Volume tolerance: 4', exact: true }).click()
  await page.getByRole('button', { name: 'Competition Back Squat Technique consistency / skill: 1' }).click()
  await page.getByRole('button', { name: 'Conventional Deadlift Comfort with heavy weight: 1' }).click()
  if (testInfo.project.name === 'mobile-chromium') {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.locator('.skip-link').evaluate((element) => { (element as HTMLElement).style.display = 'none' })
    await page.locator('.movement-placement-inputs').screenshot({ path: 'output/playwright/movement-placement-input-mobile.png' })
  }
  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('button', { name: /Stable.*Consistent useful training/ }).click()
  await page.getByRole('button', { name: 'Schedule stability: 4' }).click()
  await page.getByRole('button', { name: /Continue/ }).click()

  await expect(page.getByRole('heading', { name: 'Finding Your Working Weights', exact: true })).toBeVisible()
  await expect(page.getByText('high confidence', { exact: true })).toBeVisible()
  await expect(page.getByText('Long-term experience remains an asset', { exact: false })).toBeVisible()
  await expect(page.getByText('Your starting sessions will actually change')).toBeVisible()
  await expect(page.getByText('3 × 8', { exact: true })).toBeVisible()
  await expect(page.locator('.movement-placement-preview')).toContainText('Competition Back Squat')
  await expect(page.locator('.movement-placement-preview')).toContainText('Skill-Building Cycle')
  await expect(page.locator('.movement-placement-preview')).toContainText('Competition Bench Press')
  await expect(page.locator('.movement-placement-preview')).toContainText('Finding Your Working Weights')
  await expect(page.locator('.movement-placement-preview')).toContainText('Conventional Deadlift')
  await expect(page.locator('.movement-placement-preview')).toContainText('Finding Your Working Weights')
  await page.getByText('Why not lower or higher?').click()
  await expect(page.getByText('Current experience and skill do not support resetting', { exact: false })).toBeVisible()
  if (testInfo.project.name === 'mobile-chromium') {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.locator('.skip-link').evaluate((element) => { (element as HTMLElement).style.display = 'none' })
    await page.locator('.onboarding__panel').screenshot({ path: 'output/playwright/onboarding-placement-mobile.png' })
  }

  await page.getByRole('button', { name: /Start more conservatively/ }).click()
  await expect(page.getByRole('heading', { name: 'Easing Back In' })).toBeVisible()
  await expect(page.getByText('2 × 8', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /This looks right.*Enter ForgePath/ }).click()
  await page.getByRole('button', { name: 'You' }).click()
  await expect(page.getByText('Easing Back In', { exact: true }).first()).toBeVisible()
  await openPanel(page, 'your starting profile')
  await expect(page.getByText(/high confidence.*conservative/i)).toBeVisible()
  await expect(page.locator('.profile-movement-lanes')).toContainText('Competition Back Squat')
  await expect(page.locator('.profile-movement-lanes')).toContainText('Skill-Building Cycle')
  await expect(page.locator('.profile-movement-lanes')).toContainText('Competition Bench Press')
  await expect(page.locator('.profile-movement-lanes')).toContainText('Easing Back In')
  await expect(page.locator('.profile-movement-lanes')).toContainText('Conventional Deadlift')
  await expect(page.locator('.profile-movement-lanes')).toContainText('Easing Back In')
  await page.getByText('Why and how this will be verified').click()
  await expect(page.getByText(/first work sets/i)).toBeVisible()

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.version).toBe(33)
  expect(persisted.state.athlete.placement).toMatchObject({ ruleVersion: 'placement-v3', recommendedRoute: 'bridge-calibration', selectedRoute: 'reacclimation', confidence: 'high', decision: 'conservative' })
  expect(persisted.state.athlete.placement.movementPlacements.map((movement: { exerciseId: string; selectedRoute: string }) => [movement.exerciseId, movement.selectedRoute])).toEqual([
    ['competition-squat', 'introductory-skill'], ['competition-bench', 'reacclimation'], ['conventional-deadlift', 'reacclimation']
  ])
  expect(persisted.state.athlete.level.movementSkill).toBe(5)
  expect(persisted.state.mesocycles.find((plan: { id: string }) => plan.id === persisted.state.activeMesocycleId)).toMatchObject({ dominantAdaptation: 'reacclimation', title: 'Easing Back In · Starting Cycle', entryRoute: 'reacclimation', generationRuleVersion: 'route-session-v4', generationEquipment: { profileId: 'equipment-home-gym' } })
  expect(new Set(persisted.state.sessions.map((session: { generation?: { route: string } }) => session.generation?.route))).toEqual(new Set(['introductory-skill', 'reacclimation']))
  expect(persisted.state.sessions.every((session: { generation?: { ruleVersion: string; planRoute?: string; equipment?: { profileId: string }; movementPlacement?: { exerciseId: string } }; exercises: Array<{ role: string; exerciseId: string }> }) => session.generation?.ruleVersion === 'route-session-v4' && session.generation.planRoute === 'reacclimation' && session.generation.equipment?.profileId === 'equipment-home-gym' && session.generation.movementPlacement?.exerciseId === session.exercises.find((exercise) => exercise.role === 'primary')?.exerciseId)).toBe(true)
  expect(persisted.state.sessions[0].exercises[0].sets[0]).toMatchObject({ targetReps: 8, targetRir: 4 })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.settings-main .panel').first().screenshot({ path: 'output/playwright/placement-profile-mobile.png' })
  expect(browserErrors).toEqual([])
})

test('pauses automatic training when placement says pain changes movement choice', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('button', { name: /Continue/ }).click()
  await page.getByRole('button', { name: /Changes what I can train/ }).click()
  await page.getByRole('button', { name: /Continue/ }).click()
  await expect(page.getByRole('heading', { name: 'Working Around Pain', exact: true })).toBeVisible()
  await expect(page.getByText('This is not medical clearance', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: /This looks right.*Enter ForgePath/ }).click()
  await expect(page.getByRole('heading', { name: 'The app learns. You stay in charge.' })).toBeVisible()
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(page.getByText('Workout start paused for your review')).toBeVisible()
  await expect(page.getByRole('button', { name: /Reassess before training/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Start without check-in' })).toBeDisabled()
  await page.getByRole('button', { name: 'I missed this opportunity' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Rebuild my plan' }).click()
  await expect(page.getByRole('alert')).toContainText('Automatic schedule rebuilding is paused because the current pain or restriction evidence changes what can be trained')
  const blockedState = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(blockedState.state.missedOpportunityEvents).toHaveLength(0)
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('button', { name: 'You', exact: true }).click()
  await openPanel(page, 'your starting profile')
  await page.getByRole('button', { name: 'Update my starting profile' }).click()
  await expect(page.getByRole('heading', { name: 'Build my starting profile' })).toBeVisible()
  await page.getByRole('button', { name: /Quick Start/ }).click()
  await expect(page.getByRole('heading', { name: 'Your next useful win.' })).toBeVisible()
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.state.mesocycles).toHaveLength(2)
  expect(persisted.state.mesocycles.filter((plan: { status: string }) => plan.status === 'active')).toHaveLength(1)
  expect(persisted.state.mesocycles.filter((plan: { status: string }) => plan.status === 'superseded')).toHaveLength(1)
  expect(persisted.state.athlete.placement).toMatchObject({ decision: 'quick-start', confidence: 'low' })
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('turns warm-up, first-set, session, and recovery evidence into an auditable placement check', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)

  await page.getByRole('button', { name: 'Start without check-in' }).click()
  await expect(page.getByText('Competition Bench Press starting check 1 of 3')).toBeHidden()
  await completeFirstMovementSets(page)
  await expect(page.getByText('Competition Bench Press starting check 1 of 3')).toBeVisible()
  await page.getByRole('button', { name: 'As expected' }).click()
  await expect(page.getByText('Answer saved')).toBeVisible()
  await finishWorkout(page)
  await page.getByRole('button', { name: /Full.*Complete session and trained-muscle feedback/ }).click()
  await page.getByRole('button', { name: 'How difficult was the session overall?: 7' }).click()
  await page.getByRole('button', { name: 'How consistent was your technique?: 4' }).click()
  await page.getByRole('button', { name: 'Did any movement create joint pain or irritation?: 0' }).click()
  await page.getByRole('button', { name: 'How well did the session fit the time you had?: 4' }).click()
  await page.getByRole('button', { name: 'Save feedback & finish' }).click()
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(page.getByText('How did you recover from Bench Calibration Session?')).toBeVisible()
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.placement-recovery-check').screenshot({ path: 'output/playwright/placement-recovery-check-mobile.png' })
  await page.getByRole('button', { name: 'Recovered', exact: true }).click()
  await page.getByRole('button', { name: 'You', exact: true }).click()
  await openPanel(page, 'your starting profile')
  await expect(page.getByText('1 completed · 1 checks across 1 main lift', { exact: false })).toBeVisible()
  await expect(page.getByText('Starting plan looks right')).toBeVisible()
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.placement-profile-evidence').screenshot({ path: 'output/playwright/placement-verification-profile-mobile.png' })

  let persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.version).toBe(33)
  expect(persisted.state.placementVerifications).toHaveLength(1)
  expect(persisted.state.placementVerifications[0]).toMatchObject({ ruleVersion: 'placement-verification-v1', status: 'resolved', verdict: 'supports-route', warmupResponse: 'as-expected', recoveryResponse: 'recovered' })
  expect(persisted.state.history.some((workSet: { id: string }) => workSet.id === persisted.state.placementVerifications[0].firstSet.sourceSetId)).toBe(true)
  await page.reload()
  await page.getByRole('button', { name: 'You', exact: true }).click()
  await openPanel(page, 'your starting profile')
  await expect(page.getByText('Starting plan looks right')).toBeVisible()
  persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.state.placementVerifications[0].recoveryCapturedAt).toBeTruthy()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('requires placement review after painful productive verification without diagnosing the athlete', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  await expect(page.getByRole('button', { name: 'Painful' })).toBeHidden()
  await completeFirstMovementSets(page)
  await page.getByRole('button', { name: 'Painful' }).click()
  await expect(page.getByText('Answer saved')).toBeVisible()
  await expect(page.getByText('painful', { exact: true })).toBeVisible()
  await finishWorkout(page)
  await finishWorkout(page, 'Finish workout without survey')
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(page.getByText('Workout start paused for your review')).toBeVisible()
  await expect(page.getByText('A placement verification recorded pain that changed what could be trained.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: /Reassess before training/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Start without check-in' })).toBeDisabled()
  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('.skip-link').evaluate((element) => { (element as HTMLElement).style.display = 'none' })
    await page.locator('.hero-workout').screenshot({ path: 'output/playwright/placement-verification-pain-gate-mobile.png' })
  }
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.state.placementVerifications[0]).toMatchObject({ warmupResponse: 'painful', status: 'resolved', verdict: 'reassessment-required' })
  expect(persisted.state.placementVerifications[0].firstSet).not.toBeNull()
  expect(persisted.state.athlete.placement.selectedRoute).not.toBe('pain-aware-modified')
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('turns repeated productive checks into an athlete-reviewed placement checkpoint without silent reclassification', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)

  const completeSupportiveCheck = async (sequence: number) => {
    await page.getByRole('button', { name: 'Start without check-in' }).click()
    await completeFirstMovementSets(page)
    await expect(page.getByText(new RegExp(`check ${sequence} of 3$`))).toBeVisible()
    await page.getByRole('button', { name: 'As expected' }).click()
    await finishWorkout(page)
    await page.getByRole('button', { name: /Full.*Complete session and trained-muscle feedback/ }).click()
    await page.getByRole('button', { name: 'How difficult was the session overall?: 7' }).click()
    await page.getByRole('button', { name: 'How consistent was your technique?: 4' }).click()
    await page.getByRole('button', { name: 'Did any movement create joint pain or irritation?: 0' }).click()
    await page.getByRole('button', { name: 'How well did the session fit the time you had?: 4' }).click()
    await page.getByRole('button', { name: 'Save feedback & finish' }).click()
    await page.getByRole('button', { name: 'Today' }).click()
    await page.getByRole('button', { name: 'Recovered', exact: true }).click()
  }

  await completeSupportiveCheck(1)
  await completeSupportiveCheck(1)

  await expect(page.locator('.placement-exit-callout')).toContainText('Your starting plan is ready for review.')
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.placement-exit-callout').screenshot({ path: 'output/playwright/placement-exit-checkpoint-mobile.png' })
  await page.locator('.placement-exit-callout').click()
  const dismissNotice = page.getByRole('button', { name: 'Dismiss message' })
  if (await dismissNotice.isVisible()) await dismissNotice.click()
  await openPanel(page, 'your starting profile')
  const checkpoint = page.locator('.placement-exit-panel')
  await expect(checkpoint).toContainText('Consider a harder plan')
  await expect(checkpoint.locator('.placement-exit-criterion--met')).toHaveCount(4)
  await expect(checkpoint).toContainText('2 completed checks from this starting plan')
  if (testInfo.project.name === 'mobile-chromium') await checkpoint.screenshot({ path: 'output/playwright/placement-exit-profile-mobile.png' })
  await checkpoint.getByRole('button', { name: 'Review this checkpoint' }).click()
  await expect(page.getByRole('heading', { name: 'Review your starting plan' })).toBeVisible()
  const keepRouteChoice = page.locator('.placement-exit-review:not(.movement-exit-review) .placement-exit-choice-list button').filter({ has: page.getByText('Keep the current starting plan', { exact: true }) })
  await keepRouteChoice.click()
  await expect(keepRouteChoice).toHaveAttribute('aria-pressed', 'true')
  await page.getByLabel('Why is this the right decision now?').fill('Both source-linked sessions matched the expected effort, technique stayed stable, and recovery was normal.')
  await page.getByRole('button', { name: 'Save checkpoint decision' }).click()
  await expect(checkpoint).toContainText('Saved athlete review')
  await expect(checkpoint.getByRole('button', { name: 'Checkpoint reviewed' })).toBeDisabled()

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.version).toBe(33)
  expect(persisted.state.placementExitReviews).toHaveLength(1)
  expect(persisted.state.placementExitReviews[0]).toMatchObject({
    ruleVersion: 'placement-exit-review-v1',
    decision: 'continue-current',
    assessment: { ruleVersion: 'placement-exit-v1', recommendation: 'review-advance', resolved: 2, supports: 2, excludedDifferentRouteChecks: 0 }
  })
  expect(persisted.state.placementExitReviews[0].assessment.sourceVerificationEvents).toHaveLength(2)
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('keeps productive checkpoints independent per exact movement and saves the athlete lane decision', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)

  await page.evaluate(() => {
    const key = 'forgepath-private-alpha-v1'
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{}')
    const first = persisted.state.sessions[0]
    const repeat = structuredClone(first)
    repeat.id = `${first.id}-repeat`
    repeat.title = 'Bench Powerbuilding Repeat'
    repeat.dayLabel = 'Queued exact-lane check'
    repeat.exercises = repeat.exercises.map((planned: { id: string; sets: Array<{ id: string }> }) => ({
      ...planned,
      id: `${planned.id}-repeat`,
      sets: planned.sets.map((workSet) => ({ ...workSet, id: `${workSet.id}-repeat` }))
    }))
    persisted.state.sessions.splice(1, 0, repeat)
    const plan = persisted.state.mesocycles.find((candidate: { id: string }) => candidate.id === persisted.state.activeMesocycleId)
    plan.sessionIds = [first.id, repeat.id, ...plan.sessionIds.filter((id: string) => id !== first.id)]
    localStorage.setItem(key, JSON.stringify(persisted))
  })
  await page.reload()

  const completeBenchCheck = async (sequence: number) => {
    await page.getByRole('button', { name: 'Start without check-in' }).click()
    await completeFirstMovementSets(page)
    await expect(page.getByText(`Competition Bench Press starting check ${sequence} of 3`)).toBeVisible()
    await page.getByRole('button', { name: 'As expected' }).click()
    await finishWorkout(page)
    await page.getByRole('button', { name: /Full.*Complete session and trained-muscle feedback/ }).click()
    await page.getByRole('button', { name: 'How difficult was the session overall?: 7' }).click()
    await page.getByRole('button', { name: 'How consistent was your technique?: 4' }).click()
    await page.getByRole('button', { name: 'Did any movement create joint pain or irritation?: 0' }).click()
    await page.getByRole('button', { name: 'How well did the session fit the time you had?: 4' }).click()
    await page.getByRole('button', { name: 'Save feedback & finish' }).click()
    await page.getByRole('button', { name: 'Today' }).click()
    await page.getByRole('button', { name: 'Recovered', exact: true }).click()
  }

  await completeBenchCheck(1)
  await completeBenchCheck(2)
  const movementCallout = page.locator('.movement-exit-callout')
  await expect(movementCallout).toContainText('Review what ForgePath learned about Competition Bench Press.')
  if (testInfo.project.name === 'mobile-chromium') await movementCallout.screenshot({ path: 'output/playwright/movement-exit-checkpoint-mobile.png' })
  await movementCallout.click()
  const lane = page.locator('.movement-lane-card').filter({ hasText: 'Competition Bench Press' })
  await openPanel(page, 'your starting profile')
  await lane.locator('summary').click()
  await expect(lane).toContainText('Consider a harder plan')
  await expect(lane).toContainText('2/3 completed checks')
  await lane.getByRole('button', { name: "Review this lift's starting plan" }).click()
  await expect(page.getByRole('heading', { name: "Review Competition Bench Press's starting plan" })).toBeVisible()
  await expect(page.locator('.movement-exit-review .placement-exit-criterion--met')).toHaveCount(4)
  if (testInfo.project.name === 'mobile-chromium') await page.getByRole('dialog').screenshot({ path: 'output/playwright/movement-exit-review-mobile.png' })
  await page.locator('.movement-exit-review .placement-exit-choice-list button').filter({ has: page.getByText('Keep the current starting plan', { exact: true }) }).click()
  await page.getByLabel('Why is this the right decision for Competition Bench Press?').fill('Two exact bench exposures matched target effort and recovered normally, so I am keeping this lane.')
  await page.getByRole('button', { name: 'Save movement decision' }).click()
  await expect(lane).toContainText('Your decision: continue current')
  await expect(lane.getByRole('button', { name: 'Starting-plan evidence reviewed' })).toBeDisabled()

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  expect(persisted.version).toBe(33)
  expect(persisted.state.movementPlacementExitReviews).toHaveLength(1)
  expect(persisted.state.movementPlacementExitReviews[0]).toMatchObject({
    ruleVersion: 'movement-placement-exit-review-v1', exerciseId: 'competition-bench', decision: 'continue-current',
    assessment: { ruleVersion: 'movement-placement-exit-v1', exerciseId: 'competition-bench', resolved: 2, supports: 2 }
  })
  expect(persisted.state.movementPlacementExitReviews[0].assessment.sourceVerificationEvents.filter((event: { movementPlacement?: { exerciseId: string } }) => event.movementPlacement?.exerciseId === 'competition-bench').map((event: { sequence: number }) => event.sequence)).toEqual([1, 2])
  expect(persisted.state.athlete.placement.movementPlacements.find((movement: { exerciseId: string }) => movement.exerciseId === 'competition-bench').selectedRoute).toBe('bridge-calibration')
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(browserErrors).toEqual([])
})

test('lets the athlete add sets and movements on a good day without rewriting the prescription record', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  const footer = page.locator('.workout-footer')
  await expect(footer).toContainText('0 of 9 sets complete.')
  const extraWork = page.getByLabel('Add extra work')
  await expect(extraWork).toContainText('Feeling good today?')
  await expect(extraWork).not.toContainText('recorded pain that changed training')

  // An added set repeats the last target instead of inventing a heavier one.
  const firstCard = page.locator('.exercise-card').first()
  const firstName = String(await firstCard.locator('.exercise-title h2').textContent())
  const lastLoad = await firstCard.locator('.set-row input[type="number"]').first().inputValue()
  await firstCard.getByRole('button', { name: `Add a set to ${firstName}` }).click()
  await expect(footer).toContainText('0 of 10 sets complete.')
  const addedRow = firstCard.locator('.set-row').last()
  await expect(addedRow.locator('.set-number')).toContainText('+')
  await expect(addedRow.locator('input[type="number"]').first()).toHaveValue(lastLoad)

  // A movement added mid-session is optional accessory work, never the primary movement.
  await extraWork.getByRole('button', { name: 'Add a movement' }).click()
  await page.getByLabel('Search movements to add').fill('curl')
  const option = page.locator('.add-movement-option').first()
  const addedMovementName = String(await option.locator('strong').textContent())
  await option.click()
  const addedCard = page.locator('.exercise-card').filter({ hasText: addedMovementName })
  await expect(addedCard).toHaveClass(/exercise-card--tertiary/)
  await expect(addedCard).toContainText('Athlete-added extra work')
  await expect(page.locator('.exercise-card--primary').first()).not.toContainText(addedMovementName)
  await expect(footer).toContainText('0 of 13 sets complete.')

  // Adding a movement twice is refused, because the existing lane already owns that history.
  await extraWork.getByRole('button', { name: 'Add a movement' }).click()
  await page.getByLabel('Search movements to add').fill(addedMovementName)
  await expect(page.locator('.add-movement-list')).not.toContainText(addedMovementName)
  await page.getByRole('button', { name: 'Close' }).click()

  await enterFirstMovementSetValues(page)
  const logSets = page.getByRole('button', { name: 'Log set' })
  for (let remaining = await logSets.count(); remaining > 0; remaining = await logSets.count()) {
    await logSets.first().click()
  }
  await expect(footer).toContainText('13 of 13 sets complete.')
  await finishWorkout(page)
  await finishWorkout(page, 'Finish workout without survey')

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  const history = persisted.state.history as Array<{ exerciseName: string; athleteAdded?: boolean }>
  const added = history.filter((record) => record.athleteAdded)
  // Extra work is stored as real training history, flagged so plan compliance stays honest.
  expect(added).toHaveLength(4)
  expect(added.filter((record) => record.exerciseName === addedMovementName)).toHaveLength(3)
  expect(added.filter((record) => record.exerciseName === firstName)).toHaveLength(1)
  expect(history.filter((record) => !record.athleteAdded).length).toBeGreaterThan(0)

  // Placement evidence measures the prescription. Volunteered work must not enter the route decision.
  const evidence = persisted.state.placementVerifications[0].sessionEvidence
  expect(evidence.plannedSets).toBe(9)
  expect(evidence.completedSets).toBe(9)
  expect(evidence.completionRate).toBe(1)
  expect(evidence.sessionStatus).toBe('completed')
  const firstSet = persisted.state.placementVerifications[0].firstSet
  expect(String(firstSet.sourceSetId)).toBeTruthy()
  expect(history.find((record) => (record as { id: string }).id === firstSet.sourceSetId)?.athleteAdded).toBeUndefined()
  expect(browserErrors).toEqual([])
})

test('keeps a live pain control available and immediately pauses added volume', async ({ page }) => {
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  const safety = page.getByLabel('Live pain safety check')
  const extraWork = page.getByLabel('Add extra work')
  await expect(safety).toBeVisible()
  await expect(safety).toContainText('This control is always available')
  await safety.getByRole('button', { name: 'Modify or stop' }).click()
  await expect(extraWork).toContainText('recorded pain that changed training')
  await expect(extraWork.getByRole('button', { name: 'Add a movement' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Add a set to/ })).toHaveCount(0)

  const captured = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state.sessions.find((session: { status: string }) => session.status === 'active')?.painStatus)
  expect(captured).toBe('changed-training')

  await safety.getByRole('button', { name: 'Pain not affecting training' }).click()
  await expect(extraWork.getByRole('button', { name: 'Add a movement' })).toBeVisible()
})

test('withholds a load target until the exact movement has logged history', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  // A movement added mid-session has no exact history, so it cannot honestly be given a load.
  await page.getByLabel('Add extra work').getByRole('button', { name: 'Add a movement' }).click()
  // The picker reports which movements have exact history, so pick one that genuinely has none.
  const option = page.locator('.add-movement-option').filter({ hasText: 'No exact history' }).first()
  const freshName = String(await option.locator('strong').textContent())
  await option.click()

  const freshCard = page.locator('.exercise-card').filter({ hasText: freshName })
  await expect(freshCard).toContainText(`No logged ${freshName} yet`)
  await expect(freshCard.locator('.set-row input[type="number"]').first()).toHaveValue('')
  await expect(freshCard.locator('.set-row input[type="number"]').first()).toHaveAttribute('placeholder', 'Your call')
  // The effort target still carries the prescription.
  await expect(freshCard.locator('.set-table__head')).toContainText('RIR')

  // A movement with seeded exact history still shows its real target.
  const anchorCard = page.locator('.exercise-card--primary').first()
  await expect(anchorCard).not.toContainText('yet, so there is no honest load')
  const anchorLoad = await anchorCard.locator('.set-row input[type="number"]').first().inputValue()
  expect(Number(anchorLoad)).toBeGreaterThan(0)

  expect(browserErrors).toEqual([])
})

test('performs accessory volume as drop sets and supersets while protecting the anchor', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  // The primary movement never offers a technique, because its exposures carry route evidence.
  const anchorCard = page.locator('.exercise-card--primary').first()
  await expect(anchorCard.getByRole('button', { name: 'Technique' })).toHaveCount(0)

  const accessoryCard = page.locator('.exercise-card--accessory, .exercise-card--tertiary').first()
  const accessoryName = String(await accessoryCard.locator('.exercise-title h2').textContent())
  // count() does not auto-wait, so the rows have to be on screen before they are counted.
  await expect(accessoryCard.locator('.set-row').first()).toBeVisible()
  const setsBefore = await accessoryCard.locator('.set-row').count()
  await accessoryCard.getByRole('button', { name: 'Technique' }).click()
  await page.getByRole('button', { name: /Drop set/ }).click()

  // Two drops are added below the top set, each lighter than the last.
  await expect(accessoryCard.locator('.set-row')).toHaveCount(setsBefore + 2)
  await expect(accessoryCard).toContainText('The top set is what sets your next target')
  // Each row holds a load input and a reps input, so read only the first per row.
  const loads = await accessoryCard.locator('.set-row').evaluateAll((rows) => rows.map((row) => Number((row.querySelector('input[type="number"]') as HTMLInputElement).value)))
  // A movement with a real target strips load on each drop. One with no target yet stays unloaded
  // rather than inventing a number, matching the rule that unknown loads stay unknown.
  if (loads[0] > 0) {
    expect(loads[1]).toBeLessThan(loads[0])
    expect(loads[2]).toBeLessThan(loads[1])
  } else {
    expect(loads.slice(0, 3).every((load) => load === 0)).toBe(true)
  }

  await page.getByRole('button', { name: 'Log set' }).first().click()
  const logSets = page.getByRole('button', { name: 'Log set' })
  for (let remaining = await logSets.count(); remaining > 0; remaining = await logSets.count()) {
    await logSets.first().click()
  }
  await finishWorkout(page)
  await finishWorkout(page, 'Finish workout without survey')

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}'))
  const history = persisted.state.history as Array<{ exerciseName: string; grouping?: { groupKind: string; groupRole: string; groupId: string } }>
  const grouped = history.filter((record) => record.grouping)
  // History records how the volume was actually performed, not just that it happened.
  expect(grouped.length).toBe(3)
  expect(grouped.every((record) => record.grouping!.groupKind === 'drop-set')).toBe(true)
  expect(grouped.filter((record) => record.grouping!.groupRole === 'top')).toHaveLength(1)
  expect(grouped.filter((record) => record.grouping!.groupRole === 'drop')).toHaveLength(2)
  expect(new Set(grouped.map((record) => record.grouping!.groupId)).size).toBe(1)
  expect(grouped.every((record) => record.exerciseName === accessoryName)).toBe(true)
  // The anchor's own sets stay ungrouped so its progression stays comparable.
  expect(history.some((record) => !record.grouping)).toBe(true)
  expect(browserErrors).toEqual([])
})

test('runs myo-reps on accessory work and refuses a superset that would cut volume load', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  const accessoryCard = page.locator('.exercise-card--accessory, .exercise-card--tertiary').first()
  // count() does not auto-wait, so the rows have to be on screen before they are counted.
  await expect(accessoryCard.locator('.set-row').first()).toBeVisible()
  const setsBefore = await accessoryCard.locator('.set-row').count()
  await accessoryCard.getByRole('button', { name: 'Technique' }).click()

  // Pairing options state plainly why a pair is or is not allowed.
  const pairing = page.locator('.structure-pairing')
  await expect(pairing).toBeVisible()
  const refused = pairing.locator('button.is-refused')
  if (await refused.count()) await expect(refused.first()).toContainText(/cuts the volume load|already uses a technique|share meaningful muscle work/)

  await page.getByRole('button', { name: /Myo-reps/ }).click()
  // One activation set plus three short sets replaces the single set it was applied to.
  await expect(accessoryCard.locator('.set-row')).toHaveCount(setsBefore + 3)
  await expect(accessoryCard).toContainText('three to five deep breaths')
  await expect(accessoryCard).toContainText('The first set is what sets your next target')

  // Clearing the technique restores the original set list.
  await accessoryCard.getByRole('button', { name: 'Clear technique' }).click()
  await expect(accessoryCard.locator('.set-row')).toHaveCount(setsBefore)
  await expect(accessoryCard).not.toContainText('three to five deep breaths')

  expect(browserErrors).toEqual([])
})

test('turns session feedback into next week volume rather than storing it unused', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.getByRole('button', { name: 'Start without check-in' }).click()

  const logSets = page.getByRole('button', { name: 'Log set' })
  await expect(logSets.first()).toBeVisible()
  for (let remaining = await logSets.count(); remaining > 0; remaining = await logSets.count()) {
    await logSets.first().click()
  }
  await finishWorkout(page)
  await page.getByRole('button', { name: /Full.*Complete session and trained-muscle feedback/ }).click()
  // Pump and stimulus are asked per trained muscle, which is what the volume decision reads.
  const perMuscle = page.getByRole('button', { name: /How strong was the pump in your/ })
  await expect(perMuscle.first()).toBeVisible()
  const firstMuscleQuestion = String(await perMuscle.first().getAttribute('aria-label'))
  const muscleName = firstMuscleQuestion.replace(/^How strong was the pump in your /, '').replace(/\?.*$/, '')
  await page.getByRole('button', { name: `How strong was the pump in your ${muscleName}?: 1` }).click()
  await page.getByRole('button', { name: `How well did your ${muscleName} actually get trained?: 2` }).click()
  await page.getByRole('button', { name: 'How fatigued were you at the end?: 2' }).click()
  await page.getByRole('button', { name: 'Before today, how early had the target muscles recovered from their prior session?: 5' }).click()
  await page.getByRole('button', { name: 'Did any movement create joint pain or irritation?: 0' }).click()
  await expect(page.getByRole('spinbutton', { name: 'How many minutes did this actually take?' })).toBeVisible()
  await page.getByRole('button', { name: /Save feedback/ }).click()

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await openPanel(page, 'muscle by muscle')
  const volumePlan = page.getByLabel('Weekly volume trend')
  await expect(volumePlan).toBeVisible()
  await expect(volumePlan).toContainText('What next week should look like')
  // Every row states the rule that produced it rather than showing a bare number.
  await expect(volumePlan.locator('.volume-plan__row').first()).toContainText('weekly direct')
  await expect(volumePlan.locator('.volume-plan__row').first().locator('p')).not.toBeEmpty()
  // The muscle answered about directly is marked exact rather than inherited from the session.
  await expect(volumePlan.locator('.volume-plan__row').filter({ hasText: new RegExp(muscleName, 'i') }).first()).toContainText('exact')
  // Rows that inherited a session answer still say so.
  await expect(volumePlan).toContainText('an approximation rather than a measurement')
  expect(browserErrors).toEqual([])
})

test('shows an earned athlete form and level that trace back to completed work', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'You', exact: true }).click()

  const levelPanel = page.getByLabel('ForgePath journal level and visual form')
  await expect(levelPanel).toBeVisible()
  await expect(levelPanel).toContainText(/Forge level \d+ ·/)
  // Points are only ever earned from work that happened, so the breakdown must be present.
  await expect(levelPanel.locator('.athlete-level__sources li').first()).toBeVisible()
  await expect(levelPanel).toContainText('not how experienced or capable you are')

  // The avatar carries the same level beside its head, and the form matches the level reached.
  const heroAvatar = page.locator('.profile-hero .pixel-avatar')
  const levelText = String(await levelPanel.textContent()).match(/Forge level (\d+)/)?.[1]
  await expect(heroAvatar.locator('.pixel-avatar__level')).toHaveText(`Level ${levelText}`)
  await expect(heroAvatar.locator('.pixel-avatar__level')).toHaveCSS('box-shadow', 'none')
  const avatarBox = await heroAvatar.boundingBox()
  const levelBox = await heroAvatar.locator('.pixel-avatar__level').boundingBox()
  expect(avatarBox).not.toBeNull()
  expect(levelBox).not.toBeNull()
  expect(levelBox!.x).toBeGreaterThanOrEqual(avatarBox!.x)
  expect(levelBox!.x + levelBox!.width).toBeLessThanOrEqual(avatarBox!.x + avatarBox!.width)
  await expect(heroAvatar).toHaveAttribute('aria-label', new RegExp(`Forge level ${levelText}`))
  const form = String(await heroAvatar.getAttribute('class')).match(/pixel-avatar--(apprentice|forged|champion|apex)/)?.[1]
  expect(['apprentice', 'forged', 'champion', 'apex']).toContain(form)
  await expect(levelPanel).toContainText(/Uncharted|Established|Well mapped|Long record/)
  if (testInfo.project.name === 'mobile-chromium') await page.locator('.profile-hero').screenshot({ path: 'output/playwright/forge-level-mobile.png' })

  expect(browserErrors).toEqual([])
})

test('keeps a record-heavy first workout at Forge level one', async ({ page }) => {
  await enterRecommendedProfile(page)
  await page.evaluate(() => {
    const key = 'forgepath-private-alpha-v1'
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{"state":{}}')
    const firstSession = { ...persisted.state.sessions[0], id: 'first-workout', status: 'completed' }
    persisted.state.sessions = [firstSession]
    persisted.state.history = persisted.state.history.slice(0, 15).map((workSet: Record<string, unknown>, index: number) => ({
      ...workSet,
      id: `first-set-${index}`,
      sessionId: 'first-workout',
      exerciseId: `first-movement-${index % 5}`,
      exerciseName: `First movement ${index % 5}`
    }))
    persisted.state.records = persisted.state.records.slice(0, 30).map((record: Record<string, unknown>, index: number) => ({
      ...record,
      id: `first-record-${index}`,
      sourceSessionId: 'first-workout',
      validation: 'validated'
    }))
    localStorage.setItem(key, JSON.stringify(persisted))
  })
  await page.reload()
  await page.getByRole('button', { name: 'You', exact: true }).click()

  const levelPanel = page.getByLabel('ForgePath journal level and visual form')
  await expect(levelPanel).toContainText('Forge level 1')
  await expect(levelPanel).toContainText('125 journal points')
  await expect(levelPanel).toContainText('125 of 200 toward Forge level 2')
  await expect(levelPanel).toContainText('1 source-backed workout')
  await expect(levelPanel).not.toContainText('Volume moved')
  await expect(levelPanel).toContainText('each later level requires 75 more points')
})

test('warns before finishing with unlogged work and records a deliberate skip', async ({ page }) => {
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Today' }).click()
  await page.getByRole('button', { name: /Start/ }).first().click()

  // A deliberate skip is the athlete's decision and is kept as one.
  await page.getByRole('button', { name: 'Skip set 3' }).click()
  await expect(page.getByRole('button', { name: 'Set 3 skipped, undo' })).toBeVisible()

  await page.getByRole('button', { name: /Finish workout/ }).click()
  await expect(page.getByRole('heading', { name: 'Before you finish' })).toBeVisible()
  await expect(page.getByText(/sets? not logged/)).toBeVisible()
  await expect(page.getByText(/set you skipped|sets you skipped/)).toBeVisible()

  // Nothing is forced: the athlete can go back, or finish and keep what they did.
  await page.getByRole('button', { name: 'Go back and fill them in' }).click()
  await expect(page.getByRole('heading', { name: 'Before you finish' })).toBeHidden()
  await page.getByRole('button', { name: /Finish workout/ }).click()
  await page.getByRole('button', { name: 'Finish anyway' }).click()
  await expect(page.getByRole('heading', { name: 'Before you finish' })).toBeHidden()
})
