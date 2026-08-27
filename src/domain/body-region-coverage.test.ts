import { describe, expect, it } from 'vitest'
import { exercises } from './seed'
import { bodyRegionFilterIds } from '../screens/library-filters'

// Body part is the only filter in the library now, so a movement that no chip can reach is
// effectively hidden. This guards the case that already happened once: trunk, calves, and
// forearms movements existed with no chip to find them.
describe('library body part coverage', () => {
  it('exposes Traps as its own body part instead of folding it into Back', () => {
    expect(bodyRegionFilterIds).toHaveLength(12)
    expect(bodyRegionFilterIds).toContain('traps')
  })

  it('reaches every shipped movement from at least one body part chip', () => {
    const unreachable = exercises
      .filter((exercise) => !exercise.retired)
      .filter((exercise) => !exercise.regions.some((region) => bodyRegionFilterIds.includes(region)))
      .map((exercise) => exercise.name)
    expect(unreachable).toEqual([])
  })

  it('keeps every movement listed under its own primary region', () => {
    const mismatched = exercises.filter((exercise) => !exercise.regions.includes(exercise.primaryRegion)).map((exercise) => exercise.name)
    expect(mismatched).toEqual([])
  })
})
