import type { CompletedSetRecord, Exercise, PlacementHistoryEvidence } from './types'

export const placementHistoryRuleVersion = 'placement-history-v1' as const
export const placementHistoryWindowDays = 42

const dayMs = 86_400_000
const validDate = (value: string) => !Number.isNaN(new Date(value).getTime())
const wholeNonNegative = (value: unknown) => Number.isInteger(value) && Number(value) >= 0

function suggestedDataConfidence(recentSets: number, exposureDates: number, rirKnown: number, qualityConfirmed: number) {
  if (recentSets >= 6 && exposureDates >= 3 && rirKnown >= 4 && qualityConfirmed >= 4) return 5
  if (recentSets >= 4 && exposureDates >= 2) return 4
  if (recentSets >= 2) return 3
  if (recentSets === 1) return 2
  return 1
}

function suggestedStrengthTolerance(representativeSets: number, exposureDates: number, qualityConfirmed: number) {
  if (representativeSets < 3 || exposureDates < 2) return null
  if (representativeSets >= 6 && exposureDates >= 3 && qualityConfirmed >= 4) return 5
  if (representativeSets >= 4 && exposureDates >= 2 && qualityConfirmed >= 2) return 4
  return 3
}

export function buildPlacementHistoryEvidence(input: {
  exercise: Pick<Exercise, 'id' | 'name'>
  history: CompletedSetRecord[]
  assessedAt?: string
  windowDays?: number
}): PlacementHistoryEvidence {
  const assessedAt = input.assessedAt ?? new Date().toISOString()
  const windowDays = input.windowDays ?? placementHistoryWindowDays
  if (!validDate(assessedAt)) throw new Error('Placement-history evidence needs a valid assessment date.')
  if (!Number.isInteger(windowDays) || windowDays < 7 || windowDays > 365) throw new Error('Placement-history window must be a whole number from 7 to 365 days.')
  const cutoff = new Date(assessedAt).getTime() - windowDays * dayMs
  const exact = input.history
    .filter((workSet) => workSet.exerciseId === input.exercise.id && validDate(workSet.completedAt) && new Date(workSet.completedAt).getTime() <= new Date(assessedAt).getTime())
    .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime())
  const recent = exact.filter((workSet) => new Date(workSet.completedAt).getTime() >= cutoff)
  const latest = exact[0] ?? null
  const recentExposureDateCount = new Set(recent.map((workSet) => workSet.completedAt.slice(0, 10))).size
  const recentRirKnownSetCount = recent.filter((workSet) => workSet.rirKnown !== false).length
  const recentQualityConfirmedSetCount = recent.filter((workSet) => workSet.qualityConfirmed === true).length
  const representativeStrength = recent.filter((workSet) => workSet.load > 0 && workSet.reps <= 8 && workSet.rirKnown !== false && workSet.rir <= 4)
  const recentRepresentativeStrengthExposureDateCount = new Set(representativeStrength.map((workSet) => workSet.completedAt.slice(0, 10))).size
  const recentRepresentativeStrengthQualityConfirmedSetCount = representativeStrength.filter((workSet) => workSet.qualityConfirmed === true).length
  const dataSuggestion = recent.length ? suggestedDataConfidence(recent.length, recentExposureDateCount, recentRirKnownSetCount, recentQualityConfirmedSetCount) : exact.length ? 2 : 1
  const toleranceSuggestion = recent.length ? suggestedStrengthTolerance(representativeStrength.length, recentRepresentativeStrengthExposureDateCount, recentRepresentativeStrengthQualityConfirmedSetCount) : null
  const limitations: string[] = []
  const numericOnlyImported = recent.filter((workSet) => Boolean(workSet.importBatchId) && workSet.qualityConfirmed !== true).length
  const missingRir = recent.filter((workSet) => workSet.rirKnown === false).length
  const unconfirmedQuality = recent.filter((workSet) => workSet.qualityConfirmed !== true).length
  if (!exact.length) limitations.push('No exact-movement history is available. Family or neighboring-variation history was not borrowed.')
  else if (!recent.length) limitations.push(`The latest exact exposure is outside the ${windowDays}-day review window.`)
  if (numericOnlyImported) limitations.push(`${numericOnlyImported} recent imported set${numericOnlyImported === 1 ? ' is' : 's are'} numeric-only and do not confirm technique, pain, or recovery.`)
  if (missingRir) limitations.push(`${missingRir} recent set${missingRir === 1 ? ' has' : 's have'} unknown RIR.`)
  if (unconfirmedQuality && recent.length) limitations.push(`${unconfirmedQuality} recent set${unconfirmedQuality === 1 ? ' lacks' : 's lack'} confirmed technique and pain evidence.`)
  limitations.push('History can suggest evidence confidence and heavy-work tolerance only. It never infers movement skill, pain status, or medical readiness.')

  return {
    ruleVersion: placementHistoryRuleVersion,
    exerciseId: input.exercise.id,
    exerciseName: input.exercise.name,
    assessedAt,
    windowDays,
    basis: recent.length ? 'recent-window' : latest ? 'latest-stale' : 'none',
    sourceSetIds: recent.length ? recent.map((workSet) => workSet.id) : latest ? [latest.id] : [],
    totalSetCount: exact.length,
    recentSetCount: recent.length,
    recentExposureDateCount,
    recentImportedSetCount: recent.filter((workSet) => Boolean(workSet.importBatchId)).length,
    recentRirKnownSetCount,
    recentQualityConfirmedSetCount,
    recentRepresentativeStrengthSetCount: representativeStrength.length,
    recentRepresentativeStrengthExposureDateCount,
    recentRepresentativeStrengthQualityConfirmedSetCount,
    latestCompletedAt: latest?.completedAt ?? null,
    suggestedDataConfidence: dataSuggestion,
    suggestedStrengthTolerance: toleranceSuggestion,
    limitations
  }
}

