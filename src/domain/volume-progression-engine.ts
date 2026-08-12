import { muscleCreditsFor } from './muscle-dose'
import { muscleQuestionId } from './survey-engine'
import { isComparableExposure } from './set-structure-engine'
import type { CompletedSetRecord, Exercise, MuscleId, SurveyRecord } from './types'

export const VOLUME_PROGRESSION_RULE = 'volume-progression-v1'

/**
 * Weekly working-set landmarks per muscle, in the Renaissance Periodization sense:
 * MV is what maintains, MEV is the least that grows, MAV is the productive band, and MRV is the
 * ceiling this athlete can still recover from. These are starting reference points, not physiology.
 * They are scaled by the athlete's own volume tolerance and then corrected by their real response,
 * which is the only reason the app is allowed to act on them at all.
 */
export interface VolumeLandmarks {
  mv: number
  mev: number
  mav: number
  mrv: number
}

const baseLandmarks: Record<MuscleId, VolumeLandmarks> = {
  pectorals: { mv: 4, mev: 8, mav: 16, mrv: 22 },
  latissimus: { mv: 6, mev: 10, mav: 18, mrv: 25 },
  'upper-back': { mv: 6, mev: 10, mav: 18, mrv: 25 },
  'anterior-deltoids': { mv: 0, mev: 6, mav: 12, mrv: 16 },
  'lateral-deltoids': { mv: 6, mev: 8, mav: 18, mrv: 26 },
  'posterior-deltoids': { mv: 4, mev: 6, mav: 14, mrv: 20 },
  triceps: { mv: 4, mev: 6, mav: 12, mrv: 18 },
  biceps: { mv: 4, mev: 8, mav: 16, mrv: 26 },
  forearms: { mv: 2, mev: 4, mav: 10, mrv: 16 },
  quadriceps: { mv: 6, mev: 8, mav: 15, mrv: 20 },
  hamstrings: { mv: 3, mev: 4, mav: 12, mrv: 20 },
  gluteals: { mv: 0, mev: 4, mav: 12, mrv: 16 },
  adductors: { mv: 0, mev: 4, mav: 10, mrv: 16 },
  calves: { mv: 6, mev: 8, mav: 14, mrv: 20 },
  abdominals: { mv: 0, mev: 6, mav: 16, mrv: 25 },
  obliques: { mv: 0, mev: 4, mav: 12, mrv: 20 },
  'spinal-erectors': { mv: 2, mev: 4, mav: 10, mrv: 16 }
}

/** Volume tolerance is a one-to-five athlete dimension. Three leaves the reference values unchanged. */
export function landmarksFor(muscle: MuscleId, volumeTolerance: number | null): VolumeLandmarks {
  const base = baseLandmarks[muscle]
  const tolerance = volumeTolerance === null ? 3 : Math.max(1, Math.min(5, volumeTolerance))
  const scale = 1 + (tolerance - 3) * 0.12
  const scaled = (value: number) => Math.max(0, Math.round(value * scale))
  return { mv: scaled(base.mv), mev: scaled(base.mev), mav: scaled(base.mav), mrv: scaled(base.mrv) }
}

export type VolumeAction = 'add-sets' | 'hold' | 'reduce-sets' | 'deload' | 'insufficient-evidence'

export interface MuscleVolumeDecision {
  ruleVersion: typeof VOLUME_PROGRESSION_RULE
  muscle: MuscleId
  currentSets: number
  landmarks: VolumeLandmarks
  action: VolumeAction
  nextSets: number
  setChange: number
  confidence: 'low' | 'medium' | 'high'
  reasons: string[]
  unknownInputs: string[]
}

export interface MuscleFeedback {
  /** Post-session pump, 0 to 5. Null when the athlete did not answer. */
  pump: number | null
  /** How well the target muscle was trained, 1 to 5. Null when unanswered. */
  targetStimulus: number | null
  /** End-of-session fatigue, 1 to 5. Null when unanswered. */
  endFatigue: number | null
  /** Highest joint pain recorded against this muscle's work, 0 to 5. Null when unanswered. */
  pain: number | null
  /** Whether comparable exposures improved, held, or declined across the round. */
  performance: 'improved' | 'held' | 'declined' | 'unknown'
  /** Whether stimulus was answered for this exact muscle or inherited from the session answer. */
  attribution?: 'exact' | 'attributed'
}

