import { useEffect, useState } from 'react'
import type { AthleteForm } from '../domain/athlete-level-engine'

interface SpritePack { name: string; stages: { stage: AthleteForm; file: string }[] }

/**
 * An optional sprite pack installed locally by the athlete, which overrides the shipped forms on that
 * machine only. The pack folder is gitignored, so it never enters the repository or the published site.
 */
function useSpritePack(): SpritePack | null {
  const [pack, setPack] = useState<SpritePack | null>(null)
  useEffect(() => {
    let active = true
    fetch(`${import.meta.env.BASE_URL}sprite-pack/manifest.json`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active && data?.stages?.length) setPack(data as SpritePack) })
      .catch(() => undefined)
    return () => { active = false }
  }, [])
  return pack
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
  const pack = useSpritePack()
  const packStage = pack?.stages.find((entry) => entry.stage === form)
  const source = packStage
    ? `${import.meta.env.BASE_URL}sprite-pack/${packStage.file}`
    : `${import.meta.env.BASE_URL}athlete-forms/${form}.png`

  return (
    <div
      className={`pixel-avatar pixel-avatar--${size} pixel-avatar--${form} pixel-avatar--${mood}`}
      aria-label={`Athlete, ${form} form${typeof level === 'number' ? `, level ${level}` : ''}`}
      role="img"
    >
      <img src={source} alt="" />
      {typeof level === 'number' && <span className="pixel-avatar__level" aria-hidden="true">{level}</span>}
    </div>
  )
}
