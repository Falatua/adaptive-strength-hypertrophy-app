import { describe, expect, it } from 'vitest'
import { applyPlacementDecision, buildPlacementAssessment, placementRouteLabels } from '../domain/placement-engine'
import { backupStateFrom, createBackup, parseBackup } from '../domain/backup'
import { useAppStore } from '../store/useAppStore'
import type { PlacementInputs } from '../domain/types'

// An invited athlete's very first cloud save is a push of whatever state the app starts with, and the
// second is whatever onboarding produces. Both must survive the backup contract or the account is
// locked out of Supabase before it holds a single set.

const newAthleteInputs: PlacementInputs = {
  goal: 'hypertrophy', fixedEvent: null, trainingAge: 2, continuity: 'stable',
  movementSkill: 3, strengthTolerance: 3, volumeTolerance: null, scheduleStability: 4, dataConfidence: 2,
  painState: 'none', weeklyOpportunities: 4, defaultMinutes: 45,
  equipmentProfileId: 'equipment-commercial-gym', skippedFields: [],
  // Onboarding always builds one profile per protected anchor, so route generation has evidence for each.
  movementProfiles: [
    { exerciseId: 'competition-squat', exerciseName: 'Competition Back Squat', family: 'Squat', movementSkill: 2, strengthTolerance: 3, dataConfidence: null },
    { exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', family: 'Bench Press', movementSkill: 3, strengthTolerance: 3, dataConfidence: 2 },
    { exerciseId: 'conventional-deadlift', exerciseName: 'Conventional Deadlift', family: 'Deadlift', movementSkill: 3, strengthTolerance: 3, dataConfidence: 2 }
  ]
}

const roundTrip = () => {
  const state = backupStateFrom(useAppStore.getState())
  const backup = createBackup(state)
  const restored = parseBackup(JSON.stringify(backup))
  return { backup, restored }
}

describe('invited athlete first cloud save', () => {
  it('pushes the untouched starting state without failing the backup contract', () => {
    useAppStore.getState().resetForTesting()
    expect(useAppStore.getState().onboardingComplete).toBe(false)
    expect(useAppStore.getState().history).toHaveLength(0)
    expect(useAppStore.getState().sessions).toHaveLength(0)

    const { backup, restored } = roundTrip()
    expect(backup.integrity.value).toMatch(/^[0-9a-f]{8}$/)
    expect(restored.backup.data.onboardingComplete).toBe(false)
    expect(restored.backup.data.history).toHaveLength(0)
  })

  it('keeps the state savable after the athlete finishes their own onboarding', () => {
    useAppStore.getState().resetForTesting()
    const placement = applyPlacementDecision(buildPlacementAssessment(newAthleteInputs, '2026-08-15T18:00:00.000Z'), 'confirmed')
    useAppStore.getState().completeOnboarding({
      trainingAge: 2,
      weeklyOpportunities: 4,
      defaultMinutes: 45,
      equipmentProfile: 'Commercial Gym',
      goal: 'Muscle growth: protect useful training while the first sessions verify current capacity',
      continuity: 'stable',
      entryRoute: placementRouteLabels[placement.selectedRoute],
      placement,
      level: placement.dimensions
    })

    const state = useAppStore.getState()
    expect(state.onboardingComplete).toBe(true)
    expect(state.sessions.length).toBeGreaterThan(0)
    expect(state.athlete.placement.inputs.goal).toBe('hypertrophy')

    const { restored } = roundTrip()
    expect(restored.backup.data.athlete.placement.inputs.goal).toBe('hypertrophy')
    expect(restored.backup.data.athlete.entryRoute).toBe(placementRouteLabels[placement.selectedRoute])
    expect(restored.backup.data.sessions.length).toBe(state.sessions.length)
    expect(restored.backup.data.onboardingComplete).toBe(true)
  })

  it('keeps the state savable after the athlete logs and finishes their first session', () => {
    const state = useAppStore.getState()
    const session = state.sessions.find((candidate) => candidate.status === 'planned')
    expect(session).toBeDefined()
    state.startSession(session!.id)
    const started = useAppStore.getState()
    const planned = started.sessions.find((candidate) => candidate.id === session!.id)!.exercises.find((exercise) => exercise.role === 'primary')!
    started.updateSet(session!.id, planned.id, planned.sets[0].id, { reps: 8, load: 60, rir: 2 })
    useAppStore.getState().toggleSetComplete(session!.id, planned.id, planned.sets[0].id)
    useAppStore.getState().finishSession(session!.id, { answers: [], skipped: true, mode: 'minimal' })

    const after = useAppStore.getState()
    expect(after.history.length).toBeGreaterThan(0)
    const { restored } = roundTrip()
    expect(restored.backup.data.history.length).toBe(after.history.length)
  })
})
