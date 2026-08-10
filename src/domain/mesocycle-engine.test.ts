import { describe, expect, it } from 'vitest'
import { buildMesocyclePreview, createMesocyclePlan, draftFromPlan, replaceFuturePlan } from './mesocycle-engine'
import { exercises, history, mesocycles, sessions } from './seed'

const draft = () => ({ ...draftFromPlan(mesocycles[0]), revisionReason: 'Testing a deliberate plan revision.' })

describe('criterion-driven mesocycle planning', () => {
  it('protects every strength anchor even when calendar opportunities are lower', () => {
    const next = { ...draft(), weeklyOpportunities: 2 }
    const preview = buildMesocyclePreview(next, {
      exercises,
      currentSessions: sessions,
      history,
      planId: 'test-plan',
      planVersion: 2,
      startsAt: new Date('2026-08-10T12:00:00.000Z')
    })
    expect(preview.requiredExposureCount).toBe(3)
    expect(new Set(preview.sessions.map((session) => session.exercises.find((item) => item.role === 'primary')?.exerciseId))).toEqual(new Set(next.strengthAnchors))
  })

  it('fits the generated session to a short declared time budget', () => {
    const next = { ...draft(), defaultMinutes: 30 }
    const preview = buildMesocyclePreview(next, {
      exercises,
      currentSessions: sessions,
      history,
      planId: 'short-plan',
      planVersion: 2
    })
    expect(preview.sessions.every((session) => session.durationMinutes <= 30)).toBe(true)
    expect(preview.sessions.every((session) => session.exercises.some((item) => item.role === 'primary'))).toBe(true)
  })

  it('rotates accessory selection across declared development priorities', () => {
    const next = draft()
    const preview = buildMesocyclePreview(next, {
      exercises,
      currentSessions: sessions,
      history,
      planId: 'priority-plan',
      planVersion: 2
    })
    next.priorityRegions.forEach((region) => expect(preview.regionSets[region] ?? 0).toBeGreaterThan(0))
    expect(preview.sessions.some((session) => session.exercises.some((item) => item.role === 'maintenance'))).toBe(true)
  })

  it('starts reacclimation conservatively without adding catch-up volume', () => {
    const next = { ...draft(), dominantAdaptation: 'reacclimation' as const }
    const preview = buildMesocyclePreview(next, {
      exercises,
      currentSessions: sessions,
      history,
      planId: 'return-plan',
      planVersion: 2
    })
    const oldBench = sessions[0].exercises.find((item) => item.exerciseId === 'competition-bench')!
    const newBench = preview.sessions.flatMap((session) => session.exercises).find((item) => item.exerciseId === 'competition-bench')!
    expect(newBench.sets.length).toBe(oldBench.sets.length - 1)
    expect(newBench.sets[0].targetLoad).toBeLessThan(oldBench.sets[0].targetLoad)
  })

  it('replaces future planned work while preserving completed and partial truth', () => {
    const current = structuredClone(sessions)
    current[0].status = 'completed'
    current[1].status = 'partial-primary'
    const nextDraft = draft()
    const preview = buildMesocyclePreview(nextDraft, {
      exercises,
      currentSessions: current,
      history,
      planId: 'revision-plan',
      planVersion: 2
    })
    const plan = createMesocyclePlan(nextDraft, 'revision-plan', 2, '2026-08-10T12:00:00.000Z', mesocycles[0].id, preview.sessions.map((session) => session.id))
    const revised = replaceFuturePlan(current, structuredClone(mesocycles), plan, preview.sessions)
    expect(revised.sessions.find((session) => session.id === current[0].id)).toEqual(current[0])
    expect(revised.sessions.find((session) => session.id === current[1].id)).toEqual(current[1])
    expect(revised.sessions.find((session) => session.id === current[2].id)).toBeUndefined()
    expect(revised.plans[0].status).toBe('superseded')
    expect(revised.plans.at(-1)?.supersedesId).toBe(mesocycles[0].id)
  })

  it('keeps projected planning sets separate from completed training volume', () => {
    const preview = buildMesocyclePreview(draft(), {
      exercises,
      currentSessions: sessions,
      history,
      planId: 'volume-plan',
      planVersion: 2
    })
    expect(preview.projectedSets).toBeGreaterThan(0)
    expect(history.length).toBeGreaterThan(preview.projectedSets)
    expect(preview.sessions.every((session) => session.exercises.every((item) => item.sets.every((set) => !set.completed)))).toBe(true)
  })
})
