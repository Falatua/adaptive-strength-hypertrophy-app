export type NavKey = 'today' | 'plan' | 'progress' | 'library' | 'you'

export type ExerciseRole = 'primary' | 'secondary' | 'priority' | 'maintenance' | 'optional'
export type MovementPattern = 'squat' | 'hinge' | 'horizontal-push' | 'vertical-push' | 'horizontal-pull' | 'vertical-pull' | 'isolation' | 'carry'
export type BodyRegion = 'chest' | 'back' | 'shoulders' | 'quadriceps' | 'hamstrings' | 'glutes' | 'biceps' | 'triceps' | 'forearms' | 'calves' | 'trunk'
export type MuscleId = 'pectorals' | 'anterior-deltoids' | 'lateral-deltoids' | 'posterior-deltoids' | 'triceps' | 'biceps' | 'forearms' | 'latissimus' | 'upper-back' | 'spinal-erectors' | 'quadriceps' | 'hamstrings' | 'gluteals' | 'adductors' | 'calves' | 'abdominals' | 'obliques'
export type JointFeeling = 'great' | 'good' | 'neutral' | 'irritating' | 'avoid'
export type SessionStatus = 'planned' | 'active' | 'completed' | 'partial-primary' | 'partial-no-primary' | 'deferred' | 'expired' | 'stopped'
export type ContinuityState = 'stable' | 'interrupted' | 'returning'
export type PlacementGoal = 'powerbuilding' | 'strength' | 'hypertrophy' | 'power' | 'event-specific' | 'return-to-training'
export type PlacementRoute = 'introductory-skill' | 'reacclimation' | 'bridge-calibration' | 'base-building' | 'hypertrophy' | 'powerbuilding' | 'strength' | 'power' | 'event-specific' | 'pain-aware-modified'
export type PlacementConfidence = 'low' | 'medium' | 'high'
export type PlacementDecision = 'confirmed' | 'conservative' | 'aggressive-test' | 'quick-start'
export type PlacementPainState = 'none' | 'manageable' | 'modifying' | 'unknown'
export type PlacementRuleVersion = 'placement-v1' | 'placement-v2' | 'placement-v3'
export type RouteSessionRuleVersion = 'route-session-v1' | 'route-session-v2' | 'route-session-v3'

export type PlacementHistoryAcceptedField = 'dataConfidence' | 'strengthTolerance'

export interface PlacementHistoryEvidence {
  ruleVersion: 'placement-history-v1'
  exerciseId: string
  exerciseName: string
  assessedAt: string
  windowDays: number
  basis: 'recent-window' | 'latest-stale' | 'none'
  sourceSetIds: string[]
  totalSetCount: number
  recentSetCount: number
  recentExposureDateCount: number
  recentImportedSetCount: number
  recentRirKnownSetCount: number
  recentQualityConfirmedSetCount: number
  recentRepresentativeStrengthSetCount: number
  recentRepresentativeStrengthExposureDateCount: number
  recentRepresentativeStrengthQualityConfirmedSetCount: number
  latestCompletedAt: string | null
  suggestedDataConfidence: number
  suggestedStrengthTolerance: number | null
  limitations: string[]
}

export interface PlacementHistoryReview {
  evidence: PlacementHistoryEvidence
  acceptedFields: PlacementHistoryAcceptedField[]
  reviewedAt: string
}

export interface MovementPlacementInput {
  exerciseId: string
  exerciseName: string
  family: string
  movementSkill: number | null
  strengthTolerance: number | null
  dataConfidence: number | null
  historyReview?: PlacementHistoryReview
}

export interface MovementPlacementAssessment {
  ruleVersion: 'movement-placement-v1' | 'movement-placement-v2'
  exerciseId: string
  exerciseName: string
  family: string
  movementSkill: number
  strengthTolerance: number
  dataConfidence: number
  recommendedRoute: PlacementRoute
  selectedRoute: PlacementRoute
  confidence: PlacementConfidence
  reasons: string[]
  uncertainInputs: string[]
  historyReview?: PlacementHistoryReview
}

