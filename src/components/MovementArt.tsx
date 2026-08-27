import { movementSceneAssets, movementSceneFor, type MovementArtSubject, type MovementScene } from '../domain/movement-art'

/**
 * A small original generated-and-reviewed emblem for each movement family, so a card is recognizable
 * before it is read. The art is decoration: the movement name and pattern label always stay on screen,
 * so nothing here is the only carrier of meaning or a variation-specific technique demonstration.
 */
const sceneLabels: Record<MovementScene, string> = {
  bench: 'Lying press', incline: 'Incline press', fly: 'Cable fly', deadlift: 'Barbell pull from the floor',
  squat: 'Barbell squat', goodMorning: 'Hip hinge with a bar on the back', machineSquat: 'Machine squat',
  legCurl: 'Seated leg curl', legExtension: 'Leg extension', hipThrust: 'Hip thrust', row: 'Row',
  pulldown: 'Pulldown', overhead: 'Overhead press', lateralRaise: 'Lateral raise', triceps: 'Triceps extension',
  curl: 'Curl', calf: 'Calf raise', trunk: 'Trunk work', carry: 'Loaded carry', dumbbell: 'Dumbbell movement',
  pushUp: 'Push-up', dip: 'Parallel-bar dip', rearDeltFly: 'Rear-delt fly', backExtension: 'Back extension',
  kettlebellSwing: 'Kettlebell swing', splitSquat: 'Rear-foot-elevated split squat', lunge: 'Lunge',
  stepUp: 'Step-up', legPress: 'Leg press', hackSquat: 'Hack squat', hipAbduction: 'Hip abduction',
  hipAdduction: 'Hip adduction', nordicCurl: 'Nordic hamstring curl', pullUp: 'Pull-up', pullover: 'Pullover',
  uprightRow: 'Upright row', facePull: 'Face pull', shrug: 'Shrug', sledPush: 'Sled push',
  seatedCalf: 'Seated calf raise', tibialisRaise: 'Tibialis raise'
}

export function MovementArt({ exercise, large }: { exercise: MovementArtSubject; large?: boolean }) {
  const scene = movementSceneFor(exercise)
  return (
    <span className={`movement-art ${large ? 'movement-art--large ' : ''}movement-art--${scene}`} role="img" aria-label={`${sceneLabels[scene]} movement-family illustration`}>
      <img src={`${import.meta.env.BASE_URL}icons/movements/${movementSceneAssets[scene]}.png`} alt="" aria-hidden="true" />
    </span>
  )
}
