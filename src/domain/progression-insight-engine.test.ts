import { describe, expect, it } from 'vitest'
import { athlete, equipmentProfiles, exercises, history, sessions } from './seed'
import { buildMovementProgressPath } from './progression-insight-engine'
import type { CycleReviewEvent } from './types'

describe('movement progress paths', () => {
  it('explains bodyweight progression through exact repetitions without inventing load', () => {
    const exercise = exercises.find((candidate) => candidate.id === 'pull-up')!
    const session = structuredClone(sessions[0])
    const planned = structuredClone(session.exercises[0])
    planned.id = 'pull-up-plan'
    planned.exerciseId = exercise.id
    planned.sets = planned.sets.slice(0, 3).map((workSet, index) => ({ ...workSet, id: `pull-up-plan-${index}`, targetLoad: 0, targetReps: 6, loadMode: 'bodyweight' as const }))
    session.exercises = [planned]
    const exact = planned.sets.map((_, index) => ({ ...history[0], id: `pull-up-source-${index}`, sessionId: 'prior-pull-ups', exerciseId: exercise.id, exerciseName: exercise.name, family: exercise.family, load: 0, reps: 5, setIndex: index, loadMode: 'bodyweight' as const }))
    const path = buildMovementProgressPath({ athlete, session, planned, exercise, history: exact, surveys: [], equipmentProfile: equipmentProfiles[1], units: 'lb' })
    expect(path).toMatchObject({ loadMode: 'bodyweight', status: 'push-reps' })
    expect(path.last).toMatch(/3 sets.*5 \/ 5 \/ 5.*BW/i)
    expect(path.today).toMatch(/6 \/ 6 \/ 6/)
    expect(path.toProgress).toMatch(/one clean repetition/i)
    expect(path.sourceSetIds.every((id) => id.startsWith('pull-up-source-'))).toBe(true)
  })

  it('lets a live safety signal outrank progression', () => {
    const session = { ...structuredClone(sessions[0]), painStatus: 'changed-training' as const }
    const planned = session.exercises[0]
    const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)!
    const path = buildMovementProgressPath({ athlete, session, planned, exercise, history, surveys: [], equipmentProfile: equipmentProfiles[1], units: 'lb' })
    expect(path).toMatchObject({ status: 'protect', canApply: false })
    expect(path.toProgress).toMatch(/do not chase a record/i)

    const heldSession = { ...structuredClone(sessions[0]), mesocycleId: 'held-block', plannedDate: '2026-08-10T12:00:00.000Z' }
    const heldPlanned = heldSession.exercises[0]
    const heldExercise = exercises.find((candidate) => candidate.id === heldPlanned.exerciseId)!
    const heldReview: CycleReviewEvent = {
      id: 'held-review', mesocycleId: 'held-block', planVersion: 1, microcycleNumber: 1,
      decision: 'continue-hold', recommendation: 'continue-hold', createdAt: '2026-08-09T12:00:00.000Z', reason: 'Repeat the current targets while quality evidence remains incomplete.',
      recommendationReasons: ['Quality evidence remains incomplete.'], evidence: { requiredSessions: 3, qualifiedSessions: 2, unresolvedSessions: 1, totalQualifiedExposures: 2, completedSets: 6, volumeLoad: 6000, averageSessionRpe: null, maximumPain: null, calendarDays: 7 },
      generatedSessionIds: [], expiredSessionIds: []
    }
    const held = buildMovementProgressPath({ athlete, session: heldSession, planned: heldPlanned, exercise: heldExercise, history, surveys: [], cycleReviews: [heldReview], equipmentProfile: equipmentProfiles[1], units: 'lb' })
    expect(held).toMatchObject({ status: 'hold', canApply: false })
    expect(held.toProgress).toMatch(/quality evidence remains incomplete/i)

    const returning = buildMovementProgressPath({ athlete: { ...athlete, continuity: 'returning' }, session: heldSession, planned: heldPlanned, exercise: heldExercise, history, surveys: [], equipmentProfile: equipmentProfiles[1], units: 'lb' })
    expect(returning.status).toBe('hold')
    expect(returning.title).toContain('Rebuild')
    expect(returning.next).toContain('sets')
    expect(returning.canApply).toBe(false)
  })
})
