import { describe, expect, it } from 'vitest'
import {
  checkInDepthLabels,
  evidenceStrengthLabels,
  noCheckInPlanLabel,
  progressionActionLabels,
  readinessPlanLabels
} from './readable-labels'
import type { EvidenceConfidence, ProgressionAction, ReadinessOutcome } from './types'

const readinessOutcomes: ReadinessOutcome[] = ['normal', 'confirm', 'protect', 'reacclimate', 'pain-aware']
const confidences: EvidenceConfidence[] = ['low', 'medium', 'high']
const actions: ProgressionAction[] = ['load', 'reps', 'sets', 'hold', 'reduce', 'reacclimate']

const allLabels = [
  noCheckInPlanLabel,
  ...readinessOutcomes.map((outcome) => readinessPlanLabels[outcome]),
  ...confidences.flatMap((confidence) => [checkInDepthLabels[confidence], evidenceStrengthLabels[confidence]]),
  ...actions.map((action) => progressionActionLabels[action])
]

describe('athlete-facing labels for stored codes', () => {
  it('covers every stored code so no screen can fall back to the raw value', () => {
    readinessOutcomes.forEach((outcome) => expect(readinessPlanLabels[outcome]).toBeTruthy())
    confidences.forEach((confidence) => {
      expect(checkInDepthLabels[confidence]).toBeTruthy()
      expect(evidenceStrengthLabels[confidence]).toBeTruthy()
    })
    actions.forEach((action) => expect(progressionActionLabels[action]).toBeTruthy())
  })

  it('never shows an athlete the stored code or the internal words for it', () => {
    const internalWords = /\b(survey|engine|confidence|readiness|progression|baseline plan|hold|reduce|reacclimate|normal|protect|confirm)\b/i
    allLabels.forEach((label) => expect(label, `"${label}" reads as internal vocabulary`).not.toMatch(internalWords))
  })

  it('keeps each label short enough for a status chip and written as plain words', () => {
    allLabels.forEach((label) => {
      expect(label.length, `"${label}" is too long for a chip`).toBeLessThanOrEqual(22)
      expect(label, `"${label}" should read as a phrase, not a code`).not.toMatch(/[_-]{1}[a-z]+$|^[a-z]+-[a-z]+$/)
      expect(label[0], `"${label}" should start capitalised`).toBe(label[0].toUpperCase())
    })
  })

  it('distinguishes how much the athlete told us from how much training evidence exists', () => {
    expect(checkInDepthLabels.low).not.toBe(evidenceStrengthLabels.low)
    expect(new Set(allLabels).size).toBeGreaterThanOrEqual(allLabels.length - 1)
  })
})
