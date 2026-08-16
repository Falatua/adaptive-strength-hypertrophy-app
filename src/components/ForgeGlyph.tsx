import type { ReactNode } from 'react'
import type { BodyRegion, MovementPattern } from '../domain/types'

export type ForgeGlyphName =
  | 'mark'
  | 'today'
  | 'plan'
  | 'progress'
  | 'library'
  | 'you'
  | 'recommended'
  | 'choice'
  | 'evidence'
  | 'unknown'
  | 'hold'
  | 'safety'
  | 'return'
  | 'calibration'
  | 'saved'
  | 'sync'

const glyphs: Record<ForgeGlyphName, ReactNode> = {
  mark: <><path d="M4 4h11v4H8v4h8v4H8v4H4z" /><path d="M16 8h4v4h-4zM12 16h8v4h-8z" className="forge-glyph__accent" /></>,
  today: <><path d="M3 9h3V6h3v3h6V6h3v3h3v6h-3v3h-3v-3H9v3H6v-3H3z" /><path d="M10 10h4v4h-4z" className="forge-glyph__cut" /></>,
  plan: <><path d="M3 5h7v5H3zm11 0h7v5h-7zM8 14h8v6H8z" /><path d="M10 7h4v1h-4zm2 1h1v6h-1z" className="forge-glyph__accent" /></>,
  progress: <><path d="M3 17h4v4H3zm7-5h4v9h-4zm7-8h4v17h-4z" /><path d="M4 13l5-5 4 2 6-7 2 2-7 9-4-2-4 4z" className="forge-glyph__accent" /></>,
  library: <><path d="M3 4h8v15H5a2 2 0 0 0-2 2zm10 0h8v17a2 2 0 0 0-2-2h-6z" /><path d="M6 7h3v2H6zm9 0h3v2h-3zM6 12h3v2H6zm9 0h3v2h-3z" className="forge-glyph__cut" /></>,
  you: <><path d="M9 3h6v6H9zM6 11h12v9H6z" /><path d="M9 14h6v6H9z" className="forge-glyph__accent" /></>,
  recommended: <><path d="M3 5h10v4H7v3h8v4H7v3H3z" /><path d="M14 8l7 4-7 4z" className="forge-glyph__accent" /></>,
  choice: <><path d="M3 5h7v6H3zm11 0h7v6h-7zM3 15h7v6H3zm11 0h7v6h-7z" /><path d="M15 16h5v4h-5z" className="forge-glyph__accent" /></>,
  evidence: <><path d="M2 12c3-5 6-7 10-7s7 2 10 7c-3 5-6 7-10 7S5 17 2 12z" /><path d="M9 9h6v6H9z" className="forge-glyph__cut" /><path d="M11 11h2v2h-2z" className="forge-glyph__accent" /></>,
  unknown: <><path d="M5 3h14v18H5z" /><path d="M9 7h6v5h-2v2h-3v-4h3V9H9zm2 9h3v3h-3z" className="forge-glyph__cut" /></>,
  hold: <><path d="M5 4h5v16H5zm9 0h5v16h-5z" /><path d="M10 10h4v4h-4z" className="forge-glyph__accent" /></>,
  safety: <><path d="M12 2l9 4v6c0 5-3 8-9 10-6-2-9-5-9-10V6z" /><path d="M10 7h4v6h-4zm0 8h4v3h-4z" className="forge-glyph__cut" /></>,
  return: <><path d="M4 5h4V2l5 5-5 5V9H6v3c0 4 2 6 6 6h7v4h-7C5 22 2 18 2 12V7h2z" /><path d="M14 5h6v4h-6z" className="forge-glyph__accent" /></>,
  calibration: <><path d="M10 2h4v4h-4zM10 18h4v4h-4zM2 10h4v4H2zM18 10h4v4h-4z" /><path d="M8 8h8v8H8z" className="forge-glyph__accent" /><path d="M11 11h2v2h-2z" className="forge-glyph__cut" /></>,
  saved: <><path d="M3 3h18v18H3z" /><path d="M7 12l3 3 7-8 2 2-9 10-5-5z" className="forge-glyph__cut" /><path d="M7 4h10v3H7z" className="forge-glyph__accent" /></>,
  sync: <><path d="M3 6h12V3l6 5-6 5v-3H3zm18 12H9v3l-6-5 6-5v3h12z" /><path d="M10 10h4v4h-4z" className="forge-glyph__accent" /></>
}