/**
 * The Renaissance Periodization set-progression judgement, expressed against evidence this app already
 * collects. Stimulus is read from pump and target stimulus, fatigue from end fatigue and pain, and
 * performance from whether comparable exposures actually moved. Volume climbs through the productive
 * band only while the athlete is still responding, and stops at the ceiling they can recover from.
 *
 * Missing answers never become assumed answers. An unanswered round holds volume and says so, because
 * adding sets on the strength of a guess is how an athlete gets buried.
 */
export function decideMuscleVolume(input: {
  muscle: MuscleId
  currentSets: number
  volumeTolerance: number | null
  feedback: MuscleFeedback
  microcycleNumber: number
  targetMicrocycles: number
}): MuscleVolumeDecision {
  const landmarks = landmarksFor(input.muscle, input.volumeTolerance)
  const reasons: string[] = []
  const unknownInputs: string[] = []
  const { pump, targetStimulus, endFatigue, pain, performance } = input.feedback

  if (pump === null) unknownInputs.push('pump')
  if (targetStimulus === null) unknownInputs.push('target stimulus')
  if (endFatigue === null) unknownInputs.push('end fatigue')
  if (performance === 'unknown') unknownInputs.push('comparable performance')

  const decision = (action: VolumeAction, nextSets: number, confidence: MuscleVolumeDecision['confidence']): MuscleVolumeDecision => {
    const bounded = Math.max(0, Math.round(nextSets))
    return {
      ruleVersion: VOLUME_PROGRESSION_RULE,
      muscle: input.muscle,
      currentSets: input.currentSets,
      landmarks,
      action,
      nextSets: bounded,
      setChange: bounded - input.currentSets,
      confidence,
      reasons,
      unknownInputs
    }
  }

  // Pain that changed training is a safety boundary, not a volume signal.
  if (pain !== null && pain >= 3) {
    reasons.push(`Joint pain reached ${pain} of 5 on this muscle's work. Volume is reduced toward maintenance until that settles, and this is not medical advice.`)
    return decision('reduce-sets', Math.max(landmarks.mv, input.currentSets - 2), 'high')
  }

  // The last planned week of a mesocycle is the deload, and the ceiling forces one early.
  const atCeiling = input.currentSets >= landmarks.mrv
  const finalWeek = input.microcycleNumber >= input.targetMicrocycles
  if (atCeiling || finalWeek) {
    reasons.push(atCeiling
      ? `Weekly sets reached the ${landmarks.mrv} you can still recover from. Volume resets to ${landmarks.mev} so the next block starts productive rather than buried.`
      : `This is the last planned week of the block. Volume resets to ${landmarks.mev} so accumulated fatigue clears before the next one.`)
    return decision('deload', landmarks.mev, 'high')
  }

  if (unknownInputs.length >= 3) {
    reasons.push('Too little feedback was recorded this round to justify changing volume, so it holds. Answering pump, stimulus, and end fatigue is what lets volume move.')
    return decision('insufficient-evidence', input.currentSets, 'low')
  }

  if (input.currentSets < landmarks.mev) {
    reasons.push(`Weekly sets are below the ${landmarks.mev} that reliably grows this muscle, so volume climbs toward it.`)
    return decision('add-sets', Math.min(landmarks.mev, input.currentSets + 2), 'medium')
  }

  const highFatigue = endFatigue !== null && endFatigue >= 4
  const lowStimulus = (pump !== null && pump <= 1) || (targetStimulus !== null && targetStimulus <= 2)
  const strongStimulus = (pump !== null && pump >= 4) || (targetStimulus !== null && targetStimulus >= 4)

  if (performance === 'declined' && highFatigue) {
    reasons.push('Comparable performance dropped while end fatigue stayed high, which is the signal that this volume is no longer being recovered from.')
    return decision('reduce-sets', Math.max(landmarks.mev, input.currentSets - 2), 'high')
  }

  if (performance === 'declined') {
    reasons.push('Comparable performance dropped. Volume holds rather than climbing until the work already prescribed is being completed again.')
    return decision('hold', input.currentSets, 'medium')
  }

  if (highFatigue && strongStimulus) {
    reasons.push('The stimulus is clearly there and end fatigue is already high, so volume holds. More sets would buy fatigue rather than growth.')
    return decision('hold', input.currentSets, 'medium')
  }

  if (lowStimulus && !highFatigue) {
    reasons.push('Pump and target stimulus came back low while fatigue stayed manageable, which is the clearest case for more work.')
    return decision('add-sets', Math.min(landmarks.mrv, input.currentSets + 2), 'medium')
  }

  if (!highFatigue && (performance === 'improved' || performance === 'held')) {
    reasons.push(`Performance is holding or improving and fatigue is manageable, so volume adds one set toward the ${landmarks.mav} productive band.`)
    return decision('add-sets', Math.min(landmarks.mrv, input.currentSets + 1), performance === 'improved' ? 'high' : 'medium')
  }

  reasons.push('Evidence is mixed, so volume holds at its current level rather than guessing in either direction.')
  return decision('hold', input.currentSets, 'low')
}

