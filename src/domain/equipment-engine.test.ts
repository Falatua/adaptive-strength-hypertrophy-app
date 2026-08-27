import { describe, expect, it } from 'vitest'
import { equipmentProfiles, exercises, sessions } from './seed'
import { equipmentProfileError, exerciseEquipmentFit, loadIncrementFor, nearestExecutableLoad, normalizedEquipmentProfile, sessionEquipmentGaps } from './equipment-engine'

describe('equipment-profile-v1', () => {
  it('requires every explicit equipment item instead of guessing from the location name', () => {
    const bench = exercises.find((exercise) => exercise.id === 'competition-bench')!
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const travel = equipmentProfiles.find((profile) => profile.id === 'equipment-travel')!
    expect(exerciseEquipmentFit(bench, home)).toEqual({ available: true, required: ['barbell', 'bench', 'rack'], missing: [] })
    expect(exerciseEquipmentFit(bench, travel)).toMatchObject({ available: false, missing: ['barbell', 'bench', 'rack'] })
  })

  it('reports every unavailable planned movement and exact missing items', () => {
    const travel = equipmentProfiles.find((profile) => profile.id === 'equipment-travel')!
    const gaps = sessionEquipmentGaps(sessions[0], exercises, travel)
    expect(gaps.map((gap) => gap.exerciseId)).toEqual(['competition-bench', 'two-board-press', 'chest-supported-row', 'triceps-extension', 'lateral-raise'])
    expect(gaps[0].missing).toContain('barbell')
  })

  it('makes the ABX bench and Leg Developer movements executable at Home Gym', () => {
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const movementIds = ['incline-db-press', 'incline-barbell-press', 'two-board-press', 'close-grip-bench', 'spoto-press', 'abx-chest-supported-db-row', 'abx-cambered-bar-chest-supported-row', 'squat-press', 'ssb-squat', 'cambered-bar-bench', 'leg-extension', 'single-leg-extension', 'lying-leg-curl', 'red-band-pull-apart', 'parallel-bar-dip', 'weighted-dip', 'bulgarian-split-squat']
    movementIds.forEach((exerciseId) => expect(exerciseEquipmentFit(exercises.find((exercise) => exercise.id === exerciseId)!, home).available).toBe(true))
    expect(home.equipment).toEqual(expect.arrayContaining(['freak athlete abx bench', 'freak athlete hyper pro', 'freak athlete leg developer', 'boards']))
  })

  it('uses profile-specific executable increments by equipment class', () => {
    const profile = { ...equipmentProfiles[0], increments: { ...equipmentProfiles[0].increments, barbell: 2.5, dumbbell: 10 } }
    expect(loadIncrementFor(exercises.find((exercise) => exercise.id === 'competition-bench')!, profile)).toMatchObject({ kind: 'barbell', value: 2.5, unit: 'lb' })
    expect(loadIncrementFor(exercises.find((exercise) => exercise.id === 'incline-db-press')!, profile)).toMatchObject({ kind: 'dumbbell', value: 10 })
    expect(nearestExecutableLoad(177, 2.5)).toBe(177.5)
  })

  it('normalizes athlete-entered equipment and constraints deterministically', () => {
    const normalized = normalizedEquipmentProfile({
      ...equipmentProfiles[0], name: ' Garage ', source: 'athlete', equipment: [' Rack ', 'barbell', 'rack'], constraints: [' Low ceiling ', 'Low ceiling']
    })
    expect(normalized).toMatchObject({ name: 'Garage', equipment: ['barbell', 'rack'], constraints: ['Low ceiling'], source: 'athlete' })
  })

  it('rejects duplicate equipment, invalid increments, and missing provenance', () => {
    expect(equipmentProfileError({ ...equipmentProfiles[0], equipment: ['Rack', ' rack '] })).toMatch(/duplicate/i)
    expect(equipmentProfileError({ ...equipmentProfiles[0], increments: { ...equipmentProfiles[0].increments, cable: 0 } })).toMatch(/increment/i)
    expect(equipmentProfileError({ ...equipmentProfiles[0], source: 'model' })).toMatch(/source/i)
  })
})
