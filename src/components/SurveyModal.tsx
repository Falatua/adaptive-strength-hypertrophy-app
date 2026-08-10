import { useMemo, useState } from 'react'
import type { SurveyAnswer } from '../domain/types'
import { Modal } from './Modal'

const questions = [
  { id: 'sleepHours', label: 'How many hours did you sleep?', type: 'number', min: 0, max: 14, defaultValue: 7 },
  { id: 'sleepQuality', label: 'How well did you sleep?', type: 'scale', min: 1, max: 5, defaultValue: 3 },
  { id: 'nutrition', label: 'How well fueled are you?', type: 'scale', min: 1, max: 5, defaultValue: 3 },
  { id: 'hydration', label: 'How hydrated do you feel?', type: 'scale', min: 1, max: 5, defaultValue: 3 },
  { id: 'energy', label: 'How much physical energy do you have?', type: 'scale', min: 1, max: 5, defaultValue: 3 },
  { id: 'stress', label: 'How high is life stress today?', type: 'scale', min: 1, max: 5, defaultValue: 2 },
  { id: 'motivation', label: 'How motivated are you to train?', type: 'scale', min: 1, max: 5, defaultValue: 4 },
  { id: 'fatigue', label: 'How physically fatigued do you feel?', type: 'scale', min: 1, max: 5, defaultValue: 2 },
  { id: 'pain', label: 'Any soreness, aches, or pain affecting movement?', type: 'scale', min: 0, max: 5, defaultValue: 0 },
  { id: 'time', label: 'How many minutes do you actually have?', type: 'number', min: 10, max: 180, defaultValue: 60 }
]

export function SurveyModal({ open, onClose, onSubmit, onSkip }: { open: boolean; onClose: () => void; onSubmit: (answers: SurveyAnswer[]) => void; onSkip: () => void }) {
  const initial = useMemo(() => Object.fromEntries(questions.map((question) => [question.id, question.defaultValue])), [])
  const [values, setValues] = useState<Record<string, number>>(initial)
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

  const submit = () => onSubmit(questions.map((question) => ({
    id: question.id,
    value: skipped.has(question.id) ? null : values[question.id],
    status: skipped.has(question.id) ? 'skipped' : 'answered'
  })))

  return (
    <Modal open={open} onClose={onClose} title="30-second readiness check" description="This forms a hypothesis. Warm-up performance remains the ground truth." wide>
      <div className="survey-grid">
        {questions.map((question, index) => (
          <fieldset className={`survey-question ${skipped.has(question.id) ? 'is-skipped' : ''}`} key={question.id}>
            <legend><span>{String(index + 1).padStart(2, '0')}</span>{question.label}</legend>
            {question.type === 'scale' ? (
              <div className="scale-row">
                {Array.from({ length: question.max - question.min + 1 }, (_, offset) => question.min + offset).map((value) => (
                  <button key={value} type="button" className={values[question.id] === value && !skipped.has(question.id) ? 'selected' : ''} onClick={() => { setValues((current) => ({ ...current, [question.id]: value })); setSkipped((current) => { const next = new Set(current); next.delete(question.id); return next }) }}>{value}</button>
                ))}
              </div>
            ) : (
              <input aria-label={question.label} type="number" min={question.min} max={question.max} value={values[question.id]} onChange={(event) => setValues((current) => ({ ...current, [question.id]: Number(event.target.value) }))} />
            )}
            <button type="button" className="text-button" onClick={() => setSkipped((current) => { const next = new Set(current); if (next.has(question.id)) next.delete(question.id); else next.add(question.id); return next })}>{skipped.has(question.id) ? 'Answer this question' : 'Skip question'}</button>
          </fieldset>
        ))}
      </div>
      <div className="modal__actions">
        <button className="button button--ghost" onClick={onSkip}>Skip for now</button>
        <button className="button button--primary" onClick={submit}>Use my check-in</button>
      </div>
    </Modal>
  )
}
