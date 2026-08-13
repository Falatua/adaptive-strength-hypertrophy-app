import { describe, expect, it } from 'vitest'
import { ABX_BACK_PAD_ANGLES, buildBenchAngleLadder, comparableAngleHistory, normalizeBenchAngle, supportsBenchAngle } from './bench-angle-engine'
import { exercises, sessions } from './seed'

describe('bench angle evidence', () => {
  it('offers ABX back-pad positions while accepting other valid degrees', () => {
    expect(ABX_BACK_PAD_ANGLES).toEqual([0, 15, 22, 30, 37, 45, 52, 60, 67, 75, 85])
    expect(normalizeBenchAngle(33)).toBe(33)
    expect(normalizeBenchAngle(94)).toBe(90)
    expect(normalizeBenchAngle(null)).toBeUndefined()
  })

  it('shows angle controls only for incline movements that use a bench', () => {
    expect(supportsBenchAngle(exercises.find((exercise) => exercise.id === 'incline-db-press')!)).toBe(true)
    expect(supportsBenchAngle(exercises.find((exercise) => exercise.id === 'competition-bench')!)).toBe(false)
  })

  it('builds set ladders and refuses cross-angle history comparison', () => {
    expect(buildBenchAngleLadder(3, 'high-to-low')).toEqual([45, 30, 15])
    expect(buildBenchAngleLadder(3, 'low-to-high')).toEqual([15, 30, 45])
    const planned = { ...sessions[0].exercises[0], sets: sessions[0].exercises[0].sets.map((set) => ({ ...set, benchAngleDeg: 30 })) }
    const history = [{ id: '30', exerciseId: planned.exerciseId, benchAngleDeg: 30 }, { id: '45', exerciseId: planned.exerciseId, benchAngleDeg: 45 }] as Parameters<typeof comparableAngleHistory>[0]
    expect(comparableAngleHistory(history, planned).map((set) => set.id)).toEqual(['30'])
    expect(comparableAngleHistory(history, { ...planned, sets: planned.sets.map((set, index) => ({ ...set, benchAngleDeg: index ? 45 : 30 })) })).toEqual([])
  })
})
