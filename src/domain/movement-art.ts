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
  | 'pushUp' | 'dip' | 'rearDeltFly' | 'backExtension' | 'kettlebellSwing'
  | 'splitSquat' | 'lunge' | 'stepUp' | 'legPress' | 'hackSquat' | 'hipAbduction'
  | 'hipAdduction' | 'nordicCurl' | 'pullUp' | 'pullover' | 'uprightRow'
  | 'facePull' | 'shrug' | 'sledPush' | 'seatedCalf' | 'tibialisRaise'

export const movementSceneAssets: Record<MovementScene, string> = {
  bench: 'bench', incline: 'incline', fly: 'fly', deadlift: 'deadlift', squat: 'squat',
  goodMorning: 'good-morning', machineSquat: 'machine-squat', legCurl: 'leg-curl',
  legExtension: 'leg-extension', hipThrust: 'hip-thrust', row: 'row', pulldown: 'pulldown',
  overhead: 'overhead', lateralRaise: 'lateral-raise', triceps: 'triceps', curl: 'curl',
  calf: 'calf', trunk: 'trunk', carry: 'carry', dumbbell: 'dumbbell', pushUp: 'push-up',
  dip: 'dip', rearDeltFly: 'rear-delt-fly', backExtension: 'back-extension', kettlebellSwing: 'kettlebell-swing',
  splitSquat: 'split-squat', lunge: 'lunge', stepUp: 'step-up', legPress: 'machine-squat',
  hackSquat: 'hack-squat', hipAbduction: 'hip-abduction', hipAdduction: 'hip-adduction',
  nordicCurl: 'nordic-curl', pullUp: 'pull-up', pullover: 'pullover', uprightRow: 'upright-row',
  facePull: 'face-pull', shrug: 'shrug', sledPush: 'sled-push', seatedCalf: 'seated-calf',
  tibialisRaise: 'tibialis-raise'
}

// Name and family keywords come first because they describe the actual movement.
// The pattern is the fallback, so a custom movement still gets a fitting picture.
const keywordScenes: [RegExp, MovementScene][] = [
  // Order matters: the most specific movement wins, so "Incline Dumbbell Curl" reads as a curl
  // and "Leg Press Calf Raise" reads as a calf raise rather than the machine it uses.
  [/seated calf/i, 'seatedCalf'],
  [/tibialis|toe raise/i, 'tibialisRaise'],
  [/calf|soleus/i, 'calf'],
  [/nordic hamstring|nordic curl|glute-?ham|razor curl/i, 'nordicCurl'],
  [/leg curl|hamstring curl/i, 'legCurl'],
  [/leg extension|knee extension|reverse nordic/i, 'legExtension'],
  [/hip adduction/i, 'hipAdduction'],
  [/hip abduction/i, 'hipAbduction'],
  [/jefferson/i, 'goodMorning'],
  [/bench dip/i, 'triceps'],
  [/parallel-bar dip|assisted dip|weighted dip|ring dip/i, 'dip'],
  [/push-?up|suspension trainer chest press/i, 'pushUp'],
  [/dead bug|hollow body|woodchop|landmine rotation|l-?sit|knee raise/i, 'trunk'],
  [/curl|wrist curl|wrist extension|wrist roller|forearm/i, 'curl'],
  [/incline/i, 'incline'],
  [/reverse pec deck|rear-?delt fly|powell raise/i, 'rearDeltFly'],
  [/\bfly\b|flye|pec deck|press-around/i, 'fly'],
  [/hip thrust|glute bridge|kickback|frog pump|glute drive/i, 'hipThrust'],
  [/back extension|hyperextension|reverse hyper/i, 'backExtension'],
  [/kettlebell swing/i, 'kettlebellSwing'],
  [/deadlift|rack pull|block pull|pull-?through/i, 'deadlift'],
  [/rear-foot-elevated|front-foot-elevated|split squat/i, 'splitSquat'],
  [/step-?up|step-?down/i, 'stepUp'],
  [/walking lunge|reverse lunge|front-rack lunge|cossack|curtsy/i, 'lunge'],
  [/45-degree leg press|horizontal leg press|single-leg press/i, 'legPress'],
  [/hack squat|machine squat|pendulum|belt squat|v-squat/i, 'hackSquat'],
  [/smith machine squat/i, 'machineSquat'],
  [/pallof|anti-rotation|ab wheel|plank|crunch|rollout|trunk|core|leg raise/i, 'trunk'],
  [/face pull/i, 'facePull'],
  [/upright row/i, 'uprightRow'],
  [/rear-?delt row/i, 'row'],
  [/lateral raise|lat raise|side raise|trap raise|y-?raise|front raise|cuban/i, 'lateralRaise'],
  [/jm press|triceps|pushdown|skull ?crusher/i, 'triceps'],
  [/pull-?up|chin-?up|rack chin/i, 'pullUp'],
  [/pullover/i, 'pullover'],
  [/pulldown/i, 'pulldown'],
  [/\brow\b/i, 'row'],
  [/overhead press|shoulder press|push press|military|\bdip\b/i, 'overhead'],
  [/bench|floor press|coffin|push-?up|chest press/i, 'bench'],
  [/sled push|sled drag/i, 'sledPush'],
  [/shrug/i, 'shrug'],
  [/hatfield squat/i, 'squat'],
  [/squat|lunge|step-?up/i, 'squat'],
  [/carry|farmer|suitcase|yoke|plate pinch/i, 'carry']
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