/** Where the muscle currently sits relative to its landmarks, for display. */
export function volumeZone(sets: number, landmarks: VolumeLandmarks): 'below-maintenance' | 'maintenance' | 'productive' | 'near-ceiling' | 'over-ceiling' {
  if (sets >= landmarks.mrv) return 'over-ceiling'
  if (sets >= landmarks.mav) return 'near-ceiling'
  if (sets >= landmarks.mev) return 'productive'
  if (sets >= landmarks.mv) return 'maintenance'
  return 'below-maintenance'
}

const answerValue = (survey: SurveyRecord | undefined, id: string): number | null => {
  const answer = survey?.answers.find((candidate) => candidate.id === id && candidate.status === 'answered')
  return typeof answer?.value === 'number' ? answer.value : null
}

const mean = (values: number[]): number | null => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null

/**
 * Reads the per-muscle feedback the volume decision needs out of what the app already stores.
 *
 * Pump and target stimulus are asked per trained muscle, so those answers are exact for the muscle
 * being judged. When a session predates per-muscle questions, or the muscle fell outside the asked
 * cap, the session-level answer is used instead and reported as an attributed rather than exact
 * reading. End fatigue remains a whole-session measure by nature.
 */
export function summarizeMuscleFeedback(input: {
  muscle: MuscleId
  history: CompletedSetRecord[]
  surveys: SurveyRecord[]
  exercises: Exercise[]
  currentWindowStart: Date
  priorWindowStart: Date
  now?: Date
}): MuscleFeedback {
  const now = input.now ?? new Date()
  const directSetsFor = (set: CompletedSetRecord) => (muscleCreditsFor(set.exerciseId, input.exercises) ?? {})[input.muscle] === 1
  const inWindow = (set: CompletedSetRecord, from: Date, to: Date) => {
    const at = new Date(set.completedAt).getTime()
    return at >= from.getTime() && at < to.getTime()
  }

  const currentSets = input.history.filter((set) => directSetsFor(set) && inWindow(set, input.currentWindowStart, now))
  const priorSets = input.history.filter((set) => directSetsFor(set) && inWindow(set, input.priorWindowStart, input.currentWindowStart))
  const sessionIds = new Set(currentSets.map((set) => set.sessionId))
  const postSurveys = input.surveys.filter((survey) => survey.type === 'post' && sessionIds.has(survey.sessionId))

  const perSurvey = (id: string) => postSurveys.flatMap((survey) => {
    const value = answerValue(survey, id)
    return value === null ? [] : [value]
  })

  // An answer recorded against this exact muscle always beats the whole-session answer.
  const perMuscle = (base: 'pump' | 'targetStimulus') => {
    const exact = postSurveys.flatMap((survey) => {
      const value = answerValue(survey, muscleQuestionId(base, input.muscle))
      return value === null ? [] : [value]
    })
    return exact.length ? { value: mean(exact), exact: true } : { value: mean(perSurvey(base)), exact: false }
  }

  // Only comparable exposures decide whether performance moved. Drops and mini sets are real work but
  // are performed at reduced load, so including them would read a technique week as a decline.
  const comparableLoad = (sets: CompletedSetRecord[]) => mean(sets.filter((set) => isComparableExposure(set.grouping)).map((set) => set.load * set.reps))
  const currentLoad = comparableLoad(currentSets)
  const priorLoad = comparableLoad(priorSets)
  const performance: MuscleFeedback['performance'] = currentLoad === null || priorLoad === null || priorLoad === 0
    ? 'unknown'
    : currentLoad > priorLoad * 1.02 ? 'improved'
      : currentLoad < priorLoad * 0.98 ? 'declined' : 'held'

  const painValues = currentSets.map((set) => set.pain).filter((value) => Number.isFinite(value))
  const pump = perMuscle('pump')
  const targetStimulus = perMuscle('targetStimulus')
  return {
    pump: pump.value,
    targetStimulus: targetStimulus.value,
    endFatigue: mean(perSurvey('endFatigue')),
    pain: painValues.length ? Math.max(...painValues) : null,
    performance,
    attribution: pump.exact || targetStimulus.exact ? 'exact' : 'attributed'
  }
}

