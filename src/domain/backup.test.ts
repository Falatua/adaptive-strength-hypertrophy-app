import { describe, expect, it } from 'vitest'
import { athlete, exercises, history, mesocycles, records, sessions } from './seed'
import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, backupStateFrom, createBackup, fnv1a32, parseBackup, type RestorableAppState } from './backup'

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
    reducedMotion: false, sounds: false, haptics: true, availableMinutes: 60, equipmentLocation: 'Commercial Gym'
  },
  exercises: structuredClone(exercises),
  sessions: structuredClone(sessions),
  history: structuredClone(history),
  surveys: [],
  records: structuredClone(records),
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
    expect(parsed.summary.planVersions).toBe(1)
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

  it('creates an isolated restore snapshot', () => {
    const source = state()
    const snapshot = backupStateFrom(source)
    snapshot.athlete.name = 'Changed'
    expect(source.athlete.name).not.toBe('Changed')
  })
})
