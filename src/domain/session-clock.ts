import type { TrainingSession } from './types'

/**
 * The workout clock. It starts itself when the session starts, because a clock the athlete has to
 * remember to start is a clock that records nothing. Stopping it is for real interruptions: a phone
 * call, a drive between gyms, a long wait for a rack. Stopped time is removed from the session length
 * that gets recorded, so the number on screen and the number in history are the same number.
 */
export const SESSION_CLOCK_RULE = 'session-clock-v1' as const

export interface SessionClockState {
  running: boolean
  elapsedMs: number
}

export function sessionClockState(session: Pick<TrainingSession, 'startedAt' | 'clockPausedMs' | 'clockPausedAt'>, now: number): SessionClockState {
  const startedAt = session.startedAt ? new Date(session.startedAt).getTime() : now
  const stoppedAt = session.clockPausedAt ? new Date(session.clockPausedAt).getTime() : null
  const openStop = stoppedAt === null ? 0 : Math.max(0, now - stoppedAt)
  const elapsedMs = Math.max(0, now - startedAt - (session.clockPausedMs ?? 0) - openStop)
  return { running: stoppedAt === null, elapsedMs }
}

/** Trained minutes for the record: wall clock from the start, minus every stop the athlete took. */
export function sessionTrainedMinutes(session: Pick<TrainingSession, 'startedAt' | 'clockPausedMs' | 'clockPausedAt'>, completedAt: string): number {
  const { elapsedMs } = sessionClockState(session, new Date(completedAt).getTime())
  return Math.max(1, Math.round(elapsedMs / 60_000))
}

export function stopSessionClock<T extends TrainingSession>(session: T, now: string): T {
  if (session.clockPausedAt) return session
  return { ...session, clockPausedAt: now }
}

export function startSessionClock<T extends TrainingSession>(session: T, now: string): T {
  if (!session.clockPausedAt) return session
  const stoppedMs = Math.max(0, new Date(now).getTime() - new Date(session.clockPausedAt).getTime())
  return { ...session, clockPausedAt: null, clockPausedMs: (session.clockPausedMs ?? 0) + stoppedMs }
}
