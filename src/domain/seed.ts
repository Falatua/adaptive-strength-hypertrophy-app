import { subDays } from 'date-fns'
import { nanoid } from 'nanoid'
import { makeSets } from './training-engine'
import { derivePersonalRecords } from './history-engine'
import { buildPlacementAssessment } from './placement-engine'
import { expandedCommercialEquipment, expandedExercises } from './exercise-catalog-expansion'
import { extraCommercialEquipment, extraExercises, extraPortableEquipment } from './exercise-catalog-extras'
import type { AthleteProfile, CompletedSetRecord, EquipmentProfile, Exercise, MesocyclePlan, TrainingSession } from './types'

export const exercises: Exercise[] = [
  {
    id: 'competition-bench', name: 'Competition Bench Press', family: 'Bench Press', aliases: ['Bench', 'Flat Barbell Bench'], pattern: 'horizontal-push',
    regions: ['chest', 'triceps', 'shoulders'], primaryRegion: 'chest', equipment: ['barbell', 'bench', 'rack'],
    description: 'Paused competition-style barbell bench press with a repeatable range and setup.', roleTags: ['strength anchor', 'chest', 'competition'], favorite: true, jointFeeling: 'good'
  },
  {
    id: 'two-board-press', name: 'Two-Board Press', family: 'Bench Press', aliases: ['2 Board Press'], pattern: 'horizontal-push',
    regions: ['triceps', 'chest', 'shoulders'], primaryRegion: 'triceps', equipment: ['barbell', 'bench', 'rack', 'boards'],
    description: 'Reduced-range bench variation that emphasizes midrange and triceps strength.', roleTags: ['secondary builder', 'bench lockout', 'triceps'], favorite: true, jointFeeling: 'great'
  },
  {
    id: 'three-board-press', name: 'Three-Board Press', family: 'Bench Press', aliases: ['3 Board Press'], pattern: 'horizontal-push',
    regions: ['triceps', 'chest'], primaryRegion: 'triceps', equipment: ['barbell', 'bench', 'rack', 'boards'],
    description: 'High board press for overload and lockout-specific triceps work.', roleTags: ['secondary builder', 'lockout', 'overload'], favorite: false, jointFeeling: 'good'
  },
  {
    id: 'coffin-press', name: 'Coffin Press', family: 'Bench Press', aliases: [], pattern: 'horizontal-push',
    regions: ['chest', 'triceps'], primaryRegion: 'chest', equipment: ['dumbbells', 'bench'],
    description: 'Neutral-to-close dumbbell press variation for chest and triceps with a joint-friendly path.', roleTags: ['hypertrophy', 'chest', 'triceps'], favorite: false, jointFeeling: 'good'
  },
  {
    id: 'incline-db-press', name: 'Incline Dumbbell Press', family: 'Incline Press', aliases: ['Incline DB Bench'], pattern: 'horizontal-push',
    regions: ['chest', 'shoulders', 'triceps'], primaryRegion: 'chest', equipment: ['dumbbells', 'adjustable bench'],
    description: 'Upper-chest focused dumbbell press with individually adjustable arm paths.', roleTags: ['hypertrophy', 'upper chest'], favorite: true, jointFeeling: 'great'
  },
  {
    id: 'cable-fly', name: 'Low-to-High Cable Fly', family: 'Chest Fly', aliases: ['Cable Fly'], pattern: 'isolation',
    regions: ['chest'], primaryRegion: 'chest', equipment: ['cable station'], description: 'Cable adduction with an upper-chest bias and continuous tension.',
    roleTags: ['accessory', 'chest', 'short setup'], favorite: true, jointFeeling: 'great'
  },
  {
    id: 'sumo-deadlift', name: 'Sumo Deadlift', family: 'Deadlift', aliases: ['Sumo Deads'], pattern: 'hinge',
    regions: ['glutes', 'hamstrings', 'quadriceps', 'back', 'trunk'], primaryRegion: 'glutes', equipment: ['barbell', 'plates'],
    description: 'Wide-stance competition hinge and your current main deadlift.', roleTags: ['strength anchor', 'competition', 'hinge'], favorite: true, jointFeeling: 'good'
  },
  {
    id: 'deficit-conventional', name: 'Conventional Deficit Deadlift', family: 'Deadlift', aliases: ['Deficit Conventional'], pattern: 'hinge',
    regions: ['hamstrings', 'glutes', 'back', 'trunk'], primaryRegion: 'hamstrings', equipment: ['barbell', 'plates', 'deficit platform'],
    description: 'Longer-range pull from a deficit intended to build low-back and off-floor strength for the conventional deadlift.', roleTags: ['secondary builder', 'low back', 'off floor'], favorite: true, jointFeeling: 'good'
  },
  {
    id: 'paused-sumo', name: 'Paused Sumo Deadlift', family: 'Deadlift', aliases: [], pattern: 'hinge',
    regions: ['glutes', 'hamstrings', 'quadriceps', 'back'], primaryRegion: 'glutes', equipment: ['barbell', 'plates'],
    description: 'Sumo pull paused below the knee to reinforce position and patience.', roleTags: ['secondary builder', 'technique', 'sumo'], favorite: false, jointFeeling: 'good'
  },
  {
    id: 'competition-squat', name: 'Competition Back Squat', family: 'Squat', aliases: ['Back Squat', 'Comp Squat'], pattern: 'squat',
    regions: ['quadriceps', 'glutes', 'hamstrings', 'trunk'], primaryRegion: 'quadriceps', equipment: ['barbell', 'rack', 'plates'],
    description: 'Competition-style back squat with consistent stance, depth, and bar position.', roleTags: ['strength anchor', 'competition', 'squat'], favorite: true, jointFeeling: 'good'
  },
  {
    id: 'ssb-squat', name: 'Safety Squat Bar Squat', family: 'Squat', aliases: ['SSB Squat'], pattern: 'squat',
    regions: ['quadriceps', 'glutes', 'back', 'trunk'], primaryRegion: 'quadriceps', equipment: ['safety squat bar', 'rack', 'plates'],
    description: 'Anteriorly demanding specialty-bar squat that can build upper-back and quad strength.', roleTags: ['secondary builder', 'upper back', 'quads'], favorite: true, jointFeeling: 'great'
  },
  {
    id: 'good-morning', name: 'Cambered Bar Good Morning', family: 'Good Morning', aliases: ['Cambered Good Morning'], pattern: 'hinge',
    regions: ['hamstrings', 'glutes', 'back', 'trunk'], primaryRegion: 'hamstrings', equipment: ['cambered bar', 'rack'],
    description: 'Controlled hinge for posterior-chain and trunk strength.', roleTags: ['secondary builder', 'posterior chain'], favorite: false, jointFeeling: 'neutral'
  },
  {
    id: 'hack-squat', name: 'Hack Squat', family: 'Machine Squat', aliases: [], pattern: 'squat',
    regions: ['quadriceps', 'glutes'], primaryRegion: 'quadriceps', equipment: ['hack squat machine'],
    description: 'Stable machine squat for high-output quadriceps work with low coordination demand.', roleTags: ['hypertrophy', 'quadriceps'], favorite: true, jointFeeling: 'good'
  },
  {
    id: 'leg-curl', name: 'Seated Leg Curl', family: 'Leg Curl', aliases: [], pattern: 'isolation',
    regions: ['hamstrings'], primaryRegion: 'hamstrings', equipment: ['seated leg curl'], description: 'Lengthened-position hamstring isolation.',
    roleTags: ['accessory', 'hamstrings'], favorite: true, jointFeeling: 'great'
  },
  {
    id: 'cambered-row', name: 'Cambered Bar Row', family: 'Row', aliases: [], pattern: 'horizontal-pull',
    regions: ['back', 'biceps', 'forearms'], primaryRegion: 'back', equipment: ['cambered bar', 'plates'],
    description: 'Barbell row using a cambered bar for additional range and torso clearance.', roleTags: ['back', 'secondary builder'], favorite: true, jointFeeling: 'good'
  },
  {
    id: 'chest-supported-row', name: 'Chest-Supported Row', family: 'Row', aliases: ['Chest Supported Machine Row'], pattern: 'horizontal-pull',
    regions: ['back', 'biceps'], primaryRegion: 'back', equipment: ['row machine'], description: 'Stable row that limits low-back fatigue.',
    roleTags: ['hypertrophy', 'back', 'low fatigue'], favorite: true, jointFeeling: 'great'
  },
  {
    id: 'lat-pulldown', name: 'Neutral-Grip Lat Pulldown', family: 'Vertical Pull', aliases: ['Neutral Pulldown'], pattern: 'vertical-pull',
    regions: ['back', 'biceps'], primaryRegion: 'back', equipment: ['cable station', 'neutral handle'], description: 'Shoulder-friendly vertical pull for lats and upper back.',
    roleTags: ['hypertrophy', 'lats'], favorite: true, jointFeeling: 'great'
  },
  {
    id: 'overhead-press', name: 'Standing Overhead Press', family: 'Overhead Press', aliases: ['OHP'], pattern: 'vertical-push',
    regions: ['shoulders', 'triceps', 'trunk'], primaryRegion: 'shoulders', equipment: ['barbell', 'rack'], description: 'Standing barbell press for shoulder and triceps strength.',
    roleTags: ['strength', 'shoulders'], favorite: false, jointFeeling: 'neutral'
  },
  {
    id: 'lateral-raise', name: 'Cable Lateral Raise', family: 'Lateral Raise', aliases: [], pattern: 'isolation',
    regions: ['shoulders'], primaryRegion: 'shoulders', equipment: ['cable station'], description: 'Single-arm cable raise for side-deltoid hypertrophy.',
    roleTags: ['accessory', 'shoulders'], favorite: true, jointFeeling: 'great'
  },
  {
    id: 'triceps-extension', name: 'Overhead Cable Triceps Extension', family: 'Triceps Extension', aliases: ['Cable French Press'], pattern: 'isolation',
    regions: ['triceps'], primaryRegion: 'triceps', equipment: ['cable station', 'rope'], description: 'Lengthened-position triceps isolation.',
    roleTags: ['accessory', 'triceps'], favorite: true, jointFeeling: 'good'
  },
  {
    id: 'hammer-curl', name: 'Cross-Body Hammer Curl', family: 'Curl', aliases: [], pattern: 'isolation',
    regions: ['biceps', 'forearms'], primaryRegion: 'biceps', equipment: ['dumbbells'], description: 'Elbow-flexor and forearm accessory with a neutral grip.',
    roleTags: ['accessory', 'arms'], favorite: true, jointFeeling: 'great'
  },
  {
    id: 'ab-wheel', name: 'Ab Wheel Rollout', family: 'Trunk', aliases: ['Ab Roller'], pattern: 'carry',
    regions: ['trunk'], primaryRegion: 'trunk', equipment: ['ab wheel'], description: 'Anti-extension trunk work.', roleTags: ['accessory', 'trunk'], favorite: false, jointFeeling: 'good'
  },
  ...expandedExercises,
  ...extraExercises
]

