import { beforeEach, describe, expect, it } from 'vitest'
import { backupStateFrom, createBackup, parseBackup } from '../domain/backup'
import { athlete, equipmentProfiles, exercises, history, mesocycles, records, sessions } from '../domain/seed'
import { useAppStore } from './useAppStore'

describe('clean first-use state', () => {
  beforeEach(() => useAppStore.getState().resetForTesting())

  it('contains no demo training truth or inherited athlete preferences', () => {
    const state = useAppStore.getState()
    const backup = backupStateFrom(state)

    expect(state.athlete.name).toBe('Athlete')
    expect(state.sessions).toEqual([])
    expect(state.history).toEqual([])
    expect(state.records).toEqual([])
    expect(state.mesocycles).toEqual([])
    expect(state.surveys).toEqual([])
    expect(state.movementNotes).toEqual([])
    expect(state.exercises.every((exercise) => !exercise.favorite && !exercise.disliked && exercise.jointFeeling === 'neutral')).toBe(true)
    expect(state.workoutVisible).toBe(false)
    expect(state.onboardingComplete).toBe(false)
    expect('resetDemo' in state).toBe(false)
    expect(backup.history).toEqual([])
    expect(backup.sessions).toEqual([])
    expect(backup.mesocycles).toEqual([])
  })

  it('persists the athlete-controlled live pain signal on the active workout', () => {
    const active = {
      id: 'active-safety-session', title: 'Safety session', objective: 'Train within current capacity.', dayLabel: 'Today',
      plannedDate: '2026-08-24T12:00:00.000Z', status: 'active' as const, durationMinutes: 45, exercises: []
    }
    useAppStore.setState({ sessions: [active], activeSessionId: active.id, workoutVisible: true })
    useAppStore.getState().setSessionPainStatus(active.id, 'changed-training')
    expect(useAppStore.getState().sessions[0].painStatus).toBe('changed-training')
    expect(backupStateFrom(useAppStore.getState()).sessions[0].painStatus).toBe('changed-training')
    useAppStore.getState().setSessionPainStatus(active.id, 'no-change')
    expect(useAppStore.getState().sessions[0].painStatus).toBe('no-change')
  })

  it('persists Set 1 autofill as editable draft data without completing later sets', () => {
    const session = {
      id: 'autofill-session', title: 'Autofill session', objective: 'Fast honest entry.', dayLabel: 'Today',
      plannedDate: '2026-08-27T12:00:00.000Z', status: 'active' as const, durationMinutes: 45,
      exercises: [{
        id: 'autofill-bench', exerciseId: 'competition-bench', role: 'primary' as const, purpose: 'Test Set 1 entry.', restSeconds: 180, estimatedMinutes: 15, optional: false,
        sets: Array.from({ length: 3 }, (_, index) => ({ id: `autofill-set-${index + 1}`, targetLoad: 100, targetReps: 8, targetRir: 2, completed: false }))
      }]
    }
    useAppStore.setState({ sessions: [session], activeSessionId: session.id, workoutVisible: true })
    useAppStore.getState().updateSet(session.id, session.exercises[0].id, session.exercises[0].sets[0].id, { load: 135, reps: 10, rir: 4 })

    const sets = useAppStore.getState().sessions[0].exercises[0].sets
    expect(sets[1]).toMatchObject({ completedLoad: 135, completedReps: 10, actualRir: 4, completed: false, valuesEntered: true, entryOrigins: { load: 'top-set-autofill', reps: 'top-set-autofill', rir: 'top-set-autofill' } })
    expect(sets.every((workSet) => !workSet.completed)).toBe(true)

    const restored = parseBackup(JSON.stringify(createBackup(backupStateFrom(useAppStore.getState()))))
    expect(restored.backup.data.sessions[0].exercises[0].sets[1]).toMatchObject({ completed: false, entryOrigins: { load: 'top-set-autofill', reps: 'top-set-autofill', rir: 'top-set-autofill' } })
  })

  it('clears inherited completion fields when a genuinely unstarted workout begins', () => {
    const session = structuredClone(sessions[0])
    session.status = 'planned'
    const staleSet = session.exercises[0].sets[0]
    Object.assign(staleSet, {
      completed: true,
      skipped: true,
      completedLoad: 999,
      completedReps: 99,
      actualRir: 0,
      valuesEntered: true,
      entryOrigins: { load: 'manual', reps: 'manual', rir: 'manual' }
    })
    useAppStore.setState({ sessions: [session], activeSessionId: null, workoutVisible: false })

    useAppStore.getState().startSession(session.id)

    const started = useAppStore.getState().sessions[0]
    expect(started.status).toBe('active')
    expect(started.exercises.flatMap((planned) => planned.sets).every((workSet) =>
      !workSet.completed
      && !workSet.skipped
      && workSet.completedLoad === undefined
      && workSet.completedReps === undefined
      && workSet.actualRir === undefined
      && workSet.valuesEntered === undefined
      && workSet.entryOrigins === undefined
    )).toBe(true)
    expect(useAppStore.getState().notice).toMatch(/unstarted set status was cleared/i)
  })

  it('logs a bodyweight movement without inventing a pound value and preserves editable Set 1 autofill', () => {
    const session = {
      id: 'bodyweight-session', title: 'Bodyweight session', objective: 'Build pull-up capacity.', dayLabel: 'Today',
      plannedDate: '2026-08-31T12:00:00.000Z', status: 'active' as const, durationMinutes: 45,
      exercises: [{
        id: 'bodyweight-pull-up', exerciseId: 'pull-up', role: 'secondary' as const, purpose: 'Pull-up strength.', restSeconds: 120, estimatedMinutes: 12, optional: false,
        sets: Array.from({ length: 3 }, (_, index) => ({ id: `bodyweight-set-${index + 1}`, targetLoad: 25, targetReps: 5, targetRir: 2, completed: false }))
      }]
    }
    useAppStore.setState({ sessions: [session], activeSessionId: session.id, workoutVisible: true })
    useAppStore.getState().setExerciseLoadMode(session.id, session.exercises[0].id, 'bodyweight')
    useAppStore.getState().setExerciseLoadMode(session.id, session.exercises[0].id, 'external')
    expect(useAppStore.getState().sessions[0].exercises[0].sets.every((workSet) => workSet.loadMode === 'external' && workSet.targetLoad === 25)).toBe(true)
    useAppStore.getState().setExerciseLoadMode(session.id, session.exercises[0].id, 'bodyweight')
    useAppStore.getState().updateSet(session.id, session.exercises[0].id, session.exercises[0].sets[0].id, { reps: 8, rir: 2 })

    const sets = useAppStore.getState().sessions[0].exercises[0].sets
    expect(sets.every((workSet) => workSet.loadMode === 'bodyweight' && workSet.targetLoad === 25 && workSet.completedLoad === undefined)).toBe(true)
    expect(sets.map((workSet) => workSet.completedReps)).toEqual([8, 8, 8])
    expect(sets.every((workSet) => !workSet.completed)).toBe(true)

    useAppStore.getState().toggleSetComplete(session.id, session.exercises[0].id, sets[0].id)
    useAppStore.getState().finishSession(session.id, { answers: [], skipped: true, mode: 'off' })
    expect(useAppStore.getState().history[0]).toMatchObject({ exerciseId: 'pull-up', load: 0, reps: 8, loadMode: 'bodyweight' })
    const restored = parseBackup(JSON.stringify(createBackup(backupStateFrom(useAppStore.getState()))))
    expect(restored.backup.data.history[0]).toMatchObject({ load: 0, reps: 8, loadMode: 'bodyweight' })
  })

  it('applies an evidence-backed suggestion only to unfinished sets after explicit approval', () => {
    const session = structuredClone(sessions[0])
    session.status = 'active'
    session.exercises[0].sets[0].completed = true
    useAppStore.setState({ sessions: [session], activeSessionId: session.id, workoutVisible: true })
    const planned = session.exercises[0]
    const result = useAppStore.getState().applyProgressSuggestion(session.id, {
      ruleVersion: 'movement-progress-path-v2', exerciseId: planned.exerciseId, plannedExerciseId: planned.id,
      loadMode: 'external', status: 'push-reps', title: 'A repetition is the next useful win',
      last: '4 × 6', today: '4 × 6', next: '4 × 7', toProgress: 'Add a repetition.', explanation: 'Completed evidence supports it.',
      confidence: 'high', sourceSetIds: ['source-set'], unknownInputs: [], proposed: { load: planned.sets[0].targetLoad, reps: 7, sets: planned.sets.length, loadMode: 'external' }, canApply: true
    })
    const updated = useAppStore.getState().sessions[0].exercises[0].sets
    expect(result.ok).toBe(true)
    expect(updated[0].targetReps).toBe(session.exercises[0].sets[0].targetReps)
    expect(updated.slice(1).every((workSet) => workSet.targetReps === 7 && !workSet.completed)).toBe(true)
    expect(useAppStore.getState().notice).toMatch(/unfinished sets/i)
  })

  it('versions a movement change across the remaining block while preserving the active workout and history', () => {
    const queuedSessions = structuredClone(sessions)
    queuedSessions[1].status = 'deferred'
    const unrelatedSession = {
      ...structuredClone(queuedSessions[1]),
      id: 'unrelated-planned-session',
      mesocycleId: 'another-training-block',
      status: 'planned' as const
    }
    const queuedCheckIn = {
      id: 'queued-check-in', sessionId: queuedSessions[1].id, type: 'pre' as const,
      completedAt: '2026-08-31T12:00:00.000Z', skipped: false,
      answers: [{ id: 'energy', value: 3, status: 'answered' as const }]
    }
    useAppStore.setState((state) => ({
      ...state,
      athlete: structuredClone(athlete),
      equipmentProfiles: structuredClone(equipmentProfiles),
      exercises: structuredClone(exercises),
      history: structuredClone(history),
      records: structuredClone(records),
      sessions: [...queuedSessions, unrelatedSession],
      surveys: [queuedCheckIn],
      mesocycles: structuredClone(mesocycles),
      activeMesocycleId: mesocycles[0].id,
      settings: { ...state.settings, activeEquipmentProfileId: equipmentProfiles[0].id, equipmentLocation: equipmentProfiles[0].name }
    }))
    useAppStore.getState().startSession('session-bench')
    const historyBefore = structuredClone(useAppStore.getState().history)
    const result = useAppStore.getState().swapExerciseForBlock('session-bench', 'plan-board', 'three-board-press', 'preference', false)

    expect(result.ok).toBe(true)
    const state = useAppStore.getState()
    const nextPlan = state.mesocycles.find((plan) => plan.id === state.activeMesocycleId)!
    expect(nextPlan).toMatchObject({ version: 2, status: 'active', supersedesId: mesocycles[0].id })
    expect(state.mesocycles.find((plan) => plan.id === mesocycles[0].id)?.status).toBe('superseded')
    const activeSession = state.sessions.find((session) => session.id === 'session-bench')!
    expect(activeSession).toMatchObject({ mesocycleId: nextPlan.id, planVersion: 2, status: 'active' })
    expect(activeSession.exercises[1].exerciseId).toBe('three-board-press')
    expect(nextPlan.sessionIds).toContain(activeSession.id)
    expect(state.sessions.filter((session) => session.mesocycleId === nextPlan.id && session.status === 'planned')).toHaveLength(2)
    expect(state.sessions.filter((session) => session.mesocycleId === nextPlan.id && session.microcycleNumber === 1)).toHaveLength(3)
    expect(state.sessions.find((session) => session.id === queuedSessions[1].id)?.status).toBe('expired')
    expect(state.sessions.some((session) => session.status === 'deferred' && session.mesocycleId === mesocycles[0].id)).toBe(false)
    expect(state.sessions.find((session) => session.id === unrelatedSession.id)?.status).toBe('planned')
    expect(state.surveys).toContainEqual(queuedCheckIn)
    expect(state.history).toEqual(historyBefore)
    expect(nextPlan.movementOverrides).toContainEqual({ sessionIndex: 0, slotIndex: 1, exerciseId: 'three-board-press', source: 'athlete' })
  })

  it('gives a replacement primary its own placement and future progression lane', () => {
    useAppStore.setState((state) => ({
      ...state,
      athlete: structuredClone(athlete),
      equipmentProfiles: structuredClone(equipmentProfiles),
      exercises: structuredClone(exercises),
      history: structuredClone(history),
      records: structuredClone(records),
      sessions: structuredClone(sessions),
      mesocycles: structuredClone(mesocycles),
      activeMesocycleId: mesocycles[0].id,
      settings: { ...state.settings, activeEquipmentProfileId: equipmentProfiles[0].id, equipmentLocation: equipmentProfiles[0].name }
    }))
    useAppStore.getState().startSession('session-bench')
    const result = useAppStore.getState().swapExerciseForBlock('session-bench', 'plan-bench', 'incline-barbell-press', 'preference', true)

    expect(result.ok).toBe(true)
    const state = useAppStore.getState()
    const plan = state.mesocycles.find((candidate) => candidate.id === state.activeMesocycleId)!
    const replacementPlacement = plan.movementPlacements?.find((placement) => placement.exerciseId === 'incline-barbell-press')
    expect(plan.strengthAnchors).toContain('incline-barbell-press')
    expect(plan.movementPlacements?.some((placement) => placement.exerciseId === 'competition-bench')).toBe(false)
    expect(replacementPlacement).toMatchObject({ exerciseId: 'incline-barbell-press', selectedRoute: 'bridge-calibration' })
    const activeSession = state.sessions.find((session) => session.id === 'session-bench')!
    expect(activeSession).toMatchObject({ mesocycleId: plan.id, planVersion: plan.version, status: 'active' })
    expect(activeSession.exercises[0].exerciseId).toBe('incline-barbell-press')
    expect(plan.sessionIds).toContain(activeSession.id)
    expect(state.sessions.filter((session) => session.mesocycleId === plan.id && session.status === 'planned')).toHaveLength(2)
  })

  it('stores movement completion feedback with exact set provenance and applies safety context only to that movement', () => {
    const session = {
      id: 'movement-feedback-session', title: 'Movement feedback session', objective: 'Keep feedback exact.', dayLabel: 'Today',
      plannedDate: '2026-08-27T12:00:00.000Z', status: 'active' as const, durationMinutes: 45,
      exercises: [{
        id: 'movement-feedback-bench', exerciseId: 'competition-bench', role: 'primary' as const, purpose: 'Bench.', restSeconds: 180, estimatedMinutes: 15, optional: false,
        sets: Array.from({ length: 2 }, (_, index) => ({ id: `movement-feedback-set-${index + 1}`, targetLoad: 135, targetReps: 8, targetRir: 2, completed: true, completedLoad: 135, completedReps: 8, actualRir: 2, valuesEntered: true }))
      }]
    }
    useAppStore.setState({ sessions: [session], activeSessionId: session.id, workoutVisible: true })
    const result = useAppStore.getState().recordMovementFeedback(session.id, session.exercises[0].id, [
      { id: 'movementPain', value: 4, status: 'answered' },
      { id: 'movementTechnique', value: 5, status: 'answered' },
      { id: 'volumeFit', value: 3, status: 'answered' }
    ], 'Shoulder changed the setup.', false)

    expect(result.ok).toBe(true)
    expect(useAppStore.getState().sessions[0].painStatus).toBe('changed-training')
    expect(useAppStore.getState().surveys[0]).toMatchObject({
      type: 'movement', plannedExerciseId: session.exercises[0].id, exerciseId: 'competition-bench',
      sourceSetIds: ['movement-feedback-set-1', 'movement-feedback-set-2'], note: 'Shoulder changed the setup.'
    })

    useAppStore.getState().finishSession(session.id, { answers: [], skipped: true, mode: 'off' })
    expect(useAppStore.getState().history).toHaveLength(2)
    expect(useAppStore.getState().history.every((workSet) => workSet.qualityConfirmed && workSet.technique === 5 && workSet.pain === 4)).toBe(true)
    expect(() => parseBackup(JSON.stringify(createBackup(backupStateFrom(useAppStore.getState()))))).not.toThrow()
  })

  it('adds and reverses exact past performance from a Library movement', () => {
    const store = useAppStore.getState()
    const incline = store.exercises.find((exercise) => exercise.id === 'incline-barbell-press')!
    const result = store.addHistoricalPerformance({
      exerciseId: incline.id,
      completedAt: new Date(Date.now() - 86_400_000).toISOString(),
      setCount: 3,
      reps: 8,
      load: 135,
      loadUnit: 'lb',
      effortScale: 'rir',
      effortValue: 0,
      benchAngleDeg: 45,
      technique: null,
      pain: null,
      sessionName: 'Upper day',
      note: 'Same bench and grip.'
    })
    expect(result.ok).toBe(true)
    expect(result.records).toHaveLength(3)
    expect(useAppStore.getState().history).toHaveLength(3)
    expect(useAppStore.getState().historyMutations.at(-1)).toMatchObject({ type: 'history-entered', affectedSetIds: expect.any(Array) })
    expect(backupStateFrom(useAppStore.getState()).history[0]).toMatchObject({ historyEntrySource: 'library', benchAngleDeg: 45, numbersEntered: true })
    const correction = useAppStore.getState().correctHistorySet(useAppStore.getState().history[0].id, {
      reps: 7, load: 140, rir: 1, technique: 0, pain: 0, qualityConfirmed: false,
      completedAt: useAppStore.getState().history[0].completedAt, benchAngleDeg: 45
    }, 'Corrected the first set from my log')
    expect(correction).toMatchObject({ ok: true })
    expect(useAppStore.getState().history[0]).toMatchObject({ reps: 7, load: 140, rir: 1, historyEntryEffortScale: 'rir', historyEntryEffortValue: 1 })
    expect(() => parseBackup(JSON.stringify(createBackup(backupStateFrom(useAppStore.getState()))))).not.toThrow()
    expect(useAppStore.getState().undoLatestHistoryMutation()).toMatchObject({ ok: true })
    expect(useAppStore.getState().history[0]).toMatchObject({ reps: 8, load: 135, rir: 0 })
    expect(useAppStore.getState().deleteHistorySet(useAppStore.getState().history[0].id, 'That set was not actually completed')).toMatchObject({ ok: true })
    expect(useAppStore.getState().history.map((workSet) => workSet.setIndex)).toEqual([1, 2])
    expect(() => parseBackup(JSON.stringify(createBackup(backupStateFrom(useAppStore.getState()))))).not.toThrow()
    expect(useAppStore.getState().undoLatestHistoryMutation()).toMatchObject({ ok: true })
    expect(useAppStore.getState().undoLatestHistoryMutation()).toMatchObject({ ok: true })
    expect(useAppStore.getState().history).toEqual([])
  })
})
