export type NavKey = 'today' | 'plan' | 'progress' | 'library' | 'you'

export type ExerciseRole = 'primary' | 'secondary' | 'priority' | 'maintenance' | 'optional'
export type MovementPattern = 'squat' | 'hinge' | 'horizontal-push' | 'vertical-push' | 'horizontal-pull' | 'vertical-pull' | 'isolation' | 'carry'
export type BodyRegion = 'chest' | 'back' | 'shoulders' | 'quadriceps' | 'hamstrings' | 'glutes' | 'biceps' | 'triceps' | 'forearms' | 'calves' | 'trunk'
export type JointFeeling = 'great' | 'good' | 'neutral' | 'irritating' | 'avoid'
export type SessionStatus = 'planned' | 'active' | 'completed' | 'partial-primary' | 'partial-no-primary' | 'deferred' | 'expired' | 'stopped'
export type ContinuityState = 'stable' | 'interrupted' | 'returning'
export type ReadinessOutcome = 'normal' | 'confirm' | 'protect' | 'reacclimate' | 'pain-aware'
export type ProgressionAction = 'load' | 'reps' | 'sets' | 'hold' | 'reduce' | 'reacclimate'
export type SurveyMode = 'full' | 'quick' | 'minimal' | 'off' | 'ask'
export type MesocycleAdaptation = 'powerbuilding' | 'strength' | 'hypertrophy' | 'reacclimation'
export type MesocycleStatus = 'draft' | 'active' | 'superseded' | 'completed' | 'abandoned'
export type CycleReviewDecision = 'continue-progress' | 'continue-hold' | 'extend' | 'recover' | 'complete'

export interface Exercise {
  id: string
  name: string
  family: string
  aliases: string[]
  pattern: MovementPattern
  regions: BodyRegion[]
  primaryRegion: BodyRegion
  equipment: string[]
  description: string
  roleTags: string[]
  favorite: boolean
  jointFeeling: JointFeeling
  custom?: boolean
  retired?: boolean
  mergedIntoId?: string
}

export interface SetPrescription {
  id: string
  targetReps: number
  targetLoad: number
  targetRir: number
  completedReps?: number
  completedLoad?: number
  actualRir?: number
  completed: boolean
}

export interface PlannedExercise {
  id: string
  exerciseId: string
  role: ExerciseRole
  purpose: string
  sets: SetPrescription[]
  restSeconds: number
  estimatedMinutes: number
  optional: boolean
  substitutedFrom?: string
}

export interface TrainingSession {
  id: string
  title: string
  objective: string
  dayLabel: string
  plannedDate: string
  status: SessionStatus
  durationMinutes: number
  exercises: PlannedExercise[]
  readiness?: ReadinessOutcome
  startedAt?: string
  completedAt?: string
  sessionRpe?: number
  note?: string
  mesocycleId?: string
  planVersion?: number
  microcycleNumber?: number
}

export interface MesocyclePlan {
  id: string
  version: number
  title: string
  objective: string
  dominantAdaptation: MesocycleAdaptation
  status: MesocycleStatus
  createdAt: string
  effectiveAt: string
  supersedesId: string | null
  revisionReason: string
  entryCriteria: string
  progressionModel: string
  targetMicrocycles: number
  minimumProductiveExposures: number
  successCriteria: string
  exitPlan: string
  weeklyOpportunities: number
  defaultMinutes: number
  strengthAnchors: string[]
  priorityRegions: BodyRegion[]
  maintenanceRegions: BodyRegion[]
  sessionIds: string[]
}

export interface MesocycleDraft {
  title: string
  objective: string
  dominantAdaptation: MesocycleAdaptation
  revisionReason: string
  entryCriteria: string
  progressionModel: string
  targetMicrocycles: number
  minimumProductiveExposures: number
  successCriteria: string
  exitPlan: string
  weeklyOpportunities: number
  defaultMinutes: number
  strengthAnchors: string[]
  priorityRegions: BodyRegion[]
  maintenanceRegions: BodyRegion[]
}

