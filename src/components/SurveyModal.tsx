import { useMemo, useState } from 'react'
import { questionsForSurvey, surveyModeLabel } from '../domain/survey-engine'
import type { EffectiveSurveyMode, SurveyAnswer } from '../domain/types'
import { Modal } from './Modal'

export function SurveyModal({ open, mode, onClose, onSubmit, onSkip }: { open: boolean; mode: Exclude<EffectiveSurveyMode, 'off'>; onClose: () => void; onSubmit: (answers: SurveyAnswer[]) => void; onSkip: () => void }) {
  const questions = useMemo(() => questionsForSurvey('pre', mode), [mode])
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(questions.map((question) => [question.id, question.defaultValue])))
  const [statuses, setStatuses] = useState<Record<string, SurveyAnswer['status']>>(() => Object.fromEntries(questions.map((question) => [question.id, 'not-answered'])))

  const submit = () => onSubmit(questions.map((question) => ({
    id: question.id,
    value: statuses[question.id] === 'answered' ? values[question.id] : null,
    status: statuses[question.id] ?? 'not-answered'
  })))

  const setStatus = (id: string, status: SurveyAnswer['status']) => setStatuses((current) => ({ ...current, [id]: status }))

  return (
    <Modal open={open} onClose={onClose} title={`${surveyModeLabel[mode]} readiness check`} description={`${questions.length} optional questions. This forms a hypothesis; warm-up performance remains the ground truth.`} wide>
      <div className="survey-grid">
        {questions.map((question, index) => (
          <fieldset className={`survey-question ${statuses[question.id] !== 'answered' ? 'is-unanswered' : ''}`} key={question.id}>
            <legend><span>{String(index + 1).padStart(2, '0')}</span>{question.label}</legend>
            {question.type === 'scale' ? (
              <>
              <div className="scale-row">
                {Array.from({ length: question.max - question.min + 1 }, (_, offset) => question.min + offset).map((value) => (
                  <button key={value} type="button" aria-label={`${question.label}: ${value}${value === question.min && question.lowLabel ? `, ${question.lowLabel}` : value === question.max && question.highLabel ? `, ${question.highLabel}` : ''}`} className={values[question.id] === value && statuses[question.id] === 'answered' ? 'selected' : ''} onClick={() => { setValues((current) => ({ ...current, [question.id]: value })); setStatus(question.id, 'answered') }}>{value}</button>
                ))}
              </div>
              {question.lowLabel && question.highLabel && (
                <div className="scale-anchors" aria-hidden="true"><small>{question.min} · {question.lowLabel}</small><small>{question.highLabel} · {question.max}</small></div>
              )}
              </>
            ) : (
              <input aria-label={question.label} type="number" min={question.min} max={question.max} placeholder={String(question.defaultValue)} value={statuses[question.id] === 'answered' ? values[question.id] : ''} onChange={(event) => { setValues((current) => ({ ...current, [question.id]: Number(event.target.value) })); setStatus(question.id, 'answered') }} />
            )}
            <div className="question-unknown-actions"><button type="button" className={statuses[question.id] === 'skipped' ? 'selected' : ''} onClick={() => setStatus(question.id, 'skipped')}>Skip</button><button type="button" className={statuses[question.id] === 'not-sure' ? 'selected' : ''} onClick={() => setStatus(question.id, 'not-sure')}>Not sure</button><button type="button" className={statuses[question.id] === 'prefer-not' ? 'selected' : ''} onClick={() => setStatus(question.id, 'prefer-not')}>Prefer not</button></div>
          </fieldset>
        ))}
      </div>
      <div className="modal__actions">
        <button className="button button--ghost" onClick={onSkip}>Start workout now</button>
        <button className="button button--primary" onClick={submit}>Use my check-in</button>
      </div>
    </Modal>
  )
}