export function placementHistoryEvidenceError(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Placement-history evidence must be a structured record.'
  const evidence = value as Partial<PlacementHistoryEvidence>
  if (evidence.ruleVersion !== placementHistoryRuleVersion) return 'Placement-history evidence has an unsupported rule version.'
  if (typeof evidence.exerciseId !== 'string' || !evidence.exerciseId.trim() || typeof evidence.exerciseName !== 'string' || !evidence.exerciseName.trim()) return 'Placement-history evidence has incomplete movement identity.'
  if (typeof evidence.assessedAt !== 'string' || !validDate(evidence.assessedAt)) return 'Placement-history evidence has an invalid assessment date.'
  if (!Number.isInteger(evidence.windowDays) || Number(evidence.windowDays) < 7 || Number(evidence.windowDays) > 365) return 'Placement-history evidence has an invalid review window.'
  if (!['recent-window', 'latest-stale', 'none'].includes(String(evidence.basis))) return 'Placement-history evidence has an invalid basis.'
  const counts = [evidence.totalSetCount, evidence.recentSetCount, evidence.recentExposureDateCount, evidence.recentImportedSetCount, evidence.recentRirKnownSetCount, evidence.recentQualityConfirmedSetCount, evidence.recentRepresentativeStrengthSetCount, evidence.recentRepresentativeStrengthExposureDateCount, evidence.recentRepresentativeStrengthQualityConfirmedSetCount]
  if (!counts.every(wholeNonNegative)) return 'Placement-history evidence counts must be whole and non-negative.'
  if (Number(evidence.recentSetCount) > Number(evidence.totalSetCount) || Number(evidence.recentExposureDateCount) > Number(evidence.recentSetCount) || Number(evidence.recentImportedSetCount) > Number(evidence.recentSetCount) || Number(evidence.recentRirKnownSetCount) > Number(evidence.recentSetCount) || Number(evidence.recentQualityConfirmedSetCount) > Number(evidence.recentSetCount)) return 'Placement-history evidence counts do not reconcile.'
  if (Number(evidence.recentRepresentativeStrengthSetCount) > Number(evidence.recentSetCount) || Number(evidence.recentRepresentativeStrengthExposureDateCount) > Number(evidence.recentRepresentativeStrengthSetCount) || Number(evidence.recentRepresentativeStrengthQualityConfirmedSetCount) > Number(evidence.recentRepresentativeStrengthSetCount)) return 'Placement-history representative strength counts do not reconcile.'
  if (!Array.isArray(evidence.sourceSetIds) || evidence.sourceSetIds.some((id) => typeof id !== 'string' || !id) || new Set(evidence.sourceSetIds).size !== evidence.sourceSetIds.length) return 'Placement-history evidence has invalid source-set references.'
  if (evidence.basis === 'recent-window' && (evidence.recentSetCount === 0 || evidence.sourceSetIds.length !== evidence.recentSetCount)) return 'Recent placement-history evidence must reference every recent source set.'
  if (evidence.basis === 'latest-stale' && (evidence.recentSetCount !== 0 || evidence.totalSetCount === 0 || evidence.sourceSetIds.length !== 1)) return 'Stale placement-history evidence must reference only its latest exact set.'
  if (evidence.basis === 'none' && (evidence.totalSetCount !== 0 || evidence.recentSetCount !== 0 || evidence.sourceSetIds.length !== 0 || evidence.latestCompletedAt !== null)) return 'Empty placement-history evidence cannot invent source history.'
  if (evidence.basis !== 'none' && (typeof evidence.latestCompletedAt !== 'string' || !validDate(evidence.latestCompletedAt))) return 'Placement-history evidence is missing its latest exact exposure.'
  if (typeof evidence.latestCompletedAt === 'string') {
    const ageDays = (new Date(evidence.assessedAt).getTime() - new Date(evidence.latestCompletedAt).getTime()) / dayMs
    if (ageDays < 0) return 'Placement-history evidence cannot use a future source set.'
    if (evidence.basis === 'recent-window' && ageDays > Number(evidence.windowDays)) return 'Recent placement-history evidence is outside its review window.'
    if (evidence.basis === 'latest-stale' && ageDays <= Number(evidence.windowDays)) return 'Stale placement-history evidence is still inside its review window.'
  }
  if (!Number.isInteger(evidence.suggestedDataConfidence) || Number(evidence.suggestedDataConfidence) < 1 || Number(evidence.suggestedDataConfidence) > 5) return 'Placement-history evidence has an invalid confidence suggestion.'
  if (!(evidence.suggestedStrengthTolerance === null || (Number.isInteger(evidence.suggestedStrengthTolerance) && Number(evidence.suggestedStrengthTolerance) >= 1 && Number(evidence.suggestedStrengthTolerance) <= 5))) return 'Placement-history evidence has an invalid tolerance suggestion.'
  const expectedDataConfidence = evidence.recentSetCount
    ? suggestedDataConfidence(Number(evidence.recentSetCount), Number(evidence.recentExposureDateCount), Number(evidence.recentRirKnownSetCount), Number(evidence.recentQualityConfirmedSetCount))
    : evidence.totalSetCount ? 2 : 1
  const expectedStrengthTolerance = evidence.recentSetCount
    ? suggestedStrengthTolerance(Number(evidence.recentRepresentativeStrengthSetCount), Number(evidence.recentRepresentativeStrengthExposureDateCount), Number(evidence.recentRepresentativeStrengthQualityConfirmedSetCount))
    : null
  if (evidence.suggestedDataConfidence !== expectedDataConfidence || evidence.suggestedStrengthTolerance !== expectedStrengthTolerance) return 'Placement-history suggestions do not reconcile with their source counts.'
  if (!Array.isArray(evidence.limitations) || evidence.limitations.length === 0 || evidence.limitations.some((item) => typeof item !== 'string' || !item.trim())) return 'Placement-history evidence must preserve its limitations.'
  return null
}
