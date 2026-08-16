import { describe, expect, it } from 'vitest'
import {
  calibrationStateLabels,
  checkInAgeLabels,
  checkInDepthLabels,
  continuityLabels,
  evidenceStrengthLabels,
  noCheckInPlanLabel,
  progressionActionLabels,
  readinessPlanLabels,
  scheduleChangeLabels,
  scheduleReadinessActionLabels
} from './readable-labels'
import type { EvidenceConfidence, ProgressionAction, ReadinessOutcome } from './types'

const readinessOutcomes: ReadinessOutcome[] = ['normal', 'confirm', 'protect', 'reacclimate', 'pain-aware']
const confidences: EvidenceConfidence[] = ['low', 'medium', 'high']
const actions: ProgressionAction[] = ['load', 'reps', 'sets', 'hold', 'reduce', 'reacclimate']

const codeMaps = [continuityLabels, scheduleChangeLabels, checkInAgeLabels, scheduleReadinessActionLabels, calibrationStateLabels]

const allLabels = [
  noCheckInPlanLabel,
  ...readinessOutcomes.map((outcome) => readinessPlanLabels[outcome]),
  ...confidences.flatMap((confidence) => [checkInDepthLabels[confidence], evidenceStrengthLabels[confidence]]),
  ...actions.map((action) => progressionActionLabels[action]),
  ...codeMaps.flatMap((map) => Object.values(map))
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
    const internalWords = /\b(survey|engine|confidence|readiness|progression|calibration|uncalibrated|evidence strength|baseline plan|hold|reduce|reacclimate|reacclimation|normal|protect|confirm|stale|proceed|blocked|defer|rebuild|interrupted|unknown)\b/i
    allLabels.forEach((label) => expect(label, `"${label}" reads as internal vocabulary`).not.toMatch(internalWords))
  })

  it('keeps each label short enough for a status chip and written as plain words', () => {
    allLabels.forEach((label) => {
      expect(label.length, `"${label}" is too long for a chip`).toBeLessThanOrEqual(24)
      // A stored code is all lowercase and joined by hyphens or underscores. Ordinary hyphenated
      // English like "warm-up" and "check-in" is fine, so only flag labels that are entirely code-shaped.
      expect(label, `"${label}" should read as a phrase, not a code`).not.toMatch(/^[a-z]+([-_][a-z]+)+$/)
      expect(label[0], `"${label}" should start capitalised`).toBe(label[0].toUpperCase())
    })
  })

  it('leaves no stored code without a phrase, across every code map', () => {
    codeMaps.forEach((map) => Object.entries(map).forEach(([code, label]) => {
      expect(label, `${code} has no athlete-facing phrase`).toBeTruthy()
      expect(label.toLowerCase(), `${code} still reads as its stored code`).not.toBe(code.replaceAll('-', ' '))
    }))
  })

  it('distinguishes how much the athlete told us from how much training evidence exists', () => {
    expect(checkInDepthLabels.low).not.toBe(evidenceStrengthLabels.low)
    expect(new Set(allLabels).size).toBeGreaterThanOrEqual(allLabels.length - 1)
  })
})
