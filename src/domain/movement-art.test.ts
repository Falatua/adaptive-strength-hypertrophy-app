import { describe, expect, it } from 'vitest'
import { movementSceneFor } from './movement-art'
import { exercises } from './seed'

describe('movementSceneFor', () => {
  it('reads the movement itself before the pattern', () => {
    expect(movementSceneFor({ name: 'Incline Dumbbell Press', family: 'Incline Press', pattern: 'horizontal-push', primaryRegion: 'chest' })).toBe('incline')
    expect(movementSceneFor({ name: 'Competition Bench Press', family: 'Bench Press', pattern: 'horizontal-push', primaryRegion: 'chest' })).toBe('bench')
    expect(movementSceneFor({ name: 'Seated Leg Curl', family: 'Leg Curl', pattern: 'isolation', primaryRegion: 'hamstrings' })).toBe('legCurl')
  })

  it('falls back to the body part, then the pattern, for an athlete-created movement', () => {
    expect(movementSceneFor({ name: 'My Delt Thing', family: 'Custom', pattern: 'isolation', primaryRegion: 'shoulders' })).toBe('lateralRaise')
    expect(movementSceneFor({ name: 'My Pull Thing', family: 'Custom', pattern: 'vertical-pull', primaryRegion: 'back' })).toBe('pulldown')
  })

  it('gives every shipped movement a drawing', () => {
    for (const exercise of exercises) expect(movementSceneFor(exercise)).toBeTruthy()
  })
})
