import type {
  AchievementEvent,
  AthleteProfile,
  CompletedSetRecord,
  Exercise,
  PersonalRecord,
  PlannedExercise,
  ReadinessOutcome,
  RecordOpportunity,
  TrainingSession
} from './types'
import { benchAngleKey, benchAngleLabel, comparableAngleHistory } from './bench-angle-engine'

export const historyVolume = (history: CompletedSetRecord[]) =>
  history.reduce((total, workSet) => total + workSet.reps * workSet.load, 0)

const latest = (sets: CompletedSetRecord[]) =>
  [...sets].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime() || b.id.localeCompare(a.id))[0]

const best = (sets: CompletedSetRecord[], value: (workSet: CompletedSetRecord) => number) =>
  [...sets].sort((a, b) => value(b) - value(a) || new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime() || b.id.localeCompare(a.id))[0]

const recordRuleVersion = 'pr-v2' as const
const achievementRuleVersion = 'achievement-v1' as const
const opportunityRuleVersion = 'opportunity-v1' as const

const bySession = (sets: CompletedSetRecord[]) => {
  const sessions = new Map<string, CompletedSetRecord[]>()
  sets.forEach((workSet) => sessions.set(workSet.sessionId, [...(sessions.get(workSet.sessionId) ?? []), workSet]))
  return sessions
}

const orderedSets = (sets: CompletedSetRecord[]) => [...sets].sort((a, b) => a.setIndex - b.setIndex || a.id.localeCompare(b.id))
const sameNumber = (values: number[]) => values.length > 0 && values.every((value) => value === values[0])
const setSchemeKey = (sets: CompletedSetRecord[]) => orderedSets(sets).map((workSet) => workSet.reps).join('-')
const recordDate = (sets: CompletedSetRecord[]) => latest(sets).completedAt

const validationFor = (sets: CompletedSetRecord[]): PersonalRecord['validation'] =>
  sets.every((workSet) => workSet.qualityConfirmed === true && workSet.technique >= 3 && workSet.pain <= 3) ? 'validated' : 'numeric-only'

const record = (input: Omit<PersonalRecord, 'scope' | 'ruleVersion'>): PersonalRecord => ({
  ...input,
  scope: 'all-time',
  ruleVersion: recordRuleVersion
})

