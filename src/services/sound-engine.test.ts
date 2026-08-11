import { describe, expect, it } from 'vitest'
import { FORGE_SOUND_CUES, SOUND_PACK_VERSION, shouldPlayForgeSound } from './sound-engine'

describe('original field guide sound pack', () => {
  it('keeps every cue brief, restrained, and complete', () => {
    expect(SOUND_PACK_VERSION).toBe('field-guide-synth-v1')
    expect(Object.keys(FORGE_SOUND_CUES)).toEqual(['menu-confirm', 'workout-start', 'set-complete', 'achievement', 'workout-complete', 'warning'])

    Object.values(FORGE_SOUND_CUES).forEach((notes) => {
      expect(notes.length).toBeGreaterThan(0)
      expect(Math.max(...notes.map((note) => note.startsAt + note.duration))).toBeLessThanOrEqual(0.7)
      notes.forEach((note) => {
        expect(note.frequency).toBeGreaterThanOrEqual(180)
        expect(note.frequency).toBeLessThanOrEqual(1000)
        expect(note.gain).toBeGreaterThan(0)
        expect(note.gain).toBeLessThanOrEqual(0.05)
      })
    })
  })

  it('keeps quiet mode authoritative over the sound preference', () => {
    expect(shouldPlayForgeSound({ sounds: false, quietMode: false })).toBe(false)
    expect(shouldPlayForgeSound({ sounds: true, quietMode: true })).toBe(false)
    expect(shouldPlayForgeSound({ sounds: true, quietMode: false })).toBe(true)
  })
})
