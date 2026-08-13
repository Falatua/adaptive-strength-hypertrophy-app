import { describe, expect, it } from 'vitest'
import { sessionClockState, sessionTrainedMinutes, startSessionClock, stopSessionClock } from './session-clock'
import type { TrainingSession } from './types'

const session = (overrides: Partial<TrainingSession> = {}): TrainingSession => ({
  id: 'session-1', title: 'Test', objective: 'Test', dayLabel: 'Today', plannedDate: '2026-08-12T16:00:00.000Z',
  status: 'active', durationMinutes: 60, exercises: [], startedAt: '2026-08-12T16:00:00.000Z', ...overrides
})

describe('session clock', () => {
  it('runs from the moment the session started', () => {
    const state = sessionClockState(session(), new Date('2026-08-12T16:10:00.000Z').getTime())
    expect(state).toEqual({ running: true, elapsedMs: 600_000 })
  })

  it('holds still while stopped and does not lose the time already trained', () => {
    const stopped = stopSessionClock(session(), '2026-08-12T16:10:00.000Z')
    const during = sessionClockState(stopped, new Date('2026-08-12T16:25:00.000Z').getTime())
    expect(during).toEqual({ running: false, elapsedMs: 600_000 })
  })

  it('resumes without counting the stopped stretch', () => {
    const stopped = stopSessionClock(session(), '2026-08-12T16:10:00.000Z')
    const resumed = startSessionClock(stopped, '2026-08-12T16:25:00.000Z')
    expect(resumed.clockPausedMs).toBe(900_000)
    expect(resumed.clockPausedAt).toBeNull()
    expect(sessionClockState(resumed, new Date('2026-08-12T16:30:00.000Z').getTime()).elapsedMs).toBe(900_000)
  })

  it('records the trained minutes the athlete actually saw, not the wall clock', () => {
    const stopped = stopSessionClock(session(), '2026-08-12T16:10:00.000Z')
    const resumed = startSessionClock(stopped, '2026-08-12T16:40:00.000Z')
    expect(sessionTrainedMinutes(resumed, '2026-08-12T17:00:00.000Z')).toBe(30)
  })

  it('subtracts a stop that is still open when the session is finished', () => {
    const stopped = stopSessionClock(session(), '2026-08-12T16:20:00.000Z')
    expect(sessionTrainedMinutes(stopped, '2026-08-12T17:00:00.000Z')).toBe(20)
  })

  it('never reports less than a minute of training', () => {
    expect(sessionTrainedMinutes(session(), '2026-08-12T16:00:10.000Z')).toBe(1)
  })

  it('ignores a second stop while already stopped and a start while already running', () => {
    const stopped = stopSessionClock(session(), '2026-08-12T16:10:00.000Z')
    expect(stopSessionClock(stopped, '2026-08-12T16:15:00.000Z')).toEqual(stopped)
    expect(startSessionClock(session(), '2026-08-12T16:15:00.000Z')).toEqual(session())
  })
})
