import { describe, expect, it } from 'vitest'
import { buildMovementCalibrationEvidence, buildOngoingConfidenceModel } from './ongoing-confidence-engine'
import { exercises } from './seed'
import type { CompletedSetRecord } from './types'

const assessedAt = '2026-08-13T12:00:00.000Z'
const bench = exercises.find((exercise) => exercise.id === 'competition-bench')!
const workSet = (id: string, completedAt: string, overrides: Partial<CompletedSetRecord> = {}): CompletedSetRecord => ({
  id,
  sessionId: `session-${id}`,
  exerciseId: bench.id,
  exerciseName: bench.name,
  family: bench.family,
  primaryRegion: bench.primaryRegion,
  completedAt,
  reps: 5,
  load: 225,
  rir: 2,
  rirKnown: true,
  technique: 4,
  pain: 0,
  qualityConfirmed: true,
  setIndex: 0,
  ...overrides
})

describe('ongoing confidence model', () => {
  it('keeps no history uncalibrated instead of treating missing evidence as poor performance', () => {
    const result = buildMovementCalibrationEvidence({ exercise: bench, history: [], assessedAt })
    expect(result).toMatchObject({ state: 'uncalibrated', evidenceStrength: 0, exactSetCount: 0, daysSinceLatest: null })
    expect(result.nextLearningNeed).toMatch(/one non-maximal/i)
  })

  it('earns current movement confidence from repeated exact, complete evidence', () => {
    const history = [
      workSet('a', '2026-07-20T12:00:00.000Z'),
      workSet('b', '2026-07-27T12:00:00.000Z'),
      workSet('c', '2026-08-03T12:00:00.000Z'),
      workSet('d', '2026-08-10T12:00:00.000Z')
    ]
    const result = buildMovementCalibrationEvidence({ exercise: bench, history, assessedAt })
    expect(result).toMatchObject({ state: 'well-calibrated', evidenceStrength: 5, exactSetCount: 4, exposureDateCount: 4, comparableExposureDateCount: 4 })
    expect(result.sourceSetIds).toEqual(['a', 'b', 'c', 'd'])
  })

  it('marks useful old history stale without deleting or rewriting it', () => {
    const history = [workSet('old', '2026-04-01T12:00:00.000Z')]
    const result = buildMovementCalibrationEvidence({ exercise: bench, history, assessedAt })
    expect(result.state).toBe('stale')
    expect(result.sourceSetIds).toEqual(['old'])
    expect(result.explanation).toMatch(/history stays visible/i)
  })

  it('keeps decision confidence in separate lanes', () => {
    const model = buildOngoingConfidenceModel({
      strengthAnchorIds: [bench.id],
      exercises,
      history: [workSet('one', '2026-08-10T12:00:00.000Z')],
      sessions: [], surveys: [], placementVerifications: [], missedOpportunityEvents: [], assessedAt
    })
    expect(model.ruleVersion).toBe('ongoing-confidence-v1')
    expect(model.lanes.map((lane) => lane.id)).toEqual(['main-lift-prescriptions', 'schedule-fit', 'recovery-response', 'volume-tolerance'])
    expect(model.lanes.find((lane) => lane.id === 'main-lift-prescriptions')?.evidenceCount).toBe(1)
    expect(model.lanes.find((lane) => lane.id === 'recovery-response')).toMatchObject({ state: 'uncalibrated', evidenceCount: 0 })
    expect(model.summary).toMatch(/Missing answers lower certainty only/i)
  })
})
