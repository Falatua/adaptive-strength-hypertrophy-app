import { useMemo, useState } from 'react'
import { muscleFeedbackQuestions, questionsForSurvey, surveyModeLabel } from '../domain/survey-engine'
import type { EffectiveSurveyMode, SurveyAnswer } from '../domain/types'
import { Modal } from './Modal'

export function PostSurveyModal({
  open,
  mode,
  completedSets,
  totalSets,
  volume,
  estimatedStrength,
  followUp = false,
  trainedMuscles,
  onClose,
  onSubmit,
  onSkip,
  onDefer
}: {
  open: boolean
  mode: Exclude<EffectiveSurveyMode, 'off'>
  completedSets: number
  totalSets: number
  volume: number
  estimatedStrength: number
  followUp?: boolean
  trainedMuscles?: { id: string; label: string }[]
  onClose: () => void
  onSubmit: (answers: SurveyAnswer[], note: string) => void
  onSkip: () => void
  onDefer?: () => void
}) {
  // Per-muscle questions come first: they are the ones that decide next week's volume.
  const questions = useMemo(() => [...muscleFeedbackQuestions(trainedMuscles ?? [], mode), ...questionsForSurvey('post', mode)], [mode, trainedMuscles])
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(questions.map((question) => [question.id, question.defaultValue])))
  const [statuses, setStatuses] = useState<Record<string, SurveyAnswer['status']>>(() => Object.fromEntries(questions.map((question) => [question.id, 'not-answered'])))
  const [note, setNote] = useState('')

  const setStatus = (id: string, status: SurveyAnswer['status']) => setStatuses((current) => ({ ...current, [id]: status }))

  const submit = () => onSubmit(questions.map((question) => ({
    id: question.id,
    value: statuses[question.id] === 'answered' ? values[question.id] : null,
    status: statuses[question.id] ?? 'not-answered'
  })), note)

  return (
    <Modal open={open} onClose={onClose} title={`${followUp ? 'Optional ' : ''}${surveyModeLabel[mode]} session feedback`} description={`${questions.length} optional questions. ${completedSets} of ${totalSets} sets are complete; unfinished sets will not be added to a later workout.`} wide>
      <div className="finish-summary">
        <div><small>Completed sets</small><strong>{completedSets}</strong></div>
        <div><small>Volume load</small><strong>{volume.toLocaleString()}</strong></div>
        <div><small>Best estimated strength</small><strong>{Math.round(estimatedStrength).toLocaleString()}</strong></div>
      </div>
      <div className="survey-grid post-survey-grid">
        {questions.map((question, index) => (
          <fieldset className={`survey-question ${statuses[question.id] !== 'answered' ? 'is-unanswered' : ''}`} key={question.id}>
            <legend><span>{String(index + 1).padStart(2, '0')}</span>{question.label}</legend>
            <div className="scale-row">
              {Array.from({ length: question.max - question.min + 1 }, (_, offset) => question.min + offset).map((value) => (
                <button key={value} type="button" aria-label={`${question.label}: ${value}${value === question.min && question.lowLabel ? `, ${question.lowLabel}` : value === question.max && question.highLabel ? `, ${question.highLabel}` : ''}`} className={values[question.id] === value && statuses[question.id] === 'answered' ? 'selected' : ''} onClick={() => {
                  setValues((current) => ({ ...current, [question.id]: value }))
                  setStatus(question.id, 'answered')
                }}>{value}</button>
              ))}
            </div>
            {question.lowLabel && question.highLabel && (
              <div className="scale-anchors" aria-hidden="true"><small>{question.min} · {question.lowLabel}</small><small>{question.highLabel} · {question.max}</small></div>
            )}
            <div className="question-unknown-actions"><button type="button" className={statuses[question.id] === 'skipped' ? 'selected' : ''} onClick={() => setStatus(question.id, 'skipped')}>Skip</button><button type="button" className={statuses[question.id] === 'not-sure' ? 'selected' : ''} onClick={() => setStatus(question.id, 'not-sure')}>Not sure</button><button type="button" className={statuses[question.id] === 'prefer-not' ? 'selected' : ''} onClick={() => setStatus(question.id, 'prefer-not')}>Prefer not</button></div>
          </fieldset>
        ))}
      </div>
      <label className="field-label" htmlFor="session-note">Anything the numbers missed? <span>Optional</span></label>
      <textarea id="session-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Equipment issue, joint feel, interruption, unusual success..." />
      <div className="modal__actions">
        <button className="button button--ghost" onClick={onSkip}>{followUp ? 'Dismiss feedback' : 'Finish without survey'}</button>
        {onDefer && <button className="button button--secondary" onClick={onDefer}>Remind me later</button>}
        <button className="button button--primary" onClick={submit}>{followUp ? 'Save feedback' : 'Save feedback & finish'}</button>
      </div>
    </Modal>
  )
}
