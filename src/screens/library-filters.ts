import type { BodyRegion } from '../domain/types'

/** The body part chips in the library, in display order. Body part is the only filter, so this
 *  list has to cover every region the catalog uses or those movements become unfindable. */
export const bodyRegionFilters: { id: BodyRegion | 'all'; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'chest', label: 'Chest' }, { id: 'back', label: 'Back' }, { id: 'shoulders', label: 'Shoulders' },
  { id: 'quadriceps', label: 'Quads' }, { id: 'hamstrings', label: 'Hamstrings' }, { id: 'glutes', label: 'Glutes' }, { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' }, { id: 'forearms', label: 'Forearms' }, { id: 'calves', label: 'Calves' }, { id: 'trunk', label: 'Core' }
]

export const bodyRegionFilterIds = bodyRegionFilters.filter((item) => item.id !== 'all').map((item) => item.id as BodyRegion)
