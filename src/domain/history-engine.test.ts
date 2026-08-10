import { describe, expect, it } from 'vitest'
import { athlete, exercises, history, sessions } from './seed'
import { deriveAchievementEvents, derivePersonalRecords, deriveRecordOpportunities, findExerciseDuplicatePairs, historyVolume, projectExerciseMerge } from './history-engine'

describe('source history replay', () => {
  it('derives every record from exact supporting set IDs', () => {
    const records = derivePersonalRecords(history)
    const sourceIds = new Set(history.map((workSet) => workSet.id))
    expect(records.length).toBeGreaterThan(0)
    expect(records.every((record) => record.sourceSetIds.length > 0 && record.sourceSetIds.every((id) => sourceIds.has(id)))).toBe(true)
  })

  it('removes a false load record after its source set is corrected', () => {
    const template = history.find((workSet) => workSet.exerciseId === 'competition-bench')!
    const workSets = [{ ...template, id: 'ordinary-set', load: 180 }, { ...template, id: 'false-record-set', load: 500, completedAt: '2026-08-10T12:00:00.000Z' }]
    const peak = [...workSets].sort((a, b) => b.load - a.load)[0]
    const before = derivePersonalRecords(workSets).find((record) => record.type === 'absolute-load')
    const corrected = workSets.map((workSet) => workSet.id === peak.id ? { ...workSet, load: 1 } : workSet)
    const after = derivePersonalRecords(corrected).find((record) => record.type === 'absolute-load')
    expect(after?.value).toBeLessThan(before?.value ?? 0)
    expect(after?.sourceSetIds).not.toContain(peak.id)
  })

  it('reconciles an exact deletion delta', () => {
    const removed = history[0]
    const after = history.filter((workSet) => workSet.id !== removed.id)
    expect(historyVolume(history) - historyVolume(after)).toBe(removed.load * removed.reps)
  })

  it('keeps exact load, repetition-at-load, load-for-reps, scheme, estimate, and volume definitions separate', () => {
    const records = derivePersonalRecords(history.filter((workSet) => workSet.exerciseId === 'competition-bench'))
    expect(new Set(records.map((record) => record.type))).toEqual(new Set([
      'absolute-load', 'reps-at-load', 'load-for-reps', 'set-scheme', 'estimated-strength', 'exercise-session-volume', 'workout-session-volume'
    ]))
    const scheme = records.find((record) => record.type === 'set-scheme')
    expect(scheme?.sourceSetIds).toHaveLength(4)
    expect(scheme?.context.formula).toBeUndefined()
    expect(records.find((record) => record.type === 'estimated-strength')?.context).toMatchObject({ formula: 'epley', formulaVersion: 'epley-v1', eligibleRepRange: [1, 12] })
  })

  it('reveals only opportunities already inside the plan and pauses them under protective readiness', () => {
    const planned = structuredClone(sessions[0].exercises[0])
    planned.sets.forEach((workSet) => { workSet.targetLoad = 500 })
    planned.sets[0].completedLoad = 900
    const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)!
    const normal = deriveRecordOpportunities({ history, planned, exercise, readiness: 'normal' })
    const protectedOpportunities = deriveRecordOpportunities({ history, planned, exercise, readiness: 'protect' })
    expect(normal.length).toBeGreaterThan(0)
    expect(normal.every((opportunity) => opportunity.eligible && opportunity.plannedValue <= 500 * planned.sets.length * planned.sets[0].targetReps)).toBe(true)
    expect(normal.some((opportunity) => opportunity.plannedValue === 900)).toBe(false)
    expect(protectedOpportunities.every((opportunity) => !opportunity.eligible && /pauses/i.test(opportunity.gateReason))).toBe(true)
  })

  it('derives an auditable achievement timeline from completed source sets', () => {
    const events = deriveAchievementEvents(history)
    const sourceIds = new Set(history.map((workSet) => workSet.id))
    expect(events.some((event) => event.kind === 'personal-record')).toBe(true)
    expect(events.some((event) => event.category === 'baseline')).toBe(true)
    expect(events.every((event) => event.sourceSetIds.length > 0 && event.sourceSetIds.every((id) => sourceIds.has(id)))).toBe(true)
  })

  it('labels an improved number without confirmed technique and pain as numeric-only', () => {
    const template = history.find((workSet) => workSet.exerciseId === 'competition-bench')!
    const earlier = { ...template, id: 'confirmed-earlier', sessionId: 'earlier', completedAt: '2026-08-01T12:00:00.000Z', load: 180, qualityConfirmed: true }
    const unconfirmed = { ...template, id: 'unconfirmed-later', sessionId: 'later', completedAt: '2026-08-10T12:00:00.000Z', load: 185, qualityConfirmed: false }
    const record = derivePersonalRecords([earlier, unconfirmed]).find((candidate) => candidate.type === 'absolute-load')
    const event = deriveAchievementEvents([earlier, unconfirmed]).find((candidate) => candidate.recordType === 'absolute-load')
    expect(record?.validation).toBe('numeric-only')
    expect(event).toMatchObject({ title: 'Unverified number best', validation: 'numeric-only' })
    expect(event?.explanation).toMatch(/not a validated PR/i)
  })
})

