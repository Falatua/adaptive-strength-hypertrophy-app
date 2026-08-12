import { describe, expect, it } from 'vitest'
import { buildDropSet, buildMyoReps, canPairForSuperset, isComparableExposure, progressSetStructure, structureAllowedForRole, structureTimeSaved, summarizeSetGroups } from './set-structure-engine'
import type { CompletedSetRecord, Exercise, SetPrescription } from './types'

const movement = (id: string, primaryRegion: Exercise['primaryRegion'], pattern: Exercise['pattern']): Exercise => ({
  id, name: id, family: 'Test', aliases: [], pattern, regions: [primaryRegion], primaryRegion,
  equipment: ['barbell'], description: 'Test.', roleTags: [], favorite: false, jointFeeling: 'good'
})

const topSet: SetPrescription = { id: 'set-1', targetLoad: 100, targetReps: 10, targetRir: 2, completed: false }

describe('structureAllowedForRole', () => {
  it('never allows a technique on the primary movement', () => {
    for (const kind of ['superset', 'drop-set', 'myo-reps'] as const) {
      const gate = structureAllowedForRole('primary', kind)
      expect(gate.allowed).toBe(false)
      expect(gate.reason).toContain('primary movement')
    }
  })

  it('allows only supersets on secondary work, which still drives the primary', () => {
    expect(structureAllowedForRole('secondary', 'superset').allowed).toBe(true)
    expect(structureAllowedForRole('secondary', 'drop-set').allowed).toBe(false)
    expect(structureAllowedForRole('secondary', 'myo-reps').allowed).toBe(false)
  })

  it('allows every technique on accessory and tertiary work', () => {
    for (const role of ['accessory', 'tertiary'] as const) {
      for (const kind of ['superset', 'drop-set', 'myo-reps'] as const) {
        expect(structureAllowedForRole(role, kind).allowed).toBe(true)
      }
    }
  })
})

describe('canPairForSuperset', () => {
  it('refuses a pair that trains the same primary muscle, which cuts volume load', () => {
    const gate = canPairForSuperset(movement('a', 'chest', 'horizontal-push'), movement('b', 'chest', 'vertical-push'))
    expect(gate.allowed).toBe(false)
    expect(gate.reason).toContain('cuts the volume load')
  })

  it('refuses pairing a movement with itself', () => {
    const bench = movement('bench', 'chest', 'horizontal-push')
    expect(canPairForSuperset(bench, bench).allowed).toBe(false)
  })

  it('recognises an opposing push and pull pair', () => {
    const gate = canPairForSuperset(movement('press', 'chest', 'horizontal-push'), movement('row', 'back', 'horizontal-pull'))
    expect(gate.allowed).toBe(true)
    expect(gate.reason).toContain('oppose each other')
  })

  it('allows different primary muscles that are not strict antagonists', () => {
    const gate = canPairForSuperset(movement('curl', 'biceps', 'isolation'), movement('calf', 'calves', 'isolation'))
    expect(gate.allowed).toBe(true)
    expect(gate.reason).toContain('different primary muscles')
  })
})