export function derivePersonalRecords(entireHistory: CompletedSetRecord[]): PersonalRecord[] {
  // A set the athlete never entered numbers for keeps its planned values as a record of the session,
  // but it must never become a personal record, in any scope. Sets saved before version 26 carry no
  // flag and stay trusted, so existing records are never rewritten.
  const history = entireHistory.filter((workSet) => workSet.numbersEntered !== false)
  const byExercise = new Map<string, CompletedSetRecord[]>()
  history.forEach((workSet) => {
    const key = `${workSet.exerciseId}::${benchAngleKey(workSet)}::${workSet.loadMode ?? 'external'}`
    byExercise.set(key, [...(byExercise.get(key) ?? []), workSet])
  })
  const records: PersonalRecord[] = []

  byExercise.forEach((sets) => {
    const exerciseId = sets[0].exerciseId
    const angle = sets[0].benchAngleDeg
    const setupId = angle === undefined ? '' : `:${benchAngleKey(sets[0])}`
    const setupLabel = angle === undefined ? '' : ` at ${angle}°`
    const bodyweight = sets[0].loadMode === 'bodyweight'
    const modeId = bodyweight ? ':bodyweight' : ''
    const setupContext = { ...(angle === undefined ? {} : { benchAngleDeg: angle }), ...(bodyweight ? { loadMode: 'bodyweight' as const } : {}) }
    const loadSet = best(sets, (workSet) => workSet.load)
    const eligibleStrengthSets = sets.filter((workSet) => workSet.reps >= 1 && workSet.reps <= 12)
    const strengthSet = eligibleStrengthSets.length ? best(eligibleStrengthSets, (workSet) => workSet.load * (1 + workSet.reps / 30)) : null
    const sessions = bySession(sets)
    const volumeSets = [...sessions.values()].sort((a, b) => historyVolume(b) - historyVolume(a) || new Date(recordDate(b)).getTime() - new Date(recordDate(a)).getTime() || latest(b).sessionId.localeCompare(latest(a).sessionId))[0]
    const exerciseName = loadSet.exerciseName

    if (bodyweight) {
      const bestRepSet = best(sets, (workSet) => workSet.reps)
      const bestSession = [...sessions.values()].sort((a, b) => b.reduce((sum, workSet) => sum + workSet.reps, 0) - a.reduce((sum, workSet) => sum + workSet.reps, 0) || new Date(recordDate(b)).getTime() - new Date(recordDate(a)).getTime())[0]
      const totalReps = bestSession.reduce((sum, workSet) => sum + workSet.reps, 0)
      records.push(
        record({
          id: `record:${exerciseId}${setupId}${modeId}:reps-at-load`, exerciseId, exerciseName, type: 'reps-at-load', category: 'repetition',
          value: bestRepSet.reps, unit: 'repetitions', label: `${bestRepSet.reps} bodyweight reps in one set${setupLabel}`, achievedAt: bestRepSet.completedAt,
          sourceSessionId: bestRepSet.sessionId, sourceSetIds: [bestRepSet.id], context: { reps: bestRepSet.reps, ...setupContext }, validation: validationFor([bestRepSet])
        }),
        record({
          id: `record:${exerciseId}${setupId}${modeId}:set-scheme`, exerciseId, exerciseName, type: 'set-scheme', category: 'scheme',
          value: totalReps, unit: 'repetitions', label: `${totalReps} bodyweight reps across ${bestSession.length} sets${setupLabel}`, achievedAt: recordDate(bestSession),
          sourceSessionId: bestSession[0].sessionId, sourceSetIds: orderedSets(bestSession).map((workSet) => workSet.id),
          context: { setCount: bestSession.length, repetitionScheme: orderedSets(bestSession).map((workSet) => workSet.reps), ...setupContext }, validation: validationFor(bestSession)
        })
      )
      return
    }

    records.push(
      record({
        id: `record:${exerciseId}${setupId}:absolute-load`, exerciseId, exerciseName, type: 'absolute-load', category: 'strength',
        value: loadSet.load, unit: 'load', label: `${loadSet.load} heaviest completed load${setupLabel}`, achievedAt: loadSet.completedAt,
        sourceSessionId: loadSet.sessionId, sourceSetIds: [loadSet.id], context: { load: loadSet.load, reps: loadSet.reps, ...setupContext }, validation: validationFor([loadSet])
      }),
      record({
        id: `record:${exerciseId}${setupId}:exercise-session-volume`, exerciseId, exerciseName, type: 'exercise-session-volume', category: 'workload',
        value: historyVolume(volumeSets), unit: 'volume-load', label: `${historyVolume(volumeSets).toLocaleString()} exact-movement session volume${setupLabel}`,
        achievedAt: recordDate(volumeSets), sourceSessionId: volumeSets[0].sessionId, sourceSetIds: orderedSets(volumeSets).map((workSet) => workSet.id),
        context: { setCount: volumeSets.length, repetitionScheme: orderedSets(volumeSets).map((workSet) => workSet.reps), ...setupContext }, validation: validationFor(volumeSets)
      })
    )

    if (strengthSet) {
      const estimated = Math.round(strengthSet.load * (1 + strengthSet.reps / 30))
      records.push(record({
        id: `record:${exerciseId}${setupId}:estimated-strength`, exerciseId, exerciseName, type: 'estimated-strength', category: 'strength',
        value: estimated, unit: 'estimated-load', label: `${estimated} estimated strength${setupLabel}`, achievedAt: strengthSet.completedAt,
        sourceSessionId: strengthSet.sessionId, sourceSetIds: [strengthSet.id],
        context: { load: strengthSet.load, reps: strengthSet.reps, formula: 'epley', formulaVersion: 'epley-v1', eligibleRepRange: [1, 12], ...setupContext }, validation: validationFor([strengthSet])
      }))
    }

    const byLoad = new Map<number, CompletedSetRecord[]>()
    const byReps = new Map<number, CompletedSetRecord[]>()
    sets.forEach((workSet) => {
      byLoad.set(workSet.load, [...(byLoad.get(workSet.load) ?? []), workSet])
      byReps.set(workSet.reps, [...(byReps.get(workSet.reps) ?? []), workSet])
    })
    byLoad.forEach((loadSets, load) => {
      const winner = best(loadSets, (workSet) => workSet.reps)
      records.push(record({
        id: `record:${exerciseId}${setupId}:reps-at-load:${load}`, exerciseId, exerciseName, type: 'reps-at-load', category: 'repetition',
        value: winner.reps, unit: 'repetitions', label: `${winner.reps} reps at ${load}${setupLabel}`, achievedAt: winner.completedAt,
        sourceSessionId: winner.sessionId, sourceSetIds: [winner.id], context: { load, reps: winner.reps, ...setupContext }, validation: validationFor([winner])
      }))
    })
    byReps.forEach((repSets, reps) => {
      const winner = best(repSets, (workSet) => workSet.load)
      records.push(record({
        id: `record:${exerciseId}${setupId}:load-for-reps:${reps}`, exerciseId, exerciseName, type: 'load-for-reps', category: 'strength',
        value: winner.load, unit: 'load', label: `${winner.load} for ${reps} reps${setupLabel}`, achievedAt: winner.completedAt,
        sourceSessionId: winner.sessionId, sourceSetIds: [winner.id], context: { load: winner.load, reps, ...setupContext }, validation: validationFor([winner])
      }))
    })

    const schemeCandidates = new Map<string, CompletedSetRecord[][]>()
    sessions.forEach((sessionSets) => {
      const ordered = orderedSets(sessionSets)
      if (ordered.length < 2 || !sameNumber(ordered.map((workSet) => workSet.load))) return
      const key = setSchemeKey(ordered)
      schemeCandidates.set(key, [...(schemeCandidates.get(key) ?? []), ordered])
    })
    schemeCandidates.forEach((candidates, key) => {
      const winner = [...candidates].sort((a, b) => b[0].load - a[0].load || new Date(recordDate(b)).getTime() - new Date(recordDate(a)).getTime())[0]
      const repetitions = winner.map((workSet) => workSet.reps)
      const uniformReps = sameNumber(repetitions)
      const schemeLabel = uniformReps ? `${winner.length} × ${repetitions[0]}` : repetitions.join(' / ')
      records.push(record({
        id: `record:${exerciseId}${setupId}:set-scheme:${key}`, exerciseId, exerciseName, type: 'set-scheme', category: 'scheme',
        value: winner[0].load, unit: 'load', label: `${schemeLabel} at ${winner[0].load}${setupLabel}`, achievedAt: recordDate(winner),
        sourceSessionId: winner[0].sessionId, sourceSetIds: winner.map((workSet) => workSet.id),
        context: { load: winner[0].load, setCount: winner.length, repetitionScheme: repetitions, ...setupContext }, validation: validationFor(winner)
      }))
    })
  })

  const workoutCandidates = [...bySession(history).values()]
  if (workoutCandidates.length) {
    const winner = [...workoutCandidates].sort((a, b) => historyVolume(b) - historyVolume(a) || new Date(recordDate(b)).getTime() - new Date(recordDate(a)).getTime())[0]
    records.push(record({
      id: 'record:workout:session-volume', exerciseId: null, exerciseName: 'Whole workout', type: 'workout-session-volume', category: 'workload',
      value: historyVolume(winner), unit: 'volume-load', label: `${historyVolume(winner).toLocaleString()} workout volume`, achievedAt: recordDate(winner),
      sourceSessionId: winner[0].sessionId, sourceSetIds: orderedSets(winner).map((workSet) => workSet.id), context: { setCount: winner.length }, validation: validationFor(winner)
    }))
  }

  return records.sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime() || a.id.localeCompare(b.id))
}

