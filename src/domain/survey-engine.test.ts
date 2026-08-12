import { describe, expect, it } from 'vitest'
import { MAXIMUM_MUSCLE_QUESTIONS, buildDeferredFeedbackRequest, expireDeferredFeedbackRequests, muscleFeedbackQuestions, muscleQuestionId, parseMuscleQuestionId, pendingDeferredFeedback, questionsForSurvey, summarizeSurveyEvidence } from './survey-engine'
import type { DeferredFeedbackRequest, SurveyAnswer } from './types'

describe('survey burden and missing evidence', () => {
  it('uses stable full, quick, minimal, and off question budgets', () => {
    expect(questionsForSurvey('pre', 'full')).toHaveLength(10)
    expect(questionsForSurvey('pre', 'quick')).toHaveLength(5)
    expect(questionsForSurvey('pre', 'minimal').map((question) => question.id)).toEqual(['energy', 'pain', 'time'])
    // The post budget gained a reported duration, which calibrates future time estimates.
    expect(questionsForSurvey('post', 'full')).toHaveLength(11)
    expect(questionsForSurvey('post', 'quick')).toHaveLength(6)
    expect(questionsForSurvey('post', 'minimal').map((question) => question.id)).toEqual(['difficulty', 'technique', 'pain'])
    expect(questionsForSurvey('post', 'off')).toEqual([])
  })

  it('counts only explicit answers as evidence', () => {
    const answers: SurveyAnswer[] = [
      { id: 'pain', value: 0, status: 'answered' },
      { id: 'time', value: null, status: 'not-answered' },
      { id: 'energy', value: null, status: 'prefer-not' }
    ]
    expect(summarizeSurveyEvidence(answers, false)).toEqual({ answeredCount: 1, unknownCount: 2, confidence: 'low' })
  })

  it('never grants confidence to a skipped survey', () => {
    expect(summarizeSurveyEvidence([{ id: 'pain', value: 0, status: 'answered' }], true).confidence).toBe('low')
  })

  it('creates one optional 24-hour deferred-feedback window', () => {
    const created = buildDeferredFeedbackRequest({ id: 'later-1', sessionId: 'session-1', mode: 'minimal', now: new Date('2026-08-10T12:00:00.000Z') })
    expect(created).toEqual({
      id: 'later-1', sessionId: 'session-1', mode: 'minimal', status: 'pending',
      createdAt: '2026-08-10T12:00:00.000Z', expiresAt: '2026-08-11T12:00:00.000Z'
    })
  })

  it('expires deferred feedback without treating it as a training answer', () => {
    const request: DeferredFeedbackRequest = {
      id: 'later-1', sessionId: 'session-1', mode: 'quick', status: 'pending',
      createdAt: '2026-08-10T12:00:00.000Z', expiresAt: '2026-08-11T12:00:00.000Z'
    }
    expect(pendingDeferredFeedback([request], new Date('2026-08-11T11:59:00.000Z'))).toHaveLength(1)
    const expired = expireDeferredFeedbackRequests([request], new Date('2026-08-11T12:00:00.000Z'))[0]
    expect(expired.status).toBe('expired')
    expect(expired.resolvedAt).toBe('2026-08-11T12:00:00.000Z')
    expect(pendingDeferredFeedback([expired], new Date('2026-08-11T12:00:00.000Z'))).toEqual([])
  })
})

describe('per-muscle feedback questions', () => {
  const muscles = [
    { id: 'pectorals', label: 'Pectorals' }, { id: 'triceps', label: 'Triceps' },
    { id: 'biceps', label: 'Biceps' }, { id: 'quadriceps', label: 'Quadriceps' },
    { id: 'calves', label: 'Calves' }
  ]

  it('asks pump and stimulus for each trained muscle, capped so it stays answerable', () => {
    const questions = muscleFeedbackQuestions(muscles, 'full')
    expect(questions).toHaveLength(MAXIMUM_MUSCLE_QUESTIONS * 2)
    expect(questions[0].id).toBe(muscleQuestionId('pump', 'pectorals'))
    expect(questions[0].label).toContain('pectorals')
    expect(questions.some((question) => question.id.includes('calves'))).toBe(false)
  })

  it('asks only about stimulus in quick mode, the stronger of the two signals', () => {
    const questions = muscleFeedbackQuestions(muscles, 'quick')
    expect(questions.every((question) => question.id.startsWith('targetStimulus:'))).toBe(true)
  })

  it('asks nothing in minimal or off mode, or when no muscle was trained', () => {
    expect(muscleFeedbackQuestions(muscles, 'minimal')).toEqual([])
    expect(muscleFeedbackQuestions(muscles, 'off')).toEqual([])
    expect(muscleFeedbackQuestions([], 'full')).toEqual([])
  })

  it('round-trips a muscle answer id', () => {
    expect(parseMuscleQuestionId(muscleQuestionId('pump', 'pectorals'))).toEqual({ base: 'pump', muscle: 'pectorals' })
    expect(parseMuscleQuestionId('difficulty')).toBeNull()
  })

  it('gives every generated question readable scale endpoints', () => {
    expect(muscleFeedbackQuestions(muscles, 'full').every((question) => question.lowLabel && question.highLabel)).toBe(true)
  })
})
