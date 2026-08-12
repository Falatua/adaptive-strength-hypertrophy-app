import { describe, expect, it } from 'vitest'
import { buildMesocyclePreview, draftFromPlan } from './mesocycle-engine'
import { effortDisplayFor, rirToRpe, routeSessionGenerationError, routeSessionProfile, routeSessionProfiles, rpeToRir } from './route-session-engine'
import { exerciseEquipmentFit } from './equipment-engine'
import { equipmentProfiles, exercises, history, mesocycles, sessions } from './seed'
import { buildPlacementAssessment } from './placement-engine'
import type { PlacementRoute } from './types'

const routes: PlacementRoute[] = ['introductory-skill', 'reacclimation', 'bridge-calibration', 'base-building', 'hypertrophy', 'powerbuilding', 'strength', 'power', 'event-specific']

function previewFor(route: PlacementRoute, exerciseHistory = history) {
  const draft = {
    ...draftFromPlan(mesocycles[0]),
    entryRoute: route,
    generationRuleVersion: 'route-session-v2' as const,
    placementCreatedAt: '2026-08-10T14:00:00.000Z'
  }
  return buildMesocyclePreview(draft, {
    exercises,
    currentSessions: sessions,
    history: exerciseHistory,
    planId: `plan-${route}`,
    planVersion: 2,
    startsAt: new Date('2026-08-10T14:00:00.000Z'),
    equipmentProfile: equipmentProfiles[0]
  })
}