describe('buildDropSet', () => {
  it('keeps the top set intact and reduces each drop from the previous load', () => {
    const sets = buildDropSet({ topSet, groupId: 'g1', dropCount: 2, dropPercent: 0.2, increment: 5 })
    expect(sets).toHaveLength(3)
    expect(sets[0]).toMatchObject({ targetLoad: 100, targetReps: 10, targetRir: 2 })
    expect(sets[0].grouping).toMatchObject({ groupKind: 'drop-set', groupRole: 'top', groupPosition: 1 })
    expect(sets[1].targetLoad).toBe(80)
    expect(sets[2].targetLoad).toBe(65)
    expect(sets.slice(1).every((set) => set.grouping?.groupRole === 'drop')).toBe(true)
  })

  it('rounds every drop to a load the equipment can actually make', () => {
    const sets = buildDropSet({ topSet, groupId: 'g1', dropCount: 3, dropPercent: 0.15, increment: 10 })
    expect(sets.slice(1).every((set) => set.targetLoad % 10 === 0)).toBe(true)
  })

  it('gives every set a unique id and clears completion from the template', () => {
    const started: SetPrescription = { ...topSet, completed: true, completedLoad: 105, completedReps: 9, actualRir: 1 }
    const sets = buildDropSet({ topSet: started, groupId: 'g1' })
    expect(new Set(sets.map((set) => set.id)).size).toBe(sets.length)
    expect(sets.slice(1).every((set) => !set.completed && set.completedLoad === undefined)).toBe(true)
  })

  it('leaves drops unloaded when the top set has no load to strip from', () => {
    const unloaded: SetPrescription = { ...topSet, targetLoad: 0 }
    const sets = buildDropSet({ topSet: unloaded, groupId: 'g1', dropCount: 2, increment: 10 })
    expect(sets.every((set) => set.targetLoad === 0)).toBe(true)
  })

  it('bounds the drop count and percentage to sane values', () => {
    expect(buildDropSet({ topSet, groupId: 'g1', dropCount: 9 })).toHaveLength(4)
    expect(buildDropSet({ topSet, groupId: 'g1', dropCount: 0 })).toHaveLength(2)
    const steep = buildDropSet({ topSet, groupId: 'g1', dropCount: 1, dropPercent: 0.99, increment: 5 })
    expect(steep[1].targetLoad).toBe(50)
  })
})

describe('buildMyoReps', () => {
  it('keeps the activation set and adds short mini sets at zero reps in reserve', () => {
    const sets = buildMyoReps({ activationSet: topSet, groupId: 'g2', miniCount: 3, miniReps: 3 })
    expect(sets).toHaveLength(4)
    expect(sets[0].grouping).toMatchObject({ groupKind: 'myo-reps', groupRole: 'activation' })
    expect(sets[0].targetReps).toBe(10)
    expect(sets.slice(1).every((set) => set.targetReps === 3 && set.targetRir === 0)).toBe(true)
  })

  it('keeps mini sets at the activation load, since only the rep target shortens', () => {
    const sets = buildMyoReps({ activationSet: topSet, groupId: 'g2' })
    expect(sets.every((set) => set.targetLoad === 100)).toBe(true)
  })

  it('bounds the mini set count and reps', () => {
    expect(buildMyoReps({ activationSet: topSet, groupId: 'g2', miniCount: 99 })).toHaveLength(6)
    expect(buildMyoReps({ activationSet: topSet, groupId: 'g2', miniCount: 0 })).toHaveLength(3)
  })
})

describe('isComparableExposure', () => {
  it('treats a plain set as comparable', () => {
    expect(isComparableExposure(undefined)).toBe(true)
  })

  it('treats the progression-carrying set of each structure as comparable', () => {
    expect(isComparableExposure({ groupRole: 'top' })).toBe(true)
    expect(isComparableExposure({ groupRole: 'activation' })).toBe(true)
    expect(isComparableExposure({ groupRole: 'paired' })).toBe(true)
  })

  it('excludes drops and mini sets, so a technique week is not read as a regression', () => {
    expect(isComparableExposure({ groupRole: 'drop' })).toBe(false)
    expect(isComparableExposure({ groupRole: 'mini' })).toBe(false)
  })
})

describe('structureTimeSaved', () => {
  it('credits a superset with roughly half the rest across paired sets', () => {
    expect(structureTimeSaved('superset', 3, 90)).toBe(135)
  })

  it('credits drops and minis for the rest they skip between them', () => {
    expect(structureTimeSaved('drop-set', 3, 60)).toBe(90)
    expect(structureTimeSaved('myo-reps', 1, 60)).toBe(0)
  })
})