export interface PlacementInputs {
  goal: PlacementGoal | null
  fixedEvent: string | null
  trainingAge: number | null
  continuity: ContinuityState | null
  movementSkill: number | null
  strengthTolerance: number | null
  volumeTolerance: number | null
  scheduleStability: number | null
  dataConfidence: number | null
  painState: PlacementPainState
  weeklyOpportunities: number
  defaultMinutes: number
  equipmentProfileId: string
  skippedFields: string[]
  movementProfiles?: MovementPlacementInput[]
}

export interface AthletePlacementAssessment {
  ruleVersion: PlacementRuleVersion
  createdAt: string
  inputs: PlacementInputs
  dimensions: {
    experience: number
    recentContinuity: number
    movementSkill: number
    strengthTolerance: number
    volumeTolerance: number
    scheduleStability: number
    dataConfidence: number
  }
  recommendedRoute: PlacementRoute
  selectedRoute: PlacementRoute
  confidence: PlacementConfidence
  decision: PlacementDecision
  reasons: string[]
  uncertainInputs: string[]
  verificationPlan: string[]
  whyNotLower: string
  whyNotHigher: string
  exitCriteria: string[]
  movementPlacements?: MovementPlacementAssessment[]
}

export type PlacementWarmupResponse = 'better' | 'as-expected' | 'harder' | 'painful' | 'skipped' | 'not-answered'
export type PlacementRecoveryResponse = 'recovered' | 'acceptable' | 'not-recovered' | 'skipped' | 'pending'
export type PlacementVerificationStatus = 'active' | 'awaiting-recovery' | 'resolved'
export type PlacementVerificationVerdict = 'collecting' | 'pending-recovery' | 'supports-route' | 'needs-more-evidence' | 'review-suggested' | 'reassessment-required'

export interface PlacementVerificationFirstSet {
  sourceSetId: string
  plannedExerciseId: string
  exerciseId: string
  exerciseName: string
  targetLoad: number
  targetReps: number
  targetRir: number
  actualLoad: number
  actualReps: number
  actualRir: number
}

export interface PlacementVerificationSessionEvidence {
  sessionStatus: SessionStatus
  completedSets: number
  plannedSets: number
  completionRate: number
  plannedMinutes: number
  actualMinutes: number
  readiness: ReadinessOutcome | null
  difficulty: number | null
  technique: number | null
  pain: number | null
  timeFit: number | null
  postSurveySkipped: boolean
}

export interface PlacementVerificationEvent {
  id: string
  ruleVersion: 'placement-verification-v1'
  placementCreatedAt: string
  placementRoute: PlacementRoute
  movementPlacement?: MovementPlacementAssessment
  sessionId: string
  sequence: number
  startedAt: string
  status: PlacementVerificationStatus
  warmupResponse: PlacementWarmupResponse
  warmupCapturedAt: string | null
  firstSet: PlacementVerificationFirstSet | null
  sessionEvidence: PlacementVerificationSessionEvidence | null
  recoveryResponse: PlacementRecoveryResponse
  recoveryCapturedAt: string | null
  verdict: PlacementVerificationVerdict
  reasons: string[]
  completedAt: string | null
}
export type ReadinessOutcome = 'normal' | 'confirm' | 'protect' | 'reacclimate' | 'pain-aware'
export type ProgressionAction = 'load' | 'reps' | 'sets' | 'hold' | 'reduce' | 'reacclimate'
export type SurveyMode = 'full' | 'quick' | 'minimal' | 'off' | 'ask'
export type EffectiveSurveyMode = Exclude<SurveyMode, 'ask'>
export type EvidenceConfidence = 'low' | 'medium' | 'high'
export type MesocycleAdaptation = 'powerbuilding' | 'strength' | 'hypertrophy' | 'reacclimation'
export type MesocycleStatus = 'draft' | 'active' | 'superseded' | 'completed' | 'abandoned'
export type CycleReviewDecision = 'continue-progress' | 'continue-hold' | 'extend' | 'recover' | 'complete'
export type PersonalRecordType = 'absolute-load' | 'reps-at-load' | 'load-for-reps' | 'set-scheme' | 'estimated-strength' | 'exercise-session-volume' | 'workout-session-volume'
export type RecordCategory = 'strength' | 'repetition' | 'scheme' | 'workload'
export type AchievementCategory = RecordCategory | 'quality' | 'consistency' | 'return' | 'baseline'
export type CelebrationLevel = 'off' | 'subtle' | 'normal' | 'high-energy'
export type SubstitutionReason = 'none' | 'pain' | 'equipment' | 'time' | 'fatigue' | 'target-feel' | 'variety' | 'preference' | 'harder' | 'easier' | 'other'
export type SubstitutionTier = 'best-match' | 'good-alternative' | 'changes-focus'
export type EquipmentProfileKind = 'commercial-gym' | 'home-gym' | 'travel' | 'hotel' | 'bodyweight' | 'custom'
export type LoadIncrementKind = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'other'

