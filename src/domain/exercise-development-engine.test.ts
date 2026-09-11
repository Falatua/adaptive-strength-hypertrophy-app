import { describe, expect, it } from 'vitest'
import { assessExerciseDevelopment, exerciseDevelopmentScore } from './exercise-development-engine'
import { exercises } from './seed'
import type { CompletedSetRecord, SurveyRecord } from './types'

const bench = exercises.find((exercise) => exercise.id === 'competition-bench')!
const setFor = (sessionId: string, completedAt: string, load = 185, over: Partial<CompletedSetRecord> = {}): CompletedSetRecord => ({
  id: `${sessionId}-set`, sessionId, exerciseId: bench.id, exerciseName: bench.name, family: bench.family,
  primaryRegion: bench.primaryRegion, completedAt, reps: 8, load, rir: 2, rirKnown: true,
  technique: 4, pain: 0, qualityConfirmed: true, setIndex: 0, numbersEntered: true, ...over
})
const surveyFor = (sessionId: string, answers: Record<string, number>): SurveyRecord => ({
  id: `${sessionId}-survey`, sessionId, type: 'movement', completedAt: '2026-09-01T12:00:00.000Z', skipped: false,
  exerciseId: bench.id, exerciseName: bench.name, plannedExerciseId: `${sessionId}-planned`, sourceSetIds: [`${sessionId}-set`],
  answers: Object.entries(answers).map(([id, value]) => ({ id, value, status: 'answered' as const }))
})

describe('assessExerciseDevelopment', () => {
  it('keeps a productive movement after a multi-week exact trial', () => {
    const result = assessExerciseDevelopment({
      exercise: bench,
      history: [setFor('s1', '2026-08-01T12:00:00.000Z', 180), setFor('s2', '2026-08-15T12:00:00.000Z'), setFor('s3', '2026-09-01T12:00:00.000Z', 190)],
      surveys: [surveyFor('s3', { movementPain: 0, movementTechnique: 5, targetStimulus: 5, recovery: 4 })]
    })
    expect(result).toMatchObject({ action: 'keep', label: 'Keep suggested', evidence: { exactSessions: 3, performance: 'improved' } })
    expect(exerciseDevelopmentScore(result)).toBeGreaterThan(0)
  })

  it('prevents novelty churn when the movement has not had a several-week trial', () => {
    const result = assessExerciseDevelopment({ exercise: bench, history: [setFor('s1', '2026-09-01T12:00:00.000Z')], surveys: [] })
    expect(result).toMatchObject({ action: 'keep-learning', evidence: { exactSessions: 1, observedDays: 0 } })
    expect(result.reason).toContain('too little evidence for exercise churn')
  })

  it('flags pain that changed training before the next block', () => {
    const result = assessExerciseDevelopment({ exercise: bench, history: [setFor('s1', '2026-09-01T12:00:00.000Z')], surveys: [surveyFor('s1', { movementPain: 4 })] })
    expect(result).toMatchObject({ action: 'change', tone: 'warning', evidence: { maximumPain: 4 } })
  })

  it('reviews repeated low stimulus without clear improvement', () => {
    const history = [setFor('s1', '2026-08-01T12:00:00.000Z'), setFor('s2', '2026-08-15T12:00:00.000Z'), setFor('s3', '2026-09-01T12:00:00.000Z')]
    const surveys = ['s1', 's2', 's3'].map((id) => surveyFor(id, { targetStimulus: 1, movementPain: 0 }))
    expect(assessExerciseDevelopment({ exercise: bench, history, surveys }).action).toBe('review')
  })

  it('excludes athlete-added and structured fatigue work from the stable trial', () => {
    const history = [
      setFor('s1', '2026-08-01T12:00:00.000Z'),
      setFor('s2', '2026-08-15T12:00:00.000Z', 185, { athleteAdded: true }),
      setFor('s3', '2026-09-01T12:00:00.000Z', 185, { grouping: { groupId: 'drop', groupKind: 'drop-set', groupRole: 'drop', groupPosition: 1 } })
    ]
    expect(assessExerciseDevelopment({ exercise: bench, history, surveys: [] }).evidence.exactSessions).toBe(1)
  })

  it('keeps a block review scoped to feedback from the selected source sessions', () => {
    const history = [setFor('current', '2026-09-01T12:00:00.000Z')]
    const surveys = [surveyFor('other-block', { movementPain: 4 })]
    const result = assessExerciseDevelopment({ exercise: bench, history, surveys, sessionIds: new Set(['current']) })
    expect(result).toMatchObject({ action: 'keep-learning', evidence: { maximumPain: 0 } })
  })
})