export const DELOAD_RULE = 'deload-v1'

export interface DeloadPrescription {
  ruleVersion: typeof DELOAD_RULE
  sets: number
  firstHalfLoad: number
  secondHalfLoad: number
  reps: number
  minimumRir: number
  notes: string[]
}

/**
 * A deload is not simply less volume. Following the Renaissance Periodization prescription, sets drop
 * to the minimum effective volume, repetitions fall to roughly half of the block's opening week, and
 * load holds at the opening week's weight for the first half of the week before halving for the
 * second. Effort stays far from failure, because hard training does not remove fatigue.
 */
export function deloadPrescription(input: {
  muscle: MuscleId
  volumeTolerance: number | null
  openingWeekLoad: number
  openingWeekReps: number
}): DeloadPrescription {
  const landmarks = landmarksFor(input.muscle, input.volumeTolerance)
  const round = (value: number) => Math.max(0, Math.round(value))
  return {
    ruleVersion: DELOAD_RULE,
    sets: landmarks.mev,
    firstHalfLoad: round(input.openingWeekLoad),
    secondHalfLoad: round(input.openingWeekLoad / 2),
    reps: Math.max(1, round(input.openingWeekReps / 2)),
    minimumRir: 4,
    notes: [
      `Sets drop to ${landmarks.mev} for the week, which is the least that still holds the adaptation.`,
      'Reps are about half of the block\'s first week, and load holds at that first week\'s weight before halving for the back half.',
      'Stay at least four reps short of failure. Hard training does not remove fatigue, and the point is to arrive at the next block wanting to train.'
    ]
  }
}

export type DeloadUrgency = 'not-yet' | 'approaching' | 'due' | 'overdue'

export interface DeloadForecast {
  ruleVersion: typeof DELOAD_RULE
  urgency: DeloadUrgency
  weeksTrained: number
  weeksUntilDue: number
  missedWeeks: number
  reasons: string[]
  athleteChoice: boolean
}

/**
 * Deloads are best taken just before the athlete hits the wall rather than after. Blocks typically run
 * five to six weeks, so the forecast starts there and then corrects for what actually happened: weeks
 * with no training accumulated no fatigue, so they push the deload later rather than counting toward
 * it, and evidence of not recovering pulls it earlier.
 *
 * The result is an offer, not an instruction. The athlete chooses when to take it unless the evidence
 * says they are already past due.
 */
