import { describe, expect, it } from 'vitest'
import { latestMovementFeedback, movementFeedbackMatchesCompletedSets, movementFeedbackMode, movementFeedbackPreview, movementFeedbackQuestions } from './movement-feedback-engine'
import type { PlannedExercise, SurveyRecord } from './types'

const planned: PlannedExercise = {
  id: 'planned-1', exerciseId: 'bench', role: 'primary', purpose: 'Press', restSeconds: 120, estimatedMinutes: 12, optional: false,
  sets: [
    { id: 'set-1', targetLoad: 135, targetReps: 10, targetRir: 3, completed: true },
    { id: 'set-2', targetLoad: 135, targetReps: 10, targetRir: 3, completed: true }
  ]
}

describe('movement feedback questions', () => {
  it('keeps the ordinary intra-workout check brief and adds recovery only after prior exact work', () => {
    expect(movementFeedbackMode('ask')).toBe('quick')
    expect(movementFeedbackQuestions('quick', false).map((question) => question.id)).toEqual(['movementPain', 'movementTechnique', 'targetStimulus', 'loadFit', 'volumeFit'])
    expect(movementFeedbackQuestions('quick', true).at(-1)?.id).toBe('recovery')
    expect(movementFeedbackQuestions('minimal', true).map((question) => question.id)).toEqual(['movementPain', 'loadFit', 'volumeFit', 'recovery'])
  })

  it('turns pain, excessive volume, and hard load feedback into conservative previews', () => {
    expect(movementFeedbackPreview([{ id: 'movementPain', value: 4, status: 'answered' }]).title).toMatch(/Review/)
    expect(movementFeedbackPreview([{ id: 'volumeFit', value: 4, status: 'answered' }]).title).toMatch(/Fewer sets/)
    expect(movementFeedbackPreview([{ id: 'loadFit', value: 5, status: 'answered' }]).title).toMatch(/Repeat or reduce/)
    expect(movementFeedbackPreview([{ id: 'volumeFit', value: 1, status: 'answered' }]).detail).toMatch(/recovery agree/)
  })
})

describe('movement feedback provenance', () => {
  const survey = (id: string, at: string, sourceSetIds: string[]): SurveyRecord => ({
    id, sessionId: 'session-1', type: 'movement', completedAt: at, skipped: false, answers: [],
    ruleVersion: 'movement-feedback-v1', plannedExerciseId: 'planned-1', exerciseId: 'bench', exerciseName: 'Bench Press', sourceSetIds
  })

  it('selects the latest response and proves which completed set list it described', () => {
    const first = survey('first', '2026-08-27T12:00:00.000Z', ['set-1'])
    const latest = survey('latest', '2026-08-27T12:01:00.000Z', ['set-1', 'set-2'])
    expect(latestMovementFeedback([latest, first], 'session-1', 'planned-1')?.id).toBe('latest')
    expect(movementFeedbackMatchesCompletedSets(latest, planned)).toBe(true)
    expect(movementFeedbackMatchesCompletedSets(first, planned)).toBe(false)
  })
})