const categoryTitle = (recordValue: PersonalRecord) => ({
  strength: 'Strength PR', repetition: 'Repetition PR', scheme: 'Set-scheme PR', workload: 'Workload PR'
})[recordValue.category]

export function deriveAchievementEvents(history: CompletedSetRecord[]): AchievementEvent[] {
  const sessionEntries = [...bySession(history).entries()].sort(([, first], [, second]) =>
    new Date(recordDate(first)).getTime() - new Date(recordDate(second)).getTime() || first[0].sessionId.localeCompare(second[0].sessionId))
  const accumulated: CompletedSetRecord[] = []
  const events: AchievementEvent[] = []
  const seenExercises = new Set<string>()
  const recentSessionDates: number[] = []

  sessionEntries.forEach(([sessionId, currentSets]) => {
    const beforeRecords = new Map(derivePersonalRecords(accumulated).map((recordValue) => [recordValue.id, recordValue]))
    const currentIds = new Set(currentSets.map((workSet) => workSet.id))
    const afterRecords = derivePersonalRecords([...accumulated, ...currentSets])
    afterRecords.forEach((after) => {
      if (!after.sourceSetIds.some((id) => currentIds.has(id))) return
      const before = beforeRecords.get(after.id)
      if (!before || after.value <= before.value) return
      events.push({
        id: `achievement:${after.id}:${sessionId}`, kind: 'personal-record', category: after.category, recordType: after.type,
        title: after.validation === 'validated' ? categoryTitle(after) : 'Unverified number best', explanation: `${after.label}, improved from ${before.label}.${after.validation === 'numeric-only' ? ' Technique and pain were not confirmed, so this is not a validated PR.' : ''}`, exerciseId: after.exerciseId,
        exerciseName: after.exerciseName, achievedAt: after.achievedAt, scope: 'all-time', value: after.value,
        priorValue: before.value, delta: after.value - before.value, sourceSessionId: sessionId,
        sourceSetIds: after.sourceSetIds, priorSourceSetIds: before.sourceSetIds, validation: after.validation, ruleVersion: achievementRuleVersion
      })
    })

    const currentByExercise = new Map<string, CompletedSetRecord[]>()
    currentSets.forEach((workSet) => {
      const key = `${workSet.exerciseId}::${benchAngleKey(workSet)}`
      currentByExercise.set(key, [...(currentByExercise.get(key) ?? []), workSet])
    })
    currentByExercise.forEach((exerciseSets, setupKey) => {
      const exerciseId = exerciseSets[0].exerciseId
      const exerciseName = exerciseSets[0].exerciseName
      const angleDescription = exerciseSets[0].benchAngleDeg === undefined ? '' : ` at ${benchAngleLabel(exerciseSets[0].benchAngleDeg)}`
      const priorExact = accumulated.filter((workSet) => workSet.exerciseId === exerciseId && benchAngleKey(workSet) === benchAngleKey(exerciseSets[0]))
      if (!seenExercises.has(setupKey) && priorExact.length === 0) {
        events.push({
          id: `achievement:baseline:${exerciseId}:${benchAngleKey(exerciseSets[0])}:${sessionId}`, kind: 'micro-win', category: 'baseline', title: 'Baseline established',
          explanation: `First completed exact-movement exposure for ${exerciseName}${angleDescription}.`, exerciseId, exerciseName,
          achievedAt: recordDate(exerciseSets), scope: 'recent', value: historyVolume(exerciseSets), priorValue: null, delta: null,
          sourceSessionId: sessionId, sourceSetIds: exerciseSets.map((workSet) => workSet.id), priorSourceSetIds: [],
          validation: 'validated', ruleVersion: achievementRuleVersion
        })
      }
      if (priorExact.length) {
        const previousSession = [...bySession(priorExact).values()].sort((a, b) => new Date(recordDate(b)).getTime() - new Date(recordDate(a)).getTime())[0]
        const currentOrdered = orderedSets(exerciseSets)
        const priorOrdered = orderedSets(previousSession)
        const currentRir = currentOrdered.reduce((sum, workSet) => sum + workSet.rir, 0) / currentOrdered.length
        const priorRir = priorOrdered.reduce((sum, workSet) => sum + workSet.rir, 0) / priorOrdered.length
        const comparableScheme = currentOrdered.length === priorOrdered.length && currentOrdered.map((workSet) => workSet.reps).join('-') === priorOrdered.map((workSet) => workSet.reps).join('-')
        const currentLoad = sameNumber(currentOrdered.map((workSet) => workSet.load)) ? currentOrdered[0].load : null
        const priorLoad = sameNumber(priorOrdered.map((workSet) => workSet.load)) ? priorOrdered[0].load : null
        const alreadyHas = (category: AchievementEvent['category']) => events.some((event) => event.sourceSessionId === sessionId && event.exerciseId === exerciseId && event.category === category)
        if (comparableScheme && currentLoad !== null && priorLoad !== null && currentLoad > priorLoad && currentRir >= priorRir && !alreadyHas('strength')) {
          events.push({
            id: `achievement:load-win:${exerciseId}:${benchAngleKey(exerciseSets[0])}:${sessionId}`, kind: 'micro-win', category: 'strength', title: 'Load micro win',
            explanation: `More load across the same completed repetition scheme without worse effort.`, exerciseId, exerciseName,
            achievedAt: recordDate(exerciseSets), scope: 'recent', value: currentLoad, priorValue: priorLoad, delta: currentLoad - priorLoad,
            sourceSessionId: sessionId, sourceSetIds: currentOrdered.map((workSet) => workSet.id), priorSourceSetIds: priorOrdered.map((workSet) => workSet.id),
            validation: validationFor(currentOrdered), ruleVersion: achievementRuleVersion
          })
        }
        const currentReps = currentOrdered.reduce((sum, workSet) => sum + workSet.reps, 0)
        const priorReps = priorOrdered.reduce((sum, workSet) => sum + workSet.reps, 0)
        if (currentOrdered.length === priorOrdered.length && currentLoad !== null && currentLoad === priorLoad && currentReps > priorReps && currentRir >= priorRir && !alreadyHas('repetition')) {
          events.push({
            id: `achievement:rep-win:${exerciseId}:${benchAngleKey(exerciseSets[0])}:${sessionId}`, kind: 'micro-win', category: 'repetition', title: 'One rep compounded',
            explanation: `More total repetitions across the same number of sets at the same load and no worse effort.`, exerciseId, exerciseName,
            achievedAt: recordDate(exerciseSets), scope: 'recent', value: currentReps, priorValue: priorReps, delta: currentReps - priorReps,
            sourceSessionId: sessionId, sourceSetIds: currentOrdered.map((workSet) => workSet.id), priorSourceSetIds: priorOrdered.map((workSet) => workSet.id),
            validation: validationFor(currentOrdered), ruleVersion: achievementRuleVersion
          })
        }
        if (currentLoad !== null && currentLoad === priorLoad && currentReps === priorReps && currentRir >= priorRir + 1 && validationFor(currentOrdered) === 'validated' && validationFor(priorOrdered) === 'validated') {
          events.push({
            id: `achievement:quality-win:${exerciseId}:${benchAngleKey(exerciseSets[0])}:${sessionId}`, kind: 'micro-win', category: 'quality', title: 'Quality micro win',
            explanation: `The same load and repetitions finished with ${currentRir.toFixed(1)} average RIR instead of ${priorRir.toFixed(1)}.`, exerciseId, exerciseName,
            achievedAt: recordDate(exerciseSets), scope: 'recent', value: currentRir, priorValue: priorRir, delta: currentRir - priorRir,
            sourceSessionId: sessionId, sourceSetIds: currentOrdered.map((workSet) => workSet.id), priorSourceSetIds: priorOrdered.map((workSet) => workSet.id),
            validation: 'validated', ruleVersion: achievementRuleVersion
          })
        }
        const gapDays = (new Date(recordDate(exerciseSets)).getTime() - new Date(recordDate(previousSession)).getTime()) / 86_400_000
        if (gapDays >= 14) {
          events.push({
            id: `achievement:return:${exerciseId}:${benchAngleKey(exerciseSets[0])}:${sessionId}`, kind: 'micro-win', category: 'return', title: 'Movement returned',
            explanation: `${exerciseName} was completed again after ${Math.floor(gapDays)} days.`, exerciseId, exerciseName,
            achievedAt: recordDate(exerciseSets), scope: 'recent', value: 1, priorValue: 0, delta: 1,
            sourceSessionId: sessionId, sourceSetIds: currentOrdered.map((workSet) => workSet.id), priorSourceSetIds: priorOrdered.map((workSet) => workSet.id),
            validation: 'validated', ruleVersion: achievementRuleVersion
          })
        }
      }
      seenExercises.add(setupKey)
    })

    const completedAt = new Date(recordDate(currentSets)).getTime()
    recentSessionDates.push(completedAt)
    const sessionsInSevenDays = recentSessionDates.filter((timestamp) => timestamp >= completedAt - 6 * 86_400_000 && timestamp <= completedAt)
    if (sessionsInSevenDays.length === 3) {
      events.push({
        id: `achievement:consistency:${sessionId}`, kind: 'micro-win', category: 'consistency', title: 'Consistency restored',
        explanation: 'Three useful training sessions were completed inside seven days.', exerciseId: null, exerciseName: 'Training rhythm',
        achievedAt: recordDate(currentSets), scope: 'recent', value: 3, priorValue: 2, delta: 1, sourceSessionId: sessionId,
        sourceSetIds: currentSets.map((workSet) => workSet.id), priorSourceSetIds: [], validation: 'validated', ruleVersion: achievementRuleVersion
      })
    }
    accumulated.push(...currentSets)
  })

  return events.sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime() || a.id.localeCompare(b.id))
}

