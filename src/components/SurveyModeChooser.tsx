import { CheckCircle2, Gauge, ListChecks, Play, Zap } from 'lucide-react'
import type { EffectiveSurveyMode } from '../domain/types'
import { Modal } from './Modal'

export function SurveyModeChooser({
  open, cadence, onClose, onChoose, onSkip
}: {
  open: boolean
  cadence: 'pre' | 'post'
  onClose: () => void
  onChoose: (mode: Exclude<EffectiveSurveyMode, 'off'>) => void
  onSkip: () => void
}) {
  const starting = cadence === 'pre'
  const choices: { mode: Exclude<EffectiveSurveyMode, 'off'>; title: string; detail: string; icon: typeof ListChecks }[] = starting ? [
    { mode: 'full', title: 'Full', detail: '10 questions · about 60 seconds', icon: ListChecks },
    { mode: 'quick', title: 'Quick', detail: '5 decision-relevant questions · about 30 seconds', icon: Gauge },
    { mode: 'minimal', title: 'Minimal', detail: '3 essential questions · about 15 seconds', icon: Zap }
  ] : [
    { mode: 'full', title: 'Full', detail: 'Complete session and trained-muscle feedback', icon: ListChecks },
    { mode: 'quick', title: 'Quick', detail: 'Core progression and recovery feedback', icon: Gauge },
    { mode: 'minimal', title: 'Minimal', detail: 'Difficulty, technique, and pain only', icon: Zap }
  ]
  return <Modal open={open} onClose={onClose} title={starting ? 'How much check-in fits today?' : 'How much feedback fits today?'} description="Choose each time. The question budget changes data collection, never workout access or training credit.">
    <div className="survey-mode-choices">
      {choices.map(({ mode, title, detail, icon: Icon }) => <button key={mode} onClick={() => onChoose(mode)}><Icon size={19} /><span><strong>{title}</strong><small>{detail}</small></span><CheckCircle2 size={17} /></button>)}
    </div>
    <button className="survey-mode-skip" onClick={onSkip}><Play size={17} /> {starting ? 'Start workout without check-in' : 'Finish workout without survey'}</button>
    <p className="modal-note">Unanswered, skipped, not-sure, and private responses remain unknown. Your plan stays as it is, and the app will learn from the work you finish instead of guessing how you feel.</p>
  </Modal>
}
