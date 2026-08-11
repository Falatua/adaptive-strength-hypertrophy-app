import { describe, expect, it } from 'vitest'
import { exercises, sessions } from './seed'
import { movementNoteError, movementNotesForExercise, projectMovementNoteMerge, upsertMovementNote } from './movement-note-engine'

describe('exact-movement workout notes', () => {
  const session = structuredClone(sessions[0])
  const planned = session.exercises[0]
  const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)!

  it('creates, updates, and clears only the exact workout movement note', () => {
    const created = upsertMovementNote({ notes: [], session, plannedExercise: planned, exercise, body: '30 degree bench. Four second eccentric.', now: '2026-08-10T10:00:00.000Z', id: 'note-1' })
    expect(created[0]).toMatchObject({ id: 'note-1', exerciseId: exercise.id, body: '30 degree bench. Four second eccentric.', ruleVersion: 'movement-note-v1' })
    const updated = upsertMovementNote({ notes: created, session, plannedExercise: planned, exercise, body: 'Keep feet farther forward.', now: '2026-08-10T10:05:00.000Z' })
    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({ body: 'Keep feet farther forward.', createdAt: '2026-08-10T10:00:00.000Z', updatedAt: '2026-08-10T10:05:00.000Z' })
    expect(upsertMovementNote({ notes: updated, session, plannedExercise: planned, exercise, body: '  ' })).toEqual([])
  })

  it('keeps notes independent when one planned slot is substituted', () => {
    const original = upsertMovementNote({ notes: [], session, plannedExercise: planned, exercise, body: 'Pause on the chest.', id: 'original-note' })
    const replacement = exercises.find((candidate) => candidate.id !== exercise.id)!
    const both = upsertMovementNote({ notes: original, session, plannedExercise: planned, exercise: replacement, body: 'Use the second pin.', id: 'replacement-note' })
    expect(both).toHaveLength(2)
    expect(both.map((note) => note.exerciseId)).toEqual([exercise.id, replacement.id])
  })

  it('sorts week-to-week recall and preserves original identity through a duplicate merge', () => {
    const firstSession = { ...session, plannedDate: '2026-08-01T10:00:00.000Z', startedAt: '2026-08-01T10:00:00.000Z' }
    const first = upsertMovementNote({ notes: [], session: firstSession, plannedExercise: planned, exercise, body: 'Week one cue.', now: '2026-08-01T10:00:00.000Z', id: 'note-1' })
    const laterSession = { ...session, id: 'later-session', plannedDate: '2026-08-08T10:00:00.000Z', startedAt: '2026-08-08T10:00:00.000Z' }
    const second = upsertMovementNote({ notes: first, session: laterSession, plannedExercise: planned, exercise, body: 'Week two cue.', now: '2026-08-08T10:00:00.000Z', id: 'note-2' })
    expect(movementNotesForExercise(second, exercise.id).map((note) => note.body)).toEqual(['Week two cue.', 'Week one cue.'])
    const target = exercises.find((candidate) => candidate.id !== exercise.id)!
    const merged = projectMovementNoteMerge(second, [exercise.id], target)
    expect(merged.every((note) => note.exerciseId === target.id)).toBe(true)
    expect(merged[0]).toMatchObject({ originalExerciseId: exercise.id, originalExerciseName: exercise.name })
    expect(movementNoteError(merged[0])).toBeNull()
  })

  it('rejects oversized or structurally invalid note records', () => {
    const note = upsertMovementNote({ notes: [], session, plannedExercise: planned, exercise, body: 'Useful cue', id: 'note-1' })[0]
    expect(movementNoteError({ ...note, body: 'x'.repeat(1001) })).toMatch(/too long/i)
    expect(movementNoteError({ ...note, sessionId: null })).toMatch(/identity/i)
  })
})
