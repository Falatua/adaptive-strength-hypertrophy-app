import { useEffect, useState } from 'react'
import type { AthleteForm } from '../domain/athlete-level-engine'
import { athleteFormArt, formPalette, FORM_GRID_HEIGHT, FORM_GRID_WIDTH, FORM_PIXEL } from './athlete-forms'

interface SpritePack { name: string; stages: { stage: AthleteForm; file: string }[] }

/**
 * An optional sprite pack installed locally by the athlete. The folder is gitignored, so a pack never
 * enters the repository or the published site: it is personal art for the machine it was installed on.
 * When no pack is present, and on every public build, the original drawn forms are used instead.
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
  /** Shown in a badge beside the head, the way a trainer's roster shows a level. */
  level?: number
}

/**
 * One original athlete drawn in four earned forms from a pixel grid. Each form changes silhouette,
 * dress, and detail, so the stage reads at a glance even at the small navigation size. The artwork and
 * its geometry are original to this app.
 */
export function PixelAvatar({ mood = 'ready', size = 'medium', form = 'apprentice', level }: PixelAvatarProps) {
  const pack = useSpritePack()
  const packStage = pack?.stages.find((entry) => entry.stage === form)
  if (packStage) {
    return (
      <div className={`pixel-avatar pixel-avatar--${size} pixel-avatar--${form} pixel-avatar--packed`} aria-label={`Athlete avatar, ${form} form${typeof level === 'number' ? `, level ${level}` : ''}`} role="img">
        <img src={`${import.meta.env.BASE_URL}sprite-pack/${packStage.file}`} alt="" />
        {typeof level === 'number' && <span className="pixel-avatar__level" aria-hidden="true">{level}</span>}
      </div>
    )
  }

  const rows = athleteFormArt[form]

  return (
    <div className={`pixel-avatar pixel-avatar--${size} pixel-avatar--${form}`} aria-label={`Athlete, ${form} form${typeof level === 'number' ? `, level ${level}` : ''}`} role="img">
      <svg viewBox={`0 0 ${FORM_GRID_WIDTH * FORM_PIXEL} ${FORM_GRID_HEIGHT * FORM_PIXEL}`} shapeRendering="crispEdges" aria-hidden="true">
        {rows.flatMap((row, y) => [...row].flatMap((token, x) => {
          const fill = formPalette[token]
          if (!fill) return []
          // Runs of the same colour are drawn as one rect so the markup stays small.
          if (x > 0 && row[x - 1] === token) return []
          let width = 1
          while (row[x + width] === token) width += 1
          return [<rect key={`${x}-${y}`} x={x * FORM_PIXEL} y={y * FORM_PIXEL} width={width * FORM_PIXEL} height={FORM_PIXEL} fill={fill} className={token === 'y' ? 'pixel-glow' : undefined} />]
        }))}
        {mood === 'celebrate' && (
          <g className="pixel-glow">
            <rect x="16" y="24" width="8" height="8" fill={formPalette.y} />
            <rect x="136" y="32" width="8" height="8" fill={formPalette.y} />
            <rect x="24" y="48" width="8" height="8" fill={formPalette.y} />
          </g>
        )}
      </svg>
      {typeof level === 'number' && <span className="pixel-avatar__level" aria-hidden="true">{level}</span>}
    </div>
  )
}
