import { describe, expect, it } from 'vitest'
import { splitRationale, trainingSplitFor } from './split-engine'

describe('trainingSplitFor', () => {
  it('trains everything each session when the week is short', () => {
    for (const sessions of [1, 2, 3]) {
      const split = trainingSplitFor(sessions)
      expect(split.shape).toBe('full-body')
      expect(split.days).toHaveLength(sessions)
      expect(split.days.every((day) => day.emphasis.length === 0)).toBe(true)
    }
  })

  it('explains why a short week is not split into body parts', () => {
    expect(trainingSplitFor(2).reasons.join(' ')).toContain('trained once')
  })

  it('splits four days into upper and lower, hitting each muscle twice', () => {
    const split = trainingSplitFor(4)
    expect(split.shape).toBe('upper-lower')
    expect(split.frequencyPerMuscle).toBe(2)
    expect(split.days.map((day) => day.label)).toEqual(['Upper', 'Lower', 'Upper', 'Lower'])
  })

  it('spends a fifth day on the weakest point rather than a fifth rotation', () => {
    const split = trainingSplitFor(5)
    expect(split.days).toHaveLength(5)
    expect(split.days[4].label).toBe('Weak point focus')
  })

  it('gives each pattern its own day once the week is long enough', () => {
    const split = trainingSplitFor(6)
    expect(split.shape).toBe('push-pull-legs')
    expect(split.days.map((day) => day.label)).toEqual(['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'])
    expect(split.frequencyPerMuscle).toBe(2)
  })

  it('keeps per-muscle frequency in the productive range at every schedule', () => {
    for (let sessions = 2; sessions <= 7; sessions += 1) {
      const split = trainingSplitFor(sessions)
      expect(split.frequencyPerMuscle).toBeGreaterThanOrEqual(2)
      expect(split.frequencyPerMuscle).toBeLessThanOrEqual(4)
    }
  })

  it('never emits more days than the athlete actually trains', () => {
    for (let sessions = 1; sessions <= 7; sessions += 1) {
      expect(trainingSplitFor(sessions).days).toHaveLength(sessions)
    }
  })

  it('bounds nonsense input rather than producing a nonsense week', () => {
    expect(trainingSplitFor(0).days).toHaveLength(1)
    expect(trainingSplitFor(99).days).toHaveLength(7)
  })

  it('states its reasoning in plain language', () => {
    expect(splitRationale(trainingSplitFor(2))).toContain('whole body')
    expect(splitRationale(trainingSplitFor(6))).toContain('2 times a week')
  })
})
