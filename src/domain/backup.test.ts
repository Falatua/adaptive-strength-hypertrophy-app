import { describe, expect, it } from 'vitest'
import { athlete, equipmentProfiles, exercises, history, mesocycles, records, sessions } from './seed'
import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, backupStateFrom, createBackup, fnv1a32, parseBackup, type RestorableAppState } from './backup'
import { derivePersonalRecords, historyVolume } from './history-engine'
import { beginPlacementVerification, completePlacementVerification, recordPlacementWarmup, resolvePlacementRecovery } from './placement-verification-engine'
import { buildMesocyclePreview, draftFromPlan } from './mesocycle-engine'
import { equipmentGenerationEvidence } from './equipment-engine'
import { buildPlacementAssessment, legacyPlacementForAthlete, placementRouteLabels } from './placement-engine'
import { buildPlacementHistoryEvidence } from './placement-history-engine'
import { buildMovementPlacementExitAssessment, buildPlacementExitAssessment } from './placement-exit-engine'
import { buildMissedOpportunityReplan } from './schedule-adaptation-engine'

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
  movementNotes: [],
  surveys: [],
  deferredFeedback: [],
  records: structuredClone(records),
  historyMutations: [],
  cycleReviews: [],
  substitutionEvents: [],
  placementVerifications: [],
  placementExitReviews: [],
  movementPlacementExitReviews: [],
  missedOpportunityEvents: [],
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
    expect(parsed.summary.movementNotes).toBe(0)
    expect(parsed.backup.data.surveys).toEqual([])
    expect(parsed.summary.deferredFeedback).toBe(0)
    expect(parsed.summary.planVersions).toBe(1)
    expect(parsed.summary.historyChanges).toBe(0)
    expect(parsed.summary.cycleReviews).toBe(0)
    expect(parsed.summary.substitutions).toBe(0)
    expect(parsed.summary.placementChecks).toBe(0)
    expect(parsed.summary.placementExitReviews).toBe(0)
    expect(parsed.summary.movementPlacementExitReviews).toBe(0)
    expect(parsed.summary.missedOpportunityEvents).toBe(0)
    expect(parsed.summary.movementPlacedAnchors).toBe(3)
    expect(parsed.summary.historyReviewedAnchors).toBe(0)
    expect(parsed.summary.routeGeneratedSessions).toBe(0)
    expect(parsed.summary.equipmentProfiles).toBe(3)
    expect(parsed.summary.placementRoute).toBe('Base-Building Cycle')
    expect(parsed.summary.placementConfidence).toBe('high')
    expect(parsed.warnings).toEqual([])
  })

  it('migrates a verified version 24 backup without inventing movement notes', () => {
    const prior: Omit<RestorableAppState, 'movementNotes'> & { movementNotes?: RestorableAppState['movementNotes'] } = state()
    delete prior.movementNotes
    const legacy = {
      format: BACKUP_FORMAT,
      schemaVersion: 24,
      appVersion: '0.38.0',
      exportedAt: '2026-08-10T12:00:00.000Z',
      data: prior,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(prior)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(parsed.backup.data.movementNotes).toEqual([])
    expect(parsed.warnings[0]).toMatch(/movement notes begin/i)
  })

  it('round-trips exact-movement notes and rejects forged references', () => {
    const current = state()
    const session = current.sessions[0]
    const planned = session.exercises[0]
    const exercise = current.exercises.find((candidate) => candidate.id === planned.exerciseId)!
    current.movementNotes = [{
      id: 'movement-note-1', ruleVersion: 'movement-note-v1', sessionId: session.id, sessionTitle: session.title,
      plannedExerciseId: planned.id, exerciseId: exercise.id, exerciseName: exercise.name,
      mesocycleId: session.mesocycleId ?? null, planVersion: session.planVersion ?? null, microcycleNumber: session.microcycleNumber ?? null,
      sessionDate: session.plannedDate, body: 'Thirty-degree bench. Keep the four-second eccentric.',
      createdAt: '2026-08-10T12:00:00.000Z', updatedAt: '2026-08-10T12:00:00.000Z'
    }]
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.summary.movementNotes).toBe(1)
    expect(parsed.backup.data.movementNotes[0].body).toMatch(/four-second eccentric/i)
    current.movementNotes[0].exerciseId = 'missing-exercise'
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/movement note references an unknown exercise/i)
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

  it('migrates a verified version 12 backup without inventing productive verification evidence', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    delete legacyData.placementVerifications
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 12, appVersion: '0.18.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.placementVerifications).toEqual([])
    expect(parsed.warnings[0]).toMatch(/version 12/i)
  })

  it('migrates a verified version 13 backup without relabeling existing sessions as route-generated', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 13, appVersion: '0.19.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.sessions.every((session) => session.generation === undefined)).toBe(true)
    expect(parsed.warnings[0]).toMatch(/version 13/i)
  })

  it('migrates a verified version 14 backup without inventing equipment-generation evidence', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 14, appVersion: '0.20.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.sessions.every((session) => session.generation?.equipment === undefined)).toBe(true)
    expect(parsed.warnings[0]).toMatch(/version 14/i)
  })

  it('migrates a verified version 15 backup without inventing per-movement placement', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    const legacyAthlete = legacyData.athlete as typeof athlete
    legacyAthlete.placement = legacyPlacementForAthlete(legacyAthlete)
    legacyAthlete.entryRoute = placementRouteLabels[legacyAthlete.placement.selectedRoute]
    legacyAthlete.level = legacyAthlete.placement.dimensions
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 15, appVersion: '0.21.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.athlete.placement.ruleVersion).toBe('placement-v1')
    expect(parsed.backup.data.athlete.placement.movementPlacements).toBeUndefined()
    expect(parsed.summary.movementPlacedAnchors).toBe(0)
    expect(parsed.warnings[0]).toMatch(/version 15/i)
  })

  it('migrates a verified version 16 backup without inventing exact-history review', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    const legacyAthlete = (legacyData.athlete as typeof athlete)
    legacyAthlete.placement.ruleVersion = 'placement-v2'
    legacyAthlete.placement.movementPlacements = legacyAthlete.placement.movementPlacements?.map((movement) => {
      const prior = structuredClone(movement)
      delete prior.historyReview
      return { ...prior, ruleVersion: 'movement-placement-v1' }
    })
    legacyAthlete.placement.inputs.movementProfiles = legacyAthlete.placement.inputs.movementProfiles?.map((profile) => {
      const prior = structuredClone(profile)
      delete prior.historyReview
      return prior
    })
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 16, appVersion: '0.22.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.athlete.placement.ruleVersion).toBe('placement-v2')
    expect(parsed.summary.historyReviewedAnchors).toBe(0)
    expect(parsed.warnings[0]).toMatch(/version 16/i)
  })

  it('migrates a verified version 17 backup without inventing criterion-exit review', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    delete legacyData.placementExitReviews
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 17, appVersion: '0.23.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.placementExitReviews).toEqual([])
    expect(parsed.summary.placementExitReviews).toBe(0)
    expect(parsed.warnings[0]).toMatch(/version 17/i)
  })

  it('migrates a verified version 18 backup without inventing exact movement-lane review', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    delete legacyData.movementPlacementExitReviews
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 18, appVersion: '0.24.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.movementPlacementExitReviews).toEqual([])
    expect(parsed.summary.movementPlacementExitReviews).toBe(0)
    expect(parsed.warnings[0]).toMatch(/version 18/i)
  })

  it('migrates a verified version 19 backup without inventing missed-opportunity evidence', () => {
    const legacyData = structuredClone(state()) as unknown as Record<string, unknown>
    delete legacyData.missedOpportunityEvents
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 19, appVersion: '0.26.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.missedOpportunityEvents).toEqual([])
    expect(parsed.summary.missedOpportunityEvents).toBe(0)
    expect(parsed.warnings[0]).toMatch(/version 19/i)
  })

  it('round-trips missed-opportunity evidence and rejects forged completed-set conservation', () => {
    const current = state()
    const recordedAt = current.sessions[0].plannedDate
    const nextOpportunity = new Date(recordedAt)
    nextOpportunity.setDate(nextOpportunity.getDate() + 1)
    current.surveys.push({
      id: 'readiness-survey-backup-1', sessionId: current.sessions[0].id, type: 'pre', completedAt: recordedAt,
      answers: [{ id: 'stress', value: 4, status: 'answered' }], skipped: false, mode: 'quick', answeredCount: 1, unknownCount: 0, confidence: 'low'
    })
    const result = buildMissedOpportunityReplan({
      eventId: 'missed-opportunity-backup-1', sessions: current.sessions, history: current.history,
      priorEvents: [], missedSessionId: current.sessions[0].id, continuity: current.athlete.continuity,
      weeklyOpportunities: current.athlete.weeklyOpportunities, recordedAt,
      priorityRegions: current.athlete.priorityRegions,
      exercises: current.exercises, equipmentProfile: current.equipmentProfiles[0], safetyGateActive: false,
      surveys: current.surveys,
      input: {
        trainingOutcome: 'no-training', reason: 'family', nextOpportunityAt: nextOpportunity.toISOString(),
        nextMinutes: 30, constraintState: 'uncertain', note: 'Testing the validated schedule ledger.'
      }
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    current.sessions = result.sessions
    current.missedOpportunityEvents = [result.event]

    const backup = createBackup(current)
    const parsed = parseBackup(JSON.stringify(backup))
    expect(parsed.summary.missedOpportunityEvents).toBe(1)
    expect(parsed.backup.data.missedOpportunityEvents[0]).toMatchObject({
      id: 'missed-opportunity-backup-1', ruleVersion: 'missed-opportunity-v5',
      completedSetCountBefore: current.history.length, completedSetCountAfter: current.history.length
    })
    expect(parsed.backup.data.missedOpportunityEvents[0].priorityDose).toMatchObject({ ruleVersion: 'schedule-priority-dose-v1', windowDays: 28 })
    expect(parsed.backup.data.missedOpportunityEvents[0].readiness).toMatchObject({ sourceSurveyId: 'readiness-survey-backup-1', freshness: 'current', effectiveOutcome: 'confirm', action: 'confirm-at-warmup' })

    const forgedReadiness = createBackup(current)
    forgedReadiness.data.missedOpportunityEvents[0].readiness!.sourceSurveyId = 'missing-readiness-survey'
    forgedReadiness.integrity.value = fnv1a32(stable(forgedReadiness.data))
    expect(() => parseBackup(JSON.stringify(forgedReadiness))).toThrow(/unknown readiness survey/i)

    const forgedPriority = createBackup(current)
    const citedRegion = forgedPriority.data.missedOpportunityEvents[0].priorityDose!.regions.find((region) => region.sourceSetIds.length > 0)!
    citedRegion.sourceSetIds[0] = 'missing-priority-source-set'
    forgedPriority.integrity.value = fnv1a32(stable(forgedPriority.data))
    expect(() => parseBackup(JSON.stringify(forgedPriority))).toThrow(/unknown completed source set/i)

    backup.data.missedOpportunityEvents[0].completedSetCountAfter += 1
    backup.integrity.value = fnv1a32(stable(backup.data))
    expect(() => parseBackup(JSON.stringify(backup))).toThrow(/cannot create or remove completed sets/i)
  })

  it('migrates a verified version 20 backup while preserving version 1 missed decisions', () => {
    const current = state()
    const recordedAt = current.sessions[0].plannedDate
    const nextOpportunity = new Date(recordedAt)
    nextOpportunity.setDate(nextOpportunity.getDate() + 1)
    const result = buildMissedOpportunityReplan({
      eventId: 'legacy-missed-v1', sessions: current.sessions, history: current.history, priorEvents: [],
      missedSessionId: current.sessions[0].id, continuity: current.athlete.continuity,
      weeklyOpportunities: current.athlete.weeklyOpportunities, recordedAt,
      priorityRegions: current.athlete.priorityRegions,
      exercises: current.exercises, equipmentProfile: current.equipmentProfiles[0], safetyGateActive: false,
      input: { trainingOutcome: 'no-training', reason: 'family', nextOpportunityAt: nextOpportunity.toISOString(), nextMinutes: 30, constraintState: 'ended', note: '', preferredNextSessionId: null }
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const legacyEvent = structuredClone(result.event)
    legacyEvent.ruleVersion = 'missed-opportunity-v1'
    delete legacyEvent.input.preferredNextSessionId
    delete legacyEvent.eligibility
    delete legacyEvent.readiness
    delete legacyEvent.priorityDose
    current.sessions = result.sessions
    current.missedOpportunityEvents = [legacyEvent]
    const legacyData = structuredClone(current)
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 20, appVersion: '0.27.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.missedOpportunityEvents[0]).toMatchObject({ id: 'legacy-missed-v1', ruleVersion: 'missed-opportunity-v1' })
    expect(parsed.warnings[0]).toMatch(/version 20/i)
  })

  it('migrates a verified version 21 backup while preserving version 2 athlete pins', () => {
    const current = state()
    const recordedAt = current.sessions[0].plannedDate
    const nextOpportunity = new Date(recordedAt)
    nextOpportunity.setDate(nextOpportunity.getDate() + 1)
    const pinnedSessionId = current.sessions[0].id
    const result = buildMissedOpportunityReplan({
      eventId: 'legacy-missed-v2', sessions: current.sessions, history: current.history, priorEvents: [],
      missedSessionId: pinnedSessionId, continuity: current.athlete.continuity,
      weeklyOpportunities: current.athlete.weeklyOpportunities, recordedAt,
      priorityRegions: current.athlete.priorityRegions,
      exercises: current.exercises, equipmentProfile: current.equipmentProfiles[0], safetyGateActive: false,
      input: { trainingOutcome: 'no-training', reason: 'family', nextOpportunityAt: nextOpportunity.toISOString(), nextMinutes: 30, constraintState: 'ended', note: '', preferredNextSessionId: pinnedSessionId }
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const legacyEvent = structuredClone(result.event)
    legacyEvent.ruleVersion = 'missed-opportunity-v2'
    delete legacyEvent.eligibility
    delete legacyEvent.readiness
    delete legacyEvent.priorityDose
    current.sessions = result.sessions
    current.missedOpportunityEvents = [legacyEvent]
    const legacyData = structuredClone(current)
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 21, appVersion: '0.28.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.missedOpportunityEvents[0]).toMatchObject({ id: 'legacy-missed-v2', ruleVersion: 'missed-opportunity-v2', input: { preferredNextSessionId: pinnedSessionId } })
    expect(parsed.warnings[0]).toMatch(/version 21/i)
  })

  it('migrates a verified version 22 backup while preserving version 3 equipment decisions', () => {
    const current = state()
    const recordedAt = current.sessions[0].plannedDate
    const nextOpportunity = new Date(recordedAt)
    nextOpportunity.setDate(nextOpportunity.getDate() + 1)
    const result = buildMissedOpportunityReplan({
      eventId: 'legacy-missed-v3', sessions: current.sessions, history: current.history, priorEvents: [],
      missedSessionId: current.sessions[0].id, continuity: current.athlete.continuity,
      weeklyOpportunities: current.athlete.weeklyOpportunities, recordedAt,
      priorityRegions: current.athlete.priorityRegions,
      exercises: current.exercises, equipmentProfile: current.equipmentProfiles[0], safetyGateActive: false,
      input: { trainingOutcome: 'no-training', reason: 'family', nextOpportunityAt: nextOpportunity.toISOString(), nextMinutes: 30, constraintState: 'ended', note: '', preferredNextSessionId: null }
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const legacyEvent = structuredClone(result.event)
    legacyEvent.ruleVersion = 'missed-opportunity-v3'
    delete legacyEvent.readiness
    delete legacyEvent.priorityDose
    current.sessions = result.sessions
    current.missedOpportunityEvents = [legacyEvent]
    const legacyData = structuredClone(current)
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 22, appVersion: '0.29.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.missedOpportunityEvents[0]).toMatchObject({ id: 'legacy-missed-v3', ruleVersion: 'missed-opportunity-v3', eligibility: { ruleVersion: 'schedule-eligibility-v1' } })
    expect(parsed.backup.data.missedOpportunityEvents[0].readiness).toBeUndefined()
    expect(parsed.warnings[0]).toMatch(/version 22/i)
  })

  it('migrates a verified version 23 backup while preserving version 4 readiness decisions', () => {
    const current = state()
    const recordedAt = current.sessions[0].plannedDate
    const nextOpportunity = new Date(recordedAt)
    nextOpportunity.setDate(nextOpportunity.getDate() + 1)
    const result = buildMissedOpportunityReplan({
      eventId: 'legacy-missed-v4', sessions: current.sessions, history: current.history, priorEvents: [],
      missedSessionId: current.sessions[0].id, continuity: current.athlete.continuity,
      weeklyOpportunities: current.athlete.weeklyOpportunities, recordedAt,
      priorityRegions: current.athlete.priorityRegions,
      exercises: current.exercises, equipmentProfile: current.equipmentProfiles[0], safetyGateActive: false,
      surveys: [],
      input: { trainingOutcome: 'no-training', reason: 'family', nextOpportunityAt: nextOpportunity.toISOString(), nextMinutes: 30, constraintState: 'ended', note: '', preferredNextSessionId: null }
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const legacyEvent = structuredClone(result.event)
    legacyEvent.ruleVersion = 'missed-opportunity-v4'
    delete legacyEvent.priorityDose
    current.sessions = result.sessions
    current.missedOpportunityEvents = [legacyEvent]
    const legacyData = structuredClone(current)
    const legacy = {
      format: BACKUP_FORMAT, schemaVersion: 23, appVersion: '0.30.0', exportedAt: '2026-08-10T12:00:00.000Z', data: legacyData,
      integrity: { algorithm: 'fnv1a32', value: fnv1a32(stable(legacyData)) }
    }
    const parsed = parseBackup(JSON.stringify(legacy))
    expect(parsed.backup.data.missedOpportunityEvents[0]).toMatchObject({ id: 'legacy-missed-v4', ruleVersion: 'missed-opportunity-v4', readiness: { ruleVersion: 'schedule-readiness-v1' } })
    expect(parsed.backup.data.missedOpportunityEvents[0].priorityDose).toBeUndefined()
    expect(parsed.warnings[0]).toMatch(/version 23/i)
  })

  it('round-trips route-generated sessions and rejects forged route provenance', () => {
    const current = state()
    const plan = current.mesocycles[0]
    plan.entryRoute = 'strength'
    plan.generationRuleVersion = 'route-session-v2'
    plan.placementCreatedAt = current.athlete.placement.createdAt
    plan.generationEquipment = equipmentGenerationEvidence(current.equipmentProfiles[0])
    const preview = buildMesocyclePreview(draftFromPlan(plan), {
      exercises: current.exercises, currentSessions: current.sessions, history: current.history,
      planId: plan.id, planVersion: plan.version, startsAt: new Date('2026-08-10T12:00:00.000Z'), equipmentProfile: current.equipmentProfiles[0]
    })
    current.sessions = preview.sessions
    plan.sessionIds = preview.sessions.map((session) => session.id)
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.backup.data.sessions.every((session) => session.generation?.route === 'strength')).toBe(true)
    expect(parsed.summary.routeGeneratedSessions).toBe(3)
    expect(parsed.summary.equipmentGeneratedSessions).toBe(3)

    current.sessions[0].generation!.strategy = 'Forged route strategy.'
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/strategy/i)

    const mismatched = state()
    const mismatchedPlan = mismatched.mesocycles[0]
    mismatchedPlan.entryRoute = 'strength'
    mismatchedPlan.generationRuleVersion = 'route-session-v2'
    mismatchedPlan.placementCreatedAt = mismatched.athlete.placement.createdAt
    mismatchedPlan.generationEquipment = equipmentGenerationEvidence(mismatched.equipmentProfiles[0])
    const mismatchedPreview = buildMesocyclePreview(draftFromPlan(mismatchedPlan), { exercises: mismatched.exercises, currentSessions: mismatched.sessions, history: mismatched.history, planId: mismatchedPlan.id, planVersion: mismatchedPlan.version, equipmentProfile: mismatched.equipmentProfiles[0] })
    mismatched.sessions = mismatchedPreview.sessions
    mismatchedPlan.sessionIds = mismatched.sessions.map((session) => session.id)
    mismatched.sessions[0].generation!.equipment!.profileName = 'Forged Location'
    expect(() => parseBackup(JSON.stringify(createBackup(mismatched)))).toThrow(/equipment snapshot/i)
  })

  it('round-trips mixed per-movement route generation and rejects a forged movement snapshot', () => {
    const current = state()
    const placement = buildPlacementAssessment({
      goal: 'strength', fixedEvent: null, trainingAge: 8, continuity: 'stable', movementSkill: 5,
      strengthTolerance: 5, volumeTolerance: 4, scheduleStability: 4, dataConfidence: 5,
      painState: 'none', weeklyOpportunities: 3, defaultMinutes: 60, equipmentProfileId: current.equipmentProfiles[0].id, skippedFields: [],
      movementProfiles: [
        { exerciseId: 'competition-squat', exerciseName: 'Competition Back Squat', family: 'Squat', movementSkill: 1, strengthTolerance: 2, dataConfidence: 2 },
        { exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', family: 'Bench Press', movementSkill: 5, strengthTolerance: 5, dataConfidence: 5 },
        { exerciseId: 'conventional-deadlift', exerciseName: 'Conventional Deadlift', family: 'Deadlift', movementSkill: 3, strengthTolerance: 3, dataConfidence: 1 }
      ]
    }, '2026-08-10T16:00:00.000Z')
    current.athlete.placement = placement
    current.athlete.entryRoute = placementRouteLabels[placement.selectedRoute]
    current.athlete.level = placement.dimensions
    const plan = current.mesocycles[0]
    plan.entryRoute = placement.selectedRoute
    plan.generationRuleVersion = 'route-session-v3'
    plan.placementCreatedAt = placement.createdAt
    plan.generationEquipment = equipmentGenerationEvidence(current.equipmentProfiles[0])
    plan.movementPlacements = structuredClone(placement.movementPlacements)
    const preview = buildMesocyclePreview(draftFromPlan(plan), {
      exercises: current.exercises, currentSessions: current.sessions, history: current.history,
      planId: plan.id, planVersion: plan.version, startsAt: new Date('2026-08-10T16:00:00.000Z'), equipmentProfile: current.equipmentProfiles[0]
    })
    current.sessions = preview.sessions
    plan.sessionIds = preview.sessions.map((session) => session.id)
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.summary.movementPlacedAnchors).toBe(3)
    expect(new Set(parsed.backup.data.sessions.map((session) => session.generation?.route))).toEqual(new Set(['introductory-skill', 'strength', 'bridge-calibration']))
    expect(parsed.backup.data.sessions.every((session) => session.generation?.ruleVersion === 'route-session-v3')).toBe(true)

    current.sessions[0].generation!.movementPlacement!.exerciseName = 'Forged Squat'
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/movement snapshot|movement placement/i)
  })

  it('round-trips athlete-reviewed history placement and rejects unknown or cross-movement source evidence', () => {
    const current = state()
    const bench = current.exercises.find((exercise) => exercise.id === 'competition-bench')!
    const evidence = buildPlacementHistoryEvidence({ exercise: bench, history: current.history, assessedAt: '2026-08-10T18:00:00.000Z' })
    const priorProfiles = current.athlete.placement.inputs.movementProfiles!
    const placement = buildPlacementAssessment({
      ...current.athlete.placement.inputs,
      movementProfiles: priorProfiles.map((profile) => profile.exerciseId === bench.id ? {
        ...profile,
        dataConfidence: evidence.suggestedDataConfidence,
        ...(evidence.suggestedStrengthTolerance !== null ? { strengthTolerance: evidence.suggestedStrengthTolerance } : {}),
        historyReview: {
          evidence,
          acceptedFields: evidence.suggestedStrengthTolerance === null ? ['dataConfidence'] : ['dataConfidence', 'strengthTolerance'],
          reviewedAt: '2026-08-10T18:01:00.000Z'
        }
      } : profile)
    }, '2026-08-10T18:02:00.000Z')
    current.athlete.placement = placement
    current.athlete.level = placement.dimensions
    current.athlete.entryRoute = placementRouteLabels[placement.selectedRoute]
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.summary.historyReviewedAnchors).toBe(1)
    expect(parsed.backup.data.athlete.placement.movementPlacements?.find((movement) => movement.exerciseId === bench.id)?.historyReview?.evidence.sourceSetIds.length).toBeGreaterThan(0)

    current.athlete.placement.inputs.movementProfiles!.find((profile) => profile.exerciseId === bench.id)!.historyReview!.evidence.sourceSetIds[0] = 'unknown-set'
    current.athlete.placement.movementPlacements!.find((movement) => movement.exerciseId === bench.id)!.historyReview!.evidence.sourceSetIds[0] = 'unknown-set'
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/unknown completed source set/i)

    const wrongMovementSet = current.history.find((workSet) => workSet.exerciseId !== bench.id)!
    current.athlete.placement.inputs.movementProfiles!.find((profile) => profile.exerciseId === bench.id)!.historyReview!.evidence.sourceSetIds[0] = wrongMovementSet.id
    current.athlete.placement.movementPlacements!.find((movement) => movement.exerciseId === bench.id)!.historyReview!.evidence.sourceSetIds[0] = wrongMovementSet.id
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/different exercise identity/i)
  })

  it('rejects placement tampering and a route label that disagrees with its evidence', () => {
    const invalidDimension = state()
    invalidDimension.athlete.placement.dimensions.movementSkill = 7
    expect(() => parseBackup(JSON.stringify(createBackup(invalidDimension)))).toThrow(/placement.*one to five/i)

    const invalidRoute = state()
    invalidRoute.athlete.entryRoute = 'Introductory Skill Cycle'
    expect(() => parseBackup(JSON.stringify(createBackup(invalidRoute)))).toThrow(/entry route/i)
  })

  it('round-trips source-linked productive placement verification and rejects a forged verdict', () => {
    const current = state()
    const session = current.sessions[0]
    const planned = session.exercises.find((exercise) => exercise.role === 'primary')!
    const exercise = current.exercises.find((candidate) => candidate.id === planned.exerciseId)!
    const sourceSet = {
      ...structuredClone(current.history[0]), id: 'placement-source-set', sessionId: session.id,
      exerciseId: exercise.id, exerciseName: exercise.name, family: exercise.family, primaryRegion: exercise.primaryRegion,
      completedAt: '2026-08-10T12:00:00.000Z', reps: 5, load: 180, rir: 2, technique: 4, pain: 0,
      qualityConfirmed: true, setIndex: 0, plannedExerciseId: planned.id
    }
    current.history.push(sourceSet)
    current.records = derivePersonalRecords(current.history)
    let event = beginPlacementVerification({ id: 'placement-check-1', placement: current.athlete.placement, sessionId: session.id, sequence: 1, startedAt: '2026-08-10T11:00:00.000Z' })
    event = recordPlacementWarmup(event, 'as-expected', '2026-08-10T11:05:00.000Z')
    event = completePlacementVerification(event, {
      firstSet: { sourceSetId: sourceSet.id, plannedExerciseId: planned.id, exerciseId: exercise.id, exerciseName: exercise.name, targetLoad: 180, targetReps: 5, targetRir: 2, actualLoad: 180, actualReps: 5, actualRir: 2 },
      sessionEvidence: { sessionStatus: 'completed', completedSets: 10, plannedSets: 10, completionRate: 1, plannedMinutes: 60, actualMinutes: 58, readiness: 'normal', difficulty: 7, technique: 4, pain: 0, timeFit: 4, postSurveySkipped: false },
      completedAt: '2026-08-10T12:00:00.000Z'
    })
    event = resolvePlacementRecovery(event, 'recovered', '2026-08-11T10:00:00.000Z')
    current.placementVerifications = [event]
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.summary.placementChecks).toBe(1)
    expect(parsed.backup.data.placementVerifications[0]).toMatchObject({ verdict: 'supports-route', firstSet: { sourceSetId: 'placement-source-set' } })

    current.placementVerifications[0].verdict = 'review-suggested'
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/does not reconcile/i)
  })

  it('round-trips athlete-reviewed placement exit evidence and rejects a forged recommendation', () => {
    const current = state()
    const makeSupport = (sequence: number) => {
      const session = current.sessions[sequence - 1]
      const planned = session.exercises.find((exercise) => exercise.role === 'primary')!
      const exercise = current.exercises.find((candidate) => candidate.id === planned.exerciseId)!
      const sourceSet = {
        ...structuredClone(current.history[0]), id: `exit-source-${sequence}`, sessionId: session.id,
        exerciseId: exercise.id, exerciseName: exercise.name, family: exercise.family, primaryRegion: exercise.primaryRegion,
        completedAt: `2026-08-1${sequence}T12:00:00.000Z`, reps: 5, load: 180, rir: 2, technique: 4, pain: 0,
        qualityConfirmed: true, setIndex: 0, plannedExerciseId: planned.id
      }
      current.history.push(sourceSet)
      let event = beginPlacementVerification({
        id: `exit-check-${sequence}`, placement: current.athlete.placement, sessionId: session.id, sequence,
        startedAt: `2026-08-1${sequence}T11:00:00.000Z`, movementPlacement: current.athlete.placement.movementPlacements?.find((movement) => movement.exerciseId === exercise.id)
      })
      event = recordPlacementWarmup(event, 'as-expected', `2026-08-1${sequence}T11:05:00.000Z`)
      event = completePlacementVerification(event, {
        firstSet: { sourceSetId: sourceSet.id, plannedExerciseId: planned.id, exerciseId: exercise.id, exerciseName: exercise.name, targetLoad: 180, targetReps: 5, targetRir: 2, actualLoad: 180, actualReps: 5, actualRir: 2 },
        sessionEvidence: { sessionStatus: 'completed', completedSets: 10, plannedSets: 10, completionRate: 1, plannedMinutes: 60, actualMinutes: 58, readiness: 'normal', difficulty: 7, technique: 4, pain: 0, timeFit: 4, postSurveySkipped: false },
        completedAt: `2026-08-1${sequence}T12:00:00.000Z`
      })
      return resolvePlacementRecovery(event, 'recovered', `2026-08-1${sequence + 1}T10:00:00.000Z`)
    }
    current.placementVerifications = [makeSupport(1), makeSupport(2)]
    current.records = derivePersonalRecords(current.history)
    const assessment = buildPlacementExitAssessment({ placement: current.athlete.placement, verificationEvents: current.placementVerifications, assessedAt: '2026-08-13T12:00:00.000Z' })
    current.placementExitReviews = [{
      id: 'exit-review-1', ruleVersion: 'placement-exit-review-v1', placementCreatedAt: current.athlete.placement.createdAt,
      createdAt: '2026-08-13T12:00:00.000Z', decision: 'continue-current', reason: 'Two productive checks support this starting route.', assessment
    }]
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.summary.placementExitReviews).toBe(1)
    expect(parsed.backup.data.placementExitReviews[0]).toMatchObject({ decision: 'continue-current', assessment: { ruleVersion: 'placement-exit-v1', supports: 2 } })

    current.placementExitReviews[0].assessment.recommendation = 'review-conservative'
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/does not reconcile/i)
  })

  it('round-trips an athlete-reviewed exact movement-lane exit and rejects forged lane evidence', () => {
    const current = state()
    const session = current.sessions[0]
    const planned = session.exercises.find((candidate) => candidate.role === 'primary')!
    const exercise = current.exercises.find((candidate) => candidate.id === planned.exerciseId)!
    const movementPlacement = current.athlete.placement.movementPlacements!.find((movement) => movement.exerciseId === exercise.id)!
    const makeSupport = (sequence: number) => {
      const sourceSet = {
        ...structuredClone(current.history[0]), id: `movement-exit-source-${sequence}`, sessionId: session.id,
        exerciseId: exercise.id, exerciseName: exercise.name, family: exercise.family, primaryRegion: exercise.primaryRegion,
        completedAt: `2026-08-1${sequence}T12:00:00.000Z`, reps: 5, load: 180, rir: 2, technique: 4, pain: 0,
        qualityConfirmed: true, setIndex: sequence - 1, plannedExerciseId: planned.id
      }
      current.history.push(sourceSet)
      let event = beginPlacementVerification({
        id: `movement-exit-check-${sequence}`, placement: current.athlete.placement, sessionId: session.id, sequence,
        startedAt: `2026-08-1${sequence}T11:00:00.000Z`, movementPlacement
      })
      event = recordPlacementWarmup(event, 'as-expected', `2026-08-1${sequence}T11:05:00.000Z`)
      event = completePlacementVerification(event, {
        firstSet: { sourceSetId: sourceSet.id, plannedExerciseId: planned.id, exerciseId: exercise.id, exerciseName: exercise.name, targetLoad: 180, targetReps: 5, targetRir: 2, actualLoad: 180, actualReps: 5, actualRir: 2 },
        sessionEvidence: { sessionStatus: 'completed', completedSets: 10, plannedSets: 10, completionRate: 1, plannedMinutes: 60, actualMinutes: 58, readiness: 'normal', difficulty: 7, technique: 4, pain: 0, timeFit: 4, postSurveySkipped: false },
        completedAt: `2026-08-1${sequence}T12:00:00.000Z`
      })
      return resolvePlacementRecovery(event, 'recovered', `2026-08-1${sequence + 1}T10:00:00.000Z`)
    }
    current.placementVerifications = [makeSupport(1), makeSupport(2)]
    current.records = derivePersonalRecords(current.history)
    const assessment = buildMovementPlacementExitAssessment({ placement: current.athlete.placement, movementPlacement, verificationEvents: current.placementVerifications, assessedAt: '2026-08-13T12:00:00.000Z' })
    current.movementPlacementExitReviews = [{
      id: 'movement-exit-review-1', ruleVersion: 'movement-placement-exit-review-v1', placementCreatedAt: current.athlete.placement.createdAt,
      exerciseId: exercise.id, createdAt: '2026-08-13T12:00:00.000Z', decision: 'continue-current',
      reason: 'Two exact bench checks support this movement lane.', assessment
    }]
    const parsed = parseBackup(JSON.stringify(createBackup(current)))
    expect(parsed.summary.movementPlacementExitReviews).toBe(1)
    expect(parsed.backup.data.movementPlacementExitReviews[0]).toMatchObject({
      exerciseId: exercise.id, decision: 'continue-current',
      assessment: { ruleVersion: 'movement-placement-exit-v1', resolved: 2, supports: 2, excludedOtherMovementChecks: 0 }
    })

    current.movementPlacementExitReviews[0].assessment.exerciseName = 'Forged movement identity'
    expect(() => parseBackup(JSON.stringify(createBackup(current)))).toThrow(/does not match its source identity/i)
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
