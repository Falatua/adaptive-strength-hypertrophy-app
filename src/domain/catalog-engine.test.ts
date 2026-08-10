import { describe, expect, it } from 'vitest'
import { exercises } from './seed'
import { normalizeCatalogList, projectExerciseCatalogEdit } from './catalog-engine'

describe('exercise catalog governance', () => {
  it('normalizes aliases without duplicating the canonical name', () => {
    expect(normalizeCatalogList([' Incline Bench ', 'incline bench', '', 'DB Incline'], ['Incline Bench Press'])).toEqual(['Incline Bench', 'DB Incline'])
  })

  it('lets an athlete edit a custom identity while keeping its stable ID', () => {
    const custom = { ...structuredClone(exercises[0]), id: 'custom-incline', name: 'My Incline', family: 'Incline Press', aliases: [], custom: true }
    const projection = projectExerciseCatalogEdit([...exercises, custom], custom.id, {
      name: ' Low Incline Barbell Press ', family: ' Incline Press ', aliases: ['Low Incline', ' low incline '],
      pattern: 'horizontal-push', primaryRegion: 'chest', equipment: [' barbell ', 'rack'], description: ' My joint-friendly setup. '
    })
    expect(projection.exercise).toMatchObject({
      id: custom.id, name: 'Low Incline Barbell Press', family: 'Incline Press', aliases: ['Low Incline'],
      primaryRegion: 'chest', regions: ['chest'], equipment: ['barbell', 'rack'], description: 'My joint-friendly setup.'
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
})
