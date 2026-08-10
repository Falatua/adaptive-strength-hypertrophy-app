interface PixelAvatarProps {
  mood?: 'ready' | 'strong' | 'rest' | 'celebrate'
  size?: 'small' | 'medium' | 'large'
}

export function PixelAvatar({ mood = 'ready', size = 'medium' }: PixelAvatarProps) {
  return (
    <div className={`pixel-avatar pixel-avatar--${size}`} aria-label={`Pixel athlete feeling ${mood}`} role="img">
      <svg viewBox="0 0 160 160" shapeRendering="crispEdges" aria-hidden="true">
        <rect x="56" y="16" width="48" height="8" className="pixel-hair" />
        <rect x="48" y="24" width="64" height="16" className="pixel-hair" />
        <rect x="48" y="40" width="64" height="40" className="pixel-skin" />
        <rect x="40" y="48" width="8" height="24" className="pixel-skin-dark" />
        <rect x="112" y="48" width="8" height="24" className="pixel-skin-dark" />
        <rect x="64" y="48" width="8" height="8" className="pixel-ink" />
        <rect x="88" y="48" width="8" height="8" className="pixel-ink" />
        <rect x="72" y="64" width="16" height="8" className={mood === 'rest' ? 'pixel-skin-dark' : 'pixel-ink'} />
        <rect x="48" y="80" width="64" height="48" className="pixel-shirt" />
        <rect x="64" y="88" width="32" height="8" className="pixel-accent" />
        <rect x="72" y="96" width="16" height="24" className="pixel-ink" />
        <rect x="32" y="88" width="16" height="32" className="pixel-skin" />
        <rect x="112" y="88" width="16" height="32" className="pixel-skin" />
        <rect x="40" y="120" width="32" height="24" className="pixel-shorts" />
        <rect x="88" y="120" width="32" height="24" className="pixel-shorts" />
        <rect x="40" y="144" width="32" height="8" className="pixel-shoe" />
        <rect x="88" y="144" width="32" height="8" className="pixel-shoe" />
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
            <rect x="16" y="88" width="16" height="8" className="pixel-ink" />
            <rect x="128" y="88" width="16" height="8" className="pixel-ink" />
          </>
        )}
      </svg>
    </div>
  )
}
