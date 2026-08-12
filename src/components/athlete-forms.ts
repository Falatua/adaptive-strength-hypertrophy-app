import type { AthleteForm } from '../domain/athlete-level-engine'

/**
 * Four original athlete forms drawn on a 20 by 22 pixel grid.
 *
 * Style: heavy dark outlines, a muted earthy palette with a few saturated accents, and chunky
 * proportions with a slightly oversized head, in the manner of hand-drawn adventure pixel art.
 *
 * Design intent: Polynesian-inspired strength imagery expressed through original geometry only. The
 * banding and chevrons here are decorative shapes invented for this app. They deliberately do not
 * reproduce tatau or any culturally specific design, and no real or mythological figure is depicted.
 * The forms read as one athlete growing into their strength, not as a representation of any people.
 */
export const formPalette: Record<string, string> = {
  o: '#17120e', // outline
  s: '#9c6440', // skin
  d: '#754a2e', // skin shadow
  l: '#b8825c', // skin highlight
  h: '#241a14', // hair
  w: '#a8642c', // wrap, ochre
  W: '#7d4a20', // wrap shadow
  b: '#e8ddc8', // bone and shell
  c: '#5d2f22', // cord
  g: '#3f5136', // mantle, deep green
  G: '#2c3a26', // mantle shadow
  m: '#c8a45c', // carved wood
  y: '#e7ff58', // lime accent
  k: '#8f2f22'  // deep red cloth
}

const grid = (rows: string[]) => rows

/** Lean, young, plain wrap and a single cord band. Nothing earned yet but the willingness. */
const apprentice = grid([
  '.......oooooo.......',
  '......ohhhhhhoo.....',
  '.....ohhhhhhhhho....',
  '.....ohssssssdho....',
  '.....ossosssosdo....',
  '.....ossssssssdo....',
  '.....osssooosssdo...',
  '......odssssdo......',
  '.......oddddo.......',
  '......osssssso......',
  '.....osdwwwwdso.....',
  '....oosdwwwwdsoo....',
  '....osodwwwwdoso....',
  '....osodWWWWdoso....',
  '....oo.occccco.oo...',
  '.......owwwwwo......',
  '.......owWWWwo......',
  '.......odo.odo......',
  '.......oso.oso......',
  '......ooso.osoo.....',
  '......obbo.obbo.....',
  '....................'
])

/** Filled out, patterned wrap, shell at the throat. The work has started to show. */
const forged = grid([
  '.......oooooo.......',
  '......ohhhhhhoo.....',
  '.....ohhhhhhhhho....',
  '.....ohssssssdho....',
  '.....ossosssosdo....',
  '.....ossssssssdo....',
  '.....osssooosssdo...',
  '......odssssdo......',
  '.......oddddo.......',
  '......obbbbbbo......',
  '....oosssssssoo.....',
  '...osdswwwwwsdso....',
  '...osdswbwbwsdso....',
  '...osodwwwwwdoso....',
  '...oo..occccco..oo..',
  '.......owwwwwo......',
  '.......oWbWbWo......',
  '......odso.osdo.....',
  '......osso.osso.....',
  '.....oosso.ossoo....',
  '.....obbbo.obbbo....',
  '....................'
])

/** Heavy, four-armed, carved band and a shoulder mantle. Unmistakably strong. */
const champion = grid([
  '.......oooooo.......',
  '......ohhhhhhoo.....',
  '.....ohhhhhhhhho....',
  '.....ohssssssdho....',
  '.....ossosssosdo....',
  '.....ossssssssdo....',
  '.....osssooosssdo...',
  '......odssssdo......',
  '.......oddddo.......',
  '....ogggbbbbggggo...',
  '..ossggggsssggggso..',
  '.osdsGggwwwwwgGgsdo.',
  '.osdsGgwbwbwbwGgsdo.',
  '.osdsGgwwwwwwwGgsdo.',
  '.oooo..occccco..oooo',
  '..oso..owwwwwo..oso.',
  '..oso..oWbWbWo..oso.',
  '..obo..odsosdo..obo.',
  '......ossoossso.....',
  '.....oossoossoo.....',
  '.....obbbo.obbbo....',
  '....................'
])

/** Apex. Mantle, carved staff, and an energy the app only shows once it has been earned. */
const apex = grid([
  '.......oooooo.......',
  '......ohhhhhhoo.....',
  '.....ohhhhhhhhho....',
  '.....ohyyyyyydho....',
  '.....ossosssosdo....',
  '.....ossssssssdo....',
  '.....osssooosssdo...',
  '......odssssdo......',
  '.......oddddo.......',
  '....ogggbbbbggggo...',
  '..ossggggsssggggso..',
  '.osdsGgkkkkkkkGgsdo.',
  '.osdsGgkbkbkbkGgsdo.',
  '.osdsGgkkkkkkkGgsdo.',
  'ommoo..occccco..oomm',
  'ommo...owwwwwo...omm',
  '.oso...oWbWbWo...oso',
  '.oso...odsosdo...oso',
  'y.....ossoossso....y',
  '.....oossoossoo.....',
  '.....obbbo.obbbo....',
  '..y..............y..'
])

export const athleteFormArt: Record<AthleteForm, string[]> = {
  apprentice,
  forged,
  champion,
  apex
}

export const FORM_GRID_WIDTH = 20
export const FORM_GRID_HEIGHT = 22
export const FORM_PIXEL = 8