export const equipmentProfiles: EquipmentProfile[] = [
  {
    id: 'equipment-commercial-gym', name: 'Commercial Gym', kind: 'commercial-gym', source: 'seed', incrementUnit: 'lb',
    equipment: ['ab wheel', 'adjustable bench', 'barbell', 'bench', 'boards', 'cable station', 'cambered bar', 'deficit platform', 'dumbbells', 'hack squat machine', 'neutral handle', 'plates', 'rack', 'rope', 'row machine', 'safety squat bar', 'seated leg curl', ...expandedCommercialEquipment, ...extraCommercialEquipment],
    increments: { barbell: 5, dumbbell: 5, cable: 5, machine: 10, other: 5 }, constraints: [], updatedAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'equipment-home-gym', name: 'Home Gym', kind: 'home-gym', source: 'seed', incrementUnit: 'lb',
    equipment: ['ab wheel', 'adjustable bench', 'barbell', 'bench', 'bodyweight', 'cambered bar', 'dip station', 'dumbbells', 'freak athlete abx bench', 'freak athlete hyper pro', 'freak athlete leg developer', 'leg extension machine', 'lying leg curl machine', 'plates', 'pull-up bar', 'rack', 'resistance bands', 'safety squat bar', 'squat press machine', ...extraPortableEquipment],
    increments: { barbell: 5, dumbbell: 5, cable: 5, machine: 10, other: 5 }, constraints: ['Freak Athlete Hyper Pro with ABX bench and Leg Developer', 'Squat Press, safety squat bar, cambered bar, dip station, and red resistance bands available', 'Avoid automatic low-bar squat programming; minimize free-weight squat volume', 'Cambered-bar bench press is flat-bench only', 'No cable or selectorized machine work'], updatedAt: '2026-08-26T18:00:00.000Z'
  },
  {
    id: 'equipment-travel', name: 'Travel Setup', kind: 'travel', source: 'seed', incrementUnit: 'lb',
    equipment: ['adjustable bench', 'bodyweight', 'dumbbells', ...extraPortableEquipment],
    increments: { barbell: 5, dumbbell: 5, cable: 5, machine: 10, other: 5 }, constraints: ['Dumbbell load may vary by location'], updatedAt: '2026-08-11T12:00:00.000Z'
  }
]