export function ForgeGlyph({ name, size = 20, className = '' }: { name: ForgeGlyphName; size?: number; className?: string }) {
  return <svg className={`forge-glyph ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" shapeRendering="crispEdges">{glyphs[name]}</svg>
}

const regionHighlights: Record<BodyRegion | 'all', ReactNode> = {
  all: <path d="M9 7h6v7H9zM6 8h3v7H6zm9 0h3v7h-3zM9 14h3v8H9zm3 0h3v8h-3z" />,
  chest: <path d="M9 8h6v3H9z" />,
  back: <path d="M9 8h6v6H9z" />,
  shoulders: <path d="M6 8h3v3H6zm9 0h3v3h-3z" />,
  quadriceps: <path d="M9 14h3v5H9zm3 0h3v5h-3z" />,
  hamstrings: <path d="M9 15h2v5H9zm4 0h2v5h-2z" />,
  glutes: <path d="M9 12h6v3H9z" />,
  biceps: <path d="M6 9h3v3H6zm9 0h3v3h-3z" />,
  triceps: <path d="M6 11h3v4H6zm9 0h3v4h-3z" />,
  forearms: <path d="M5 14h4v3H5zm10 0h4v3h-4z" />,
  calves: <path d="M9 18h3v4H9zm3 0h3v4h-3z" />,
  trunk: <path d="M10 10h4v5h-4z" />
}

export function BodyRegionGlyph({ region, size = 18 }: { region: BodyRegion | 'all'; size?: number }) {
  return <svg className="forge-glyph body-region-glyph" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" shapeRendering="crispEdges"><path d="M10 2h4v4h-4zM9 7h6v7H9zM6 8h3v7H6zm9 0h3v7h-3zM9 14h3v8H9zm3 0h3v8h-3z" className="forge-glyph__muted" />{regionHighlights[region]}</svg>
}

const patternPaths: Record<MovementPattern, ReactNode> = {
  squat: <><path d="M5 5h14v3H5zM10 8h4v5h-4zM7 13h5v3H7zm5 0h5v3h-5zM5 16h5v5H5zm9 0h5v5h-5z" /><path d="M3 4h3v5H3zm15 0h3v5h-3z" className="forge-glyph__accent" /></>,
  hinge: <><path d="M7 4h5v4h-2l7 5-2 3-7-5v10H4V8h3z" /><path d="M15 15h5v6h-5z" className="forge-glyph__accent" /></>,
  'horizontal-push': <><path d="M3 9h9V5l8 7-8 7v-4H3z" /><path d="M4 11h8v2H4z" className="forge-glyph__cut" /></>,
  'vertical-push': <><path d="M9 21v-9H5l7-8 7 8h-4v9z" /><path d="M11 12h2v8h-2z" className="forge-glyph__cut" /></>,
  'horizontal-pull': <><path d="M21 9h-9V5l-8 7 8 7v-4h9z" /><path d="M12 11h8v2h-8z" className="forge-glyph__cut" /></>,
  'vertical-pull': <><path d="M9 3v9H5l7 8 7-8h-4V3z" /><path d="M11 4h2v8h-2z" className="forge-glyph__cut" /></>,
  isolation: <><path d="M4 10h5V6h6v4h5v4h-5v4H9v-4H4z" /><path d="M10 11h4v2h-4z" className="forge-glyph__cut" /></>,
  carry: <><path d="M10 2h4v5h-4zM9 7h6v7H9zM5 10h4v8H5zm10 0h4v8h-4zM8 14h4v8H8zm4 0h4v8h-4z" /><path d="M3 16h6v5H3zm12 0h6v5h-6z" className="forge-glyph__accent" /></>
}

export function MovementPatternGlyph({ pattern, size = 18 }: { pattern: MovementPattern; size?: number }) {
  return <svg className="forge-glyph movement-pattern-glyph" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" shapeRendering="crispEdges">{patternPaths[pattern]}</svg>
}
