import { describe, expect, it } from 'vitest'
import { athlete, equipmentProfiles, exercises, history, mesocycles, records, sessions } from './seed'
import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, backupStateFrom, createBackup, fnv1a32, parseBackup, type RestorableAppState } from './backup'
import { derivePersonalRecords, historyVolume } from './history-engine'

const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

const state = (): RestorableAppState => ({
  athlete: structuredClone(athlete),
  settings: {
    units: 'lb', preSurveyMode: 'ask', postSurveyMode: 'ask', focusedMode: false,
    reducedMotion: false, sounds: false, haptics: true, celebrationLevel: 'subtle', opportunityPrompts: true,
    sessionAchievements: true, confetti: false, quietMode: false, availableMinutes: 60, equipmentLocation: 'Commercial Gym', activeEquipmentProfileId: 'equipment-commercial-gym'
  },
  equipmentProfiles: structuredClone(equipmentProfiles),
  exercises: structuredClone(exercises),
  sessions: structuredClone(sessions),
  history: structuredClone(history),
  surveys: [],
  deferredFeedback: [],
  records: structuredClone(records),
  historyMutations: [],
  cycleReviews: [],
  substitutionEvents: [],
  mesocycles: structuredClone(mesocycles),
  activeMesocycleId: mesocycles[0].id,
  activeSessionId: null,
  onboardingComplete: true
})

