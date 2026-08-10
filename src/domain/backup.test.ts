import { describe, expect, it } from 'vitest'
import { athlete, exercises, history, records, sessions } from './seed'
import { BACKUP_SCHEMA_VERSION, backupStateFrom, createBackup, parseBackup, type RestorableAppState } from './backup'

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

  it('creates an isolated restore snapshot', () => {
    const source = state()
    const snapshot = backupStateFrom(source)
    snapshot.athlete.name = 'Changed'
    expect(source.athlete.name).not.toBe('Changed')
  })
})
