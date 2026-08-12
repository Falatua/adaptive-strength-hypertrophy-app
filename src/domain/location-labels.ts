import type { EquipmentProfileKind } from './types'

/** Readable name for each training location, used for the accessible label on its illustration. */
export const locationLabels: Record<EquipmentProfileKind, string> = {
  'commercial-gym': 'Commercial gym',
  'home-gym': 'Home gym',
  travel: 'Training while travelling',
  hotel: 'Hotel gym',
  bodyweight: 'Bodyweight only',
  custom: 'Custom setup'
}
