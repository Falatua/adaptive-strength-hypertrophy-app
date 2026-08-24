import { describe, expect, it } from 'vitest'
import { buildAnalytics } from './analytics'
import { createBackup, parseBackup, type RestorableAppState } from './backup'
import { buildCycleReview, buildNextMicrocycle } from './cycle-review-engine'
import { derivePersonalRecords } from './history-engine'
import { buildLifeAwareAssessment } from './life-aware-engine'
import { buildOngoingConfidenceModel } from './ongoing-confidence-engine'
import { athlete, equipmentProfiles, exercises, mesocycles } from './seed'
import { recommendProgression, volumeLoad } from './training-engine'
import { decideMuscleVolume, summarizeMuscleFeedback } from './volume-progression-engine'
import type {
  CompletedSetRecord,
  MissedOpportunityEvent,
  ProgressionDecision,
  SurveyRecord,
  TrainingSession
} from './types'

const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS
const bench = exercises.find((exercise) => exercise.id === 'competition-bench')!
const incline = exercises.find((exercise) => exercise.id === 'incline-db-press')!

interface Target {
  load: number
  reps: number
  sets: number
}

interface LongitudinalReplay {
  history: CompletedSetRecord[]
  sessions: TrainingSession[]
  surveys: SurveyRecord[]
  decisions: ProgressionDecision[]
  nextTarget: Target
}

const atWeek = (start: string, week: number, minute = 0) => new Date(new Date(start).getTime() + week * WEEK_MS + minute * 60_000).toISOString()

const feedback = (sessionId: string, completedAt: string, values: Record<string, number> = {}): SurveyRecord => ({
  id: `post-${sessionId}`,
  sessionId,
  type: 'post',
  completedAt,
  skipped: false,
  mode: 'quick',
  answeredCount: 7,
  unknownCount: 0,
  confidence: 'medium',
  answers: Object.entries({
    expectedComparison: 3,
    difficulty: 6,
    endFatigue: 2,
    targetStimulus: 3,
    recovery: 5,
    pain: 0,
    technique: 4,
    ...values
  }).map(([id, value]) => ({ id, value, status: 'answered' as const }))
})

const prescribedSets = (input: {
  sessionId: string
  completedAt: string
  target: Target
  exerciseId?: string
  exerciseName?: string
  family?: string
  benchAngleDeg?: number
  rir?: number
  technique?: number
  pain?: number
  includeAthleteAdded?: boolean
}): CompletedSetRecord[] => {
  const exercise = exercises.find((candidate) => candidate.id === (input.exerciseId ?? bench.id)) ?? bench
  const sets = Array.from({ length: input.target.sets }, (_, setIndex): CompletedSetRecord => ({
    id: `${input.sessionId}-set-${setIndex + 1}`,
    sessionId: input.sessionId,
    exerciseId: input.exerciseId ?? exercise.id,
    exerciseName: input.exerciseName ?? exercise.name,
    family: input.family ?? exercise.family,
    primaryRegion: exercise.primaryRegion,
    completedAt: new Date(new Date(input.completedAt).getTime() + setIndex * 60_000).toISOString(),
    reps: input.target.reps,
    load: input.target.load,
    rir: input.rir ?? 2,
    rirKnown: true,
    technique: input.technique ?? 4,
    pain: input.pain ?? 0,
    qualityConfirmed: true,
    setIndex,
    benchAngleDeg: input.benchAngleDeg,
    plannedExerciseId: `${input.sessionId}-planned`
  }))
  if (input.includeAthleteAdded) sets.push({
    ...sets.at(-1)!,
    id: `${input.sessionId}-athlete-added`,
    setIndex: input.target.sets,
    reps: Math.max(1, input.target.reps - 2),
    athleteAdded: true
  })
  return sets
}

const completedSession = (sessionId: string, completedAt: string, target: Target, microcycleNumber: number): TrainingSession => ({
  id: sessionId,
  title: `Longitudinal bench exposure ${microcycleNumber}`,
  objective: 'Progress the exact bench prescription while preserving athlete control.',
  dayLabel: `Round ${microcycleNumber}`,
  plannedDate: completedAt,
  status: 'completed',
  durationMinutes: 55,
  readiness: 'normal',
  readinessSurveyMode: 'quick',
  readinessAnsweredCount: 5,
  readinessUnknownCount: 0,
  readinessConfidence: 'high',
  startedAt: completedAt,
  completedAt: new Date(new Date(completedAt).getTime() + 55 * 60_000).toISOString(),
  sessionRpe: 7,
  mesocycleId: 'mesocycle-longitudinal',
  planVersion: 1,
  microcycleNumber,
  exercises: [{
    id: `${sessionId}-planned`,
    exerciseId: bench.id,
    role: 'primary',
    purpose: 'Main lift',
    restSeconds: 180,
    estimatedMinutes: 25,
    optional: false,
    sets: Array.from({ length: target.sets }, (_, setIndex) => ({
      id: `${sessionId}-prescription-${setIndex + 1}`,
      targetLoad: target.load,
      targetReps: target.reps,
      targetRir: 2,
      completed: true
    }))
  }]
})

