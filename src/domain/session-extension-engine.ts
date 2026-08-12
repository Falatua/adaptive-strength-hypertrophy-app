import type { CompletedSetRecord, Exercise, PlannedExercise, ReadinessOutcome, SetPrescription } from './types'

export const SESSION_EXTENSION_RULE = 'session-extension-v1'

export interface SessionExtensionGate {
  allowed: boolean
  reason: string
  caution: string | null
}

/**
 * Extra work is athlete-authored, so the gate stays permissive by default and refuses only where the
 * app already refuses: a workout that is not open, and evidence that training changed pain. Reduced
 * readiness produces a stated caution rather than a block, because the athlete owns the decision.
 */
export function sessionExtensionGate(input: {
  sessionStatus: string
  readiness?: ReadinessOutcome
  painReported: boolean
}): SessionExtensionGate {
  if (input.sessionStatus !== 'active') {
    return { allowed: false, reason: 'Extra work can only be added while the workout is open.', caution: null }
  }
  if (input.painReported || input.readiness === 'pain-aware') {
    return {
      allowed: false,
      reason: 'This session recorded pain that changed training. Change or stop the affected movement instead of adding volume.',
      caution: null
    }
  }
  if (input.readiness === 'protect' || input.readiness === 'reacclimate') {
    return {
      allowed: true,
      reason: 'Extra work is available.',
      caution: `Readiness is ${input.readiness}. Today's plan was already reduced on purpose, so added work carries more recovery cost than usual.`
    }
  }
  return { allowed: true, reason: 'Extra work is available.', caution: null }
}

/**
 * An added set repeats the last prescribed target rather than progressing it. The engine did not
 * prescribe this work, so it must not invent a heavier target for it. The athlete edits load,
 * repetitions, and RIR directly, exactly as they can on any planned set.
 */
export function buildAddedSet(input: { sets: SetPrescription[]; id: string }): SetPrescription {
  const template = input.sets[input.sets.length - 1]
  return {
    id: input.id,
    targetReps: template?.targetReps ?? 8,
    targetLoad: template?.targetLoad ?? 0,
    targetRir: template?.targetRir ?? 2,
    completed: false,
    athleteAdded: true
  }
}

/**
 * An added movement enters as optional tertiary work and never takes the primary role. The primary anchor is where placement verification
 * reads its first completed set, so athlete-added work must not be able to become the evidence a
 * route decision rests on. Prescription repeats the latest exact exposure when one exists and stays
 * an explicit unloaded calibration when it does not.
 */
export function buildAddedMovement(input: {
  id: string
  setIdPrefix: string
  exercise: Exercise
  history: CompletedSetRecord[]
  setCount?: number
}): PlannedExercise {
  const setCount = Math.max(1, Math.min(6, input.setCount ?? 3))
  const exactHistory = input.history.filter((workSet) => workSet.exerciseId === input.exercise.id)
  const makeSets = (targetLoad: number, targetReps: number, targetRir: number): SetPrescription[] =>
    Array.from({ length: setCount }, (_, index) => ({
      id: `${input.setIdPrefix}-${index + 1}`,
      targetReps,
      targetLoad,
      targetRir,
      completed: false,
      athleteAdded: true
    }))

  const base = {
    id: input.id,
    exerciseId: input.exercise.id,
    role: 'tertiary' as const,
    purpose: 'Athlete-added extra work',
    restSeconds: 90,
    estimatedMinutes: setCount * 3,
    optional: true,
    athleteAdded: true
  }

  if (!exactHistory.length) {
    return {
      ...base,
      sets: makeSets(0, 8, 3),
      prescriptionMethod: 'baseline-calibration',
      prescriptionNote: `No exact ${input.exercise.name} history exists yet, so this starts as an unloaded calibration. Set the load you actually use. It becomes exact history for this movement once logged.`
    }
  }

  const latest = [...exactHistory].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime() || b.id.localeCompare(a.id))[0]
  return {
    ...base,
    sets: makeSets(latest.load, latest.reps, Math.max(2, latest.rir)),
    prescriptionMethod: 'exact-history',
    prescriptionNote: `Repeats your last exact ${input.exercise.name} exposure of ${latest.load} × ${latest.reps}. Added work repeats a known exposure instead of progressing it, because this movement was not part of today's prescription.`
  }
}
