import { muscleCreditsFor } from './muscle-dose'
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
 * Attribution caveat worth stating plainly: pump, target stimulus, and end fatigue are asked once per
 * session, while volume is judged per muscle. This attributes a session's answers to the muscles that
 * received direct work in that session, which is an approximation, not a measurement. Asking those
 * questions per trained muscle group would make it exact.
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
  return {
    pump: mean(perSurvey('pump')),
    targetStimulus: mean(perSurvey('targetStimulus')),
    endFatigue: mean(perSurvey('endFatigue')),
    pain: painValues.length ? Math.max(...painValues) : null,
    performance
  }
}