function replayStableYear(weeks = 52): LongitudinalReplay {
  const history: CompletedSetRecord[] = []
  const sessions: TrainingSession[] = []
  const surveys: SurveyRecord[] = []
  const decisions: ProgressionDecision[] = []
  let target: Target = { load: 175, reps: 4, sets: 4 }
  const start = '2025-08-18T16:00:00.000Z'

  for (let week = 0; week < weeks; week += 1) {
    const sessionId = `longitudinal-session-${week + 1}`
    const completedAt = atWeek(start, week)
    const before = JSON.stringify(history)
    history.push(...prescribedSets({ sessionId, completedAt, target, includeAthleteAdded: week % 4 === 3 }))
    sessions.push(completedSession(sessionId, completedAt, target, week + 1))
    surveys.push(feedback(sessionId, atWeek(start, week, 60)))
    const decision = recommendProgression({
      history,
      surveys,
      targetLoad: target.load,
      targetReps: target.reps,
      targetSets: target.sets,
      repRange: [4, 6],
      increment: 5,
      continuity: 'stable',
      readiness: 'normal'
    })
    decisions.push(decision)
    expect(JSON.stringify(history.slice(0, -target.sets - (week % 4 === 3 ? 1 : 0)))).toBe(before)
    target = { load: decision.nextLoad, reps: decision.nextReps, sets: decision.nextSets }
  }
  return { history, sessions, surveys, decisions, nextTarget: target }
}

const missedEvent = (input: {
  id: string
  session: TrainingSession
  recordedAt: string
  consecutiveMisses: number
  removedSets: number
}): MissedOpportunityEvent => ({
  id: input.id,
  ruleVersion: 'missed-opportunity-v1',
  sessionId: input.session.id,
  mesocycleId: input.session.mesocycleId ?? null,
  planVersion: input.session.planVersion ?? null,
  recordedAt: input.recordedAt,
  plannedAt: input.session.plannedDate,
  priorStatus: 'planned',
  input: {
    reason: 'family',
    trainingOutcome: 'no-training',
    nextOpportunityAt: new Date(new Date(input.recordedAt).getTime() + 2 * DAY_MS).toISOString(),
    nextMinutes: 30,
    constraintState: 'continuing',
    note: 'Family schedule changed.',
    preferredNextSessionId: null
  },
  continuityBefore: input.consecutiveMisses === 1 ? 'stable' : 'interrupted',
  continuityAfter: 'interrupted',
  consecutiveMisses: input.consecutiveMisses,
  mode: input.consecutiveMisses === 1 ? 'defer-one' : 'rebuild-sequence',
  queueBefore: [input.session.id],
  queueAfter: [input.session.id],
  nextSessionId: input.session.id,
  nextPrimaryExerciseId: bench.id,
  nextPrimaryLastExposureAt: null,
  nextPrimaryDaysSinceExposure: null,
  reasons: ['Keep earned work and rebuild only the open queue.'],
  changes: [{
    sessionId: input.session.id,
    fromPlannedAt: input.session.plannedDate,
    toPlannedAt: new Date(new Date(input.session.plannedDate).getTime() + 2 * DAY_MS).toISOString(),
    fromStatus: 'planned',
    toStatus: 'planned',
    fromDurationMinutes: 60,
    toDurationMinutes: 30,
    fromSetCount: 10,
    toSetCount: 10 - input.removedSets
  }],
  preservedTerminalSessionIds: [],
  completedSetCountBefore: 0,
  completedSetCountAfter: 0,
  openSetCountBefore: 10,
  openSetCountAfter: 10 - input.removedSets
})

