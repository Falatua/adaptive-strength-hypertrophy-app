import type { ReactElement } from 'react'
import { movementSceneFor, type MovementArtSubject, type MovementScene } from '../domain/movement-art'

/**
 * A small original drawing for each movement, so a card is recognizable before it is read.
 * Every scene is hand-drawn geometry made for this app. The art is decoration: the movement name and
 * pattern label always stay on screen, so nothing here is the only carrier of meaning.
 */
const sceneLabels: Record<MovementScene, string> = {
  bench: 'Lying press', incline: 'Incline press', fly: 'Cable fly', deadlift: 'Barbell pull from the floor',
  squat: 'Barbell squat', goodMorning: 'Hip hinge with a bar on the back', machineSquat: 'Machine squat',
  legCurl: 'Seated leg curl', legExtension: 'Leg extension', hipThrust: 'Hip thrust', row: 'Row',
  pulldown: 'Pulldown', overhead: 'Overhead press', lateralRaise: 'Lateral raise', triceps: 'Triceps extension',
  curl: 'Curl', calf: 'Calf raise', trunk: 'Trunk work', carry: 'Loaded carry', dumbbell: 'Dumbbell movement'
}

// Shared parts keep every scene the same character: same head, same stroke weight, same floor.
const Head = ({ x, y, r = 3.4 }: { x: number; y: number; r?: number }) => <circle cx={x} cy={y} r={r} className="movement-art__body" />
const Floor = () => <line x1="4" y1="35" x2="44" y2="35" className="movement-art__floor" />
const Plate = ({ x, y, h = 11 }: { x: number; y: number; h?: number }) => <rect x={x - 1.6} y={y - h / 2} width="3.2" height={h} rx="1.4" className="movement-art__load" />

