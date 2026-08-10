import { describe, expect, it } from 'vitest'
import { buildPlacementHistoryEvidence, placementHistoryEvidenceError } from './placement-history-engine'
import type { CompletedSetRecord, Exercise } from './types'

const exercise = { id: 'competition-bench', name: 'Competition Bench Press' } satisfies Pick<Exercise, 'id' | 'name'>
const set = (id: string, date: string, overrides: Partial<CompletedSetRecord> = {}): CompletedSetRecord => ({
  id, sessionId: `session-${id}`, exerciseId: exercise.id, exerciseName: exercise.name, family: 'Bench Press', primaryRegion: 'chest',
  completedAt: `${date}T12:00:00.000Z`, reps: 5, load: 185, rir: 2, rirKnown: true, technique: 0, pain: 0, qualityConfirmed: false, setIndex: 0,
  ...overrides
})

describe('placement-history-v1', () => {
  it('turns recent numeric-only imports into bounded review suggestions without inferring skill or pain', () => {
    const history = [
      set('a1', '2026-08-01', { importBatchId: 'batch', importSourceName: 'log.csv' }), set('a2', '2026-08-01', { importBatchId: 'batch', importSourceName: 'log.csv' }),
      set('b1', '2026-08-04', { importBatchId: 'batch', importSourceName: 'log.csv' }), set('b2', '2026-08-04', { importBatchId: 'batch', importSourceName: 'log.csv' }),
      set('c1', '2026-08-07', { importBatchId: 'batch', importSourceName: 'log.csv' }), set('c2', '2026-08-07', { importBatchId: 'batch', importSourceName: 'log.csv' })
    ]
    const evidence = buildPlacementHistoryEvidence({ exercise, history, assessedAt: '2026-08-10T12:00:00.000Z' })
    expect(evidence).toMatchObject({ basis: 'recent-window', totalSetCount: 6, recentSetCount: 6, recentExposureDateCount: 3, recentImportedSetCount: 6, suggestedDataConfidence: 4, suggestedStrengthTolerance: 3 })
    expect(evidence.sourceSetIds).toHaveLength(6)
    expect(evidence.limitations.join(' ')).toMatch(/numeric-only.*never infers movement skill, pain status/i)
    expect(placementHistoryEvidenceError(evidence)).toBeNull()
  })

  it('requires repeated quality-confirmed exact evidence for the highest suggestions', () => {
    const history = ['01', '01', '04', '04', '07', '07'].map((date, index) => set(`q${index}`, `2026-08-${date}`, { qualityConfirmed: true, technique: 4, pain: 0 }))
    const evidence = buildPlacementHistoryEvidence({ exercise, history, assessedAt: '2026-08-10T12:00:00.000Z' })
    expect(evidence).toMatchObject({ suggestedDataConfidence: 5, suggestedStrengthTolerance: 5, recentQualityConfirmedSetCount: 6 })
  })

  it('keeps stale and absent evidence conservative and never borrows another exercise', () => {
    const stale = buildPlacementHistoryEvidence({ exercise, history: [set('old', '2026-01-01'), set('other', '2026-08-09', { exerciseId: 'incline-bench', exerciseName: 'Incline Bench Press' })], assessedAt: '2026-08-10T12:00:00.000Z' })
    expect(stale).toMatchObject({ basis: 'latest-stale', totalSetCount: 1, recentSetCount: 0, suggestedDataConfidence: 2, suggestedStrengthTolerance: null, sourceSetIds: ['old'] })
    const absent = buildPlacementHistoryEvidence({ exercise, history: [set('other', '2026-08-09', { exerciseId: 'incline-bench', exerciseName: 'Incline Bench Press' })], assessedAt: '2026-08-10T12:00:00.000Z' })
    expect(absent).toMatchObject({ basis: 'none', totalSetCount: 0, suggestedDataConfidence: 1, suggestedStrengthTolerance: null })
  })

  it('rejects altered provenance and invalid windows', () => {
    const evidence = buildPlacementHistoryEvidence({ exercise, history: [set('one', '2026-08-09')], assessedAt: '2026-08-10T12:00:00.000Z' })
    expect(placementHistoryEvidenceError({ ...evidence, recentSetCount: 2 })).toMatch(/reconcile|reference/i)
    expect(placementHistoryEvidenceError({ ...evidence, suggestedDataConfidence: 5 })).toMatch(/suggestions/i)
    expect(() => buildPlacementHistoryEvidence({ exercise, history: [], assessedAt: '2026-08-10T12:00:00.000Z', windowDays: 1 })).toThrow(/7 to 365/i)
  })
})
