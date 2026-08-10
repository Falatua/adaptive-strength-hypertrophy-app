import { describe, expect, it } from 'vitest'
import { buildDeferredFeedbackRequest, expireDeferredFeedbackRequests, pendingDeferredFeedback, questionsForSurvey, summarizeSurveyEvidence } from './survey-engine'
import type { DeferredFeedbackRequest, SurveyAnswer } from './types'

describe('survey burden and missing evidence', () => {
  it('uses stable full, quick, minimal, and off question budgets', () => {
    expect(questionsForSurvey('pre', 'full')).toHaveLength(10)
    expect(questionsForSurvey('pre', 'quick')).toHaveLength(5)
    expect(questionsForSurvey('pre', 'minimal').map((question) => question.id)).toEqual(['energy', 'pain', 'time'])
    expect(questionsForSurvey('post', 'full')).toHaveLength(10)
    expect(questionsForSurvey('post', 'quick')).toHaveLength(5)
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