export function deriveRecordOpportunities(input: {
  history: CompletedSetRecord[]
  planned: PlannedExercise
  exercise: Exercise
  readiness: ReadinessOutcome
}): RecordOpportunity[] {
  const { history, planned, exercise, readiness } = input
  const exerciseHistory = history.filter((workSet) => workSet.exerciseId === exercise.id)
  const exactHistory = comparableAngleHistory(exerciseHistory, planned)
  if (!planned.sets.length) return []
  const first = planned.sets[0]
  const setupId = first.benchAngleDeg === undefined ? '' : `:${benchAngleKey(first)}`
  const setupLabel = first.benchAngleDeg === undefined ? '' : ` at ${first.benchAngleDeg}°`
  const bodyweight = first.loadMode === 'bodyweight'
  const current = new Map(derivePersonalRecords(exactHistory).map((recordValue) => [recordValue.id, recordValue]))
  const plannedLoads = planned.sets.map((workSet) => workSet.targetLoad)
  const plannedReps = planned.sets.map((workSet) => workSet.targetReps)
  const gateReasons: string[] = []
  if (['protect', 'pain-aware'].includes(readiness)) gateReasons.push(`${readiness} readiness pauses record prompts`)
  if (['irritating', 'avoid'].includes(exercise.jointFeeling)) gateReasons.push(`${exercise.jointFeeling} joint response pauses record prompts`)
  if (planned.sets.some((workSet) => workSet.targetRir < 1)) gateReasons.push('the prescription does not retain a safety repetition')
  const eligible = gateReasons.length === 0
  const gateReason = eligible ? 'Already inside the prescribed work. No extra load, repetitions, or sets are required.' : gateReasons.join('; ')
  const kind: RecordOpportunity['kind'] = eligible ? 'available' : 'paused'
  const opportunities: RecordOpportunity[] = []
  const add = (type: RecordOpportunity['type'], category: RecordOpportunity['category'], title: string, explanation: string, plannedValue: number, recordId: string) => {
    const existing = current.get(recordId)
    if (existing && plannedValue <= existing.value) return
    opportunities.push({
      id: `opportunity:${planned.id}:${type}:${recordId}`, exerciseId: exercise.id, type, category, title, explanation,
      plannedValue, currentValue: existing?.value ?? null, margin: existing ? plannedValue - existing.value : null,
      sourceSetIds: existing?.sourceSetIds ?? [], plannedSetIds: planned.sets.map((workSet) => workSet.id), eligible,
      kind, gateReason, ruleVersion: opportunityRuleVersion
    })
  }

  if (!exactHistory.length) {
    const totalReps = plannedReps.reduce((sum, reps) => sum + reps, 0)
    return [{
      id: `opportunity:${planned.id}:baseline`, exerciseId: exercise.id, type: 'set-scheme', category: 'scheme',
      title: bodyweight ? 'Establish a bodyweight baseline' : 'Establish your first exact baseline',
      explanation: bodyweight
        ? `Complete the planned ${planned.sets.length} set${planned.sets.length === 1 ? '' : 's'} for ${totalReps} total repetitions. That becomes the bodyweight mark your next workout can beat.`
        : `Complete the planned work with the load and repetitions you actually perform. That gives this exact movement a real next target.`,
      plannedValue: bodyweight ? totalReps : planned.sets.length, currentValue: null, margin: null,
      sourceSetIds: [], plannedSetIds: planned.sets.map((workSet) => workSet.id), eligible,
      kind: eligible ? 'baseline' : 'paused', gateReason, ruleVersion: opportunityRuleVersion
    }]
  }

  if (bodyweight) {
    const repRecordId = `record:${exercise.id}${setupId}:bodyweight:reps-at-load`
    const schemeRecordId = `record:${exercise.id}${setupId}:bodyweight:set-scheme`
    const repRecord = current.get(repRecordId)
    const schemeRecord = current.get(schemeRecordId)
    const plannedBestSet = Math.max(...plannedReps)
    const plannedTotal = plannedReps.reduce((sum, reps) => sum + reps, 0)
    add('reps-at-load', 'repetition', 'Bodyweight rep record in reach', `${plannedBestSet} repetitions${setupLabel} would be your best completed bodyweight set for this movement.`, plannedBestSet, repRecordId)
    add('set-scheme', 'scheme', 'Bodyweight set record in reach', `Complete the planned ${planned.sets.length} sets for ${plannedTotal} total repetitions${setupLabel} to set a new session mark.`, plannedTotal, schemeRecordId)
    if (!opportunities.length && repRecord) {
      opportunities.push({
        id: `opportunity:${planned.id}:bodyweight:build`, exerciseId: exercise.id, type: 'reps-at-load', category: 'repetition',
        title: 'Next bodyweight rep record',
        explanation: `Your best is ${repRecord.value} repetition${repRecord.value === 1 ? '' : 's'} in one set. ${repRecord.value + 1} surpasses it; today’s planned ${plannedBestSet} builds toward that mark without adding unplanned work.`,
        plannedValue: plannedBestSet, currentValue: repRecord.value, margin: repRecord.value + 1 - plannedBestSet,
        sourceSetIds: repRecord.sourceSetIds, plannedSetIds: planned.sets.map((workSet) => workSet.id), eligible: false,
        kind: eligible ? 'build' : 'paused', gateReason: eligible ? 'Build toward the next record inside the planned work.' : gateReason, ruleVersion: opportunityRuleVersion
      })
    } else if (!opportunities.length && schemeRecord) {
      opportunities.push({
        id: `opportunity:${planned.id}:bodyweight:scheme-build`, exerciseId: exercise.id, type: 'set-scheme', category: 'scheme',
        title: 'Next bodyweight set record',
        explanation: `Your best session is ${schemeRecord.value} total repetitions. ${schemeRecord.value + 1} across the planned sets surpasses it when the progression plan reaches that target.`,
        plannedValue: plannedTotal, currentValue: schemeRecord.value, margin: schemeRecord.value + 1 - plannedTotal,
        sourceSetIds: schemeRecord.sourceSetIds, plannedSetIds: planned.sets.map((workSet) => workSet.id), eligible: false,
        kind: eligible ? 'build' : 'paused', gateReason: eligible ? 'Build toward the next record inside the planned work.' : gateReason, ruleVersion: opportunityRuleVersion
      })
    }
    return opportunities.slice(0, 2)
  }

  const plannedLoad = first.targetLoad
  const plannedRep = first.targetReps
  add('load-for-reps', 'strength', 'Load-for-reps opportunity', `${plannedLoad} × ${plannedRep}${setupLabel} would be the heaviest completed set of ${plannedRep} for this exact setup.`, plannedLoad, `record:${exercise.id}${setupId}:load-for-reps:${plannedRep}`)
  add('reps-at-load', 'repetition', 'Repetition opportunity', `${plannedRep} repetitions at ${plannedLoad}${setupLabel} would be a new exact-setup repetition best.`, plannedRep, `record:${exercise.id}${setupId}:reps-at-load:${plannedLoad}`)
  add('absolute-load', 'strength', 'Absolute-load opportunity', `${plannedLoad}${setupLabel} would be the heaviest completed load for this exact setup.`, plannedLoad, `record:${exercise.id}${setupId}:absolute-load`)

  if (sameNumber(plannedLoads) && planned.sets.length >= 2) {
    const key = plannedReps.join('-')
    const schemeLabel = sameNumber(plannedReps) ? `${planned.sets.length} × ${plannedReps[0]}` : plannedReps.join(' / ')
    add('set-scheme', 'scheme', 'Set-scheme opportunity', `Completing the prescribed ${schemeLabel} at ${plannedLoads[0]}${setupLabel} would set a new exact-setup load best.`, plannedLoads[0], `record:${exercise.id}${setupId}:set-scheme:${key}`)
  }
  const projectedVolume = planned.sets.reduce((sum, _workSet, index) => sum + plannedLoads[index] * plannedReps[index], 0)
  add('exercise-session-volume', 'workload', 'Planned workload opportunity', `Completing the prescribed sets would create ${projectedVolume.toLocaleString()} exact-setup volume${setupLabel}.`, projectedVolume, `record:${exercise.id}${setupId}:exercise-session-volume`)

  if (!opportunities.length) {
    const repRecord = current.get(`record:${exercise.id}${setupId}:reps-at-load:${plannedLoad}`)
    if (repRecord) opportunities.push({
      id: `opportunity:${planned.id}:build`, exerciseId: exercise.id, type: 'reps-at-load', category: 'repetition',
      title: 'Next repetition record',
      explanation: `Your best at ${plannedLoad} is ${repRecord.value} repetition${repRecord.value === 1 ? '' : 's'}. ${repRecord.value + 1} surpasses it; today’s planned ${plannedRep} builds toward that mark without adding unplanned work.`,
      plannedValue: plannedRep, currentValue: repRecord.value, margin: repRecord.value + 1 - plannedRep,
      sourceSetIds: repRecord.sourceSetIds, plannedSetIds: planned.sets.map((workSet) => workSet.id), eligible: false,
      kind: eligible ? 'build' : 'paused', gateReason: eligible ? 'Build toward the next record inside the planned work.' : gateReason, ruleVersion: opportunityRuleVersion
    })
  }

  const priority: Record<RecordOpportunity['type'], number> = {
    'load-for-reps': 0, 'reps-at-load': 1, 'absolute-load': 2, 'set-scheme': 3,
    'estimated-strength': 4, 'exercise-session-volume': 5, 'workout-session-volume': 6
  }
  return opportunities.sort((a, b) => Number(b.eligible) - Number(a.eligible) || priority[a.type] - priority[b.type]).slice(0, 2)
}