const scenes: Record<MovementScene, ReactElement> = {
  bench: <>
    <Floor />
    <rect x="12" y="24" width="26" height="3.4" rx="1.7" className="movement-art__gear" />
    <line x1="18" y1="27" x2="17" y2="35" className="movement-art__gear" />
    <line x1="34" y1="27" x2="35" y2="35" className="movement-art__gear" />
    <Head x={15} y={20} />
    <path d="M19 22h13l4 5" className="movement-art__body" />
    <line x1="24" y1="21" x2="24" y2="14" className="movement-art__body" />
    <line x1="10" y1="14" x2="38" y2="14" className="movement-art__load" />
    <Plate x={14} y={14} /><Plate x={34} y={14} />
  </>,
  incline: <>
    <Floor />
    <path d="M13 34l20-14" className="movement-art__gear" />
    <line x1="13" y1="34" x2="33" y2="34" className="movement-art__gear" />
    <Head x={31} y={17} />
    <path d="M28 20L18 30" className="movement-art__body" />
    <path d="M27 19l5-6M23 24l5-6" className="movement-art__body" />
    <Plate x={33} y={12} h={8} /><Plate x={29} y={17} h={8} />
  </>,
  fly: <>
    <Floor />
    <Head x={24} y={11} />
    <line x1="24" y1="15" x2="24" y2="26" className="movement-art__body" />
    <path d="M24 18C18 18 13 21 11 26" className="movement-art__body" />
    <path d="M24 18c6 0 11 3 13 8" className="movement-art__body" />
    <line x1="20" y1="26" x2="17" y2="35" className="movement-art__body" />
    <line x1="28" y1="26" x2="31" y2="35" className="movement-art__body" />
    <Plate x={10} y={27} h={7} /><Plate x={38} y={27} h={7} />
  </>,
  deadlift: <>
    <Floor />
    <Head x={19} y={13} />
    <path d="M22 15l7 6" className="movement-art__body" />
    <path d="M29 21v6l-4 8" className="movement-art__body" />
    <line x1="29" y1="27" x2="34" y2="35" className="movement-art__body" />
    <line x1="24" y1="17" x2="24" y2="26" className="movement-art__body" />
    <line x1="12" y1="26" x2="36" y2="26" className="movement-art__load" />
    <circle cx="15" cy="26" r="6" className="movement-art__load" />
    <circle cx="33" cy="26" r="6" className="movement-art__load" />
  </>,
  squat: <>
    <Floor />
    <Head x={24} y={12} />
    <line x1="24" y1="15" x2="24" y2="24" className="movement-art__body" />
    <path d="M24 24l-5 5v6M24 24l5 5v6" className="movement-art__body" />
    <line x1="12" y1="17" x2="36" y2="17" className="movement-art__load" />
    <circle cx="14" cy="17" r="5" className="movement-art__load" />
    <circle cx="34" cy="17" r="5" className="movement-art__load" />
  </>,
  goodMorning: <>
    <Floor />
    <Head x={14} y={17} />
    <path d="M17 18h11" className="movement-art__body" />
    <path d="M28 18v8l-3 9M28 26l4 9" className="movement-art__body" />
    <line x1="10" y1="14" x2="30" y2="14" className="movement-art__load" />
    <Plate x={11} y={14} /><Plate x={29} y={14} />
  </>,
  machineSquat: <>
    <Floor />
    <path d="M10 34l16-18" className="movement-art__gear" />
    <rect x="24" y="10" width="14" height="4" rx="1.6" className="movement-art__load" />
    <line x1="31" y1="14" x2="31" y2="21" className="movement-art__gear" />
    <Head x={22} y={24} />
    <path d="M25 26l6 3" className="movement-art__body" />
    <path d="M31 29l-3 6" className="movement-art__body" />
  </>,
  legCurl: <>
    <Floor />
    <rect x="10" y="22" width="16" height="3.4" rx="1.7" className="movement-art__gear" />
    <line x1="13" y1="25" x2="13" y2="35" className="movement-art__gear" />
    <Head x={13} y={17} />
    <path d="M16 21h10" className="movement-art__body" />
    <path d="M26 23c6 1 9 5 8 10" className="movement-art__body" />
    <circle cx="33" cy="31" r="3.4" className="movement-art__load" />
  </>,
  legExtension: <>
    <Floor />
    <rect x="10" y="22" width="14" height="3.4" rx="1.7" className="movement-art__gear" />
    <line x1="13" y1="25" x2="13" y2="35" className="movement-art__gear" />
    <Head x={13} y={15} />
    <line x1="13" y1="18" x2="13" y2="22" className="movement-art__body" />
    <path d="M20 24h11" className="movement-art__body" />
    <circle cx="33" cy="24" r="3.4" className="movement-art__load" />
  </>,
  hipThrust: <>
    <Floor />
    <rect x="8" y="20" width="10" height="3.4" rx="1.7" className="movement-art__gear" />
    <Head x={12} y={16} />
    <path d="M15 20l10 4 8 8" className="movement-art__body" />
    <line x1="18" y1="20" x2="30" y2="20" className="movement-art__load" />
    <Plate x={19} y={20} h={9} /><Plate x={29} y={20} h={9} />
  </>,
  row: <>
    <Floor />
    <Head x={15} y={15} />
    <path d="M18 16h10" className="movement-art__body" />
    <path d="M28 16v10l-3 9M28 26l4 9" className="movement-art__body" />
    <line x1="22" y1="18" x2="22" y2="25" className="movement-art__body" />
    <line x1="12" y1="25" x2="32" y2="25" className="movement-art__load" />
    <Plate x={13} y={25} /><Plate x={31} y={25} />
  </>,
  pulldown: <>
    <line x1="12" y1="8" x2="36" y2="8" className="movement-art__load" />
    <line x1="24" y1="8" x2="24" y2="14" className="movement-art__gear" />
    <Head x={24} y={19} />
    <path d="M24 15l-6-3M24 15l6-3" className="movement-art__body" />
    <line x1="24" y1="22" x2="24" y2="29" className="movement-art__body" />
    <rect x="16" y="29" width="16" height="3.4" rx="1.7" className="movement-art__gear" />
    <Floor />
  </>,
  overhead: <>
    <Floor />
    <Head x={24} y={19} />
    <path d="M24 15l-5-3M24 15l5-3" className="movement-art__body" />
    <line x1="24" y1="22" x2="24" y2="29" className="movement-art__body" />
    <path d="M24 29l-4 6M24 29l4 6" className="movement-art__body" />
    <line x1="13" y1="11" x2="35" y2="11" className="movement-art__load" />
    <Plate x={15} y={11} /><Plate x={33} y={11} />
  </>,
  lateralRaise: <>
    <Floor />
    <Head x={24} y={12} />
    <line x1="24" y1="15" x2="24" y2="26" className="movement-art__body" />
    <path d="M24 18h-9M24 18h9" className="movement-art__body" />
    <path d="M24 26l-4 9M24 26l4 9" className="movement-art__body" />
    <Plate x={13} y={18} h={8} /><Plate x={35} y={18} h={8} />
  </>,
  triceps: <>
    <Floor />
    <Head x={24} y={17} />
    <line x1="24" y1="20" x2="24" y2="29" className="movement-art__body" />
    <path d="M24 21l-4-6 5-3M24 21l4-6-5-3" className="movement-art__body" />
    <path d="M24 29l-4 6M24 29l4 6" className="movement-art__body" />
    <line x1="18" y1="10" x2="30" y2="10" className="movement-art__load" />
  </>,
  curl: <>
    <Floor />
    <Head x={20} y={12} />
    <line x1="20" y1="15" x2="20" y2="27" className="movement-art__body" />
    <path d="M20 19l6 5-3 5" className="movement-art__body" />
    <path d="M20 27l-3 8M20 27l3 8" className="movement-art__body" />
    <Plate x={23} y={30} h={8} />
    <circle cx="23" cy="30" r="1.6" className="movement-art__load" />
  </>,
  calf: <>
    <Floor />
    <Head x={24} y={12} />
    <line x1="24" y1="15" x2="24" y2="27" className="movement-art__body" />
    <path d="M24 27v5l4 2" className="movement-art__body" />
    <path d="M19 17h-4M29 17h4" className="movement-art__body" />
    <Plate x={14} y={19} h={7} /><Plate x={34} y={19} h={7} />
  </>,
  trunk: <>
    <Floor />
    <Head x={16} y={22} />
    <path d="M19 24h11" className="movement-art__body" />
    <path d="M19 24l4 9M30 24l3 5" className="movement-art__body" />
    <circle cx="34" cy="30" r="5" className="movement-art__load" />
    <line x1="29" y1="30" x2="39" y2="30" className="movement-art__gear" />
  </>,
  carry: <>
    <Floor />
    <Head x={24} y={12} />
    <line x1="24" y1="15" x2="24" y2="25" className="movement-art__body" />
    <line x1="19" y1="17" x2="19" y2="25" className="movement-art__body" />
    <line x1="29" y1="17" x2="29" y2="25" className="movement-art__body" />
    <path d="M24 25l-5 10M24 25l5 10" className="movement-art__body" />
    <rect x="15" y="25" width="8" height="5" rx="1.8" className="movement-art__load" />
    <rect x="25" y="25" width="8" height="5" rx="1.8" className="movement-art__load" />
  </>,
  dumbbell: <>
    <Floor />
    <line x1="14" y1="22" x2="34" y2="22" className="movement-art__load" />
    <Plate x={15} y={22} h={13} /><Plate x={33} y={22} h={13} />
    <Head x={24} y={13} />
  </>
}

export function MovementArt({ exercise, large }: { exercise: MovementArtSubject; large?: boolean }) {
  const scene = movementSceneFor(exercise)
  return (
    <span className={`movement-art ${large ? 'movement-art--large ' : ''}movement-art--${scene}`}>
      <svg viewBox="0 0 48 40" role="img" aria-label={`${sceneLabels[scene]} movement-family illustration`} focusable="false">{scenes[scene]}</svg>
    </span>
  )
}
