import { describe, expect, it } from 'vitest'
import { decideMuscleVolume, landmarksFor, summarizeMuscleFeedback, volumeZone, type MuscleFeedback } from './volume-progression-engine'
import { muscleQuestionId } from './survey-engine'
import { muscleIds } from './muscle-dose'
import type { CompletedSetRecord, Exercise, MuscleId, SurveyRecord } from './types'
import { exercises as seedExercises } from './seed'

const feedback = (over: Partial<MuscleFeedback> = {}): MuscleFeedback => ({
  pump: 3, targetStimulus: 3, endFatigue: 3, pain: 0, performance: 'held', ...over
})

const decide = (over: Partial<Parameters<typeof decideMuscleVolume>[0]> = {}) => decideMuscleVolume({
  muscle: 'pectorals', currentSets: 10, volumeTolerance: 3, feedback: feedback(),
  microcycleNumber: 2, targetMicrocycles: 4, ...over
})

describe('landmarksFor', () => {
  it('defines landmarks for every muscle the app can attribute a set to', () => {
    for (const muscle of muscleIds as MuscleId[]) {
      const landmarks = landmarksFor(muscle, 3)
      expect(landmarks.mev).toBeGreaterThan(0)
      expect(landmarks.mev).toBeGreaterThanOrEqual(landmarks.mv)
      expect(landmarks.mav).toBeGreaterThanOrEqual(landmarks.mev)
      expect(landmarks.mrv).toBeGreaterThanOrEqual(landmarks.mav)
    }
  })

  it('scales with the athlete\'s own volume tolerance', () => {
    expect(landmarksFor('pectorals', 5).mrv).toBeGreaterThan(landmarksFor('pectorals', 3).mrv)
    expect(landmarksFor('pectorals', 1).mrv).toBeLessThan(landmarksFor('pectorals', 3).mrv)
  })

  it('treats an unknown tolerance as the neutral reference rather than guessing high', () => {
    expect(landmarksFor('pectorals', null)).toEqual(landmarksFor('pectorals', 3))
  })
})

describe('decideMuscleVolume', () => {
  it('climbs toward the minimum effective volume when below it', () => {
    const result = decide({ currentSets: 4 })
    expect(result.action).toBe('add-sets')
    expect(result.nextSets).toBeGreaterThan(4)
    expect(result.reasons[0]).toContain('reliably grows')
  })

  it('adds work when stimulus came back low and fatigue was manageable', () => {
    const result = decide({ feedback: feedback({ pump: 1, targetStimulus: 2, endFatigue: 2 }) })
    expect(result.action).toBe('add-sets')
    expect(result.setChange).toBe(2)
  })

  it('holds when the stimulus is clearly there and fatigue is already high', () => {
    const result = decide({ feedback: feedback({ pump: 5, endFatigue: 5 }) })
    expect(result.action).toBe('hold')
    expect(result.reasons[0]).toContain('buy fatigue rather than growth')
  })

  it('adds a single set when performance holds and fatigue is manageable', () => {
    const result = decide({ feedback: feedback({ performance: 'held', endFatigue: 2 }) })
    expect(result.action).toBe('add-sets')
    expect(result.setChange).toBe(1)
  })

  it('cuts volume when performance declined under high fatigue', () => {
    const result = decide({ feedback: feedback({ performance: 'declined', endFatigue: 5 }) })
    expect(result.action).toBe('reduce-sets')
    expect(result.setChange).toBeLessThan(0)
    expect(result.reasons[0]).toContain('no longer being recovered from')
  })

  it('holds rather than cutting when performance declined without high fatigue', () => {
    const result = decide({ feedback: feedback({ performance: 'declined', endFatigue: 2 }) })
    expect(result.action).toBe('hold')
  })

  it('deloads to the minimum effective volume once the recoverable ceiling is reached', () => {
    const landmarks = landmarksFor('pectorals', 3)
    const result = decide({ currentSets: landmarks.mrv, feedback: feedback({ pump: 1, endFatigue: 1 }) })
    expect(result.action).toBe('deload')
    expect(result.nextSets).toBe(landmarks.mev)
  })

  it('deloads on the final planned week of the block', () => {
    const result = decide({ microcycleNumber: 4, targetMicrocycles: 4 })
    expect(result.action).toBe('deload')
    expect(result.reasons[0]).toContain('last planned week')
  })

  it('never climbs past the recoverable ceiling', () => {
    const landmarks = landmarksFor('pectorals', 3)
    const result = decide({ currentSets: landmarks.mrv - 1, feedback: feedback({ pump: 0, targetStimulus: 1, endFatigue: 1 }) })
    expect(result.nextSets).toBeLessThanOrEqual(landmarks.mrv)
  })

  it('treats pain as a safety boundary rather than a volume signal', () => {
    const result = decide({ feedback: feedback({ pain: 4, pump: 1, endFatigue: 1, performance: 'improved' }) })
    expect(result.action).toBe('reduce-sets')
    expect(result.reasons[0]).toContain('not medical advice')
  })

  it('holds and says so when too little feedback was recorded', () => {
    const result = decide({ feedback: { pump: null, targetStimulus: null, endFatigue: null, pain: null, performance: 'unknown' } })
    expect(result.action).toBe('insufficient-evidence')
    expect(result.setChange).toBe(0)
    expect(result.confidence).toBe('low')
    expect(result.unknownInputs).toContain('pump')
  })

  it('reports every unanswered input rather than silently filling it in', () => {
    const result = decide({ feedback: feedback({ pump: null, endFatigue: null }) })
    expect(result.unknownInputs).toEqual(['pump', 'end fatigue'])
  })

  it('always explains itself and never returns a bare number', () => {
    const result = decide()
    expect(result.reasons.length).toBeGreaterThan(0)
    expect(result.ruleVersion).toBe('volume-progression-v1')
  })
})

