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
    planned.sets = planned.sets.slice(0, 3).map((workSet, index) => ({ ...workSet, id: `pull-up-plan-${index}`, targetLoad: 0, targetReps: 5, loadMode: 'bodyweight' as const }))
    session.exercises = [planned]
    const exact = ['first-pull-ups', 'prior-pull-ups'].flatMap((sessionId, exposure) => planned.sets.map((_, index) => ({
      ...history[0], id: `pull-up-source-${exposure}-${index}`, sessionId, exerciseId: exercise.id, exerciseName: exercise.name,
      family: exercise.family, load: 0, reps: 5, setIndex: index, loadMode: 'bodyweight' as const,
      completedAt: `2026-08-0${exposure + 1}T12:0${index}:00.000Z`
    })))
    const path = buildMovementProgressPath({ athlete, session, planned, exercise, history: exact, surveys: [], equipmentProfile: equipmentProfiles[1], units: 'lb' })
    expect(path).toMatchObject({ loadMode: 'bodyweight', status: 'push-reps' })
    expect(path.last).toMatch(/3 sets.*5 \/ 5 \/ 5.*BW/i)
    expect(path.today).toMatch(/5 \/ 5 \/ 5/)
    expect(path.next).toMatch(/6 reps in the lead set or 16 total reps/i)
    expect(path.toProgress).toMatch(/one clean repetition/i)
    expect(path.sourceSetIds).toHaveLength(3)
    expect(path.sourceSetIds.every((id) => id.startsWith('pull-up-source-'))).toBe(true)
  })

  it('lets a live safety signal outrank progression', () => {
    const session = { ...structuredClone(sessions[0]), painStatus: 'changed-training' as const }
    const planned = session.exercises[0]
    const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)!
    const path = buildMovementProgressPath({ athlete, session, planned, exercise, history, surveys: [], equipmentProfile: equipmentProfiles[1], units: 'lb' })
    expect(path).toMatchObject({ ruleVersion: 'movement-progress-path-v4', status: 'protect' })
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
    expect(held).toMatchObject({ status: 'hold' })
    expect(held.toProgress).toMatch(/quality evidence remains incomplete/i)

    const returning = buildMovementProgressPath({ athlete: { ...athlete, continuity: 'returning' }, session: heldSession, planned: heldPlanned, exercise: heldExercise, history, surveys: [], equipmentProfile: equipmentProfiles[1], units: 'lb' })
    expect(returning.status).toBe('hold')
    expect(returning.title).toContain('proven performance')
    expect(returning.next).toContain('sets')
  })

  it('does not present displayed-only workout numbers as an exact completed exposure', () => {
    const session = structuredClone(sessions[0])
    const planned = session.exercises[0]
    const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)!
    const assumed = history
      .filter((workSet) => workSet.exerciseId === exercise.id)
      .map((workSet) => ({ ...workSet, numbersEntered: false }))
    const path = buildMovementProgressPath({ athlete, session, planned, exercise, history: assumed, surveys: [], equipmentProfile: equipmentProfiles[1], units: 'lb' })
    expect(path.last).toBe('No exact completed exposure')
    expect(path.sourceSetIds).toHaveLength(0)
  })

  it('does not compound a reduced planned load below the latest entered performance', () => {
    const session = structuredClone(sessions[0])
    session.startedAt = '2026-09-10T12:00:00.000Z'
    session.readiness = 'reacclimate'
    const planned = session.exercises[0]
    planned.sets = planned.sets.slice(0, 2).map((workSet, index) => ({ ...workSet, id: `today-${index}`, targetLoad: 150, targetReps: 8 }))
    const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)!
    const exact = planned.sets.map((_, setIndex) => ({
      ...history[0], id: `prior-${setIndex}`, sessionId: 'prior-session', exerciseId: exercise.id, exerciseName: exercise.name,
      family: exercise.family, load: 185, reps: 8, setIndex, completedAt: '2026-09-08T12:00:00.000Z', numbersEntered: true
    }))
    const path = buildMovementProgressPath({ athlete: { ...athlete, continuity: 'returning' }, session, planned, exercise, history: exact, surveys: [], equipmentProfile: equipmentProfiles[1], units: 'lb' })

    expect(path).toMatchObject({ status: 'hold', title: 'Return to your proven performance' })
    expect(path.last).toContain('185 lb')
    expect(path.next).toContain('185 lb')
    expect(path.next).not.toContain('135')
  })

  it('rejects a bodyweight jump from 6 / 5 / 5 to two sets of 12', () => {
    const exercise = exercises.find((candidate) => candidate.id === 'pull-up')!
    const session = structuredClone(sessions[0])
    session.startedAt = '2026-09-10T12:00:00.000Z'
    const planned = structuredClone(session.exercises[0])
    planned.exerciseId = exercise.id
    planned.sets = planned.sets.slice(0, 2).map((workSet, index) => ({ ...workSet, id: `today-pull-up-${index}`, targetLoad: 0, targetReps: 12, loadMode: 'bodyweight' as const }))
    session.exercises = [planned]
    const exact = [6, 5, 5].map((reps, setIndex) => ({
      ...history[0], id: `prior-pull-up-${setIndex}`, sessionId: 'prior-pull-ups', exerciseId: exercise.id, exerciseName: exercise.name,
      family: exercise.family, load: 0, reps, setIndex, completedAt: '2026-09-08T12:00:00.000Z', loadMode: 'bodyweight' as const, numbersEntered: true
    }))
    const path = buildMovementProgressPath({ athlete, session, planned, exercise, history: exact, surveys: [], equipmentProfile: equipmentProfiles[1], units: 'lb' })

    expect(path).toMatchObject({ status: 'hold', title: 'Use the last completed rep path' })
    expect(path.next).toMatch(/3 sets.*6 \/ 5 \/ 5 reps.*BW/i)
    expect(path.next).not.toContain('12')
  })
})