describe('route-specific session generation', () => {
  it('defines a bounded deterministic profile for every placement route', () => {
    expect(routeSessionProfiles).toHaveLength(10)
    routeSessionProfiles.forEach((profile) => {
      expect(profile.ruleVersion).toBe('route-session-v3')
      expect(profile.strategy.length).toBeGreaterThan(20)
      expect(profile.reasons.length).toBeGreaterThanOrEqual(2)
      expect(profile.route === 'pain-aware-modified' ? profile.primary.sets === 0 : profile.primary.sets > 0).toBe(true)
    })
  })

  it('writes exact route provenance and route-specific primary prescriptions for every trainable route', () => {
    routes.forEach((route) => {
      const preview = previewFor(route)
      const profile = routeSessionProfile(route)
      expect(preview.sessions).toHaveLength(3)
      preview.sessions.forEach((session) => {
        const primary = session.exercises.find((planned) => planned.role === 'primary')!
        expect(primary.sets).toHaveLength(profile.primary.sets)
        expect(primary.sets[0]).toMatchObject({ targetReps: profile.primary.reps, targetRir: profile.primary.rir })
        expect(primary.restSeconds).toBe(profile.primary.restSeconds)
        expect(primary.warmupGuidance).toBe(profile.warmupGuidance)
        expect(session.generation).toMatchObject({ ruleVersion: 'route-session-v2', route, placementCreatedAt: '2026-08-10T14:00:00.000Z', equipment: { profileId: 'equipment-commercial-gym', incrementUnit: 'lb' } })
        expect(routeSessionGenerationError(session.generation)).toBeNull()
      })
    })
  })

  it('makes introductory, hypertrophy, strength, and power routes materially different', () => {
    const introductory = previewFor('introductory-skill').sessions[0].exercises[0]
    const hypertrophy = previewFor('hypertrophy').sessions[0].exercises[0]
    const strength = previewFor('strength').sessions[0].exercises[0]
    const power = previewFor('power').sessions[0].exercises[0]
    expect([introductory.sets.length, introductory.sets[0].targetReps, introductory.sets[0].targetRir]).toEqual([2, 8, 4])
    expect([hypertrophy.sets.length, hypertrophy.sets[0].targetReps, hypertrophy.sets[0].targetRir]).toEqual([3, 8, 3])
    expect([strength.sets.length, strength.sets[0].targetReps, strength.sets[0].targetRir]).toEqual([4, 4, 2])
    expect([power.sets.length, power.sets[0].targetReps, power.sets[0].targetRir]).toEqual([5, 3, 4])
    expect(new Set([introductory.sets[0].targetLoad, hypertrophy.sets[0].targetLoad, strength.sets[0].targetLoad, power.sets[0].targetLoad]).size).toBeGreaterThan(2)
  })

  it('uses exact completed evidence and never borrows load from a related variation', () => {
    const withoutBenchHistory = history.filter((workSet) => workSet.exerciseId !== 'competition-bench')
    const noPlannedBench = sessions.map((session) => ({ ...session, exercises: session.exercises.filter((planned) => planned.exerciseId !== 'competition-bench') }))
    const draft = { ...draftFromPlan(mesocycles[0]), entryRoute: 'strength' as const, generationRuleVersion: 'route-session-v2' as const, placementCreatedAt: '2026-08-10T14:00:00.000Z' }
    const preview = buildMesocyclePreview(draft, { exercises, currentSessions: noPlannedBench, history: withoutBenchHistory, planId: 'no-bench-evidence', planVersion: 2, equipmentProfile: equipmentProfiles[0] })
    const bench = preview.sessions.flatMap((session) => session.exercises).find((planned) => planned.exerciseId === 'competition-bench')!
    expect(bench.sets[0].targetLoad).toBe(0)
    expect(withoutBenchHistory.some((workSet) => workSet.family === 'Bench Press')).toBe(true)
  })

  it('limits route accessories and still honors the declared time cap', () => {
    const draft = { ...draftFromPlan(mesocycles[0]), entryRoute: 'strength' as const, generationRuleVersion: 'route-session-v2' as const, placementCreatedAt: '2026-08-10T14:00:00.000Z', defaultMinutes: 30 }
    const preview = buildMesocyclePreview(draft, { exercises, currentSessions: sessions, history, planId: 'short-strength', planVersion: 2, equipmentProfile: equipmentProfiles[0] })
    expect(preview.sessions.every((session) => session.durationMinutes <= 30)).toBe(true)
    expect(preview.sessions.every((session) => session.exercises.filter((planned) => !['primary', 'secondary'].includes(planned.role)).length <= 2)).toBe(true)
  })

  it('rejects valid-looking provenance when route explanations are altered', () => {
    const evidence = previewFor('strength').sessions[0].generation!
    expect(routeSessionGenerationError({ ...evidence, strategy: 'Use a secret different strategy.' })).toMatch(/strategy/i)
    expect(routeSessionGenerationError({ ...evidence, reasons: ['Different reason'] })).toMatch(/reasons/i)
  })

  it('filters generated support work to the active location while preserving protected anchors', () => {
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const draft = { ...draftFromPlan(mesocycles[0]), entryRoute: 'powerbuilding' as const, generationRuleVersion: 'route-session-v2' as const, placementCreatedAt: '2026-08-10T14:00:00.000Z' }
    const preview = buildMesocyclePreview(draft, { exercises, currentSessions: sessions, history, planId: 'home-plan', planVersion: 2, equipmentProfile: home })
    preview.sessions.forEach((session) => session.exercises.filter((planned) => planned.role !== 'primary').forEach((planned) => {
      const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)!
      expect(exerciseEquipmentFit(exercise, home).available).toBe(true)
    }))
    expect(new Set(preview.sessions.map((session) => session.exercises.find((planned) => planned.role === 'primary')?.exerciseId))).toEqual(new Set(mesocycles[0].strengthAnchors))
  })

  it('keeps unavailable protected anchors visible and reports their exact conflicts', () => {
    const travel = equipmentProfiles.find((profile) => profile.id === 'equipment-travel')!
    const draft = { ...draftFromPlan(mesocycles[0]), entryRoute: 'powerbuilding' as const, generationRuleVersion: 'route-session-v2' as const, placementCreatedAt: '2026-08-10T14:00:00.000Z' }
    const preview = buildMesocyclePreview(draft, { exercises, currentSessions: sessions, history, planId: 'travel-plan', planVersion: 2, equipmentProfile: travel })
    expect(preview.protectedAnchors).toEqual(mesocycles[0].strengthAnchors)
    expect(preview.explanations.filter((explanation) => explanation.includes('remains protected but needs equipment review'))).toHaveLength(3)
    expect(preview.sessions.every((session) => session.exercises.filter((planned) => planned.role !== 'primary').every((planned) => exerciseEquipmentFit(exercises.find((exercise) => exercise.id === planned.exerciseId)!, travel).available))).toBe(true)
  })

  it('uses the generated movement load class and profile increment before workout start', () => {
    const custom = { ...structuredClone(equipmentProfiles[0]), id: 'equipment-fine-jumps', name: 'Fine Jumps', increments: { ...equipmentProfiles[0].increments, barbell: 2.5 }, updatedAt: '2026-08-10T15:00:00.000Z' }
    const draft = { ...draftFromPlan(mesocycles[0]), entryRoute: 'powerbuilding' as const, generationRuleVersion: 'route-session-v2' as const, placementCreatedAt: '2026-08-10T14:00:00.000Z' }
    const preview = buildMesocyclePreview(draft, { exercises, currentSessions: sessions, history, planId: 'fine-jump-plan', planVersion: 2, equipmentProfile: custom })
    const primaryLoads = preview.sessions.map((session) => session.exercises.find((planned) => planned.role === 'primary')!.sets[0].targetLoad)
    expect(primaryLoads.every((load) => Number.isInteger(load / 2.5))).toBe(true)
    expect(preview.sessions.every((session) => session.generation?.equipment?.increments.barbell === 2.5)).toBe(true)
  })

  it('keeps legacy route-session-v1 evidence valid without inventing equipment provenance', () => {
    const evidence = previewFor('strength').sessions[0].generation!
    const legacy = { ...evidence, ruleVersion: 'route-session-v1' as const }
    delete legacy.equipment
    expect(routeSessionGenerationError(legacy)).toBeNull()
  })

  it('gives each protected anchor its own route prescription and immutable placement evidence', () => {
    const placement = buildPlacementAssessment({
      goal: 'strength', fixedEvent: null, trainingAge: 8, continuity: 'stable', movementSkill: 5,
      strengthTolerance: 5, volumeTolerance: 4, scheduleStability: 4, dataConfidence: 5,
      painState: 'none', weeklyOpportunities: 3, defaultMinutes: 60, equipmentProfileId: equipmentProfiles[0].id, skippedFields: [],
      movementProfiles: [
        { exerciseId: 'competition-squat', exerciseName: 'Competition Back Squat', family: 'Squat', movementSkill: 1, strengthTolerance: 2, dataConfidence: 2 },
        { exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', family: 'Bench Press', movementSkill: 5, strengthTolerance: 5, dataConfidence: 5 },
        { exerciseId: 'conventional-deadlift', exerciseName: 'Conventional Deadlift', family: 'Deadlift', movementSkill: 3, strengthTolerance: 3, dataConfidence: 1 }
      ]
    }, '2026-08-10T16:00:00.000Z')
    const draft = {
      ...draftFromPlan(mesocycles[0]), entryRoute: 'strength' as const, generationRuleVersion: 'route-session-v3' as const,
      placementCreatedAt: placement.createdAt, movementPlacements: placement.movementPlacements
    }
    const preview = buildMesocyclePreview(draft, { exercises, currentSessions: sessions, history, planId: 'movement-plan', planVersion: 3, equipmentProfile: equipmentProfiles[0] })
    const byPrimary = new Map(preview.sessions.map((session) => [session.exercises.find((planned) => planned.role === 'primary')!.exerciseId, session]))
    expect(byPrimary.get('competition-squat')?.exercises[0].sets).toHaveLength(2)
    expect(byPrimary.get('competition-squat')?.exercises[0].sets[0]).toMatchObject({ targetReps: 8, targetRir: 4 })
    expect(byPrimary.get('competition-bench')?.exercises[0].sets).toHaveLength(4)
    expect(byPrimary.get('competition-bench')?.exercises[0].sets[0]).toMatchObject({ targetReps: 4, targetRir: 2 })
    expect(byPrimary.get('conventional-deadlift')?.exercises[0].sets).toHaveLength(3)
    expect(byPrimary.get('conventional-deadlift')?.generation).toMatchObject({ ruleVersion: 'route-session-v3', planRoute: 'strength', route: 'bridge-calibration', movementPlacement: { exerciseId: 'conventional-deadlift', selectedRoute: 'bridge-calibration' } })
    expect(preview.sessions.every((session) => routeSessionGenerationError(session.generation) === null)).toBe(true)
  })
})

