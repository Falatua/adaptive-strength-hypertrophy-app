import { describe, expect, it } from 'vitest'
import { equipmentProfiles, exercises } from './seed'
import { findExerciseDuplicateGroups, mergeSystemEquipmentProfiles, mergeSystemExerciseCatalog, normalizeCatalogList, projectExerciseCatalogEdit } from './catalog-engine'

describe('exercise catalog governance', () => {
  it('normalizes aliases without duplicating the canonical name', () => {
    expect(normalizeCatalogList([' Incline Bench ', 'incline bench', '', 'DB Incline'], ['Incline Bench Press'])).toEqual(['Incline Bench', 'DB Incline'])
  })

  it('ships a deep catalog with stable unique identities and no exact alias collision', () => {
    expect(exercises).toHaveLength(251)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(exercises.length)
    expect(new Set(exercises.map((exercise) => exercise.name.toLowerCase())).size).toBe(exercises.length)
    const exactNames = new Map<string, string[]>()
    exercises.forEach((exercise) => [exercise.name, ...exercise.aliases].forEach((name) => exactNames.set(name.toLowerCase(), [...(exactNames.get(name.toLowerCase()) ?? []), exercise.id])))
    expect([...exactNames.entries()].filter(([, ids]) => new Set(ids).size > 1)).toEqual([])
  })

  it('ships a separate trap movement base without splitting existing Barbell Shrug identity', () => {
    const trapExercises = exercises.filter((exercise) => exercise.regions.includes('traps'))
    expect(trapExercises.map((exercise) => exercise.name)).toEqual(expect.arrayContaining([
      'Barbell Shrug', 'Dumbbell Shrug', 'Trap Bar Shrug', 'Cable Shrug', 'Machine Shrug',
      'Chest-Supported Dumbbell Shrug', 'Prone Trap Raise', 'Cable Y-Raise'
    ]))
    expect(trapExercises.filter((exercise) => exercise.primaryRegion === 'traps').length).toBeGreaterThanOrEqual(8)

    const priorShrug = structuredClone(exercises.find((exercise) => exercise.id === 'barbell-shrug')!)
    priorShrug.primaryRegion = 'back'
    priorShrug.regions = ['back', 'forearms']
    priorShrug.favorite = true
    priorShrug.jointFeeling = 'good'
    const merged = mergeSystemExerciseCatalog([priorShrug], exercises)
    expect(merged.find((exercise) => exercise.id === 'barbell-shrug')).toMatchObject({
      id: 'barbell-shrug', primaryRegion: 'traps', favorite: true, jointFeeling: 'good'
    })
  })

  it('adds new system movements without erasing athlete preferences or custom movements', () => {
    const priorBench = { ...structuredClone(exercises.find((exercise) => exercise.id === 'competition-bench')!), favorite: false, jointFeeling: 'avoid' as const, aliases: ['My Meet Bench'] }
    const custom = { ...structuredClone(priorBench), id: 'custom-sled', name: 'My Garage Sled', aliases: [], custom: true, jointFeeling: 'good' as const }
    const merged = mergeSystemExerciseCatalog([priorBench, custom], exercises)
    expect(merged).toHaveLength(exercises.length + 1)
    expect(merged.find((exercise) => exercise.id === 'competition-bench')).toMatchObject({ favorite: false, jointFeeling: 'avoid' })
    expect(merged.find((exercise) => exercise.id === 'competition-bench')?.aliases).toContain('My Meet Bench')
    expect(merged.find((exercise) => exercise.id === 'leg-press-45')?.aliases).toContain('Leg Press')
    expect(merged.find((exercise) => exercise.id === custom.id)).toEqual(custom)
  })

  it('expands seeded locations while preserving athlete-owned equipment profiles', () => {
    const priorCommercial = { ...structuredClone(equipmentProfiles[0]), equipment: ['barbell', 'rack', 'plates'] }
    const custom = { ...structuredClone(equipmentProfiles[0]), id: 'my-gym', name: 'My Gym', source: 'athlete' as const, equipment: ['barbell'] }
    const merged = mergeSystemEquipmentProfiles([priorCommercial, custom], equipmentProfiles)
    expect(merged.find((profile) => profile.id === priorCommercial.id)?.equipment).toContain('leg press machine')
    expect(merged.find((profile) => profile.id === custom.id)?.equipment).toEqual(['barbell'])
  })

  it('upgrades the untouched Home Gym profile with Freak Athlete capabilities without changing athlete-owned locations', () => {
    const priorHome = { ...structuredClone(equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!), equipment: ['barbell', 'rack'], constraints: ['Old system constraint'], updatedAt: '2026-08-11T12:00:00.000Z' }
    const athleteHome = { ...structuredClone(priorHome), id: 'athlete-home', name: 'My Garage', source: 'athlete' as const, equipment: ['barbell'], constraints: ['Athlete choice'] }
    const merged = mergeSystemEquipmentProfiles([priorHome, athleteHome], equipmentProfiles)
    const upgraded = merged.find((profile) => profile.id === 'equipment-home-gym')!
    expect(upgraded.equipment).toEqual(expect.arrayContaining(['freak athlete abx bench', 'freak athlete leg developer', 'leg extension machine', 'lying leg curl machine', 'boards', 'cambered bar', 'safety squat bar', 'squat press machine', 'dip station', 'resistance bands']))
    expect(upgraded.constraints).toContain('Freak Athlete Hyper Pro with ABX bench and Leg Developer')
    expect(merged.find((profile) => profile.id === athleteHome.id)).toEqual(athleteHome)
  })

  it('lets an athlete edit a custom identity while keeping its stable ID', () => {
    const custom = { ...structuredClone(exercises[0]), id: 'custom-incline', name: 'My Incline', family: 'Incline Press', aliases: [], custom: true }
    const projection = projectExerciseCatalogEdit([...exercises, custom], custom.id, {
      name: ' Low Incline Barbell Press ', family: ' Incline Press ', aliases: ['Low Incline', ' low incline '],
      pattern: 'horizontal-push', primaryRegion: 'chest', equipment: [' barbell ', 'rack'], description: ' My joint-friendly setup. ',
      muscleMapping: { ruleVersion: 'exercise-muscle-map-v1', direct: 'pectorals', secondary: ['triceps'], source: 'athlete', reviewedAt: '2026-08-10T12:00:00.000Z' }
    })
    expect(projection.exercise).toMatchObject({
      id: custom.id, name: 'Low Incline Barbell Press', family: 'Incline Press', aliases: ['Low Incline'],
      primaryRegion: 'chest', regions: ['chest'], equipment: ['barbell', 'rack'], description: 'My joint-friendly setup.',
      muscleMapping: { direct: 'pectorals', secondary: ['triceps'], source: 'athlete' }
    })
  })

  it('allows alias maintenance on a built-in identity without rewriting its taxonomy', () => {
    const bench = exercises.find((exercise) => exercise.id === 'competition-bench')!
    const projection = projectExerciseCatalogEdit(exercises, bench.id, {
      name: 'Changed name', family: 'Changed family', aliases: [...bench.aliases, 'Meet Bench'], pattern: 'carry',
      primaryRegion: 'glutes', equipment: ['bands'], description: 'Changed description'
    })
    expect(projection.exercise).toMatchObject({
      id: bench.id, name: bench.name, family: bench.family, pattern: bench.pattern,
      primaryRegion: bench.primaryRegion, equipment: bench.equipment, description: bench.description
    })
    expect(projection.exercise.aliases).toContain('Meet Bench')
  })

  it('rejects an exact name or alias collision before history can split', () => {
    const custom = { ...structuredClone(exercises[0]), id: 'custom-press', name: 'My Press', aliases: [], custom: true }
    expect(() => projectExerciseCatalogEdit([...exercises, custom], custom.id, {
      name: 'My Press', family: 'Press', aliases: ['2 Board Press'], pattern: 'horizontal-push',
      primaryRegion: 'chest', equipment: ['barbell'], description: 'Custom movement.'
    })).toThrow(/already belongs to Two-Board Press/i)
  })

  it('rejects a custom mapping that counts the direct muscle again as secondary', () => {
    const custom = { ...structuredClone(exercises[0]), id: 'custom-map', name: 'Custom Map', aliases: [], custom: true }
    expect(() => projectExerciseCatalogEdit([...exercises, custom], custom.id, {
      name: custom.name, family: custom.family, aliases: [], pattern: custom.pattern, primaryRegion: custom.primaryRegion,
      equipment: custom.equipment, description: custom.description,
      muscleMapping: { ruleVersion: 'exercise-muscle-map-v1', direct: 'pectorals', secondary: ['pectorals'], source: 'athlete', reviewedAt: '2026-08-10T12:00:00.000Z' }
    })).toThrow(/cannot also receive secondary credit/i)
  })

  it('collects connected duplicate pairs into one cleanup group', () => {
    const first = { ...structuredClone(exercises[0]), id: 'duplicate-one', name: 'Meet Bench', aliases: ['Flat Press'], custom: true }
    const second = { ...structuredClone(exercises[0]), id: 'duplicate-two', name: 'Flat Press', aliases: ['Bench'], custom: true }
    const groups = findExerciseDuplicateGroups([...exercises, first, second])
    const benchGroup = groups.find((group) => group.exercises.some((exercise) => exercise.id === first.id))!
    expect(benchGroup.exercises.map((exercise) => exercise.id)).toEqual(expect.arrayContaining(['competition-bench', first.id, second.id]))
    expect(benchGroup.maxScore).toBe(1)
  })

  it('keeps unrelated and retired identities out of cleanup groups', () => {
    const retired = { ...structuredClone(exercises[0]), id: 'retired-bench', name: 'Bench', aliases: [], retired: true, custom: true }
    const groups = findExerciseDuplicateGroups([...exercises, retired])
    expect(groups.flatMap((group) => group.exercises).some((exercise) => exercise.id === retired.id)).toBe(false)
  })
})
