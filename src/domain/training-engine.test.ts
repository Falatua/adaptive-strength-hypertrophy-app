import { describe, expect, it } from 'vitest'
import { compressSession, duplicateCandidates, normalizeExerciseRole, readinessFromSurvey, recommendProgression, sessionCompletionStatus, volumeLoad } from './training-engine'
import { exercises, sessions } from './seed'
import type { CompletedSetRecord, SurveyAnswer, SurveyRecord } from './types'

const set = (overrides: Partial<CompletedSetRecord> = {}): CompletedSetRecord => ({
  id: crypto.randomUUID(),
  sessionId: 'session',
  exerciseId: 'competition-bench',
  exerciseName: 'Competition Bench Press',
  family: 'Bench Press',
  primaryRegion: 'chest',
  completedAt: new Date().toISOString(),
  reps: 6,
  load: 175,
  rir: 2,
  technique: 4,
  pain: 0,
  setIndex: 0,
  ...overrides
})

const postSurvey = (sessionId: string, values: Record<string, number>): SurveyRecord => ({
  id: `post-${sessionId}`,
  sessionId,
  type: 'post',
  completedAt: new Date().toISOString(),
  skipped: false,
  answers: Object.entries(values).map(([id, value]) => ({ id, value, status: 'answered' as const }))
})

const movementSurvey = (sessionId: string, plannedExerciseId: string, values: Record<string, number>): SurveyRecord => ({
  id: `movement-${sessionId}-${plannedExerciseId}`,
  sessionId,
  type: 'movement',
  ruleVersion: 'movement-feedback-v1',
  plannedExerciseId,
  exerciseId: 'competition-bench',
  exerciseName: 'Competition Bench Press',
  sourceSetIds: ['planned-set-1'],
  completedAt: new Date().toISOString(),
  skipped: false,
  answers: Object.entries(values).map(([id, value]) => ({ id, value, status: 'answered' as const }))
})

describe('volume load', () => {
  it('sums completed reps times actual load for each set', () => {
    expect(volumeLoad([set({ reps: 5, load: 200 }), set({ reps: 4, load: 210 })])).toBe(1840)
  })
})

describe('readiness hypothesis', () => {
  it('uses pain as a safety-aware override', () => {
    const answers: SurveyAnswer[] = [{ id: 'pain', value: 4, status: 'answered' }]
    expect(readinessFromSurvey(answers, 'stable')).toBe('pain-aware')
  })

  it('does not invent a negative answer from skipped questions', () => {
    const answers: SurveyAnswer[] = [{ id: 'sleepHours', value: null, status: 'skipped' }]
    expect(readinessFromSurvey(answers, 'stable')).toBe('normal')
  })

  it('routes a returning athlete to reacclimation', () => {
    expect(readinessFromSurvey([], 'returning')).toBe('reacclimate')
  })
})