describe('effort metric by route', () => {
  it('speaks RPE on strength-expression routes and RIR on building routes', () => {
    for (const route of ['strength', 'powerbuilding', 'power', 'event-specific'] as const) {
      expect(routeSessionProfile(route).effortMetric).toBe('rpe')
    }
    for (const route of ['hypertrophy', 'base-building', 'bridge-calibration', 'introductory-skill', 'reacclimation', 'pain-aware-modified'] as const) {
      expect(routeSessionProfile(route).effortMetric).toBe('rir')
    }
  })

  it('treats RPE and RIR as the same evidence read from opposite ends', () => {
    expect(rirToRpe(0)).toBe(10)
    expect(rirToRpe(2)).toBe(8)
    expect(rpeToRir(8)).toBe(2)
    expect(rpeToRir(10)).toBe(0)
    // Round-tripping must not drift, or a strength block and a hypertrophy block stop being comparable.
    for (const rir of [0, 1, 2, 3, 4]) expect(rpeToRir(rirToRpe(rir))).toBe(rir)
  })

  it('clamps rather than emitting an impossible effort value', () => {
    expect(rirToRpe(12)).toBe(1)
    expect(rpeToRir(1)).toBe(9)
    expect(effortDisplayFor(2, 'rpe')).toMatchObject({ label: 'RPE', value: 8 })
    expect(effortDisplayFor(2, 'rir')).toMatchObject({ label: 'RIR', value: 2 })
  })
})
