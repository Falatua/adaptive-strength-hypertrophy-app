import { Clock3, Target, Trophy } from 'lucide-react'
import { deriveRecordOpportunities } from '../domain/history-engine'
import { loadLabel } from '../domain/load-mode'
import { buildMovementProgressPath } from '../domain/progression-insight-engine'
import type { AthleteProfile, CompletedSetRecord, CycleReviewEvent, EquipmentProfile, Exercise, SurveyRecord, TrainingSession } from '../domain/types'

export function WorkoutPreview({
  session,
  exercises,
  history,
  units,
  athlete,
  surveys = [],
  cycleReviews = [],
  equipmentProfile
}: {
  session: TrainingSession
  exercises: Exercise[]
  history: CompletedSetRecord[]
  units: 'lb' | 'kg'
  athlete?: AthleteProfile
  surveys?: SurveyRecord[]
  cycleReviews?: CycleReviewEvent[]
  equipmentProfile?: EquipmentProfile
}) {
  return <div className="workout-preview">
    <header className="workout-preview__summary">
      <span><Clock3 size={17} /><strong>{session.durationMinutes} minutes</strong></span>
      <span><Target size={17} /><strong>{session.exercises.length} movements</strong></span>
      <p>{session.objective}</p>
    </header>
    <ol className="workout-preview__movements">
      {session.exercises.map((planned, index) => {
        const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
        if (!exercise || !planned.sets.length) return null
        const exactHistory = history.filter((workSet) => workSet.exerciseId === exercise.id)
        const latest = [...exactHistory].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
        const opportunity = deriveRecordOpportunities({ history, planned, exercise, readiness: session.readiness ?? 'confirm' })[0]
        const path = athlete && equipmentProfile ? buildMovementProgressPath({ athlete, session, planned, exercise, history, surveys, cycleReviews, equipmentProfile, units }) : null
        const targetReps = planned.sets.map((workSet) => workSet.targetReps)
        const uniformReps = targetReps.every((reps) => reps === targetReps[0])
        const target = `${planned.sets.length} × ${uniformReps ? targetReps[0] : targetReps.join(' / ')} · ${loadLabel(planned.sets[0], exercise, units)}`
        const last = latest
          ? latest.loadMode === 'bodyweight' ? `${latest.reps} reps at bodyweight` : `${latest.load} ${units} × ${latest.reps}`
          : 'No exact completed baseline'
        return <li key={planned.id}>
          <span className="workout-preview__index">{String(index + 1).padStart(2, '0')}</span>
          <div className="workout-preview__movement">
            <small>{planned.role}</small>
            <strong>{exercise.name}</strong>
            <p><b>Planned:</b> {target}</p>
            <p><b>Last:</b> {last}</p>
            {path && <div className={`workout-preview__path workout-preview__path--${path.status}`}><span><b>{path.title}</b>{path.toProgress}</span><small>Next: {path.next} · {path.confidence} confidence · {path.sourceSetIds.length} source set{path.sourceSetIds.length === 1 ? '' : 's'}</small></div>}
            {opportunity && <div className={`workout-preview__cue workout-preview__cue--${opportunity.kind}`}><Trophy size={15} /><span><b>{opportunity.kind === 'paused' ? 'Progress cue paused' : opportunity.title}</b>{opportunity.kind === 'paused' ? opportunity.gateReason : opportunity.explanation}</span></div>}
          </div>
        </li>
      })}
    </ol>
    <p className="workout-preview__boundary">Preview only. Exact targets change only after completed-work review and athlete approval.</p>
  </div>
}
