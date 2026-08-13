import { describe, expect, it } from 'vitest'
import { buildAddedMovement, buildAddedSet, sessionExtensionGate } from './session-extension-engine'
import type { CompletedSetRecord, Exercise, SetPrescription } from './types'

const exercise: Exercise = {
  id: 'cable-row', name: 'Cable Row', family: 'Row', aliases: [], pattern: 'horizontal-pull',
  regions: ['back'], primaryRegion: 'back', equipment: ['cable station'], description: 'Row.',
  roleTags: ['accessory'], favorite: false, jointFeeling: 'good'
}

const setFor = (id: string, load: number, reps: number, completedAt: string): CompletedSetRecord => ({
  id, sessionId: 'session-1', exerciseId: 'cable-row', exerciseName: 'Cable Row', family: 'Row',
  primaryRegion: 'back', completedAt, reps, load, rir: 2, technique: 4, pain: 0, setIndex: 0
})

const prescription = (id: string, load: number, reps: number, rir: number): SetPrescription =>
  ({ id, targetLoad: load, targetReps: reps, targetRir: rir, completed: true })

describe('sessionExtensionGate', () => {
  it('allows extra work in an open session with normal readiness', () => {
    const gate = sessionExtensionGate({ sessionStatus: 'active', readiness: 'normal', painReported: false })
    expect(gate.allowed).toBe(true)
    expect(gate.caution).toContain('unrestricted')
    expect(gate.caution).toContain('microcycle or mesocycle')
  })

  it('refuses extra work when the session is not open', () => {
    expect(sessionExtensionGate({ sessionStatus: 'completed', readiness: 'normal', painReported: false }).allowed).toBe(false)
    expect(sessionExtensionGate({ sessionStatus: 'planned', readiness: 'normal', painReported: false }).allowed).toBe(false)
  })

  it('refuses extra work when the session recorded pain that changed training', () => {
    const reported = sessionExtensionGate({ sessionStatus: 'active', readiness: 'normal', painReported: true })
    expect(reported.allowed).toBe(false)
    expect(reported.reason).toContain('recorded pain')
    expect(sessionExtensionGate({ sessionStatus: 'active', readiness: 'pain-aware', painReported: false }).allowed).toBe(false)
  })

  it('allows but cautions reduced readiness instead of blocking the athlete', () => {
    for (const readiness of ['protect', 'reacclimate'] as const) {
      const gate = sessionExtensionGate({ sessionStatus: 'active', readiness, painReported: false })
      expect(gate.allowed).toBe(true)
      expect(gate.caution).toContain(readiness)
    }
  })
})

describe('buildAddedSet', () => {
  it('repeats the last prescribed target rather than progressing it', () => {
    const added = buildAddedSet({ sets: [prescription('set-1', 100, 8, 2), prescription('set-2', 110, 6, 1)], id: 'set-added-1' })
    expect(added).toMatchObject({ id: 'set-added-1', targetLoad: 110, targetReps: 6, targetRir: 1, completed: false, athleteAdded: true })
  })

  it('never carries completion or actual values from the template set', () => {
    const template: SetPrescription = { ...prescription('set-1', 100, 8, 2), completedLoad: 120, completedReps: 5, actualRir: 0 }
    const added = buildAddedSet({ sets: [template], id: 'set-added-1' })
    expect(added.completed).toBe(false)
    expect(added.completedLoad).toBeUndefined()
    expect(added.completedReps).toBeUndefined()
    expect(added.actualRir).toBeUndefined()
  })

  it('falls back to an explicit unloaded target when no set exists to copy', () => {
    expect(buildAddedSet({ sets: [], id: 'set-added-1' })).toMatchObject({ targetLoad: 0, targetReps: 8, targetRir: 2, athleteAdded: true })
  })
})

describe('buildAddedMovement', () => {
  const base = { id: 'planned-added-1', setIdPrefix: 'set-added-1', exercise }

  it('never takes the primary role, so it cannot become placement evidence', () => {
    const planned = buildAddedMovement({ ...base, history: [] })
    expect(planned.role).toBe('tertiary')
    expect(planned.optional).toBe(true)
    expect(planned.athleteAdded).toBe(true)
  })

  it('marks every generated set as athlete-added with a unique id', () => {
    const planned = buildAddedMovement({ ...base, history: [], setCount: 3 })
    expect(planned.sets).toHaveLength(3)
    expect(planned.sets.every((workSet) => workSet.athleteAdded)).toBe(true)
    expect(new Set(planned.sets.map((workSet) => workSet.id)).size).toBe(3)
  })

  it('stays an explicit unloaded calibration when no exact history exists', () => {
    const planned = buildAddedMovement({ ...base, history: [] })
    expect(planned.prescriptionMethod).toBe('baseline-calibration')
    expect(planned.sets[0].targetLoad).toBe(0)
    expect(planned.prescriptionNote).toContain('No exact Cable Row history')
  })

  it('repeats the latest exact exposure without progressing it', () => {
    const history = [
      setFor('a', 100, 10, '2026-08-01T12:00:00.000Z'),
      setFor('b', 135, 8, '2026-08-09T12:00:00.000Z')
    ]
    const planned = buildAddedMovement({ ...base, history })
    expect(planned.prescriptionMethod).toBe('exact-history')
    expect(planned.sets.every((workSet) => workSet.targetLoad === 135 && workSet.targetReps === 8)).toBe(true)
    expect(planned.prescriptionNote).toContain('135 × 8')
  })

  it('ignores history belonging to other movements', () => {
    const history = [{ ...setFor('a', 999, 3, '2026-08-09T12:00:00.000Z'), exerciseId: 'bench-press' }]
    expect(buildAddedMovement({ ...base, history }).prescriptionMethod).toBe('baseline-calibration')
  })

  it('bounds the set count to a sane range', () => {
    expect(buildAddedMovement({ ...base, history: [], setCount: 0 }).sets).toHaveLength(1)
    expect(buildAddedMovement({ ...base, history: [], setCount: 99 }).sets).toHaveLength(6)
  })
})
