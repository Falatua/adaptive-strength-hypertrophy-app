import { subDays } from 'date-fns'
import { nanoid } from 'nanoid'
import { makeSets } from './training-engine'
import type { AthleteProfile, CompletedSetRecord, Exercise, MesocyclePlan, PersonalRecord, TrainingSession } from './types'

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
    description: 'Wide-stance competition hinge and current deadlift strength anchor.', roleTags: ['strength anchor', 'competition', 'hinge'], favorite: true, jointFeeling: 'good'
  },
  {
    id: 'deficit-conventional', name: 'Conventional Deficit Deadlift', family: 'Deadlift', aliases: ['Deficit Conventional'], pattern: 'hinge',
    regions: ['hamstrings', 'glutes', 'back', 'trunk'], primaryRegion: 'hamstrings', equipment: ['barbell', 'plates', 'deficit platform'],
    description: 'Longer-range conventional pull intended to build low-back and off-floor strength for the sumo pull.', roleTags: ['secondary builder', 'low back', 'off floor'], favorite: true, jointFeeling: 'good'
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
  }
]

const today = new Date()
const iso = (date: Date) => date.toISOString()

export const mesocycles: MesocyclePlan[] = [{
  id: 'mesocycle-powerbuilding-1',
  version: 1,
  title: 'Powerbuilding Foundation',
  objective: 'Restore training rhythm while progressing squat, bench, and sumo strength and growing chest, back, and triceps.',
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
  exitPlan: 'Review anchor performance and recovery. Continue, recover, pivot, or enter a more specific strength phase.',
  weeklyOpportunities: 3,
  defaultMinutes: 60,
  strengthAnchors: ['competition-squat', 'competition-bench', 'sumo-deadlift'],
  priorityRegions: ['chest', 'back', 'triceps'],
  maintenanceRegions: ['hamstrings', 'shoulders', 'biceps'],
  sessionIds: ['session-bench', 'session-squat', 'session-deadlift']
}]