describe('structure-level progression', () => {
  const completed = (groupId: string, role: 'top' | 'drop', load: number, reps: number, at: string, position: number): CompletedSetRecord => ({
    id: `${groupId}-${position}`, sessionId: `session-${groupId}`, exerciseId: 'cable-row', exerciseName: 'Cable Row',
    family: 'Row', primaryRegion: 'back', completedAt: at, reps, load, rir: 0, technique: 4, pain: 0, setIndex: position - 1,
    grouping: { groupId, groupKind: 'drop-set', groupRole: role, groupPosition: position }
  })

  const block = (groupId: string, at: string, topLoad: number, reps: number[]) => [
    completed(groupId, 'top', topLoad, reps[0], at, 1),
    ...reps.slice(1).map((rep, index) => completed(groupId, 'drop', Math.round(topLoad * 0.8 ** (index + 1)), rep, at, index + 2))
  ]

  it('treats a drop set as one block of work rather than loose sets', () => {
    const groups = summarizeSetGroups(block('g1', '2026-08-01T12:00:00.000Z', 100, [10, 8, 6]))
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ setCount: 3, totalReps: 24, topLoad: 100, topReps: 10 })
    expect(groups[0].totalVolume).toBe(100 * 10 + 80 * 8 + 64 * 6)
  })

  it('excludes supersets, which are paired straight sets rather than one block', () => {
    const paired: CompletedSetRecord = { ...completed('g9', 'top', 100, 10, '2026-08-01T12:00:00.000Z', 1), grouping: { groupId: 'g9', groupKind: 'superset', groupRole: 'paired', groupPosition: 1 } }
    expect(summarizeSetGroups([paired])).toHaveLength(0)
  })

  it('calls the first block a baseline rather than inventing progress', () => {
    const decision = progressSetStructure({ groups: summarizeSetGroups(block('g1', '2026-08-01T12:00:00.000Z', 100, [10, 8, 6])) })
    expect(decision?.axis).toBe('baseline')
    expect(decision?.prior).toBeNull()
    expect(decision?.confidence).toBe('low')
  })

  it('progresses load when total work rose at the same top load', () => {
    const history = [...block('g1', '2026-08-01T12:00:00.000Z', 100, [10, 8, 6]), ...block('g2', '2026-08-08T12:00:00.000Z', 100, [11, 9, 7])]
    const decision = progressSetStructure({ groups: summarizeSetGroups(history), increment: 5 })
    expect(decision?.axis).toBe('load')
    expect(decision?.nextTopLoad).toBe(105)
    expect(decision?.totalVolumeChange).toBeGreaterThan(0)
  })

  it('progresses reps when reps rose but the volume gain came only from reps', () => {
    const history = [...block('g1', '2026-08-01T12:00:00.000Z', 100, [10, 8, 6]), ...block('g2', '2026-08-08T12:00:00.000Z', 90, [12, 10, 8])]
    const decision = progressSetStructure({ groups: summarizeSetGroups(history) })
    expect(decision?.axis).toBe('reps')
    expect(decision?.totalRepChange).toBe(6)
  })

  it('adds a drop when the block simply repeated', () => {
    const history = [...block('g1', '2026-08-01T12:00:00.000Z', 100, [10, 8, 6]), ...block('g2', '2026-08-08T12:00:00.000Z', 100, [10, 8, 6])]
    const decision = progressSetStructure({ groups: summarizeSetGroups(history) })
    expect(decision?.axis).toBe('sets')
    expect(decision?.nextSetCount).toBe(4)
  })

  it('holds when total work fell', () => {
    const history = [...block('g1', '2026-08-01T12:00:00.000Z', 100, [10, 8, 6]), ...block('g2', '2026-08-08T12:00:00.000Z', 100, [8, 6, 4])]
    const decision = progressSetStructure({ groups: summarizeSetGroups(history) })
    expect(decision?.axis).toBe('hold')
    expect(decision?.totalVolumeChange).toBeLessThan(0)
  })

  it('stops adding sets once the block is already long', () => {
    const long = (id: string, at: string) => block(id, at, 100, [10, 8, 6, 5])
    const decision = progressSetStructure({ groups: summarizeSetGroups([...long('g1', '2026-08-01T12:00:00.000Z'), ...long('g2', '2026-08-08T12:00:00.000Z')]), maximumSets: 4 })
    expect(decision?.axis).toBe('hold')
  })

  it('returns nothing when no structured work exists', () => {
    expect(progressSetStructure({ groups: [] })).toBeNull()
  })
})
