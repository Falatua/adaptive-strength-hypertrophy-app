import type { Exercise, MovementPattern } from './types'

/**
 * Which drawing fits a movement. Name and family keywords decide first because they describe the
 * actual movement; the pattern is the fallback, so an athlete-created movement still gets a fitting
 * picture instead of a blank tile.
 */
export type MovementArtSubject = Pick<Exercise, 'name' | 'family' | 'pattern' | 'primaryRegion'>

export type MovementScene =
  | 'bench' | 'incline' | 'fly' | 'deadlift' | 'squat' | 'goodMorning' | 'machineSquat'
  | 'legCurl' | 'legExtension' | 'hipThrust' | 'row' | 'pulldown' | 'overhead'
  | 'lateralRaise' | 'triceps' | 'curl' | 'calf' | 'trunk' | 'carry' | 'dumbbell'

// Name and family keywords come first because they describe the actual movement.
// The pattern is the fallback, so a custom movement still gets a fitting picture.
const keywordScenes: [RegExp, MovementScene][] = [
  // Order matters: the most specific movement wins, so "Incline Dumbbell Curl" reads as a curl
  // and "Leg Press Calf Raise" reads as a calf raise rather than the machine it uses.
  [/calf|soleus/i, 'calf'],
  [/leg curl|hamstring curl|glute-?ham/i, 'legCurl'],
  [/leg extension|knee extension|reverse nordic/i, 'legExtension'],
  [/nordic/i, 'legCurl'],
  [/curl/i, 'curl'],
  [/incline/i, 'incline'],
  [/\bfly\b|flye|pec deck/i, 'fly'],
  [/hip thrust|glute bridge/i, 'hipThrust'],
  [/back extension|hyperextension|good\s*morning/i, 'goodMorning'],
  [/deadlift|rack pull|block pull|pull-?through/i, 'deadlift'],
  [/hack squat|machine squat|leg press|pendulum|belt squat|v-squat|smith machine squat/i, 'machineSquat'],
  [/pallof|anti-rotation|ab wheel|plank|crunch|rollout|trunk|core|leg raise/i, 'trunk'],
  [/lateral raise|lat raise|side raise|rear delt|face pull/i, 'lateralRaise'],
  [/triceps|pushdown|skull ?crusher/i, 'triceps'],
  [/pulldown|pull-?up|chin-?up|pullover/i, 'pulldown'],
  [/\brow\b/i, 'row'],
  [/overhead press|shoulder press|push press|military|\bdip\b/i, 'overhead'],
  [/bench|floor press|coffin|push-?up|chest press/i, 'bench'],
  [/squat|lunge|step-?up/i, 'squat'],
  [/carry|farmer|suitcase|yoke|shrug/i, 'carry']
]

const patternScenes: Record<MovementPattern, MovementScene> = {
  squat: 'squat', hinge: 'deadlift', 'horizontal-push': 'bench', 'vertical-push': 'overhead',
  'horizontal-pull': 'row', 'vertical-pull': 'pulldown', isolation: 'dumbbell', carry: 'carry'
}

export function movementSceneFor(exercise: MovementArtSubject): MovementScene {
  const haystack = `${exercise.name} ${exercise.family}`
  for (const [pattern, scene] of keywordScenes) if (pattern.test(haystack)) return scene
  if (exercise.pattern === 'isolation') {
    if (exercise.primaryRegion === 'trunk') return 'trunk'
    if (exercise.primaryRegion === 'shoulders') return 'lateralRaise'
    if (exercise.primaryRegion === 'triceps') return 'triceps'
    if (exercise.primaryRegion === 'biceps') return 'curl'
    if (exercise.primaryRegion === 'hamstrings') return 'legCurl'
    if (exercise.primaryRegion === 'quadriceps') return 'legExtension'
    if (exercise.primaryRegion === 'chest') return 'fly'
  }
  return patternScenes[exercise.pattern]
}