describe('load-first progression hierarchy', () => {
  it('progresses load when the top of the rep range is owned', () => {
    const history = ['first', 'second'].flatMap((sessionId, exposure) => Array.from({ length: 4 }, (_, setIndex) => set({
      id: `${sessionId}-${setIndex}`,
      sessionId,
      setIndex,
      completedAt: `2026-08-0${exposure + 1}T12:0${setIndex}:00.000Z`
    })))
    const decision = recommendProgression({ history, targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('load')
    expect(decision.nextLoad).toBe(180)
    expect(decision.nextReps).toBe(4)
  })

  it('progresses reps when load is not yet earned', () => {
    const history = ['first', 'second'].flatMap((sessionId, exposure) => Array.from({ length: 3 }, (_, setIndex) => set({
      id: `${sessionId}-${setIndex}`,
      sessionId,
      setIndex,
      reps: 5,
      completedAt: `2026-08-0${exposure + 1}T12:0${setIndex}:00.000Z`
    })))
    const decision = recommendProgression({ history, targetLoad: 175, targetReps: 5, targetSets: 3, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('reps')
    expect(decision.nextReps).toBe(6)
    expect(decision.nextLoad).toBe(175)
  })

  it('holds rather than adding a set when execution does not pass the gate', () => {
    const decision = recommendProgression({ history: [set({ technique: 2, rir: 0 }), set({ technique: 3, rir: 0 })], targetLoad: 175, targetReps: 6, targetSets: 2, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'protect' })
    expect(decision.action).toBe('hold')
    expect(decision.nextSets).toBe(2)
  })

  it('reacclimates after a meaningful gap without erasing experience', () => {
    const decision = recommendProgression({ history: [set()], targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'returning', readiness: 'reacclimate' })
    expect(decision.action).toBe('reacclimate')
    expect(decision.nextLoad).toBeLessThan(175)
  })

  it('does not reinterpret skipped technique and pain as poor technique', () => {
    const history = ['first', 'second'].flatMap((sessionId, exposure) => Array.from({ length: 4 }, (_, setIndex) => set({
      id: `unknown-${exposure}-${setIndex}`,
      sessionId,
      setIndex,
      technique: 0,
      pain: 0,
      qualityConfirmed: false,
      completedAt: `2026-08-0${exposure + 1}T12:0${setIndex}:00.000Z`
    })))
    const decision = recommendProgression({ history, targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('load')
    expect(decision.confidence).toBe('medium')
    expect(decision.evidence.unknownInputs).toContain('technique and joint response')
  })

  it('uses only the latest exact prescribed exposure instead of pooling unfinished work with an older session', () => {
    const history = [
      ...Array.from({ length: 4 }, (_, index) => set({ id: `old-${index}`, sessionId: 'old', setIndex: index, completedAt: '2026-08-01T12:00:00.000Z' })),
      set({ id: 'new-1', sessionId: 'new', setIndex: 0, completedAt: '2026-08-08T12:00:00.000Z' }),
      set({ id: 'new-2', sessionId: 'new', setIndex: 1, completedAt: '2026-08-08T12:01:00.000Z' })
    ]
    const decision = recommendProgression({ history, targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('hold')
    expect(decision.evidence.sourceSessionId).toBe('new')
    expect(decision.evidence.sourceSetIds).toHaveLength(2)
  })

  it('counts athlete-added work as dose without letting it earn automatic progression', () => {
    const history = Array.from({ length: 4 }, (_, index) => set({ id: `bonus-${index}`, setIndex: index, athleteAdded: true }))
    const decision = recommendProgression({ history, targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('hold')
    expect(decision.evidence.athleteAddedSetsExcluded).toBe(4)
    expect(decision.reasons[0]).toContain('athlete-added')
  })

  it('holds when the athlete says the otherwise completed session was much harder than planned', () => {
    const history = Array.from({ length: 4 }, (_, index) => set({ id: `hard-${index}`, setIndex: index, qualityConfirmed: true }))
    const decision = recommendProgression({ history, surveys: [postSurvey('session', { expectedComparison: 5, difficulty: 9, endFatigue: 5 })], targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('hold')
    expect(decision.reasons.join(' ')).toContain('reported')
  })

  it('lets exact-movement load feedback override a benign whole-session answer', () => {
    const plannedExerciseId = 'planned-bench'
    const history = Array.from({ length: 4 }, (_, index) => set({ id: `exact-${index}`, setIndex: index, qualityConfirmed: true, plannedExerciseId }))
    const exact = movementSurvey('session', plannedExerciseId, { movementPain: 0, loadFit: 5, volumeFit: 2 })
    const decision = recommendProgression({ history, surveys: [postSurvey('session', { difficulty: 3, endFatigue: 2 }), exact], targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('hold')
    expect(decision.evidence.feedbackSourceId).toBe(exact.id)
    expect(decision.reasons.join(' ')).toMatch(/exact movement was too heavy/i)
  })

  it('blocks overload only for the exact movement that reported pain', () => {
    const plannedExerciseId = 'planned-bench'
    const history = Array.from({ length: 4 }, (_, index) => set({ id: `pain-${index}`, setIndex: index, qualityConfirmed: true, plannedExerciseId }))
    const decision = recommendProgression({ history, surveys: [movementSurvey('session', plannedExerciseId, { movementPain: 4, loadFit: 3 })], targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('reduce')
    expect(decision.title).toMatch(/protect/i)
  })

  it('holds after exact-movement technique breakdown even when joint response was left unknown', () => {
    const plannedExerciseId = 'planned-bench'
    const history = Array.from({ length: 4 }, (_, index) => set({ id: `technique-${index}`, setIndex: index, qualityConfirmed: false, plannedExerciseId }))
    const decision = recommendProgression({ history, surveys: [movementSurvey('session', plannedExerciseId, { movementTechnique: 2, loadFit: 3 })], targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('hold')
    expect(decision.reasons.join(' ')).toMatch(/technique broke down/i)
  })

  it('keeps load first even when recovery feedback could support more dose', () => {
    const history = Array.from({ length: 3 }, (_, exposure) => Array.from({ length: 3 }, (_, index) => set({
      id: `load-${exposure}-${index}`, sessionId: `load-${exposure}`, setIndex: index, qualityConfirmed: true,
      completedAt: `2026-08-${String(exposure + 1).padStart(2, '0')}T12:0${index}:00.000Z`
    }))).flat()
    const surveys = [postSurvey('load-2', { targetStimulus: 1, recovery: 5, endFatigue: 2 })]
    const decision = recommendProgression({ history, surveys, targetLoad: 175, targetReps: 6, targetSets: 3, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('load')
  })

  it('offers one set only after load and repetitions are unavailable and recovery evidence supports dose', () => {
    const plannedExerciseId = 'planned-bench'
    const history = Array.from({ length: 4 }, (_, exposure) => Array.from({ length: 3 }, (_, index) => set({
      id: `set-${exposure}-${index}`, sessionId: `set-${exposure}`, setIndex: index, load: 10, qualityConfirmed: true,
      plannedExerciseId,
      completedAt: `2026-08-${String(exposure + 1).padStart(2, '0')}T12:0${index}:00.000Z`
    }))).flat()
    const surveys = [
      postSurvey('set-3', { targetStimulus: 1, recovery: 5, endFatigue: 2 }),
      movementSurvey('set-3', plannedExerciseId, { volumeFit: 1 })
    ]
    const decision = recommendProgression({ history, surveys, targetLoad: 10, targetReps: 6, targetSets: 3, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('sets')
    expect(decision.nextSets).toBe(4)
    expect(decision.reasons).toContain('Load jump exceeds five percent')
  })

  it('does not offer another set when the athlete marked the exact movement at their limit', () => {
    const plannedExerciseId = 'planned-bench'
    const history = Array.from({ length: 3 }, (_, exposure) => Array.from({ length: 3 }, (_, index) => set({
      id: `limit-${exposure}-${index}`, sessionId: `limit-${exposure}`, plannedExerciseId, setIndex: index, load: 10, qualityConfirmed: true,
      completedAt: `2026-08-${String(exposure + 1).padStart(2, '0')}T12:0${index}:00.000Z`
    }))).flat()
    const surveys = [postSurvey('limit-2', { targetStimulus: 1, recovery: 5, endFatigue: 2 }), movementSurvey('limit-2', plannedExerciseId, { targetStimulus: 1, recovery: 5, volumeFit: 3 })]
    const decision = recommendProgression({ history, surveys, targetLoad: 10, targetReps: 6, targetSets: 3, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('hold')
    expect(decision.nextSets).toBe(3)
  })

  it('does not add repetitions or load when actual RIR is unknown', () => {
    const history = Array.from({ length: 4 }, (_, index) => set({ id: `rir-${index}`, setIndex: index, rir: 0, rirKnown: false, qualityConfirmed: true }))
    const decision = recommendProgression({ history, targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('hold')
    expect(decision.evidence.unknownInputs).toContain('actual RIR')
  })

  it('does not progress from a set whose displayed numbers were never entered', () => {
    const history = Array.from({ length: 8 }, (_, index) => set({
      id: `assumed-${index}`,
      sessionId: index < 4 ? 'assumed-one' : 'assumed-two',
      setIndex: index % 4,
      qualityConfirmed: true,
      rirKnown: true,
      numbersEntered: false
    }))
    const decision = recommendProgression({ history, targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('hold')
    expect(decision.evidence.sourceSetIds).toHaveLength(0)
  })

  it('holds rather than escalating when multiple current readiness signals require protection', () => {
    const history = Array.from({ length: 4 }, (_, index) => set({ id: `protect-${index}`, setIndex: index, qualityConfirmed: true }))
    const decision = recommendProgression({ history, targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'protect' })
    expect(decision.action).toBe('hold')
    expect(decision.title).toContain('Confirm today')
  })
})

describe('time-aware session compression', () => {
  it('protects at least the primary minimum before lower-priority work', () => {
    const compressed = compressSession(structuredClone(sessions[0]), 15)
    const primary = compressed.exercises.find((exercise) => exercise.role === 'primary')
    expect(primary).toBeDefined()
    expect(primary?.sets.length).toBeGreaterThanOrEqual(2)
    expect(compressed.exercises.some((exercise) => exercise.role === 'tertiary')).toBe(false)
  })
})

describe('exercise role vocabulary', () => {
  it('maps the retired five-role vocabulary forward so stored sessions survive the upgrade', () => {
    expect(normalizeExerciseRole('primary')).toBe('primary')
    expect(normalizeExerciseRole('secondary')).toBe('secondary')
    // Priority accessories served a prioritised region, which is what accessory work now means.
    expect(normalizeExerciseRole('priority')).toBe('accessory')
    // Maintenance and optional both collapse into optional tertiary work.
    expect(normalizeExerciseRole('maintenance')).toBe('tertiary')
    expect(normalizeExerciseRole('optional')).toBe('tertiary')
  })

  it('passes current roles through unchanged', () => {
    expect(normalizeExerciseRole('accessory')).toBe('accessory')
    expect(normalizeExerciseRole('tertiary')).toBe('tertiary')
  })

  it('degrades an unrecognised stored role to tertiary rather than throwing', () => {
    expect(normalizeExerciseRole('nonsense')).toBe('tertiary')
  })
})

describe('session completion truth', () => {
  it('labels a session partial-primary when some primary work was completed', () => {
    const session = structuredClone(sessions[0])
    session.exercises[0].sets[0].completed = true
    expect(sessionCompletionStatus(session)).toBe('partial-primary')
  })

  it('does not count accessory-only work as a primary exposure', () => {
    const session = structuredClone(sessions[0])
    session.exercises[1].sets[0].completed = true
    expect(sessionCompletionStatus(session)).toBe('partial-no-primary')
  })

  it('requires every remaining planned set for completed status', () => {
    const session = structuredClone(sessions[0])
    session.exercises.forEach((exercise) => exercise.sets.forEach((workSet) => { workSet.completed = true }))
    expect(sessionCompletionStatus(session)).toBe('completed')
  })

  it('does not let an unfinished athlete-added set downgrade a fully completed prescription', () => {
    const session = structuredClone(sessions[0])
    session.exercises.forEach((exercise) => exercise.sets.forEach((workSet) => { workSet.completed = true }))
    session.exercises[0].sets.push({ id: 'set-added-1', targetLoad: 100, targetReps: 8, targetRir: 2, completed: false, athleteAdded: true })
    expect(sessionCompletionStatus(session)).toBe('completed')
  })

  it('still reports a partial session when a prescribed set is left unfinished alongside added work', () => {
    const session = structuredClone(sessions[0])
    session.exercises.forEach((exercise) => exercise.sets.forEach((workSet) => { workSet.completed = true }))
    session.exercises[1].sets[0].completed = false
    session.exercises[0].sets.push({ id: 'set-added-1', targetLoad: 100, targetReps: 8, targetRir: 2, completed: true, athleteAdded: true })
    expect(sessionCompletionStatus(session)).toBe('partial-primary')
  })
})

describe('exercise identity', () => {
  it('finds exact and alias duplicate candidates before creation', () => {
    expect(duplicateCandidates('2 Board Press', exercises)[0].exercise.id).toBe('two-board-press')
    expect(duplicateCandidates('Competition Bench Press', exercises)[0].score).toBe(1)
  })
})
