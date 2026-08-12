import type { EquipmentProfileKind } from '../domain/types'
import { locationLabels } from '../domain/location-labels'

/**
 * A small illustrated scene for each kind of training location, drawn in the same pixel style as the
 * athlete forms so the app reads as one world. Unknown kinds fall back to the custom setup rather than
 * rendering nothing.
 */

export function LocationArt({ kind, size = 'medium' }: { kind: EquipmentProfileKind; size?: 'small' | 'medium' }) {
  const safe: EquipmentProfileKind = kind in locationLabels ? kind : 'custom'
  return (
    // The art always sits beside the location name, so announcing it again would just be noise.
    <span className={`location-art location-art--${size}`} aria-hidden="true" title={locationLabels[safe]}>
      <img src={`${import.meta.env.BASE_URL}locations/${safe}.png`} alt="" />
    </span>
  )
}