export interface EquipmentProfile {
  id: string
  name: string
  kind: EquipmentProfileKind
  equipment: string[]
  increments: Record<LoadIncrementKind, number>
  incrementUnit: 'lb' | 'kg'
  constraints: string[]
  source: 'seed' | 'athlete'
  updatedAt: string
}

export interface EquipmentGenerationEvidence {
  ruleVersion: 'equipment-profile-v1'
  profileId: string
  profileName: string
  profileKind: EquipmentProfileKind
  profileUpdatedAt: string
  equipment: string[]
  increments: Record<LoadIncrementKind, number>
  incrementUnit: 'lb' | 'kg'
}

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
  muscleMapping?: ExerciseMuscleMapping
}

export interface ExerciseMuscleMapping {
  ruleVersion: 'exercise-muscle-map-v1'
  direct: MuscleId
  secondary: MuscleId[]
  source: 'athlete'
  reviewedAt: string
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
  substitutionEventId?: string
  prescriptionMethod?: 'exact-history' | 'baseline-calibration'
  prescriptionNote?: string
  warmupGuidance?: string
}

export interface RouteSessionGenerationEvidence {
  ruleVersion: RouteSessionRuleVersion
  placementCreatedAt: string
  route: PlacementRoute
  planRoute?: PlacementRoute
  strategy: string
  reasons: string[]
  equipment?: EquipmentGenerationEvidence
  movementPlacement?: MovementPlacementAssessment
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
  readinessSurveyMode?: EffectiveSurveyMode
  readinessAnsweredCount?: number
  readinessUnknownCount?: number
  readinessConfidence?: EvidenceConfidence
  startedAt?: string
  completedAt?: string
  sessionRpe?: number
  note?: string
  mesocycleId?: string
  planVersion?: number
  microcycleNumber?: number
  generation?: RouteSessionGenerationEvidence
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
  entryRoute?: PlacementRoute
  generationRuleVersion?: RouteSessionRuleVersion
  placementCreatedAt?: string
  generationEquipment?: EquipmentGenerationEvidence
  movementPlacements?: MovementPlacementAssessment[]
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
  entryRoute?: PlacementRoute
  generationRuleVersion?: RouteSessionRuleVersion
  placementCreatedAt?: string
  generationEquipment?: EquipmentGenerationEvidence
  movementPlacements?: MovementPlacementAssessment[]
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
  qualityConfirmed?: boolean
  setIndex: number
  plannedExerciseId?: string
  originalExerciseId?: string
  originalExerciseName?: string
  originalFamily?: string
  originalPrimaryRegion?: BodyRegion
  rirKnown?: boolean
  importBatchId?: string
  importRow?: number
  importSourceName?: string
  importFingerprint?: string
  importUnits?: 'lb' | 'kg'
}

export interface SubstitutionCandidateSnapshot {
  exerciseId: string
  exerciseName: string
  rank: number
  score: number
  tier: SubstitutionTier
  reasons: string[]
  preserves: string
  changes: string
  lastExposureAt: string | null
  priorSetCount: number
}

