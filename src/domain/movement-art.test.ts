import { describe, expect, it } from 'vitest'
import { movementSceneAssets, movementSceneFor, type MovementArtSubject, type MovementScene } from './movement-art'
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

  it.each([
    ['Push-Up', 'Chest Press', 'horizontal-push', 'chest', 'pushUp'],
    ['Weighted Dip', 'Dip', 'vertical-push', 'chest', 'dip'],
    ['Reverse Pec Deck', 'Rear Delt Fly', 'isolation', 'shoulders', 'rearDeltFly'],
    ['45-Degree Back Extension', 'Back Extension', 'hinge', 'hamstrings', 'backExtension'],
    ['Kettlebell Swing', 'Ballistic Hinge', 'hinge', 'glutes', 'kettlebellSwing'],
    ['Smith Machine Split Squat', 'Split Squat', 'squat', 'quadriceps', 'splitSquat'],
    ['Walking Lunge', 'Lunge', 'squat', 'quadriceps', 'lunge'],
    ['Dumbbell Step-Up', 'Step-Up', 'squat', 'quadriceps', 'stepUp'],
    ['45-Degree Leg Press', 'Leg Press', 'squat', 'quadriceps', 'legPress'],
    ['Hack Squat', 'Hack Squat', 'squat', 'quadriceps', 'hackSquat'],
    ['Seated Hip Abduction', 'Hip Abduction', 'isolation', 'glutes', 'hipAbduction'],
    ['Hip Adduction Machine', 'Hip Adduction', 'isolation', 'quadriceps', 'hipAdduction'],
    ['Nordic Hamstring Curl', 'Nordic Curl', 'isolation', 'hamstrings', 'nordicCurl'],
    ['Pull-Up', 'Vertical Pull', 'vertical-pull', 'back', 'pullUp'],
    ['Dumbbell Pullover', 'Pullover', 'vertical-pull', 'back', 'pullover'],
    ['Cable Upright Row', 'Upright Row', 'horizontal-pull', 'shoulders', 'uprightRow'],
    ['Cable Face Pull', 'Face Pull', 'horizontal-pull', 'shoulders', 'facePull'],
    ['Barbell Shrug', 'Shrug', 'carry', 'back', 'shrug'],
    ['Sled Push', 'Sled', 'carry', 'quadriceps', 'sledPush'],
    ['Seated Calf Raise', 'Calf Raise', 'isolation', 'calves', 'seatedCalf'],
    ['Tibialis Raise', 'Shin', 'isolation', 'calves', 'tibialisRaise']
  ] as const)('maps %s to movement-specific art', (name, family, pattern, primaryRegion, scene) => {
    expect(movementSceneFor({ name, family, pattern, primaryRegion } as MovementArtSubject)).toBe(scene)
  })

  it('routes every movement scene to a safe local asset name', () => {
    const scenes = Object.keys(movementSceneAssets) as MovementScene[]
    expect(scenes).toHaveLength(41)
    for (const scene of scenes) {
      expect(movementSceneAssets[scene], scene).toMatch(/^[a-z0-9-]+$/)
    }
  })
})
