import { describe, expect, it } from 'vitest'
import { questionsForSurvey, summarizeSurveyEvidence } from './survey-engine'
import type { SurveyAnswer } from './types'

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
})
