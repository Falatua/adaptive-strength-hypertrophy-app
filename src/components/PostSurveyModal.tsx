import { useMemo, useState } from 'react'
import type { SurveyAnswer } from '../domain/types'
import { Modal } from './Modal'

const questions = [
  { id: 'difficulty', label: 'How difficult was the session overall?', min: 1, max: 10, defaultValue: 7 },
  { id: 'expectedComparison', label: 'Compared with the plan, how hard was it?', min: 1, max: 5, defaultValue: 3 },
  { id: 'targetStimulus', label: 'How well did the target muscles or skill get trained?', min: 1, max: 5, defaultValue: 4 },
  { id: 'pump', label: 'How strong was the target-muscle pump?', min: 0, max: 5, defaultValue: 3 },
  { id: 'technique', label: 'How consistent was your technique?', min: 1, max: 5, defaultValue: 4 },
  { id: 'pain', label: 'Did any movement create joint pain or irritation?', min: 0, max: 5, defaultValue: 0 },
  { id: 'endFatigue', label: 'How fatigued were you at the end?', min: 1, max: 5, defaultValue: 3 },
  { id: 'timeFit', label: 'How well did the session fit the time you had?', min: 1, max: 5, defaultValue: 4 },
  { id: 'productive', label: 'How productive did the session feel?', min: 1, max: 5, defaultValue: 4 },
  { id: 'enjoyment', label: 'How much did you enjoy today’s training?', min: 1, max: 5, defaultValue: 4 }
]

export function PostSurveyModal({
  open,
  completedSets,
  totalSets,
  volume,
  estimatedStrength,
  onClose,
  onSubmit,
  onSkip
}: {
  open: boolean
  completedSets: number
  totalSets: number
  volume: number
  estimatedStrength: number
  onClose: () => void
  onSubmit: (answers: SurveyAnswer[], note: string) => void
  onSkip: () => void
}) {
  const initial = useMemo(() => Object.fromEntries(questions.map((question) => [question.id, question.defaultValue])), [])
  const [values, setValues] = useState<Record<string, number>>(initial)
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [note, setNote] = useState('')

  const toggleSkipped = (id: string) => setSkipped((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const submit = () => onSubmit(questions.map((question) => ({
    id: question.id,
    value: skipped.has(question.id) ? null : values[question.id],
    status: skipped.has(question.id) ? 'skipped' : 'answered'
  })), note)

  return (
    <Modal open={open} onClose={onClose} title="How did the work land?" description={`${completedSets} of ${totalSets} sets are complete. Unfinished work creates no volume debt.`} wide>
      <div className="finish-summary">
        <div><small>Completed sets</small><strong>{completedSets}</strong></div>
        <div><small>Volume load</small><strong>{volume.toLocaleString()}</strong></div>
        <div><small>Best estimated strength</small><strong>{Math.round(estimatedStrength).toLocaleString()}</strong></div>
      </div>
      <div className="survey-grid post-survey-grid">
        {questions.map((question, index) => (
          <fieldset className={`survey-question ${skipped.has(question.id) ? 'is-skipped' : ''}`} key={question.id}>
            <legend><span>{String(index + 1).padStart(2, '0')}</span>{question.label}</legend>
            <div className="scale-row">
              {Array.from({ length: question.max - question.min + 1 }, (_, offset) => question.min + offset).map((value) => (
                <button key={value} type="button" className={values[question.id] === value && !skipped.has(question.id) ? 'selected' : ''} onClick={() => {
                  setValues((current) => ({ ...current, [question.id]: value }))
                  setSkipped((current) => { const next = new Set(current); next.delete(question.id); return next })
                }}>{value}</button>
              ))}
            </div>
            <button type="button" className="text-button" onClick={() => toggleSkipped(question.id)}>{skipped.has(question.id) ? 'Answer this question' : 'Skip question'}</button>
          </fieldset>
        ))}
      </div>
      <label className="field-label" htmlFor="session-note">Anything the numbers missed? <span>Optional</span></label>
      <textarea id="session-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Equipment issue, joint feel, interruption, unusual success..." />
      <div className="modal__actions">
        <button className="button button--ghost" onClick={onSkip}>Finish without survey</button>
        <button className="button button--primary" onClick={submit}>Save feedback & finish</button>
      </div>
    </Modal>
  )
}
