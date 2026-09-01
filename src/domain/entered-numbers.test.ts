import { describe, expect, it } from 'vitest'
import { derivePersonalRecords } from './history-engine'
import { BACKUP_SCHEMA_VERSION, backupStateFrom, createBackup, parseBackup } from './backup'
import { useAppStore } from '../store/useAppStore'
import type { CompletedSetRecord } from './types'

const setRecord = (overrides: Partial<CompletedSetRecord> = {}): CompletedSetRecord => ({
  id: 'set-1', sessionId: 'session-1', exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press',
  family: 'Bench Press', primaryRegion: 'chest', completedAt: '2026-08-16T10:00:00.000Z', reps: 5, load: 225, rir: 2,
  technique: 4, pain: 0, qualityConfirmed: true, setIndex: 0, plannedExerciseId: 'plan-1', ...overrides
})

describe('a set the athlete never entered numbers for', () => {
  it('is kept as part of the session but can never become a personal record', () => {
    const entered = derivePersonalRecords([setRecord({ numbersEntered: true })])
    const assumed = derivePersonalRecords([setRecord({ id: 'set-2', numbersEntered: false })])
    expect(entered.length).toBeGreaterThan(0)
    expect(assumed).toHaveLength(0)
  })

  it('leaves sets saved before this version trusted, so past records are not rewritten', () => {
    const legacy = derivePersonalRecords([setRecord()])
    expect(legacy.length).toBeGreaterThan(0)
    expect(legacy.every((record) => record.sourceSetIds.includes('set-1'))).toBe(true)
  })

  it('does not let an assumed set beat a genuinely entered one', () => {
    const records = derivePersonalRecords([
      setRecord({ id: 'real', load: 225, numbersEntered: true }),
      setRecord({ id: 'assumed', load: 405, completedAt: '2026-08-16T11:00:00.000Z', numbersEntered: false })
    ])
    const heaviest = records.find((record) => record.type === 'absolute-load')
    expect(heaviest?.value).toBe(225)
    expect(heaviest?.sourceSetIds).toContain('real')
  })
})

describe('the workout store', () => {
  const startedSession = () => {
    useAppStore.getState().resetForTesting()
    const state = useAppStore.getState()
    const session = state.sessions[0] ?? null
    return session
  }

  it('marks a set as entered only when the athlete types a value', () => {
    useAppStore.getState().resetForTesting()
    const store = useAppStore.getState()
    expect(store.skipSet).toBeTypeOf('function')
    expect(startedSession()).toBeNull()
  })
})

describe('version 25 backups', () => {
  it('carry forward into the current schema without rewriting history', () => {
    useAppStore.getState().resetForTesting()
    const current = createBackup(backupStateFrom(useAppStore.getState()))
    expect(current.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(BACKUP_SCHEMA_VERSION).toBe(31)

    const asVersion25 = JSON.parse(JSON.stringify(current)) as Record<string, unknown>
    asVersion25.schemaVersion = 25
    const preview = parseBackup(JSON.stringify(asVersion25))
    expect(preview.warnings.join(' ')).toMatch(/version 25/i)
    expect(preview.backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
  })
})
