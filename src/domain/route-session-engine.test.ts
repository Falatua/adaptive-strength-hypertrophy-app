import { describe, expect, it } from 'vitest'
import { buildMesocyclePreview, draftFromPlan } from './mesocycle-engine'
import { routeSessionGenerationError, routeSessionProfile, routeSessionProfiles } from './route-session-engine'
import { exercises, history, mesocycles, sessions } from './seed'
import type { PlacementRoute } from './types'

const routes: PlacementRoute[] = ['introductory-skill', 'reacclimation', 'bridge-calibration', 'base-building', 'hypertrophy', 'powerbuilding', 'strength', 'power', 'event-specific']

function previewFor(route: PlacementRoute, exerciseHistory = history) {
  const draft = {
    ...draftFromPlan(mesocycles[0]),
    entryRoute: route,
    generationRuleVersion: 'route-session-v1' as const,
    placementCreatedAt: '2026-08-10T14:00:00.000Z'
  }
  return buildMesocyclePreview(draft, {
    exercises,
    currentSessions: sessions,
    history: exerciseHistory,
    planId: `plan-${route}`,
    planVersion: 2,
    startsAt: new Date('2026-08-10T14:00:00.000Z')
  })
}

describe('route-specific session generation', () => {
  it('defines a bounded deterministic profile for every placement route', () => {
    expect(routeSessionProfiles).toHaveLength(10)
    routeSessionProfiles.forEach((profile) => {
      expect(profile.ruleVersion).toBe('route-session-v1')
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
        expect(session.generation).toMatchObject({ ruleVersion: 'route-session-v1', route, placementCreatedAt: '2026-08-10T14:00:00.000Z' })
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
    const draft = { ...draftFromPlan(mesocycles[0]), entryRoute: 'strength' as const, generationRuleVersion: 'route-session-v1' as const, placementCreatedAt: '2026-08-10T14:00:00.000Z' }
    const preview = buildMesocyclePreview(draft, { exercises, currentSessions: noPlannedBench, history: withoutBenchHistory, planId: 'no-bench-evidence', planVersion: 2 })
    const bench = preview.sessions.flatMap((session) => session.exercises).find((planned) => planned.exerciseId === 'competition-bench')!
    expect(bench.sets[0].targetLoad).toBe(0)
    expect(withoutBenchHistory.some((workSet) => workSet.family === 'Bench Press')).toBe(true)
  })

  it('limits route accessories and still honors the declared time cap', () => {
    const draft = { ...draftFromPlan(mesocycles[0]), entryRoute: 'strength' as const, generationRuleVersion: 'route-session-v1' as const, placementCreatedAt: '2026-08-10T14:00:00.000Z', defaultMinutes: 30 }
    const preview = buildMesocyclePreview(draft, { exercises, currentSessions: sessions, history, planId: 'short-strength', planVersion: 2 })
    expect(preview.sessions.every((session) => session.durationMinutes <= 30)).toBe(true)
    expect(preview.sessions.every((session) => session.exercises.filter((planned) => !['primary', 'secondary'].includes(planned.role)).length <= 2)).toBe(true)
  })

  it('rejects valid-looking provenance when route explanations are altered', () => {
    const evidence = previewFor('strength').sessions[0].generation!
    expect(routeSessionGenerationError({ ...evidence, strategy: 'Use a secret different strategy.' })).toMatch(/strategy/i)
    expect(routeSessionGenerationError({ ...evidence, reasons: ['Different reason'] })).toMatch(/reasons/i)
  })
})
