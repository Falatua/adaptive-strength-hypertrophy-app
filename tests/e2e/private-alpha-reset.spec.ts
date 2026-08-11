import { expect, test } from '@playwright/test'

test('clean testing reset removes all local training truth and restarts onboarding', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: 'Quick Start' }).click()
  await page.getByRole('button', { name: 'You' }).click()
  await page.getByRole('button', { name: 'Clear local training data' }).click()

  const resetDialog = page.getByRole('dialog', { name: 'Clear all local training data' })
  await expect(resetDialog).toContainText('completed sets, sessions, plans, surveys, notes, records, feedback, and testing history')
  await resetDialog.getByRole('button', { name: 'Clear and restart' }).click()

  await expect(page.getByRole('heading', { name: /Build the athlete/i })).toBeVisible()
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1') ?? '{}').state)

  for (const key of [
    'sessions', 'history', 'movementNotes', 'surveys', 'deferredFeedback', 'records', 'mesocycles',
    'historyMutations', 'cycleReviews', 'substitutionEvents', 'placementVerifications',
    'placementExitReviews', 'movementPlacementExitReviews', 'missedOpportunityEvents'
  ]) expect(persisted[key], key).toEqual([])

  expect(persisted.activeMesocycleId).toBeNull()
  expect(persisted.activeSessionId).toBeNull()
  expect(persisted.workoutVisible).toBe(false)
  expect(persisted.onboardingComplete).toBe(false)
  expect(persisted.recoverySnapshot).toBeNull()
  expect(persisted.exercises.length).toBeGreaterThan(0)
  expect(persisted.equipmentProfiles.length).toBeGreaterThan(0)
})
