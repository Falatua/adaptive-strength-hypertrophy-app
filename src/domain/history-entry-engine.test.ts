import { describe, expect, it } from 'vitest'
import { exercises } from './seed'
import { buildHistoricalPerformance, historicalPerformanceError, normalizeHistoricalLoad } from './history-entry-engine'
import { buildMovementCalibrationEvidence } from './ongoing-confidence-engine'
import { buildAddedMovement } from './session-extension-engine'

const incline = exercises.find((exercise) => exercise.id === 'incline-barbell-press')!

describe('athlete-entered historical performance', () => {
  it('turns the athlete example into exact, angle-aware source sets', () => {
    const projection = buildHistoricalPerformance({
      entryId: 'incline-example',
      exercise: incline,
      appUnits: 'lb',
      enteredAt: '2026-08-26T20:00:00.000Z',
      now: new Date('2026-08-26T20:00:00.000Z'),
      form: {
        exerciseId: incline.id,
        completedAt: '2026-08-26T12:00:00.000Z',
        setCount: 3,
        reps: 8,
        load: 135,
        loadUnit: 'lb',
        effortScale: 'rir',
        effortValue: 0,
        benchAngleDeg: 45,
        technique: null,
        pain: null,
        sessionName: 'Upper training',
        note: 'Same bench and grip across all sets.'
      }
    })
    expect(projection.records).toHaveLength(3)
    expect(projection.records[2]).toMatchObject({
      exerciseId: incline.id, load: 135, reps: 8, rir: 0, rirKnown: true, benchAngleDeg: 45,
      qualityConfirmed: false, numbersEntered: true, setIndex: 2, historyEntrySource: 'library',
      historyEntryEffortScale: 'rir', historyEntryEffortValue: 0, historyEntryUnits: 'lb'
    })
    expect(buildMovementCalibrationEvidence({ exercise: incline, history: projection.records, assessedAt: '2026-08-26T20:00:00.000Z' })).toMatchObject({
      exactSetCount: 3, recentSetCount: 3, recordedAngleContexts: ['45°'], rirCoverage: 1, qualityCoverage: 0
    })
    const futureProgramming = buildAddedMovement({ id: 'planned-incline', setIdPrefix: 'planned-set', exercise: incline, history: projection.records })
    expect(futureProgramming.prescriptionMethod).toBe('exact-history')
    expect(futureProgramming.sets.every((workSet) => workSet.targetLoad === 135 && workSet.targetReps === 8)).toBe(true)
  })

  it('preserves entered RPE while converting it to the shared RIR evidence scale', () => {
    const projection = buildHistoricalPerformance({
      entryId: 'rpe-entry', exercise: incline, appUnits: 'lb', now: new Date('2026-08-26T20:00:00.000Z'),
      form: { exerciseId: incline.id, completedAt: '2026-08-25T12:00:00.000Z', setCount: 1, reps: 6, load: 100, loadUnit: 'kg', effortScale: 'rpe', effortValue: 9, technique: 4, pain: 0 }
    })
    expect(projection.records[0]).toMatchObject({ load: 220.5, rir: 1, qualityConfirmed: true, historyEntryEffortScale: 'rpe', historyEntryEffortValue: 9, historyEntryUnits: 'kg' })
    expect(normalizeHistoricalLoad(220.5, 'lb', 'kg')).toBe(100)
  })

  it('keeps unknown fields unknown and blocks impossible history', () => {
    const base = { exerciseId: incline.id, completedAt: '2026-08-25T12:00:00.000Z', setCount: 3, reps: 8, load: 135, loadUnit: 'lb' as const, effortScale: 'unknown' as const, effortValue: null }
    expect(buildHistoricalPerformance({ entryId: 'unknown', exercise: incline, appUnits: 'lb', form: base }).records[0]).toMatchObject({ rir: 0, rirKnown: false, qualityConfirmed: false })
    expect(historicalPerformanceError({ ...base, completedAt: '2026-08-27T12:00:00.000Z' }, incline, new Date('2026-08-26T12:00:00.000Z'))).toMatch(/future/i)
    expect(historicalPerformanceError({ ...base, setCount: 0 }, incline)).toMatch(/sets/i)
    expect(historicalPerformanceError({ ...base, effortScale: 'rpe', effortValue: 11 }, incline)).toMatch(/RPE/i)
  })
})