export interface ExerciseSubstitutionEvent {
  id: string
  sessionId: string
  plannedExerciseId: string
  originalExerciseId: string
  selectedExerciseId: string
  role: ExerciseRole
  purpose: string
  reason: SubstitutionReason
  createdAt: string
  readiness: ReadinessOutcome
  availableMinutes: number
  equipmentLocation: string
  primaryOverrideConfirmed: boolean
  candidates: SubstitutionCandidateSnapshot[]
  originalPrescription: SetPrescription[]
  replacementPrescription: SetPrescription[]
  prescriptionMethod: 'exact-history' | 'baseline-calibration'
  prescriptionNote: string
  sourceSetIds: string[]
  outcome: 'pending' | 'completed' | 'partial' | 'not-completed'
  completedAt?: string
  postFeedback?: {
    difficulty: number | null
    targetStimulus: number | null
    technique: number | null
    pain: number | null
    enjoyment: number | null
    skipped: boolean
  }
}

export interface SurveyAnswer {
  id: string
  value: number | string | null
  status: 'answered' | 'skipped' | 'not-sure' | 'prefer-not' | 'not-answered'
}

export interface SurveyRecord {
  id: string
  sessionId: string
  type: 'pre' | 'post'
  completedAt: string
  answers: SurveyAnswer[]
  skipped: boolean
  mode?: EffectiveSurveyMode
  answeredCount?: number
  unknownCount?: number
  confidence?: EvidenceConfidence
}

export type DeferredFeedbackStatus = 'pending' | 'completed' | 'dismissed' | 'expired'

export interface DeferredFeedbackRequest {
  id: string
  sessionId: string
  mode: Exclude<EffectiveSurveyMode, 'off'>
  createdAt: string
  expiresAt: string
  status: DeferredFeedbackStatus
  resolvedAt?: string
  surveyId?: string
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
  exerciseId: string | null
  exerciseName: string
  type: PersonalRecordType
  category: RecordCategory
  scope: 'all-time'
  value: number
  unit: 'load' | 'repetitions' | 'volume-load' | 'estimated-load'
  label: string
  achievedAt: string
  sourceSessionId: string
  sourceSetIds: string[]
  context: {
    load?: number
    reps?: number
    setCount?: number
    repetitionScheme?: number[]
    formula?: 'epley'
    formulaVersion?: 'epley-v1'
    eligibleRepRange?: [number, number]
  }
  validation: 'validated' | 'numeric-only'
  ruleVersion: 'pr-v2'
}

export interface AchievementEvent {
  id: string
  kind: 'personal-record' | 'micro-win'
  category: AchievementCategory
  recordType?: PersonalRecordType
  title: string
  explanation: string
  exerciseId: string | null
  exerciseName: string
  achievedAt: string
  scope: 'all-time' | 'recent'
  value: number
  priorValue: number | null
  delta: number | null
  sourceSessionId: string
  sourceSetIds: string[]
  priorSourceSetIds: string[]
  validation: 'validated' | 'numeric-only'
  ruleVersion: 'achievement-v1'
}

export interface RecordOpportunity {
  id: string
  exerciseId: string
  type: PersonalRecordType
  category: RecordCategory
  title: string
  explanation: string
  plannedValue: number
  currentValue: number | null
  margin: number | null
  sourceSetIds: string[]
  plannedSetIds: string[]
  eligible: boolean
  gateReason: string
  ruleVersion: 'opportunity-v1'
}

export type HistoryMutationType = 'set-corrected' | 'set-deleted' | 'exercise-merged' | 'exercise-edited' | 'history-imported'

export interface HistoryMutationSnapshot {
  history: CompletedSetRecord[]
  exercises: Exercise[]
  sessions: TrainingSession[]
  athlete?: AthleteProfile
  substitutionEvents?: ExerciseSubstitutionEvent[]
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
  placement: AthletePlacementAssessment
  level: {
    experience: number
    recentContinuity: number
    movementSkill: number
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
  celebrationLevel: CelebrationLevel
  opportunityPrompts: boolean
  sessionAchievements: boolean
  confetti: boolean
  quietMode: boolean
  availableMinutes: number
  equipmentLocation: string
  activeEquipmentProfileId: string
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
