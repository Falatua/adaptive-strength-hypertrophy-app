import { describe, expect, it } from 'vitest'
import { buildMesocyclePreview, createMesocyclePlan, draftFromPlan, replaceFuturePlan } from './mesocycle-engine'
import { equipmentProfiles, exercises, history, mesocycles, sessions } from './seed'
import type { CompletedSetRecord } from './types'

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
    expect(preview.sessions.some((session) => session.exercises.some((item) => item.role === 'tertiary'))).toBe(true)
  })

  it('prioritizes the athlete-owned ABX bench, lower-body equipment, and preferred hinges within Home Gym programming', () => {
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const next = { ...draft(), defaultMinutes: 90, priorityRegions: ['back' as const, 'quadriceps' as const, 'hamstrings' as const], maintenanceRegions: [] }
    const preview = buildMesocyclePreview(next, {
      exercises,
      currentSessions: sessions,
      history,
      planId: 'freak-athlete-home-plan',
      planVersion: 2,
      equipmentProfile: home
    })
    const programmed = preview.sessions.flatMap((session) => session.exercises.map((planned) => planned.exerciseId))
    expect(programmed.some((id) => ['abx-chest-supported-db-row', 'abx-cambered-bar-chest-supported-row'].includes(id))).toBe(true)
    expect(programmed.some((id) => ['squat-press', 'leg-extension', 'single-leg-extension'].includes(id))).toBe(true)
    expect(programmed.some((id) => ['lying-leg-curl', 'deficit-conventional', 'romanian-deadlift', 'stiff-leg-deadlift'].includes(id))).toBe(true)
  })

  it('encodes JB Home Gym movement priorities without automatically selecting low-bar squats', () => {
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const next = { ...draft(), strengthAnchors: ['competition-squat', 'competition-bench', 'cambered-row'], priorityRegions: ['quadriceps' as const, 'chest' as const, 'back' as const, 'shoulders' as const], maintenanceRegions: ['hamstrings' as const] }
    const preview = buildMesocyclePreview(next, { exercises, currentSessions: [], history: [], planId: 'jb-home-priorities', planVersion: 1, equipmentProfile: home })
    const programmed = preview.sessions.flatMap((session) => session.exercises.map((planned) => planned.exerciseId))
    expect(programmed).toContain('squat-press')
    expect(programmed).toContain('incline-barbell-press')
    expect(programmed).toContain('abx-cambered-bar-chest-supported-row')
    expect(programmed).not.toContain('low-bar-squat')
  })

  it('programs a cambered supported row in most Home Gym sessions and pull-ups at a provisional three by five', () => {
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const next = { ...draft(), defaultMinutes: 60, priorityRegions: ['chest' as const, 'back' as const, 'triceps' as const], maintenanceRegions: ['hamstrings' as const, 'calves' as const] }
    const preview = buildMesocyclePreview(next, { exercises, currentSessions: [], history: [], planId: 'home-upper-priority', planVersion: 1, equipmentProfile: home })
    const rowSessions = preview.sessions.filter((session) => session.exercises.some((planned) => planned.exerciseId === 'abx-cambered-bar-chest-supported-row'))
    const pullUps = preview.sessions.flatMap((session) => session.exercises).filter((planned) => planned.exerciseId === 'pull-up')
    const calfSessions = preview.sessions.filter((session) => session.exercises.some((planned) => exercises.find((exercise) => exercise.id === planned.exerciseId)?.primaryRegion === 'calves'))

    expect(rowSessions).toHaveLength(2)
    expect(pullUps).toHaveLength(1)
    expect(pullUps[0].sets).toHaveLength(3)
    expect(pullUps[0].sets.every((workSet) => workSet.targetReps === 5 && workSet.targetLoad === 0)).toBe(true)
    expect(calfSessions.length).toBeLessThanOrEqual(1)
    expect(preview.explanations).toContain('The initial pull-up target is a provisional 3 × 5 capacity estimate, not completed history; exact logged sets replace it.')
  })

  it('uses the available Home Gym deficit platform for the highest-ranked barbell hinge builder', () => {
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const next = { ...draft(), strengthAnchors: ['conventional-deadlift'], weeklyOpportunities: 1, defaultMinutes: 60, priorityRegions: ['hamstrings' as const], maintenanceRegions: [] }
    const preview = buildMesocyclePreview(next, { exercises, currentSessions: [], history: [], planId: 'home-deficit-hinge', planVersion: 1, equipmentProfile: home })
    expect(preview.sessions[0].exercises[1].exerciseId).toBe('deficit-conventional')
  })

  it('lets exact pull-up history replace the provisional Home Gym capacity target', () => {
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const pullUpHistory = Array.from({ length: 4 }, (_, setIndex): CompletedSetRecord => ({
      id: `pull-up-history-${setIndex}`,
      sessionId: 'pull-up-history-session',
      exerciseId: 'pull-up',
      exerciseName: 'Pull-Up',
      family: 'Vertical Pull',
      primaryRegion: 'back',
      completedAt: '2026-08-25T12:00:00.000Z',
      reps: 6,
      load: 0,
      rir: 1,
      technique: 4,
      pain: 0,
      qualityConfirmed: true,
      setIndex
    }))
    const next = { ...draft(), defaultMinutes: 60 }
    const preview = buildMesocyclePreview(next, { exercises, currentSessions: [], history: pullUpHistory, planId: 'home-pull-up-history', planVersion: 1, equipmentProfile: home })
    const pullUp = preview.sessions.flatMap((session) => session.exercises).find((planned) => planned.exerciseId === 'pull-up')!
    expect(pullUp.sets).toHaveLength(4)
    expect(pullUp.sets.every((workSet) => workSet.targetReps === 6 && workSet.targetRir === 1)).toBe(true)
  })

  it('keeps an explicitly protected low-bar anchor while excluding it from automatic support work', () => {
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const next = { ...draft(), strengthAnchors: ['low-bar-squat'], priorityRegions: ['quadriceps' as const], maintenanceRegions: [] }
    const preview = buildMesocyclePreview(next, { exercises, currentSessions: [], history: [], planId: 'protected-low-bar', planVersion: 1, equipmentProfile: home })
    expect(preview.sessions[0].exercises[0].exerciseId).toBe('low-bar-squat')
    expect(preview.sessions[0].exercises.slice(1).some((planned) => planned.exerciseId === 'low-bar-squat')).toBe(false)
  })

  it('programs an available direct trap movement when Traps is a declared priority', () => {
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const next = { ...draft(), priorityRegions: ['traps' as const], maintenanceRegions: [] }
    const preview = buildMesocyclePreview(next, {
      exercises,
      currentSessions: sessions,
      history,
      planId: 'trap-priority-plan',
      planVersion: 2,
      equipmentProfile: home
    })
    const programmed = preview.sessions.flatMap((session) => session.exercises.map((planned) => planned.exerciseId))
    expect(programmed.some((id) => ['barbell-shrug', 'dumbbell-shrug', 'chest-supported-db-shrug', 'prone-trap-raise'].includes(id))).toBe(true)
  })

  it('starts reacclimation conservatively without adding catch-up volume', () => {
    const next = { ...draft(), dominantAdaptation: 'reacclimation' as const, entryRoute: undefined, generationRuleVersion: undefined, placementCreatedAt: undefined }
    const preview = buildMesocyclePreview(next, {
      exercises,
      currentSessions: sessions,
      history,
      planId: 'return-plan',
      planVersion: 2
    })
    const oldBench = sessions[0].exercises.find((item) => item.exerciseId === 'competition-bench')!
    const newBench = preview.sessions.flatMap((session) => session.exercises).find((item) => item.exerciseId === 'competition-bench')!
    expect(newBench.sets.length).toBeLessThan(oldBench.sets.length)
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

  it('keeps disliked movements out of newly selected support work', () => {
    const avoided = structuredClone(exercises).map((exercise) => exercise.id === 'two-board-press' || exercise.id === 'cable-fly' ? { ...exercise, disliked: true } : exercise)
    const preview = buildMesocyclePreview(draft(), {
      exercises: avoided,
      currentSessions: sessions,
      history,
      planId: 'preference-plan',
      planVersion: 2
    })
    const programmed = preview.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseId))
    expect(programmed).not.toContain('two-board-press')
    expect(programmed).not.toContain('cable-fly')
  })

  it('carries athlete-approved movement and incline choices through the block blueprint', () => {
    const next = {
      ...draft(),
      movementOverrides: [{ sessionIndex: 1, slotIndex: 1, exerciseId: 'incline-db-press', benchAngleDeg: 45, source: 'athlete' as const }]
    }
    const preview = buildMesocyclePreview(next, {
      exercises,
      currentSessions: sessions,
      history,
      planId: 'blueprint-plan',
      planVersion: 2
    })
    const selected = preview.sessions[1].exercises[1]
    expect(selected.exerciseId).toBe('incline-db-press')
    expect(selected.role).toBe('secondary')
    expect(selected.sets.every((workSet) => workSet.benchAngleDeg === 45)).toBe(true)
    expect(preview.projectedBlockSets).toBe(preview.projectedSets * next.targetMicrocycles)
    expect(preview.projectedBlockMinutes).toBe(preview.projectedMinutes * next.targetMicrocycles)
    expect(preview.explanations).toContain('1 athlete-approved movement or incline choice will repeat in each generated training round until the block is revised.')
  })

  it('preserves a saved blueprint when a completed block becomes the next draft', () => {
    const plan = {
      ...mesocycles[0],
      movementOverrides: [{ sessionIndex: 1, slotIndex: 1, exerciseId: 'incline-db-press', benchAngleDeg: 30, source: 'athlete' as const }]
    }
    expect(draftFromPlan(plan).movementOverrides).toEqual(plan.movementOverrides)
    expect(draftFromPlan(plan).movementOverrides).not.toBe(plan.movementOverrides)
  })
})