function restorableYear(replay: LongitudinalReplay): RestorableAppState {
  const plan = {
    ...structuredClone(mesocycles[0]),
    id: 'mesocycle-longitudinal',
    title: 'Longitudinal acceptance year',
    objective: 'Verify stable long-term progression and persistence.',
    createdAt: '2025-08-18T15:00:00.000Z',
    effectiveAt: '2025-08-18T15:00:00.000Z',
    targetMicrocycles: 52,
    minimumProductiveExposures: 40,
    weeklyOpportunities: 1,
    strengthAnchors: [bench.id],
    sessionIds: replay.sessions.map((session) => session.id)
  }
  return {
    athlete: { ...structuredClone(athlete), name: 'Disposable Longitudinal Athlete', continuity: 'stable', strengthAnchors: [bench.id], weeklyOpportunities: 1 },
    settings: {
      units: 'lb', preSurveyMode: 'ask', postSurveyMode: 'ask', focusedMode: false,
      reducedMotion: false, sounds: false, haptics: true, celebrationLevel: 'subtle', opportunityPrompts: true,
      sessionAchievements: true, confetti: false, quietMode: false, availableMinutes: 60,
      equipmentLocation: 'Commercial Gym', activeEquipmentProfileId: 'equipment-commercial-gym'
    },
    equipmentProfiles: structuredClone(equipmentProfiles),
    exercises: structuredClone(exercises),
    sessions: structuredClone(replay.sessions),
    history: structuredClone(replay.history),
    movementNotes: [],
    surveys: structuredClone(replay.surveys),
    deferredFeedback: [],
    records: derivePersonalRecords(replay.history),
    historyMutations: [],
    cycleReviews: [],
    substitutionEvents: [],
    placementVerifications: [],
    placementExitReviews: [],
    movementPlacementExitReviews: [],
    missedOpportunityEvents: [],
    mesocycles: [plan],
    activeMesocycleId: plan.id,
    activeSessionId: null,
    onboardingComplete: true
  }
}

