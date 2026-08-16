import { expect, test } from '@playwright/test'
import { derivePersonalRecords } from '../../src/domain/history-engine'
import { exercises } from '../../src/domain/seed'
import type { CompletedSetRecord, SurveyRecord, TrainingSession } from '../../src/domain/types'

const bench = exercises.find((exercise) => exercise.id === 'competition-bench')!
const WEEK_MS = 7 * 86_400_000

const buildYear = () => {
  const history: CompletedSetRecord[] = []
  const sessions: TrainingSession[] = []
  const surveys: SurveyRecord[] = []
  const start = new Date('2025-08-18T16:00:00.000Z').getTime()
  for (let week = 0; week < 52; week += 1) {
    const sessionId = `browser-year-${week + 1}`
    const completedAt = new Date(start + week * WEEK_MS).toISOString()
    const load = 175 + Math.floor(week / 3) * 5
    const reps = 4 + (week % 3)
    sessions.push({
      id: sessionId, title: `Long-term exposure ${week + 1}`, objective: 'Verify a year of completed training.', dayLabel: `Week ${week + 1}`,
      plannedDate: completedAt, status: 'completed', durationMinutes: 50, startedAt: completedAt,
      completedAt: new Date(new Date(completedAt).getTime() + 50 * 60_000).toISOString(), sessionRpe: 7,
      exercises: [{
        id: `${sessionId}-planned`, exerciseId: bench.id, role: 'primary', purpose: 'Main lift', restSeconds: 180, estimatedMinutes: 25, optional: false,
        sets: Array.from({ length: 4 }, (_, index) => ({ id: `${sessionId}-planned-set-${index + 1}`, targetLoad: load, targetReps: reps, targetRir: 2, completed: true }))
      }]
    })
    history.push(...Array.from({ length: 4 }, (_, setIndex): CompletedSetRecord => ({
      id: `${sessionId}-set-${setIndex + 1}`, sessionId, exerciseId: bench.id, exerciseName: bench.name, family: bench.family,
      primaryRegion: bench.primaryRegion, completedAt: new Date(new Date(completedAt).getTime() + setIndex * 60_000).toISOString(),
      reps, load, rir: 2, rirKnown: true, technique: 4, pain: 0, qualityConfirmed: true, setIndex, plannedExerciseId: `${sessionId}-planned`
    })))
    surveys.push({
      id: `${sessionId}-post`, sessionId, type: 'post', completedAt: new Date(new Date(completedAt).getTime() + 51 * 60_000).toISOString(),
      skipped: false, mode: 'quick', answeredCount: 4, unknownCount: 0, confidence: 'medium',
      answers: [
        { id: 'recovery', value: 4, status: 'answered' }, { id: 'targetStimulus', value: 3, status: 'answered' },
        { id: 'endFatigue', value: 2, status: 'answered' }, { id: 'pain', value: 0, status: 'answered' }
      ]
    })
  }
  return { history, sessions, surveys, records: derivePersonalRecords(history) }
}

test('renders and explains a full year of training on phone and desktop', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /Quick Start/ }).click()
  await expect(page.getByRole('heading', { name: 'Your next useful win.' })).toBeVisible()
  const fixture = buildYear()
  await page.evaluate((year) => {
    const key = 'forgepath-private-alpha-v1'
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{"state":{}}')
    persisted.state.history = year.history
    persisted.state.records = year.records
    persisted.state.sessions = year.sessions
    persisted.state.surveys = year.surveys
    persisted.state.athlete.strengthAnchors = ['competition-bench']
    persisted.state.mesocycles = []
    persisted.state.activeMesocycleId = null
    persisted.state.activeSessionId = null
    localStorage.setItem(key, JSON.stringify(persisted))
  }, fixture)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}')?.state?.history?.length)).toBe(208)
  await page.reload()
  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await page.getByLabel('More progress ranges').selectOption('all')

  await expect(page.getByRole('heading', { name: 'Yearly volume load' })).toBeVisible()
  await expect(page.getByText('208 completed sets across 52 active days', { exact: false })).toBeVisible()
  await expect(page.getByText('Competition Bench Press', { exact: true }).first()).toBeVisible()
  const volumeCard = page.getByLabel('What this period shows')
  await expect(volumeCard).toContainText('223,460')

  const confidenceToggle = page.getByRole('button', { name: /what ForgePath knows/i })
  if (await confidenceToggle.getAttribute('aria-expanded') === 'false') await confidenceToggle.click()
  const confidence = page.locator('.confidence-panel')
  await expect(confidence).toContainText('ForgePath has strong current evidence.')
  await expect(confidence).toContainText('208 exact sets', { useInnerText: true })
  await expect(confidence.getByText('well calibrated', { exact: true })).toHaveCount(5)

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/longitudinal-year-mobile.png', fullPage: true })
  expect(browserErrors).toEqual([])
})
