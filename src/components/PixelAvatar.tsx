import type { AthleteForm } from '../domain/athlete-level-engine'

interface PixelAvatarProps {
  mood?: 'ready' | 'strong' | 'rest' | 'celebrate'
  size?: 'small' | 'medium' | 'large'
  /** Which earned form to draw. Defaults to the first so callers without a level still render. */
  form?: AthleteForm
  /** Shown in a badge beside the head, the way a trainer's roster shows a level. */
  level?: number
}

/**
 * One original pixel athlete drawn in four earned forms. Each form widens the frame, thickens the
 * limbs, and adds its own silhouette detail, so the change reads at a glance even at the small
 * navigation size. Nothing here references another product's characters.
 */
export function PixelAvatar({ mood = 'ready', size = 'medium', form = 'apprentice', level }: PixelAvatarProps) {
  const build = {
    apprentice: { torso: { x: 48, width: 64 }, arm: { width: 16, y: 88, height: 32 }, shoulder: 0, legX: 40 },
    forged: { torso: { x: 44, width: 72 }, arm: { width: 20, y: 86, height: 36 }, shoulder: 6, legX: 38 },
    champion: { torso: { x: 38, width: 84 }, arm: { width: 24, y: 84, height: 40 }, shoulder: 10, legX: 34 },
    apex: { torso: { x: 32, width: 96 }, arm: { width: 28, y: 82, height: 44 }, shoulder: 14, legX: 30 }
  }[form]

  const armLeft = build.torso.x - build.arm.width
  const armRight = build.torso.x + build.torso.width

  return (
    <div className={`pixel-avatar pixel-avatar--${size} pixel-avatar--${form}`} aria-label={`Pixel athlete, ${form} form${typeof level === 'number' ? `, level ${level}` : ''}, feeling ${mood}`} role="img">
      <svg viewBox="0 0 160 176" shapeRendering="crispEdges" aria-hidden="true">
        {form === 'apex' && (
          <g className="pixel-aura">
            <rect x="16" y="60" width="8" height="8" />
            <rect x="136" y="60" width="8" height="8" />
            <rect x="24" y="44" width="8" height="8" />
            <rect x="128" y="44" width="8" height="8" />
            <rect x="8" y="88" width="8" height="8" />
            <rect x="144" y="88" width="8" height="8" />
          </g>
        )}

        <rect x="56" y="16" width="48" height="8" className="pixel-hair" />
        <rect x="48" y="24" width="64" height="16" className="pixel-hair" />
        <rect x="48" y="40" width="64" height="40" className="pixel-skin" />
        <rect x="40" y="48" width="8" height="24" className="pixel-skin-dark" />
        <rect x="112" y="48" width="8" height="24" className="pixel-skin-dark" />
        <rect x="64" y="48" width="8" height="8" className="pixel-ink" />
        <rect x="88" y="48" width="8" height="8" className="pixel-ink" />
        <rect x="72" y="64" width="16" height="8" className={mood === 'rest' ? 'pixel-skin-dark' : 'pixel-ink'} />

        {/* A wider yoke is the clearest silhouette cue that a form has been earned. */}
        {build.shoulder > 0 && <rect x={build.torso.x} y={80 - build.shoulder} width={build.torso.width} height={build.shoulder} className="pixel-skin" />}
        <rect x={build.torso.x} y="80" width={build.torso.width} height="48" className="pixel-shirt" />
        <rect x={build.torso.x + 16} y="88" width={build.torso.width - 32} height="8" className="pixel-accent" />
        <rect x="72" y="96" width="16" height="24" className="pixel-ink" />

        <rect x={armLeft} y={build.arm.y} width={build.arm.width} height={build.arm.height} className="pixel-skin" />
        <rect x={armRight} y={build.arm.y} width={build.arm.width} height={build.arm.height} className="pixel-skin" />
        {(form === 'champion' || form === 'apex') && (
          <>
            <rect x={armLeft} y={build.arm.y + build.arm.height} width={build.arm.width} height="8" className="pixel-skin-dark" />
            <rect x={armRight} y={build.arm.y + build.arm.height} width={build.arm.width} height="8" className="pixel-skin-dark" />
          </>
        )}

        <rect x={build.legX} y="128" width="32" height="24" className="pixel-shorts" />
        <rect x={build.legX + 48} y="128" width="32" height="24" className="pixel-shorts" />
        <rect x={build.legX} y="152" width="32" height="8" className="pixel-shoe" />
        <rect x={build.legX + 48} y="152" width="32" height="8" className="pixel-shoe" />

        {mood === 'celebrate' && (
          <>
            <rect x="16" y="24" width="8" height="8" className="pixel-accent" />
            <rect x="24" y="40" width="8" height="8" className="pixel-warm" />
            <rect x="136" y="24" width="8" height="8" className="pixel-warm" />
            <rect x="128" y="40" width="8" height="8" className="pixel-accent" />
          </>
        )}
        {mood === 'strong' && (
          <>
            <rect x={armLeft - 16} y="88" width="16" height="8" className="pixel-ink" />
            <rect x={armRight + build.arm.width} y="88" width="16" height="8" className="pixel-ink" />
          </>
        )}
      </svg>
      {typeof level === 'number' && <span className="pixel-avatar__level" aria-hidden="true">{level}</span>}
    </div>
  )
}
