import { describe, expect, it } from 'vitest'
import { exercises } from './seed'
import { findExerciseDuplicateGroups, normalizeCatalogList, projectExerciseCatalogEdit } from './catalog-engine'

describe('exercise catalog governance', () => {
  it('normalizes aliases without duplicating the canonical name', () => {
    expect(normalizeCatalogList([' Incline Bench ', 'incline bench', '', 'DB Incline'], ['Incline Bench Press'])).toEqual(['Incline Bench', 'DB Incline'])
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