const today = new Date()
const iso = (date: Date) => date.toISOString()

export const mesocycles: MesocyclePlan[] = [{
  id: 'mesocycle-powerbuilding-1',
  version: 1,
  title: 'Powerbuilding Foundation',
  objective: 'Restore training rhythm while progressing squat, bench, and deadlift strength and growing chest, back, and triceps.',
  dominantAdaptation: 'powerbuilding',
  status: 'active',
  createdAt: iso(subDays(today, 3)),
  effectiveAt: iso(subDays(today, 3)),
  supersedesId: null,
  revisionReason: 'Initial plan created from the athlete profile and recent training continuity.',
  entryCriteria: 'Experienced athlete with usable strength history and interrupted recent continuity.',
  progressionModel: 'Progress load first, then repetitions, then a working set only when recovery and continuity support more dose.',
  targetMicrocycles: 4,
  minimumProductiveExposures: 9,
  successCriteria: 'Complete at least three productive exposure rounds with stable technique, manageable pain, and recoverable fatigue.',
  exitPlan: 'Review main-lift performance and recovery. Continue, recover, pivot, or enter a more specific strength phase.',
  weeklyOpportunities: 3,
  defaultMinutes: 60,
  strengthAnchors: ['competition-squat', 'competition-bench', 'conventional-deadlift'],
  priorityRegions: ['chest', 'back', 'triceps'],
  maintenanceRegions: ['hamstrings', 'shoulders', 'biceps'],
  sessionIds: ['session-bench', 'session-squat', 'session-deadlift']
}]

