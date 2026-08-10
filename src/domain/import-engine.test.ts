import { describe, expect, it } from 'vitest'
import { exercises } from './seed'
import { buildTrainingHistoryImport, parseTrainingHistoryCsv } from './import-engine'

describe('training-history CSV import', () => {
  it('preserves source dates, converts units, and auto-maps only exact identities', () => {
    const preview = parseTrainingHistoryCsv({
      raw: 'date,exercise,weight,repetitions,rir,session\n2026-01-05,"Bench",100,5,2,"Upper, A"\n2026-01-06,Mystery Press,80,8,,Upper B',
      sourceName: 'old-log.csv',
      sourceUnits: 'kg',
      appUnits: 'lb',
      exercises
    })
    expect(preview.errors).toEqual([])
    expect(preview.rows).toHaveLength(2)
    expect(preview.rows[0]).toMatchObject({ sourceExerciseName: 'Bench', sourceSessionName: 'Upper, A', sourceLoad: 100, normalizedLoad: 220.5, reps: 5, rir: 2, rirKnown: true })
    expect(preview.rows[0].sourceDate.startsWith('2026-01-05')).toBe(true)
    expect(preview.rows[1]).toMatchObject({ rir: 0, rirKnown: false })
    expect(preview.mappings.find((mapping) => mapping.sourceExerciseName === 'Bench')).toMatchObject({ status: 'exact', exactExerciseId: 'competition-bench' })
    expect(preview.mappings.find((mapping) => mapping.sourceExerciseName === 'Mystery Press')).toMatchObject({ status: 'unmatched', exactExerciseId: null })
    expect(preview.convertedLoads).toBe(2)
  })

  it('requires every uncertain identity choice and preserves reversible source provenance', () => {
    const preview = parseTrainingHistoryCsv({
      raw: 'date,exercise,load,reps,session\n2026-01-05,Bench,185,5,Upper A\n2026-01-05,Mystery Press,95,12,Upper A',
      sourceName: 'notebook.csv', sourceUnits: 'lb', appUnits: 'lb', exercises
    })
    expect(() => buildTrainingHistoryImport({
      preview,
      exerciseMappings: { Bench: 'competition-bench' },
      exercises,
      existingHistory: [],
      batchId: 'batch-one'
    })).toThrow('Choose one canonical movement for: Mystery Press.')

    const projection = buildTrainingHistoryImport({
      preview,
      exerciseMappings: { Bench: 'competition-bench', 'Mystery Press': 'coffin-press' },
      exercises,
      existingHistory: [],
      batchId: 'batch-one'
    })
    expect(projection.records).toHaveLength(2)
    expect(projection.records[0]).toMatchObject({
      id: 'import-set-batch-one-2', exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press',
      originalExerciseName: 'Bench', importSourceName: 'notebook.csv', importRow: 2, importUnits: 'lb', qualityConfirmed: false
    })
    expect(projection.records[0].originalExerciseId).toBeUndefined()
    expect(projection.records[0].sessionId).toBe(projection.records[1].sessionId)
    expect(projection.records[1]).toMatchObject({ exerciseId: 'coffin-press', originalExerciseName: 'Mystery Press' })

    const repeated = buildTrainingHistoryImport({
      preview,
      exerciseMappings: { Bench: 'competition-bench', 'Mystery Press': 'coffin-press' },
      exercises,
      existingHistory: projection.records,
      batchId: 'batch-two'
    })
    expect(repeated).toEqual({ records: [], skippedDuplicates: 2 })
  })

  it('distinguishes repeated identical sets so one deleted occurrence can be restored', () => {
    const preview = parseTrainingHistoryCsv({
      raw: 'date,exercise,load,reps,session\n2026-01-05,Bench,185,5,Upper A\n2026-01-05,Bench,185,5,Upper A',
      sourceName: 'repeated.csv', sourceUnits: 'lb', appUnits: 'lb', exercises
    })
    expect(preview.rows[0].fingerprint).not.toBe(preview.rows[1].fingerprint)
    const first = buildTrainingHistoryImport({ preview, exerciseMappings: { Bench: 'competition-bench' }, exercises, existingHistory: [], batchId: 'first' })
    const restored = buildTrainingHistoryImport({ preview, exerciseMappings: { Bench: 'competition-bench' }, exercises, existingHistory: [first.records[0]], batchId: 'restore' })
    expect(restored.skippedDuplicates).toBe(1)
    expect(restored.records).toHaveLength(1)
    expect(restored.records[0].importFingerprint).toBe(first.records[1].importFingerprint)
  })

  it('blocks invalid or ambiguous source rows before projection', () => {
    const preview = parseTrainingHistoryCsv({
      raw: 'date,exercise,load,reps,rir\n01/05/2026,Bench,-5,0,11',
      sourceName: 'bad.csv', sourceUnits: 'lb', appUnits: 'lb', exercises
    })
    expect(preview.rows).toEqual([])
    expect(preview.errors).toEqual([
      'Row 2: date must use YYYY-MM-DD or an ISO date and time.',
      'Row 2: load must be zero or greater.',
      'Row 2: reps must be a whole number from 1 to 1000.',
      'Row 2: RIR must be blank or a number from 0 to 10.'
    ])
    expect(() => buildTrainingHistoryImport({ preview, exerciseMappings: {}, exercises, existingHistory: [], batchId: 'bad' })).toThrow('Fix every invalid CSV row before importing.')
  })

  it('rejects missing headers and unclosed quoted fields', () => {
    expect(() => parseTrainingHistoryCsv({ raw: 'date,exercise\n2026-01-01,Bench', sourceName: 'short.csv', sourceUnits: 'lb', appUnits: 'lb', exercises })).toThrow('Missing required columns: load, reps.')
    expect(() => parseTrainingHistoryCsv({ raw: 'date,exercise,load,reps\n2026-01-01,"Bench,185,5', sourceName: 'quoted.csv', sourceUnits: 'lb', appUnits: 'lb', exercises })).toThrow('unclosed quoted field')
  })
})
