import { beforeEach, describe, expect, it } from 'vitest'
import { backupStateFrom, createBackup, parseBackup } from '../domain/backup'
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