const normalized = (value: string) => value.toLowerCase().replace(/\b(barbell|dumbbell|machine|cable)\b/g, '').replace(/[^a-z0-9]/g, '')
const identityModifiers = ['paused', 'pause', 'deficit', 'incline', 'decline', 'board', 'competition', 'safety', 'close-grip', 'close grip', 'wide-grip', 'wide grip']
const modifiersFor = (exercise: Exercise) => new Set(identityModifiers.filter((modifier) => [exercise.name, ...exercise.aliases].some((name) => name.toLowerCase().includes(modifier))))
const equalSets = (first: Set<string>, second: Set<string>) => first.size === second.size && [...first].every((item) => second.has(item))

export interface ExerciseDuplicatePair {
  first: Exercise
  second: Exercise
  score: number
  reason: string
}

export function findExerciseDuplicatePairs(exercises: Exercise[]): ExerciseDuplicatePair[] {
  const active = exercises.filter((exercise) => !exercise.retired)
  const pairs: ExerciseDuplicatePair[] = []
  active.forEach((first, index) => {
    active.slice(index + 1).forEach((second) => {
      const firstNames = [first.name, ...first.aliases].map(normalized)
      const secondNames = [second.name, ...second.aliases].map(normalized)
      const exact = firstNames.some((name) => secondNames.includes(name))
      const related = equalSets(modifiersFor(first), modifiersFor(second)) && firstNames.some((name) => secondNames.some((candidate) => name.length >= 5 && (name.includes(candidate) || candidate.includes(name))))
      const sameFamily = normalized(first.family) === normalized(second.family)
      const samePattern = first.pattern === second.pattern
      const score = exact ? 1 : related && samePattern ? 0.86 : sameFamily && samePattern ? 0.62 : 0
      if (score >= 0.7) pairs.push({ first, second, score, reason: exact ? 'Matching name or alias' : related ? 'Overlapping name and movement type' : 'Same exercise family and movement type' })
    })
  })
  return pairs.sort((a, b) => b.score - a.score || a.first.name.localeCompare(b.first.name))
}

