import { useMemo, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, MessageSquareText } from 'lucide-react'
import { movementFeedbackPreview, movementFeedbackQuestions } from '../domain/movement-feedback-engine'
import type { EffectiveSurveyMode, SurveyAnswer, SurveyRecord } from '../domain/types'

export function MovementFeedbackPanel({
  exerciseName,
  panelId,
  mode,
  hasPriorExactExposure,
  savedFeedback,
  feedbackMatchesCurrentSets,
  onSave,
  onSkip,
  onContinue
}: {
  exerciseName: string
  panelId: string
  mode: EffectiveSurveyMode
  hasPriorExactExposure: boolean
  savedFeedback?: SurveyRecord
  feedbackMatchesCurrentSets: boolean
  onSave: (answers: SurveyAnswer[], note: string) => void
  onSkip: (answers: SurveyAnswer[]) => void
  onContinue: () => void
}) {
  const questions = useMemo(() => movementFeedbackQuestions(mode === 'off' ? 'quick' : mode, hasPriorExactExposure), [hasPriorExactExposure, mode])
  const savedValues = Object.fromEntries((savedFeedback?.answers ?? []).flatMap((answer) => answer.status === 'answered' && typeof answer.value === 'number' ? [[answer.id, answer.value]] : []))
  const [values, setValues] = useState<Record<string, number>>(savedValues)
  const [note, setNote] = useState(savedFeedback?.note ?? '')
  const [open, setOpen] = useState(mode !== 'off' && (!savedFeedback || !feedbackMatchesCurrentSets))
  const answered = questions.map((question) => ({
    id: question.id,
    value: values[question.id] ?? null,
    status: values[question.id] === undefined ? 'not-answered' as const : 'answered' as const
  }))
  const preview = movementFeedbackPreview(answered)
  const savedCount = savedFeedback?.answers.filter((answer) => answer.status === 'answered').length ?? 0

  const submit = () => {
    onSave(answered, note)
    setOpen(false)
  }

  return (
    <section id={panelId} className={`movement-feedback ${preview.tone === 'warning' && open ? 'movement-feedback--warning' : ''}`} aria-label={`${exerciseName} movement feedback`}>
      <button type="button" className="movement-feedback__heading" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        {savedFeedback && feedbackMatchesCurrentSets ? <Check size={19} /> : <MessageSquareText size={19} />}
        <span>
          <strong>{savedFeedback && feedbackMatchesCurrentSets ? 'Movement feedback saved' : savedFeedback ? 'Update feedback for the added work' : 'How did this movement go?'}</strong>
          <small>{savedFeedback && feedbackMatchesCurrentSets
            ? `${savedFeedback.skipped ? 'Skipped, so these signals remain unknown' : `${savedCount} answer${savedCount === 1 ? '' : 's'} attached to this exact movement`}. Edit anytime before finishing.`
            : 'A brief optional check for future load, repetitions, set count, and movement fit.'}</small>
        </span>
        <ChevronDown size={18} />
      </button>

      {open && <div className="movement-feedback__body">
        <p className="movement-feedback__boundary">Feedback informs a future suggestion. It never changes today’s work or a future plan without your approval.</p>
        <div className="movement-feedback__questions">
          {questions.map((question) => <fieldset key={question.id}>
            <legend><strong>{question.label}</strong><small>{question.help}</small></legend>
            <div className="movement-feedback__choices" role="group" aria-label={question.label}>
              {question.options.map((option) => <button
                type="button"
                key={option.value}
                className={`${values[question.id] === option.value ? 'selected' : ''} ${option.tone === 'warning' ? 'warning' : ''}`}
                aria-pressed={values[question.id] === option.value}
                onClick={() => setValues((current) => ({ ...current, [question.id]: option.value }))}
              >{option.label}</button>)}
            </div>
            {values[question.id] !== undefined && <button type="button" className="movement-feedback__clear" onClick={() => setValues((current) => {
              const next = { ...current }
              delete next[question.id]
              return next
            })}>Leave this unknown</button>}
          </fieldset>)}
        </div>

        <div className={`movement-feedback__preview ${preview.tone === 'warning' ? 'is-warning' : ''}`} role="status">
          {preview.tone === 'warning' && <AlertTriangle size={17} />}
          <span><strong>{preview.title}</strong><small>{preview.detail}</small></span>
        </div>

        <details className="movement-feedback__note">
          <summary>Optional setup or context note <ChevronDown size={15} /></summary>
          <textarea aria-label={`${exerciseName} feedback note`} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What changed, where you felt discomfort, or what to repeat next time..." />
        </details>

        <div className="movement-feedback__actions">
          <button type="button" className="button button--ghost" onClick={() => { onSkip(answered.map((answer) => ({ ...answer, value: null, status: 'not-answered' }))); setOpen(false) }}>Skip this check</button>
          <button type="button" className="button button--secondary" onClick={onContinue}>Continue workout</button>
          <button type="button" className="button button--primary" onClick={submit}>Save movement feedback</button>
        </div>
      </div>}
    </section>
  )
}