export interface CycleReviewEvidence {
  requiredSessions: number
  qualifiedSessions: number
  unresolvedSessions: number
  totalQualifiedExposures: number
  completedSets: number
  volumeLoad: number
  averageSessionRpe: number | null
  maximumPain: number | null
  calendarDays: number
}

export interface CycleReviewEvent {
  id: string
  mesocycleId: string
  planVersion: number
  microcycleNumber: number
  decision: CycleReviewDecision
  createdAt: string
  reason: string
  recommendation: CycleReviewDecision
  recommendationReasons: string[]
  evidence: CycleReviewEvidence
  generatedSessionIds: string[]
  expiredSessionIds: string[]
}

export interface CompletedSetRecord {
  id: string
  sessionId: string
  exerciseId: string
  exerciseName: string
  family: string
  primaryRegion: BodyRegion
  completedAt: string
  reps: number
  load: number
  rir: number
  technique: number
  pain: number
  setIndex: number
  originalExerciseId?: string
  originalExerciseName?: string
  originalFamily?: string
  originalPrimaryRegion?: BodyRegion
}

export interface SurveyAnswer {
  id: string
  value: number | string | null
  status: 'answered' | 'skipped' | 'not-sure' | 'prefer-not'
}

export interface SurveyRecord {
  id: string
  sessionId: string
  type: 'pre' | 'post'
  completedAt: string
  answers: SurveyAnswer[]
  skipped: boolean
}

export interface ProgressionDecision {
  action: ProgressionAction
  title: string
  explanation: string
  nextLoad: number
  nextReps: number
  nextSets: number
  confidence: 'low' | 'medium' | 'high'
  reasons: string[]
}

export interface PersonalRecord {
  id: string
  exerciseId: string
  exerciseName: string
  type: 'load' | 'reps' | 'volume' | 'estimated-strength'
  value: number
  label: string
  achievedAt: string
  sourceSetIds: string[]
}

export type HistoryMutationType = 'set-corrected' | 'set-deleted' | 'exercise-merged'

export interface HistoryMutationSnapshot {
  history: CompletedSetRecord[]
  exercises: Exercise[]
  sessions: TrainingSession[]
  athlete?: AthleteProfile
}

export interface HistoryMutationEvent {
  id: string
  type: HistoryMutationType
  createdAt: string
  reason: string
  description: string
  affectedSetIds: string[]
  before: HistoryMutationSnapshot
  after: HistoryMutationSnapshot
  recordsBefore: PersonalRecord[]
  recordsAfter: PersonalRecord[]
  volumeBefore: number
  volumeAfter: number
  undoneAt?: string
}

export interface AthleteProfile {
  name: string
  trainingAge: number
  goal: string
  entryRoute: string
  strengthAnchors: string[]
  priorityRegions: BodyRegion[]
  weeklyOpportunities: number
  defaultMinutes: number
  equipmentProfile: string
  continuity: ContinuityState
  level: {
    experience: number
    recentContinuity: number
    strengthTolerance: number
    volumeTolerance: number
    scheduleStability: number
    dataConfidence: number
  }
}

export interface AppSettings {
  units: 'lb' | 'kg'
  preSurveyMode: SurveyMode
  postSurveyMode: SurveyMode
  focusedMode: boolean
  reducedMotion: boolean
  sounds: boolean
  haptics: boolean
  availableMinutes: number
  equipmentLocation: string
}

export interface MissedSessionReason {
  reason: 'family' | 'work' | 'time' | 'travel' | 'sleep' | 'illness' | 'pain' | 'equipment' | 'motivation' | 'other'
  nextMinutes: number
  continuing: boolean
}

export interface WeeklyVolumePoint {
  label: string
  volume: number
  sets: number
}

export interface RegionVolumePoint {
  region: BodyRegion
  volume: number
  sets: number
}