export interface MergeProjectionInput {
  exercises: Exercise[]
  history: CompletedSetRecord[]
  sessions: TrainingSession[]
  athlete: AthleteProfile
  sourceIds: string[]
  targetId: string
}

export function projectExerciseMerge(input: MergeProjectionInput) {
  const sourceIds = [...new Set(input.sourceIds)].filter((id) => id !== input.targetId)
  const sourceSet = new Set(sourceIds)
  const target = input.exercises.find((exercise) => exercise.id === input.targetId)
  if (!target) throw new Error('Choose a valid movement to keep.')
  const sources = input.exercises.filter((exercise) => sourceSet.has(exercise.id) && !exercise.retired)
  if (!sources.length) throw new Error('Choose at least one active duplicate to merge.')
  const aliases = [...new Set([...target.aliases, ...sources.flatMap((exercise) => [exercise.name, ...exercise.aliases])])].filter((name) => name !== target.name)
  const exercises = input.exercises.map((exercise) => exercise.id === target.id
    ? { ...exercise, aliases }
    : sourceSet.has(exercise.id)
      ? { ...exercise, retired: true, mergedIntoId: target.id }
      : exercise)
  const history = input.history.map((workSet) => sourceSet.has(workSet.exerciseId) ? {
    ...workSet,
    originalExerciseId: workSet.originalExerciseId ?? workSet.exerciseId,
    originalExerciseName: workSet.originalExerciseName ?? workSet.exerciseName,
    originalFamily: workSet.originalFamily ?? workSet.family,
    originalPrimaryRegion: workSet.originalPrimaryRegion ?? workSet.primaryRegion,
    exerciseId: target.id,
    exerciseName: target.name,
    family: target.family,
    primaryRegion: target.primaryRegion
  } : workSet)
  const sessions = input.sessions.map((session) => ['planned', 'deferred'].includes(session.status) ? {
    ...session,
    exercises: session.exercises.map((planned) => sourceSet.has(planned.exerciseId) ? { ...planned, exerciseId: target.id } : planned)
  } : session)
  const strengthAnchors = [...new Set(input.athlete.strengthAnchors.map((id) => sourceSet.has(id) ? target.id : id))]
  return { exercises, history, sessions, athlete: { ...input.athlete, strengthAnchors }, sources, target }
}
