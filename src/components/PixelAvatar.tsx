import type { AthleteForm } from '../domain/athlete-level-engine'

const visualFormLabels: Record<AthleteForm, string> = {
  apprentice: 'uncharted journal',
  forged: 'established journal',
  champion: 'well-mapped journal',
  apex: 'long-record journal'
}

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
      aria-label={`Athlete with ${visualFormLabels[form]} art${typeof level === 'number' ? `, Forge level ${level}` : ''}`}
      role="img"
    >
      <img src={`${import.meta.env.BASE_URL}athlete-forms/${form}.png`} alt="" />
      <svg className="pixel-avatar__forge-marks" viewBox="0 0 256 256" aria-hidden="true" shapeRendering="crispEdges">
        <g className="forge-mark forge-mark--one"><path d="M71 132h18v5H71zm3 8h15v4H74zm4 7h12v4H78z" /></g>
        <g className="forge-mark forge-mark--two"><path d="M169 126h17v5h-17zm-2 8h16v4h-16zm-3 7h14v4h-14z" /></g>
        <g className="forge-mark forge-mark--three"><path d="M66 158h25v5H66zm5 8h22v4H71zm7 7h18v4H78z" /></g>
        <g className="forge-mark forge-mark--four"><path d="M166 154h23v5h-23zm-4 8h22v4h-22zm-3 7h18v4h-18z" /></g>
      </svg>
      {typeof level === 'number' && <span className="pixel-avatar__level" aria-hidden="true"><b>FL</b>{level}</span>}
    </div>
  )
}