export const athlete: AthleteProfile = {
  name: 'JB',
  trainingAge: 8,
  goal: 'Powerbuilding: improve squat, bench, and sumo while growing chest, back, and arms',
  entryRoute: 'Direct Strength + Hypertrophy Development',
  strengthAnchors: ['competition-squat', 'competition-bench', 'sumo-deadlift'],
  priorityRegions: ['chest', 'back', 'triceps'],
  weeklyOpportunities: 3,
  defaultMinutes: 60,
  equipmentProfile: 'Commercial Gym',
  continuity: 'interrupted',
  level: {
    experience: 5,
    recentContinuity: 3,
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
    objective: 'Progress the bench anchor and build triceps, chest, and upper back.',
    dayLabel: 'Next best session',
    plannedDate: iso(today),
    status: 'planned',
    durationMinutes: 60,
    mesocycleId: 'mesocycle-powerbuilding-1',
    planVersion: 1,
    exercises: [
      { id: 'plan-bench', exerciseId: 'competition-bench', role: 'primary', purpose: 'Strength anchor', sets: makeSets(4, 6, 175, 2), restSeconds: 180, estimatedMinutes: 22, optional: false },
      { id: 'plan-board', exerciseId: 'two-board-press', role: 'secondary', purpose: 'Build bench lockout and triceps strength', sets: makeSets(3, 8, 165, 2), restSeconds: 150, estimatedMinutes: 15, optional: false },
      { id: 'plan-row', exerciseId: 'chest-supported-row', role: 'priority', purpose: 'Upper-back dose with low systemic fatigue', sets: makeSets(3, 10, 130, 2), restSeconds: 90, estimatedMinutes: 10, optional: false },
      { id: 'plan-triceps', exerciseId: 'triceps-extension', role: 'priority', purpose: 'Direct triceps hypertrophy', sets: makeSets(3, 12, 55, 2), restSeconds: 75, estimatedMinutes: 8, optional: false },
      { id: 'plan-lateral', exerciseId: 'lateral-raise', role: 'optional', purpose: 'Shoulder maintenance', sets: makeSets(2, 15, 20, 2), restSeconds: 60, estimatedMinutes: 5, optional: true }
    ]
  },
  {
    id: 'session-squat',
    title: 'Squat Strength + Quads',
    objective: 'Progress the squat anchor and build quads without excess hinge fatigue.',
    dayLabel: 'Queued · 2',
    plannedDate: iso(subDays(today, -2)),
    status: 'planned',
    durationMinutes: 65,
    mesocycleId: 'mesocycle-powerbuilding-1',
    planVersion: 1,
    exercises: [
      { id: 'plan-squat', exerciseId: 'competition-squat', role: 'primary', purpose: 'Strength anchor', sets: makeSets(4, 5, 245, 2), restSeconds: 210, estimatedMinutes: 25, optional: false },
      { id: 'plan-ssb', exerciseId: 'ssb-squat', role: 'secondary', purpose: 'Build quads and upper-back position', sets: makeSets(3, 8, 185, 2), restSeconds: 150, estimatedMinutes: 16, optional: false },
      { id: 'plan-hack', exerciseId: 'hack-squat', role: 'priority', purpose: 'Direct quadriceps dose', sets: makeSets(3, 10, 180, 2), restSeconds: 100, estimatedMinutes: 12, optional: false },
      { id: 'plan-curl', exerciseId: 'leg-curl', role: 'maintenance', purpose: 'Hamstring maintenance', sets: makeSets(3, 12, 90, 2), restSeconds: 75, estimatedMinutes: 8, optional: false },
      { id: 'plan-core', exerciseId: 'ab-wheel', role: 'optional', purpose: 'Trunk capacity', sets: makeSets(2, 10, 0, 3), restSeconds: 60, estimatedMinutes: 4, optional: true }
    ]
  },
  {
    id: 'session-deadlift',
    title: 'Sumo Strength + Back',
    objective: 'Progress the sumo anchor and build off-floor, low-back, and lat strength.',
    dayLabel: 'Queued · 3',
    plannedDate: iso(subDays(today, -4)),
    status: 'planned',
    durationMinutes: 60,
    mesocycleId: 'mesocycle-powerbuilding-1',
    planVersion: 1,
    exercises: [
      { id: 'plan-sumo', exerciseId: 'sumo-deadlift', role: 'primary', purpose: 'Strength anchor', sets: makeSets(4, 4, 315, 2), restSeconds: 210, estimatedMinutes: 24, optional: false },
      { id: 'plan-deficit', exerciseId: 'deficit-conventional', role: 'secondary', purpose: 'Build low-back and off-floor strength for sumo', sets: makeSets(3, 6, 235, 2), restSeconds: 180, estimatedMinutes: 16, optional: false },
      { id: 'plan-cambered-row', exerciseId: 'cambered-row', role: 'priority', purpose: 'Upper-back and lat hypertrophy', sets: makeSets(3, 10, 115, 2), restSeconds: 90, estimatedMinutes: 10, optional: false },
      { id: 'plan-pulldown', exerciseId: 'lat-pulldown', role: 'priority', purpose: 'Lat dose with stable technique', sets: makeSets(3, 10, 120, 2), restSeconds: 80, estimatedMinutes: 8, optional: false },
      { id: 'plan-hammer', exerciseId: 'hammer-curl', role: 'optional', purpose: 'Arm and grip maintenance', sets: makeSets(2, 12, 30, 2), restSeconds: 60, estimatedMinutes: 5, optional: true }
    ]
  }
]

const historyTemplate = [
  { exerciseId: 'competition-bench', name: 'Competition Bench Press', family: 'Bench Press', region: 'chest' as const, load: 165, reps: 6 },
  { exerciseId: 'two-board-press', name: 'Two-Board Press', family: 'Bench Press', region: 'triceps' as const, load: 155, reps: 8 },
  { exerciseId: 'chest-supported-row', name: 'Chest-Supported Row', family: 'Row', region: 'back' as const, load: 120, reps: 10 },
  { exerciseId: 'competition-squat', name: 'Competition Back Squat', family: 'Squat', region: 'quadriceps' as const, load: 235, reps: 5 },
  { exerciseId: 'ssb-squat', name: 'Safety Squat Bar Squat', family: 'Squat', region: 'quadriceps' as const, load: 175, reps: 8 },
  { exerciseId: 'sumo-deadlift', name: 'Sumo Deadlift', family: 'Deadlift', region: 'glutes' as const, load: 305, reps: 4 },
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
      setIndex
    }))
  )
).flat()

export const records: PersonalRecord[] = [
  { id: 'pr-bench', exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', type: 'load', value: 250, label: '250 lb best bench', achievedAt: iso(subDays(today, 110)) },
  { id: 'pr-sumo', exerciseId: 'sumo-deadlift', exerciseName: 'Sumo Deadlift', type: 'load', value: 455, label: '455 lb best sumo', achievedAt: iso(subDays(today, 180)) },
  { id: 'pr-squat', exerciseId: 'competition-squat', exerciseName: 'Competition Back Squat', type: 'load', value: 365, label: '365 lb best squat', achievedAt: iso(subDays(today, 220)) },
  { id: 'pr-board-volume', exerciseId: 'two-board-press', exerciseName: 'Two-Board Press', type: 'volume', value: 7440, label: '4 × 12 at 155', achievedAt: iso(subDays(today, 70)) }
]