export const athlete: AthleteProfile = {
  name: 'Athlete',
  trainingAge: 8,
  goal: 'Powerbuilding: improve squat, bench, and deadlift while growing chest, back, and arms',
  entryRoute: 'Building a Base',
  strengthAnchors: ['competition-squat', 'competition-bench', 'conventional-deadlift'],
  priorityRegions: ['chest', 'back', 'triceps'],
  weeklyOpportunities: 3,
  defaultMinutes: 60,
  equipmentProfile: 'Commercial Gym',
  continuity: 'interrupted',
  placement: buildPlacementAssessment({
    goal: 'powerbuilding', fixedEvent: null, trainingAge: 8, continuity: 'interrupted', movementSkill: 5,
    strengthTolerance: 4, volumeTolerance: 4, scheduleStability: 2, dataConfidence: 3, painState: 'none',
    weeklyOpportunities: 3, defaultMinutes: 60, equipmentProfileId: 'equipment-commercial-gym', skippedFields: [],
    movementProfiles: [
      { exerciseId: 'competition-squat', exerciseName: 'Competition Back Squat', family: 'Squat', movementSkill: 5, strengthTolerance: 4, dataConfidence: 3 },
      { exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', family: 'Bench Press', movementSkill: 5, strengthTolerance: 4, dataConfidence: 3 },
      { exerciseId: 'conventional-deadlift', exerciseName: 'Conventional Deadlift', family: 'Deadlift', movementSkill: 5, strengthTolerance: 4, dataConfidence: 3 }
    ]
  }, '2026-08-10T00:00:00.000Z'),
  level: {
    experience: 5,
    recentContinuity: 3,
    movementSkill: 5,
    strengthTolerance: 4,
    volumeTolerance: 4,
    scheduleStability: 2,
    dataConfidence: 3
  }
}

export const sessions: TrainingSession[] = [
  {
    id: 'session-bench',
    title: 'Bench Strength + Upper Body',
    objective: 'Progress the bench and build triceps, chest, and upper back.',
    dayLabel: 'Next best session',
    plannedDate: iso(today),
    status: 'planned',
    durationMinutes: 60,
    mesocycleId: 'mesocycle-powerbuilding-1',
    planVersion: 1,
    exercises: [
      { id: 'plan-bench', exerciseId: 'competition-bench', role: 'primary', purpose: 'Main lift', sets: makeSets(4, 6, 175, 2), restSeconds: 180, estimatedMinutes: 22, optional: false },
      { id: 'plan-board', exerciseId: 'two-board-press', role: 'secondary', purpose: 'Build bench lockout and triceps strength', sets: makeSets(3, 8, 165, 2), restSeconds: 150, estimatedMinutes: 15, optional: false },
      { id: 'plan-row', exerciseId: 'chest-supported-row', role: 'accessory', purpose: 'Upper-back dose with low systemic fatigue', sets: makeSets(3, 10, 130, 2), restSeconds: 90, estimatedMinutes: 10, optional: false },
      { id: 'plan-triceps', exerciseId: 'triceps-extension', role: 'accessory', purpose: 'Direct triceps hypertrophy', sets: makeSets(3, 12, 55, 2), restSeconds: 75, estimatedMinutes: 8, optional: false },
      { id: 'plan-lateral', exerciseId: 'lateral-raise', role: 'tertiary', purpose: 'Shoulder maintenance', sets: makeSets(2, 15, 20, 2), restSeconds: 60, estimatedMinutes: 5, optional: true }
    ]
  },
  {
    id: 'session-squat',
    title: 'Squat Strength + Quads',
    objective: 'Progress the squat and build quads without excess hinge fatigue.',
    dayLabel: 'Queued · 2',
    plannedDate: iso(subDays(today, -2)),
    status: 'planned',
    durationMinutes: 65,
    mesocycleId: 'mesocycle-powerbuilding-1',
    planVersion: 1,
    exercises: [
      { id: 'plan-squat', exerciseId: 'competition-squat', role: 'primary', purpose: 'Main lift', sets: makeSets(4, 5, 245, 2), restSeconds: 210, estimatedMinutes: 25, optional: false },
      { id: 'plan-ssb', exerciseId: 'ssb-squat', role: 'secondary', purpose: 'Build quads and upper-back position', sets: makeSets(3, 8, 185, 2), restSeconds: 150, estimatedMinutes: 16, optional: false },
      { id: 'plan-hack', exerciseId: 'hack-squat', role: 'accessory', purpose: 'Direct quadriceps dose', sets: makeSets(3, 10, 180, 2), restSeconds: 100, estimatedMinutes: 12, optional: false },
      { id: 'plan-curl', exerciseId: 'leg-curl', role: 'tertiary', purpose: 'Hamstring maintenance', sets: makeSets(3, 12, 90, 2), restSeconds: 75, estimatedMinutes: 8, optional: false },
      { id: 'plan-core', exerciseId: 'ab-wheel', role: 'tertiary', purpose: 'Trunk capacity', sets: makeSets(2, 10, 0, 3), restSeconds: 60, estimatedMinutes: 4, optional: true }
    ]
  },
  {
    id: 'session-deadlift',
    title: 'Deadlift Strength + Back',
    objective: 'Progress the deadlift and build off-floor, low-back, and lat strength.',
    dayLabel: 'Queued · 3',
    plannedDate: iso(subDays(today, -4)),
    status: 'planned',
    durationMinutes: 60,
    mesocycleId: 'mesocycle-powerbuilding-1',
    planVersion: 1,
    exercises: [
      { id: 'plan-deadlift', exerciseId: 'conventional-deadlift', role: 'primary', purpose: 'Main lift', sets: makeSets(4, 4, 315, 2), restSeconds: 210, estimatedMinutes: 24, optional: false },
      { id: 'plan-deficit', exerciseId: 'deficit-conventional', role: 'secondary', purpose: 'Build low-back and off-floor strength for the deadlift', sets: makeSets(3, 6, 235, 2), restSeconds: 180, estimatedMinutes: 16, optional: false },
      { id: 'plan-cambered-row', exerciseId: 'cambered-row', role: 'accessory', purpose: 'Upper-back and lat hypertrophy', sets: makeSets(3, 10, 115, 2), restSeconds: 90, estimatedMinutes: 10, optional: false },
      { id: 'plan-pulldown', exerciseId: 'lat-pulldown', role: 'accessory', purpose: 'Lat dose with stable technique', sets: makeSets(3, 10, 120, 2), restSeconds: 80, estimatedMinutes: 8, optional: false },
      { id: 'plan-hammer', exerciseId: 'hammer-curl', role: 'tertiary', purpose: 'Arm and grip maintenance', sets: makeSets(2, 12, 30, 2), restSeconds: 60, estimatedMinutes: 5, optional: true }
    ]
  }
]

const historyTemplate = [
  { exerciseId: 'competition-bench', name: 'Competition Bench Press', family: 'Bench Press', region: 'chest' as const, load: 165, reps: 6 },
  { exerciseId: 'two-board-press', name: 'Two-Board Press', family: 'Bench Press', region: 'triceps' as const, load: 155, reps: 8 },
  { exerciseId: 'chest-supported-row', name: 'Chest-Supported Row', family: 'Row', region: 'back' as const, load: 120, reps: 10 },
  { exerciseId: 'competition-squat', name: 'Competition Back Squat', family: 'Squat', region: 'quadriceps' as const, load: 235, reps: 5 },
  { exerciseId: 'ssb-squat', name: 'Safety Squat Bar Squat', family: 'Squat', region: 'quadriceps' as const, load: 175, reps: 8 },
  { exerciseId: 'conventional-deadlift', name: 'Conventional Deadlift', family: 'Deadlift', region: 'hamstrings' as const, load: 305, reps: 4 },
  { exerciseId: 'deficit-conventional', name: 'Conventional Deficit Deadlift', family: 'Deadlift', region: 'hamstrings' as const, load: 225, reps: 6 },
  { exerciseId: 'lat-pulldown', name: 'Neutral-Grip Lat Pulldown', family: 'Vertical Pull', region: 'back' as const, load: 110, reps: 10 },
  { exerciseId: 'triceps-extension', name: 'Overhead Cable Triceps Extension', family: 'Triceps Extension', region: 'triceps' as const, load: 50, reps: 12 },
  { exerciseId: 'hammer-curl', name: 'Cross-Body Hammer Curl', family: 'Curl', region: 'biceps' as const, load: 25, reps: 12 }
]

export const history: CompletedSetRecord[] = Array.from({ length: 7 }, (_, week) =>
  historyTemplate.flatMap((item, itemIndex) =>
    Array.from({ length: itemIndex % 3 === 0 ? 4 : 3 }, (_, setIndex) => ({
      id: nanoid(),
      sessionId: `history-${week}-${itemIndex % 3}`,
      exerciseId: item.exerciseId,
      exerciseName: item.name,
      family: item.family,
      primaryRegion: item.region,
      completedAt: iso(subDays(today, week * 7 + (itemIndex % 3))),
      reps: item.reps + (week < 2 && setIndex === 0 ? 1 : 0),
      load: item.load + Math.max(0, 3 - week) * 5,
      rir: 2,
      technique: 4,
      pain: 0,
      qualityConfirmed: true,
      setIndex
    }))
  )
).flat()

export const records = derivePersonalRecords(history)
