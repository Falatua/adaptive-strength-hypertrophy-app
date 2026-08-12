import type { AthleteForm } from '../domain/athlete-level-engine'

interface PixelAvatarProps {
  mood?: 'ready' | 'strong' | 'rest' | 'celebrate'
  size?: 'small' | 'medium' | 'large'
  /** Which earned form to draw. Defaults to the first so callers without a level still render. */
  form?: AthleteForm
  /** Shown in a badge beside the head, the way a roster entry shows one. */
  level?: number
}

/**
 * The athlete avatar, drawn as one original character in four earned forms. Each form keeps the same
 * face, hair, framing, and pixel density, and changes only build and dress, so the stage reads as the
 * same person grown rather than a different character.
 *
 * The artwork is original to this app. Its decorative banding is invented geometry and deliberately
 * does not reproduce tatau or any culturally specific design.
 */
export function PixelAvatar({ mood = 'ready', size = 'medium', form = 'apprentice', level }: PixelAvatarProps) {
  return (
    <div
      className={`pixel-avatar pixel-avatar--${size} pixel-avatar--${form} pixel-avatar--${mood}`}
      aria-label={`Athlete, ${form} form${typeof level === 'number' ? `, level ${level}` : ''}`}
      role="img"
    >
      <img src={`${import.meta.env.BASE_URL}athlete-forms/${form}.png`} alt="" />
      {typeof level === 'number' && <span className="pixel-avatar__level" aria-hidden="true">{level}</span>}
    </div>
  )
}