describe('duplicate identity control', () => {
  const duplicateA = { ...structuredClone(exercises[0]), id: 'incline-bench-a', name: 'Incline Bench Press', aliases: [] }
  const duplicateB = { ...structuredClone(exercises[0]), id: 'incline-bench-b', name: 'Barbell Incline Bench Press', aliases: ['Incline Bench'] }

  it('finds deterministic probable duplicate pairs', () => {
    const pairs = findExerciseDuplicatePairs([duplicateA, duplicateB])
    expect(pairs).toHaveLength(1)
    expect(pairs[0].score).toBeGreaterThanOrEqual(0.7)
  })

  it('merges history while preserving original entered identity', () => {
    const sourceSet = { ...history[0], id: 'source-set', exerciseId: duplicateB.id, exerciseName: duplicateB.name }
    const projection = projectExerciseMerge({
      exercises: [duplicateA, duplicateB], history: [sourceSet], sessions: [], athlete: { ...athlete, strengthAnchors: [duplicateB.id] },
      sourceIds: [duplicateB.id], targetId: duplicateA.id
    })
    expect(projection.history[0]).toMatchObject({ exerciseId: duplicateA.id, exerciseName: duplicateA.name, originalExerciseId: duplicateB.id, originalExerciseName: duplicateB.name })
    expect(projection.exercises.find((exercise) => exercise.id === duplicateB.id)).toMatchObject({ retired: true, mergedIntoId: duplicateA.id })
    expect(projection.athlete.strengthAnchors).toEqual([duplicateA.id])
  })

  it('updates only future plan references', () => {
    const future = { ...structuredClone(sessions[0]), id: 'future', status: 'planned' as const, exercises: [{ ...structuredClone(sessions[0].exercises[0]), exerciseId: duplicateB.id }] }
    const completed = { ...structuredClone(future), id: 'completed', status: 'completed' as const }
    const projection = projectExerciseMerge({ exercises: [duplicateA, duplicateB], history: [], sessions: [future, completed], athlete, sourceIds: [duplicateB.id], targetId: duplicateA.id })
    expect(projection.sessions[0].exercises[0].exerciseId).toBe(duplicateA.id)
    expect(projection.sessions[1].exercises[0].exerciseId).toBe(duplicateB.id)
  })

  it('leaves input objects untouched so an undo snapshot remains exact', () => {
    const original = structuredClone([duplicateA, duplicateB])
    projectExerciseMerge({ exercises: original, history: [], sessions: [], athlete, sourceIds: [duplicateB.id], targetId: duplicateA.id })
    expect(original[1].retired).toBeUndefined()
    expect(original[0].aliases).not.toContain(duplicateB.name)
  })
})