describe('longitudinal athlete acceptance replay', () => {
  it('progresses a stable athlete for 52 weeks through the real load, repetition, and evidence gates', () => {
    const replay = replayStableYear()
    expect(replay.decisions).toHaveLength(52)
    expect(replay.decisions.slice(0, 6).map((decision) => decision.action)).toEqual(['reps', 'reps', 'load', 'reps', 'reps', 'load'])
    expect(replay.decisions.filter((decision) => decision.action === 'load')).toHaveLength(17)
    expect(replay.decisions.filter((decision) => decision.action === 'sets')).toHaveLength(0)
    expect(replay.nextTarget).toEqual({ load: 260, reps: 5, sets: 4 })
    expect(replay.decisions.every((decision) => decision.evidence.sourceSetIds.every((id) => !id.includes('athlete-added')))).toBe(true)
    expect(replay.decisions.filter((decision) => decision.evidence.athleteAddedSetsExcluded > 0)).toHaveLength(49)
    expect(replay.decisions.at(-1)?.evidence.athleteAddedSetsExcluded).toBe(13)
    expect(new Set(replay.history.map((workSet) => workSet.id)).size).toBe(replay.history.length)
    expect(new Set(replay.sessions.map((session) => session.id)).size).toBe(replay.sessions.length)
    expect(replay.history.every((workSet, index, values) => index === 0 || new Date(workSet.completedAt) >= new Date(values[index - 1].completedAt))).toBe(true)
  })

  it('does not create catch-up volume after missed family weeks and resumes through reacclimation', () => {
    const opening = replayStableYear(6)
    const oldRecords = derivePersonalRecords(opening.history)
    const gapDate = new Date(new Date(opening.sessions.at(-1)!.completedAt!).getTime() + 21 * DAY_MS).toISOString()
    const returning = recommendProgression({
      history: opening.history,
      surveys: opening.surveys,
      targetLoad: opening.nextTarget.load,
      targetReps: opening.nextTarget.reps,
      targetSets: opening.nextTarget.sets,
      repRange: [4, 6], increment: 5, continuity: 'returning', readiness: 'reacclimate'
    })
    expect(returning.action).toBe('reacclimate')
    expect(returning.nextSets).toBe(opening.nextTarget.sets - 1)

    const returnTarget = { load: returning.nextLoad, reps: returning.nextReps, sets: returning.nextSets }
    const returnSets = prescribedSets({ sessionId: 'return-session', completedAt: gapDate, target: returnTarget })
    const resumedHistory = [...opening.history, ...returnSets]
    const resumed = recommendProgression({
      history: resumedHistory,
      surveys: [...opening.surveys, feedback('return-session', new Date(new Date(gapDate).getTime() + 60 * 60_000).toISOString())],
      targetLoad: returnTarget.load,
      targetReps: returnTarget.reps,
      targetSets: returnTarget.sets,
      repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal'
    })
    expect(resumed.action).toBe('reps')
    expect(resumed.nextSets).toBe(returnTarget.sets)
    expect(derivePersonalRecords(resumedHistory).some((record) => oldRecords.some((old) => old.id === record.id))).toBe(true)

    const interruptedSessions = opening.sessions.slice(-3).map((session, index) => ({
      ...session,
      plannedDate: new Date(new Date(gapDate).getTime() - (12 - index * 3) * DAY_MS).toISOString(),
      status: index === 0 ? 'completed' as const : 'expired' as const
    }))
    const misses = interruptedSessions.slice(1).map((session, index) => missedEvent({
      id: `family-miss-${index + 1}`, session, recordedAt: session.plannedDate, consecutiveMisses: index + 1, removedSets: 3
    }))
    const lifeAware = buildLifeAwareAssessment({
      sessions: interruptedSessions,
      history: opening.history,
      missedOpportunityEvents: misses,
      activePlan: mesocycles[0],
      priorityRegions: ['chest'],
      assessedAt: gapDate
    })
    expect(lifeAware.state).toBe('interrupted')
    expect(lifeAware.round.action).toBe('rebuild')
    expect(lifeAware.metrics.notCarriedForwardSets).toBe(3)
    expect(lifeAware.guardrails).toContain('No missed set becomes work owed later.')
    expect(lifeAware.block.approvalRequired).toBe(true)
  })

  it('holds or reduces dose under uncertainty, fatigue, and pain while preserving setup identity', () => {
    const unknown = decideMuscleVolume({
      muscle: 'pectorals', currentSets: 12, volumeTolerance: 4,
      feedback: { pump: null, targetStimulus: null, endFatigue: null, recovery: null, pain: null, performance: 'unknown' },
      microcycleNumber: 2, targetMicrocycles: 6
    })
    expect(unknown.action).toBe('insufficient-evidence')
    expect(unknown.nextSets).toBe(12)

    const fatigued = decideMuscleVolume({
      muscle: 'pectorals', currentSets: 14, volumeTolerance: 4,
      feedback: { pump: 4, targetStimulus: 4, endFatigue: 5, recovery: 1, pain: 0, performance: 'declined' },
      microcycleNumber: 4, targetMicrocycles: 6
    })
    expect(fatigued.action).toBe('reduce-sets')
    expect(fatigued.nextSets).toBeLessThan(14)

    const painful = decideMuscleVolume({
      muscle: 'pectorals', currentSets: 12, volumeTolerance: 4,
      feedback: { pump: 3, targetStimulus: 3, endFatigue: 3, recovery: 3, pain: 4, performance: 'held' },
      microcycleNumber: 3, targetMicrocycles: 6
    })
    expect(painful.action).toBe('reduce-sets')
    expect(painful.reasons.join(' ')).toMatch(/pain/i)

    const prior = prescribedSets({ sessionId: 'incline-30-prior', completedAt: '2026-06-01T16:00:00.000Z', target: { load: 70, reps: 10, sets: 3 }, exerciseId: incline.id, benchAngleDeg: 30 })
    const current = prescribedSets({ sessionId: 'incline-45-current', completedAt: '2026-06-08T16:00:00.000Z', target: { load: 80, reps: 10, sets: 3 }, exerciseId: incline.id, benchAngleDeg: 45 })
    const setupFeedback = summarizeMuscleFeedback({
      muscle: 'pectorals', history: [...prior, ...current], surveys: [], exercises,
      priorWindowStart: new Date('2026-05-25T00:00:00.000Z'),
      currentWindowStart: new Date('2026-06-05T00:00:00.000Z'),
      now: new Date('2026-06-15T00:00:00.000Z')
    })
    expect(setupFeedback.performance).toBe('unknown')
  })

  it('keeps cycle advancement criterion-based across an incomplete month and a conservative return round', () => {
    const plan = { ...structuredClone(mesocycles[0]), targetMicrocycles: 4 }
    const open = structuredClone(plan.sessionIds).map((sessionId, index): TrainingSession => ({
      ...completedSession(sessionId, `2026-01-0${index + 1}T16:00:00.000Z`, { load: 175, reps: 5, sets: 4 }, 1),
      mesocycleId: plan.id,
      status: index === 0 ? 'completed' : 'deferred'
    }))
    const sets = prescribedSets({ sessionId: open[0].id, completedAt: open[0].completedAt!, target: { load: 175, reps: 5, sets: 4 } })
    const extended = buildCycleReview(plan, open, sets, new Date('2026-01-11T16:00:00.000Z'))
    expect(extended.recommendation).toBe('extend')
    const recovery = buildCycleReview(plan, open, sets, new Date('2026-01-25T16:00:00.000Z'))
    expect(recovery.recommendation).toBe('recover')
    const recoveryRound = buildNextMicrocycle({
      plan, sessions: open, history: sets, exercises, decision: 'recover', nextMicrocycleNumber: 2,
      startsAt: new Date('2026-01-26T16:00:00.000Z'), key: 'longitudinal-return', equipmentProfile: equipmentProfiles[0]
    })
    expect(recoveryRound.every((session) => session.microcycleNumber === 2)).toBe(true)
    expect(recoveryRound[0].exercises[0].sets.length).toBeLessThan(open[0].exercises[0].sets.length)
    expect(derivePersonalRecords(sets).length).toBeGreaterThan(0)
  })

  it('conserves a year of volume across analytics, records, calibration, backup, and deterministic replay', () => {
    const first = replayStableYear()
    const second = replayStableYear()
    expect(second).toEqual(first)
    const expectedVolume = volumeLoad(first.history)
    const all = buildAnalytics(first.history, 'all', new Date('2026-08-13T12:00:00.000Z'))
    const year = buildAnalytics(first.history, 'year', new Date('2026-08-13T12:00:00.000Z'))
    expect(all.totalVolume).toBe(expectedVolume)
    expect(all.points.reduce((total, point) => total + point.volume, 0)).toBe(expectedVolume)
    expect(year.points.reduce((total, point) => total + point.volume, 0)).toBe(year.totalVolume)
    expect(all.setCount).toBe(first.history.length)
    expect(all.sessionCount).toBe(52)

    const confidence = buildOngoingConfidenceModel({
      strengthAnchorIds: [bench.id], exercises, history: first.history, sessions: first.sessions, surveys: first.surveys,
      placementVerifications: [], missedOpportunityEvents: [], assessedAt: '2026-08-13T12:00:00.000Z'
    })
    expect(confidence.movements[0]).toMatchObject({ state: 'well-calibrated', exposureDateCount: 52 })
    expect(confidence.lanes.map((lane) => [lane.id, lane.state, lane.evidenceStrength])).toEqual([
      ['main-lift-prescriptions', 'well-calibrated', 5],
      ['schedule-fit', 'well-calibrated', 5],
      ['recovery-response', 'well-calibrated', 5],
      ['volume-tolerance', 'well-calibrated', 5]
    ])

    const state = restorableYear(first)
    const backup = createBackup(state, '2026-08-13T12:00:00.000Z')
    const parsed = parseBackup(JSON.stringify(backup))
    expect(parsed.summary.sessions).toBe(52)
    expect(parsed.summary.completedSets).toBe(first.history.length)
    expect(parsed.backup.data).toEqual(state)
    expect(createBackup(restorableYear(second), '2026-08-13T12:00:00.000Z').integrity.value).toBe(backup.integrity.value)

    const stale = buildOngoingConfidenceModel({
      strengthAnchorIds: [bench.id], exercises, history: first.history, sessions: first.sessions, surveys: first.surveys,
      placementVerifications: [], missedOpportunityEvents: [], assessedAt: '2026-12-01T12:00:00.000Z'
    })
    expect(stale.movements[0].state).toBe('stale')
    expect(stale.movements[0].sourceSetIds).toHaveLength(first.history.filter((workSet) => workSet.exerciseId === bench.id).length)
  })

  it('round-trips and analyzes ten thousand exact completed sets without losing identity or volume', () => {
    const replay = replayStableYear()
    const history = Array.from({ length: 10_000 }, (_, index): CompletedSetRecord => {
      const source = replay.history[index % replay.history.length]
      return {
        ...source,
        id: `stress-set-${String(index + 1).padStart(5, '0')}`,
        completedAt: new Date(new Date('2016-01-01T12:00:00.000Z').getTime() + index * 8 * 60 * 60_000).toISOString(),
        setIndex: index
      }
    })
    const state = restorableYear(replay)
    state.history = history
    state.records = derivePersonalRecords(history)
    const expectedVolume = volumeLoad(history)
    const backup = createBackup(state, '2026-08-24T12:00:00.000Z')
    const parsed = parseBackup(JSON.stringify(backup))
    const analytics = buildAnalytics(parsed.backup.data.history, 'all', new Date('2026-08-24T12:00:00.000Z'))

    expect(parsed.summary.completedSets).toBe(10_000)
    expect(new Set(parsed.backup.data.history.map((workSet) => workSet.id)).size).toBe(10_000)
    expect(analytics.setCount).toBe(10_000)
    expect(analytics.totalVolume).toBe(expectedVolume)
    expect(createBackup(parsed.backup.data, '2026-08-24T12:00:00.000Z').integrity.value).toBe(backup.integrity.value)
  })
})