describe('volumeZone', () => {
  it('places weekly sets against the athlete\'s own landmarks', () => {
    const landmarks = landmarksFor('pectorals', 3)
    expect(volumeZone(0, landmarks)).toBe('below-maintenance')
    expect(volumeZone(landmarks.mv, landmarks)).toBe('maintenance')
    expect(volumeZone(landmarks.mev, landmarks)).toBe('productive')
    expect(volumeZone(landmarks.mav, landmarks)).toBe('near-ceiling')
    expect(volumeZone(landmarks.mrv, landmarks)).toBe('over-ceiling')
  })
})


describe('summarizeMuscleFeedback', () => {
  const bench = seedExercises.find((exercise) => exercise.id === 'competition-bench') as Exercise
  const setFor = (id: string, sessionId: string, completedAt: string, load: number, over: Partial<CompletedSetRecord> = {}): CompletedSetRecord => ({
    id, sessionId, exerciseId: bench.id, exerciseName: bench.name, family: bench.family,
    primaryRegion: bench.primaryRegion, completedAt, reps: 8, load, rir: 2, technique: 4, pain: 0, setIndex: 0, ...over
  })
  const survey = (sessionId: string, values: Record<string, number>): SurveyRecord => ({
    id: `survey-${sessionId}`, sessionId, type: 'post', completedAt: '2026-08-10T12:00:00.000Z', skipped: false,
    answers: Object.entries(values).map(([id, value]) => ({ id, value, status: 'answered' as const }))
  })
  const windows = {
    currentWindowStart: new Date('2026-08-08T00:00:00.000Z'),
    priorWindowStart: new Date('2026-08-01T00:00:00.000Z'),
    now: new Date('2026-08-12T00:00:00.000Z')
  }

  it('reads session feedback for the muscles that received direct work', () => {
    const result = summarizeMuscleFeedback({
      muscle: 'pectorals', exercises: seedExercises,
      history: [setFor('a', 's1', '2026-08-09T12:00:00.000Z', 200)],
      surveys: [survey('s1', { pump: 4, targetStimulus: 5, endFatigue: 2 })],
      ...windows
    })
    expect(result).toMatchObject({ pump: 4, targetStimulus: 5, endFatigue: 2 })
  })

  it('calls performance improved only when comparable work actually moved', () => {
    const history = [
      setFor('prior', 's0', '2026-08-04T12:00:00.000Z', 200),
      setFor('now', 's1', '2026-08-09T12:00:00.000Z', 220)
    ]
    expect(summarizeMuscleFeedback({ muscle: 'pectorals', exercises: seedExercises, history, surveys: [], ...windows }).performance).toBe('improved')
  })

  it('excludes drops from the performance comparison, so a technique week is not a decline', () => {
    const history = [
      setFor('prior', 's0', '2026-08-04T12:00:00.000Z', 200),
      setFor('now', 's1', '2026-08-09T12:00:00.000Z', 200),
      setFor('drop', 's1', '2026-08-09T12:05:00.000Z', 100, { grouping: { groupId: 'g', groupKind: 'drop-set', groupRole: 'drop', groupPosition: 2 } })
    ]
    expect(summarizeMuscleFeedback({ muscle: 'pectorals', exercises: seedExercises, history, surveys: [], ...windows }).performance).toBe('held')
  })

  it('reports unknown performance rather than guessing when there is nothing to compare', () => {
    const result = summarizeMuscleFeedback({
      muscle: 'pectorals', exercises: seedExercises,
      history: [setFor('now', 's1', '2026-08-09T12:00:00.000Z', 200)], surveys: [], ...windows
    })
    expect(result.performance).toBe('unknown')
    expect(result.pump).toBeNull()
  })

  it('carries the worst pain recorded on that muscle rather than an average', () => {
    const history = [
      setFor('a', 's1', '2026-08-09T12:00:00.000Z', 200, { pain: 1 }),
      setFor('b', 's1', '2026-08-09T12:10:00.000Z', 200, { pain: 4 })
    ]
    expect(summarizeMuscleFeedback({ muscle: 'pectorals', exercises: seedExercises, history, surveys: [], ...windows }).pain).toBe(4)
  })
})


