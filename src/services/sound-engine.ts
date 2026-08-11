export type ForgeSoundCue = 'menu-confirm' | 'workout-start' | 'set-complete' | 'achievement' | 'workout-complete' | 'warning'

export interface SoundControls {
  sounds: boolean
  quietMode: boolean
}

interface SynthNote {
  frequency: number
  startsAt: number
  duration: number
  gain: number
  wave: OscillatorType
  glideTo?: number
}

export const SOUND_PACK_VERSION = 'field-guide-synth-v1'

export const FORGE_SOUND_CUES: Record<ForgeSoundCue, readonly SynthNote[]> = {
  'menu-confirm': [
    { frequency: 659.25, startsAt: 0, duration: 0.055, gain: 0.025, wave: 'square' },
    { frequency: 987.77, startsAt: 0.052, duration: 0.07, gain: 0.022, wave: 'square' }
  ],
  'workout-start': [
    { frequency: 293.66, startsAt: 0, duration: 0.12, gain: 0.032, wave: 'square' },
    { frequency: 440, startsAt: 0.09, duration: 0.13, gain: 0.034, wave: 'square' },
    { frequency: 587.33, startsAt: 0.18, duration: 0.2, gain: 0.04, wave: 'triangle' }
  ],
  'set-complete': [
    { frequency: 523.25, startsAt: 0, duration: 0.065, gain: 0.027, wave: 'square' },
    { frequency: 783.99, startsAt: 0.058, duration: 0.105, gain: 0.032, wave: 'triangle', glideTo: 880 }
  ],
  achievement: [
    { frequency: 440, startsAt: 0.16, duration: 0.1, gain: 0.033, wave: 'square' },
    { frequency: 587.33, startsAt: 0.235, duration: 0.11, gain: 0.034, wave: 'square' },
    { frequency: 739.99, startsAt: 0.31, duration: 0.12, gain: 0.035, wave: 'square' },
    { frequency: 880, startsAt: 0.395, duration: 0.22, gain: 0.04, wave: 'triangle' }
  ],
  'workout-complete': [
    { frequency: 293.66, startsAt: 0, duration: 0.12, gain: 0.035, wave: 'square' },
    { frequency: 369.99, startsAt: 0.085, duration: 0.12, gain: 0.035, wave: 'square' },
    { frequency: 440, startsAt: 0.17, duration: 0.12, gain: 0.037, wave: 'square' },
    { frequency: 587.33, startsAt: 0.255, duration: 0.28, gain: 0.042, wave: 'triangle' },
    { frequency: 739.99, startsAt: 0.34, duration: 0.22, gain: 0.025, wave: 'sine' }
  ],
  warning: [
    { frequency: 220, startsAt: 0, duration: 0.11, gain: 0.027, wave: 'sawtooth', glideTo: 185 },
    { frequency: 185, startsAt: 0.14, duration: 0.16, gain: 0.025, wave: 'square' }
  ]
}

let audioContext: AudioContext | null = null

export function shouldPlayForgeSound(controls: SoundControls) {
  return controls.sounds && !controls.quietMode
}

function getAudioContext() {
  if (audioContext) return audioContext
  if (typeof window === 'undefined') return null
  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextConstructor) return null
  audioContext = new AudioContextConstructor()
  return audioContext
}

export function playForgeSound(cue: ForgeSoundCue, controls: SoundControls) {
  if (!shouldPlayForgeSound(controls)) return false
  const context = getAudioContext()
  if (!context) return false

  try {
    if (context.state === 'suspended') void context.resume()
    const now = context.currentTime + 0.006
    FORGE_SOUND_CUES[cue].forEach((note) => {
      const startsAt = now + note.startsAt
      const endsAt = startsAt + note.duration
      const oscillator = context.createOscillator()
      const envelope = context.createGain()
      oscillator.type = note.wave
      oscillator.frequency.setValueAtTime(note.frequency, startsAt)
      if (note.glideTo) oscillator.frequency.exponentialRampToValueAtTime(note.glideTo, endsAt)
      envelope.gain.setValueAtTime(0.0001, startsAt)
      envelope.gain.exponentialRampToValueAtTime(note.gain, startsAt + Math.min(0.012, note.duration / 3))
      envelope.gain.exponentialRampToValueAtTime(0.0001, endsAt)
      oscillator.connect(envelope)
      envelope.connect(context.destination)
      oscillator.start(startsAt)
      oscillator.stop(endsAt + 0.015)
    })
    return true
  } catch {
    return false
  }
}