describe('versioned backup and restore', () => {
  it('round-trips the complete private state with integrity verification', () => {
    const backup = createBackup(state(), '2026-08-10T12:00:00.000Z')
    const parsed = parseBackup(JSON.stringify(backup))
    expect(parsed.backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(parsed.summary.completedSets).toBe(history.length)
    expect(parsed.backup.data.surveys).toEqual([])
    expect(parsed.summary.deferredFeedback).toBe(0)
    expect(parsed.summary.planVersions).toBe(1)
    expect(parsed.summary.historyChanges).toBe(0)
    expect(parsed.summary.cycleReviews).toBe(0)
    expect(parsed.summary.substitutions).toBe(0)
    expect(parsed.summary.equipmentProfiles).toBe(3)
    expect(parsed.summary.placementRoute).toBe('Base-Building Cycle')
    expect(parsed.summary.placementConfidence).toBe('high')
    expect(parsed.warnings).toEqual([])
  })

  it('rejects a backup changed after export', () => {
    const backup = createBackup(state())
    backup.data.history[0].load += 5
    expect(() => parseBackup(JSON.stringify(backup))).toThrow(/integrity check failed/i)
  })

  it('rejects broken exercise references even when the file is newly checksummed', () => {
    const invalid = state()
    invalid.history[0].exerciseId = 'missing-exercise'
    expect(() => parseBackup(JSON.stringify(createBackup(invalid)))).toThrow(/unknown exercise/i)
  })

  it('rejects ambiguous active mesocycle identity', () => {
    const invalid = state()
    invalid.mesocycles.push({ ...structuredClone(invalid.mesocycles[0]), id: 'second-active-plan', version: 2 })
    expect(() => parseBackup(JSON.stringify(createBackup(invalid)))).toThrow(/more than one mesocycle/i)
  })

  it('rejects a correction ledger whose record projection no longer matches its source snapshots', () => {
    const invalid = state()
    const beforeHistory = structuredClone(invalid.history)
    const afterHistory = invalid.history.map((workSet, index) => index === 0 ? { ...workSet, load: workSet.load + 5 } : workSet)
    invalid.historyMutations = [{
      id: 'correction-1', type: 'set-corrected', createdAt: '2026-08-10T12:00:00.000Z', reason: 'Test correction',
      description: 'Corrected one source set.', affectedSetIds: [beforeHistory[0].id],
      before: { history: beforeHistory, exercises: structuredClone(invalid.exercises), sessions: structuredClone(invalid.sessions) },
      after: { history: afterHistory, exercises: structuredClone(invalid.exercises), sessions: structuredClone(invalid.sessions) },
      recordsBefore: [], recordsAfter: derivePersonalRecords(afterHistory), volumeBefore: historyVolume(beforeHistory), volumeAfter: historyVolume(afterHistory)
    }]
    expect(() => parseBackup(JSON.stringify(createBackup(invalid)))).toThrow(/record projection/i)
  })

  it('migrates the original version 1 open export without inventing survey answers', () => {
    const current = state()
    const legacy = {
      version: 1,
      exportedAt: '2026-08-09T12:00:00.000Z',
      athlete: current.athlete,
      settings: current.settings,
      exercises: current.exercises,
      sessions: current.sessions,
      history: current.history,
      records: current.records
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.surveys).toEqual([])
    expect(parsed.backup.data.onboardingComplete).toBe(true)
    expect(parsed.warnings[0]).toMatch(/migrated/i)
  })

  it('migrates a verified version 2 backup without inventing a cycle history', () => {
    const current = state()
    const legacyData = {
      athlete: current.athlete,
      settings: current.settings,
      exercises: current.exercises,
      sessions: current.sessions,
      history: current.history,
      surveys: current.surveys,
      records: current.records,
      activeSessionId: current.activeSessionId,
      onboardingComplete: current.onboardingComplete
    }
    const legacy = {
      format: BACKUP_FORMAT,
      schemaVersion: 2,
      appVersion: '0.2.0',
      exportedAt: '2026-08-10T12:00:00.000Z',
      data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.mesocycles).toEqual([])
    expect(parsed.backup.data.activeMesocycleId).toBeNull()
    expect(parsed.warnings[0]).toMatch(/version 2/i)
  })

  it('migrates a verified version 3 backup and replays source-backed records', () => {
    const current = state()
    const legacyData: Partial<RestorableAppState> = structuredClone(current)
    delete legacyData.historyMutations
    delete legacyData.cycleReviews
    const legacy = {
      format: BACKUP_FORMAT,
      schemaVersion: 3,
      appVersion: '0.3.0',
      exportedAt: '2026-08-10T12:00:00.000Z',
      data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.historyMutations).toEqual([])
    expect(parsed.backup.data.records.every((record) => record.sourceSetIds.length > 0)).toBe(true)
    expect(parsed.warnings[0]).toMatch(/version 3/i)
  })

  it('migrates a verified version 4 backup without inventing cycle reviews', () => {
    const legacyData: Partial<RestorableAppState> = structuredClone(state())
    delete legacyData.cycleReviews
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 4, appVersion: '0.4.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.cycleReviews).toEqual([])
    expect(parsed.warnings[0]).toMatch(/version 4/i)
  })

  it('migrates a verified version 5 backup through expanded record definitions and quiet defaults', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    const legacySettings = legacyData.settings as Record<string, unknown>
    delete legacySettings.celebrationLevel
    delete legacySettings.opportunityPrompts
    delete legacySettings.sessionAchievements
    delete legacySettings.confetti
    delete legacySettings.quietMode
    legacyData.records = []
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 5, appVersion: '0.5.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.records.some((record) => record.type === 'set-scheme')).toBe(true)
    expect(parsed.backup.data.settings).toMatchObject({ celebrationLevel: 'subtle', opportunityPrompts: true, quietMode: false })
    expect(parsed.warnings[0]).toMatch(/version 5/i)
  })

  it('migrates a verified version 6 backup without inventing substitution evidence', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    delete legacyData.substitutionEvents
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 6, appVersion: '0.6.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.substitutionEvents).toEqual([])
    expect(parsed.warnings[0]).toMatch(/version 6/i)
  })

  it('migrates a verified version 7 backup without inventing survey evidence', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 7, appVersion: '0.7.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.surveys).toEqual([])
    expect(parsed.warnings[0]).toMatch(/version 7/i)
  })

  it('migrates a verified version 8 backup without inventing deferred feedback', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    delete legacyData.deferredFeedback
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 8, appVersion: '0.8.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.deferredFeedback).toEqual([])
    expect(parsed.warnings[0]).toMatch(/version 8/i)
  })

  it('migrates a verified version 9 backup without inventing catalog edits', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 9, appVersion: '0.10.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.historyMutations).toEqual([])
    expect(parsed.warnings[0]).toMatch(/version 9/i)
  })

  it('migrates a verified version 10 backup into an explicit equipment profile', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    delete legacyData.equipmentProfiles
    delete (legacyData.athlete as Record<string, unknown>).placement
    delete ((legacyData.athlete as Record<string, unknown>).level as Record<string, unknown>).movementSkill
    const legacySettings = legacyData.settings as Record<string, unknown>
    delete legacySettings.activeEquipmentProfileId
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 10, appVersion: '0.16.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.settings.activeEquipmentProfileId).toBe('equipment-commercial-gym')
    expect(parsed.backup.data.equipmentProfiles).toHaveLength(3)
    expect(parsed.backup.data.athlete.placement.ruleVersion).toBe('placement-v1')
    expect(parsed.warnings[0]).toMatch(/version 10/i)
  })

  it('migrates a verified version 11 backup into a transparent placement hypothesis', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    delete (legacyData.athlete as Record<string, unknown>).placement
    delete ((legacyData.athlete as Record<string, unknown>).level as Record<string, unknown>).movementSkill
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 11, appVersion: '0.17.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.athlete.placement).toMatchObject({ ruleVersion: 'placement-v1', confidence: 'medium' })
    expect(parsed.backup.data.athlete.level.movementSkill).toBeGreaterThanOrEqual(1)
    expect(parsed.warnings[0]).toMatch(/version 11/i)
  })

  it('rejects placement tampering and a route label that disagrees with its evidence', () => {
    const invalidDimension = state()
    invalidDimension.athlete.placement.dimensions.movementSkill = 7
    expect(() => parseBackup(JSON.stringify(createBackup(invalidDimension)))).toThrow(/placement.*one to five/i)

    const invalidRoute = state()
    invalidRoute.athlete.entryRoute = 'Introductory Skill Cycle'
    expect(() => parseBackup(JSON.stringify(createBackup(invalidRoute)))).toThrow(/entry route/i)
  })

  it('rejects invalid equipment profiles and an orphaned active profile', () => {
    const invalidIncrement = state()
    invalidIncrement.equipmentProfiles[0].increments.barbell = 0
    expect(() => parseBackup(JSON.stringify(createBackup(invalidIncrement)))).toThrow(/equipment profile.*increment/i)

    const missingActive = state()
    missingActive.settings.activeEquipmentProfileId = 'missing-profile'
    expect(() => parseBackup(JSON.stringify(createBackup(missingActive)))).toThrow(/active equipment profile/i)
  })

  it('round-trips an auditable catalog edit with unchanged source history', () => {
    const current = state()
    const beforeExercises = structuredClone(current.exercises)
    const afterExercises = current.exercises.map((exercise) => exercise.id === 'competition-bench' ? { ...exercise, aliases: [...exercise.aliases, 'Meet Bench'] } : exercise)
    current.exercises = afterExercises
    current.historyMutations = [{
      id: 'catalog-edit-1', type: 'exercise-edited', createdAt: '2026-08-10T12:00:00.000Z', reason: 'Added notebook alias',
      description: 'Competition Bench Press catalog identity updated to Competition Bench Press.',
      affectedSetIds: current.history.filter((workSet) => workSet.exerciseId === 'competition-bench').map((workSet) => workSet.id),
      before: { history: structuredClone(current.history), exercises: beforeExercises, sessions: structuredClone(current.sessions) },
      after: { history: structuredClone(current.history), exercises: afterExercises, sessions: structuredClone(current.sessions) },
      recordsBefore: structuredClone(current.records), recordsAfter: structuredClone(current.records),
      volumeBefore: historyVolume(current.history), volumeAfter: historyVolume(current.history)
    }]
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.backup.data.historyMutations[0]).toMatchObject({ type: 'exercise-edited', volumeBefore: historyVolume(current.history), volumeAfter: historyVolume(current.history) })
    expect(parsed.backup.data.exercises.find((exercise) => exercise.id === 'competition-bench')?.aliases).toContain('Meet Bench')
  })

  it('round-trips a reviewed custom muscle mapping and rejects invalid mapping provenance', () => {
    const current = state()
    const custom = {
      ...structuredClone(current.exercises[0]), id: 'custom-mapped', name: 'Mapped Custom Press', custom: true,
      muscleMapping: { ruleVersion: 'exercise-muscle-map-v1' as const, direct: 'pectorals' as const, secondary: ['triceps' as const], source: 'athlete' as const, reviewedAt: '2026-08-10T12:00:00.000Z' }
    }
    current.exercises.push(custom)
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.backup.data.exercises.at(-1)?.muscleMapping).toMatchObject({ direct: 'pectorals', secondary: ['triceps'], source: 'athlete' })

    current.exercises.at(-1)!.muscleMapping!.secondary = ['pectorals']
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/invalid muscle mapping/i)
  })

  it('round-trips an imported source set and rejects incomplete import provenance', () => {
    const current = state()
    const beforeHistory = structuredClone(current.history)
    const imported = {
      ...structuredClone(current.history[0]),
      id: 'import-set-backup-2', sessionId: 'import-session-backup-2026-01-05-uppera', completedAt: '2026-01-05T20:00:00.000Z',
      exerciseName: 'Competition Bench Press', originalExerciseId: 'competition-bench', originalExerciseName: 'Bench',
      load: 185, reps: 5, rir: 0, rirKnown: false, technique: 0, pain: 0, qualityConfirmed: false, setIndex: 0,
      importBatchId: 'backup', importRow: 2, importSourceName: 'notebook.csv', importFingerprint: 'fingerprint|occurrence:1', importUnits: 'lb' as const
    }
    current.history = [...current.history, imported]
    current.records = derivePersonalRecords(current.history)
    current.historyMutations = [{
      id: 'history-import-1', type: 'history-imported', createdAt: '2026-08-10T12:00:00.000Z', reason: 'Validated CSV import from notebook.csv',
      description: '1 completed set imported from notebook.csv.', affectedSetIds: [imported.id],
      before: { history: beforeHistory, exercises: structuredClone(current.exercises), sessions: structuredClone(current.sessions) },
      after: { history: structuredClone(current.history), exercises: structuredClone(current.exercises), sessions: structuredClone(current.sessions) },
      recordsBefore: derivePersonalRecords(beforeHistory), recordsAfter: derivePersonalRecords(current.history),
      volumeBefore: historyVolume(beforeHistory), volumeAfter: historyVolume(current.history)
    }]
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.backup.data.history.at(-1)).toMatchObject({ importSourceName: 'notebook.csv', originalExerciseName: 'Bench', rirKnown: false })
    expect(parsed.backup.data.historyMutations[0]).toMatchObject({ type: 'history-imported', affectedSetIds: ['import-set-backup-2'] })

    delete (current.history.at(-1) as Partial<typeof imported>).importFingerprint
    current.records = derivePersonalRecords(current.history)
    current.historyMutations[0].after.history = structuredClone(current.history)
    current.historyMutations[0].recordsAfter = derivePersonalRecords(current.history)
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/incomplete source provenance/i)
  })

  it('preserves explicit unknown survey answers and rejects fabricated unknown values', () => {
    const current = state()
    current.surveys = [{
      id: 'survey-1', sessionId: current.sessions[0].id, type: 'pre', completedAt: '2026-08-10T12:00:00.000Z',
      mode: 'minimal', skipped: false, answeredCount: 1, unknownCount: 2, confidence: 'low',
      answers: [{ id: 'energy', value: 3, status: 'answered' }, { id: 'pain', value: null, status: 'not-sure' }, { id: 'time', value: null, status: 'not-answered' }]
    }]
    expect(parseBackup(JSON.stringify(createBackup(current))).backup.data.surveys[0].answers[2].status).toBe('not-answered')
    current.surveys[0].answers[2].value = 60
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/missing-data semantics/i)
  })

  it('round-trips resolved deferred feedback and rejects broken survey provenance', () => {
    const current = state()
    current.surveys = [{
      id: 'post-survey-1', sessionId: current.sessions[0].id, type: 'post', completedAt: '2026-08-10T13:00:00.000Z',
      mode: 'minimal', skipped: false, answeredCount: 3, unknownCount: 0, confidence: 'medium',
      answers: [{ id: 'difficulty', value: 7, status: 'answered' }, { id: 'technique', value: 4, status: 'answered' }, { id: 'pain', value: 0, status: 'answered' }]
    }]
    current.deferredFeedback = [{
      id: 'later-1', sessionId: current.sessions[0].id, mode: 'minimal', status: 'completed',
      createdAt: '2026-08-10T12:00:00.000Z', expiresAt: '2026-08-11T12:00:00.000Z',
      resolvedAt: '2026-08-10T13:00:00.000Z', surveyId: 'post-survey-1'
    }]
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.summary.deferredFeedback).toBe(1)
    expect(parsed.backup.data.deferredFeedback[0]).toMatchObject({ status: 'completed', surveyId: 'post-survey-1' })
    current.deferredFeedback[0].surveyId = 'missing-survey'
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/does not reference/i)
  })

  it('round-trips a source-ready substitution event without losing its decision context', () => {
    const current = state()
    const session = current.sessions[0]
    const planned = session.exercises[0]
    const original = current.exercises.find((exercise) => exercise.id === planned.exerciseId)!
    const selected = current.exercises.find((exercise) => exercise.id === 'coffin-press')!
    const eventId = 'substitution-event-1'
    planned.substitutionEventId = eventId
    planned.exerciseId = selected.id
    planned.substitutedFrom = original.id
    planned.prescriptionMethod = 'baseline-calibration'
    planned.prescriptionNote = 'Conservative calibration; original load was not copied.'
    planned.sets = planned.sets.slice(0, 2).map((workSet) => ({ ...workSet, targetLoad: 0, targetRir: 3 }))
    current.substitutionEvents = [{
      id: eventId, sessionId: session.id, plannedExerciseId: planned.id, originalExerciseId: original.id, selectedExerciseId: selected.id,
      role: 'primary', purpose: planned.purpose, reason: 'equipment', createdAt: '2026-08-10T12:00:00.000Z', readiness: 'confirm',
      availableMinutes: 60, equipmentLocation: 'Commercial Gym', primaryOverrideConfirmed: true,
      candidates: [{ exerciseId: selected.id, exerciseName: selected.name, rank: 1, score: 14, tier: 'best-match', reasons: ['changes the required equipment'], preserves: 'primary chest work', changes: 'exact progression clock', lastExposureAt: null, priorSetCount: 0 }],
      originalPrescription: structuredClone(sessions[0].exercises[0].sets), replacementPrescription: structuredClone(planned.sets),
      prescriptionMethod: 'baseline-calibration', prescriptionNote: planned.prescriptionNote, sourceSetIds: [], outcome: 'pending'
    }]
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.summary.substitutions).toBe(1)
    expect(parsed.backup.data.substitutionEvents[0]).toMatchObject({ reason: 'equipment', primaryOverrideConfirmed: true, prescriptionMethod: 'baseline-calibration' })
  })

  it('creates an isolated restore snapshot', () => {
    const source = state()
    const snapshot = backupStateFrom(source)
    snapshot.athlete.name = 'Changed'
    expect(source.athlete.name).not.toBe('Changed')
  })
})