describe('per-muscle feedback beats the session-level fallback', () => {
  const bench = seedExercises.find((exercise) => exercise.id === 'competition-bench') as Exercise
  const setFor = (id: string, sessionId: string, completedAt: string): CompletedSetRecord => ({
    id, sessionId, exerciseId: bench.id, exerciseName: bench.name, family: bench.family,
    primaryRegion: bench.primaryRegion, completedAt, reps: 8, load: 200, rir: 2, technique: 4, pain: 0, setIndex: 0
  })
  const survey = (sessionId: string, values: Record<string, number>): SurveyRecord => ({
    id: `survey-${sessionId}`, sessionId, type: 'post', completedAt: '2026-08-10T12:00:00.000Z', skipped: false,
    answers: Object.entries(values).map(([id, value]) => ({ id, value, status: 'answered' as const }))
  })
  const windows = {
    currentWindowStart: new Date('2026-08-08T00:00:00.000Z'),
    priorWindowStart: new Date('2026-08-01T00:00:00.000Z'),
    now: new Date('2026-08-12T00:00:00.000Z')
  }
  const read = (values: Record<string, number>) => summarizeMuscleFeedback({
    muscle: 'pectorals', exercises: seedExercises,
    history: [setFor('a', 's1', '2026-08-09T12:00:00.000Z')],
    surveys: [survey('s1', values)], ...windows
  })

  it('uses the answer recorded against that exact muscle', () => {
    const result = read({ pump: 1, [muscleQuestionId('pump', 'pectorals')]: 5 })
    expect(result.pump).toBe(5)
    expect(result.attribution).toBe('exact')
  })

  it('falls back to the session answer when the muscle was not asked about', () => {
    const result = read({ pump: 2, [muscleQuestionId('pump', 'quadriceps')]: 5 })
    expect(result.pump).toBe(2)
    expect(result.attribution).toBe('attributed')
  })

  it('does not borrow another muscle\'s exact answer', () => {
    const result = read({ [muscleQuestionId('targetStimulus', 'triceps')]: 5 })
    expect(result.targetStimulus).toBeNull()
  })
})