export function forecastDeload(input: {
  weeksSinceLastDeload: number
  missedWeeks: number
  blockLength?: number
  musclesAtCeiling: number
  musclesLosingPerformance: number
  averageEndFatigue: number | null
  motivation: number | null
}): DeloadForecast {
  const blockLength = Math.max(3, Math.min(8, input.blockLength ?? 6))
  // Weeks with no training built no fatigue, so they do not count toward the block.
  const weeksTrained = Math.max(0, input.weeksSinceLastDeload - input.missedWeeks)
  const reasons: string[] = []
  if (input.missedWeeks > 0) {
    reasons.push(`${input.missedWeeks} week${input.missedWeeks === 1 ? '' : 's'} without training built no fatigue, so the deload moves back rather than arriving on the calendar.`)
  }

  let pull = 0
  if (input.musclesLosingPerformance >= 2) {
    pull += 1
    reasons.push(`${input.musclesLosingPerformance} muscles are losing performance, which usually shows up a week before everything else does.`)
  }
  if (input.musclesAtCeiling >= 2) {
    pull += 1
    reasons.push(`${input.musclesAtCeiling} muscles are already at the volume you can recover from.`)
  }
  if (input.averageEndFatigue !== null && input.averageEndFatigue >= 4) {
    pull += 1
    reasons.push('End-of-session fatigue has been running high across recent sessions.')
  }
  if (input.motivation !== null && input.motivation <= 2) {
    pull += 1
    reasons.push('Motivation to train has dropped, which is a fatigue signal as much as a mood one.')
  }

  // Evidence can pull a deload forward, but only so far. Letting it collapse the block would take the
  // timing decision away from the athlete, and choosing when to deload is most of what makes them take
  // it at all. The floor keeps the offer an offer.
  const effectiveLength = Math.max(4, blockLength - Math.min(2, pull))
  const weeksUntilDue = effectiveLength - weeksTrained
  const urgency: DeloadUrgency = weeksUntilDue <= -1 ? 'overdue' : weeksUntilDue <= 0 ? 'due' : weeksUntilDue === 1 ? 'approaching' : 'not-yet'

  if (urgency === 'not-yet') reasons.push(`Week ${weeksTrained} of about ${effectiveLength}. Keep training.`)
  if (urgency === 'approaching') reasons.push('One more hard week looks right, then take the deload before performance starts sliding.')
  if (urgency === 'due') reasons.push('This is the week to deload. Taking it now costs one easy week instead of three bad ones.')
  if (urgency === 'overdue') reasons.push('The deload is past due on the evidence recorded so far.')

  return {
    ruleVersion: DELOAD_RULE,
    urgency,
    weeksTrained,
    weeksUntilDue,
    missedWeeks: input.missedWeeks,
    reasons,
    athleteChoice: urgency !== 'overdue'
  }
}

/**
 * Landmarks are a starting reference until the athlete's own response corrects them. Recovering well at
 * the ceiling across two consecutive blocks raises it, because one good week is noise. A genuine
 * failure to recover lowers it after a single occurrence, because the cost of carrying a ceiling that
 * is too high is far greater than the cost of one conservative block.
 */
export function learnedCeiling(input: {
  muscle: MuscleId
  volumeTolerance: number | null
  storedAdjustment: number
  consecutiveRecoveredAtCeiling: number
  failedToRecover: boolean
}): { mrv: number; adjustment: number; reason: string | null } {
  const base = landmarksFor(input.muscle, input.volumeTolerance)
  const bounded = (value: number) => Math.max(-6, Math.min(6, value))
  if (input.failedToRecover) {
    const adjustment = bounded(input.storedAdjustment - 2)
    return { mrv: Math.max(base.mev, base.mrv + adjustment), adjustment, reason: 'Volume at the ceiling was not recovered from, so the ceiling comes down now rather than after another bad block.' }
  }
  if (input.consecutiveRecoveredAtCeiling >= 2) {
    const adjustment = bounded(input.storedAdjustment + 1)
    return { mrv: base.mrv + adjustment, adjustment, reason: 'Two consecutive blocks recovered well at the ceiling, so it rises by one set.' }
  }
  return { mrv: base.mrv + input.storedAdjustment, adjustment: input.storedAdjustment, reason: null }
}

/**
 * Weekly totals are only comparable when the same amount of training happened. A week with missed
 * sessions produced less volume for reasons that have nothing to do with the athlete's response, so
 * sets are compared per completed session rather than raw.
 */
export function scaleForCompletedSessions(sets: number, completedSessions: number, plannedSessions: number): number {
  if (completedSessions <= 0 || plannedSessions <= 0) return sets
  if (completedSessions >= plannedSessions) return sets
  return Math.round(sets * (plannedSessions / completedSessions))
}
