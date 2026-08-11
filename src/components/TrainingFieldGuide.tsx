import { BookOpenCheck, ChevronRight } from 'lucide-react'

interface TrainingFieldGuideProps {
  route: string
  nextWin: string
  evidence: string
  onOpen: () => void
}

export function TrainingFieldGuide({ route, nextWin, evidence, onOpen }: TrainingFieldGuideProps) {
  return (
    <section className="training-field-guide" aria-label="Current training field guide">
      <header className="training-field-guide__header">
        <span><BookOpenCheck size={15} /> Field guide</span>
        <small>Route 01</small>
      </header>
      <dl className="training-field-guide__list">
        <div><dt>Path</dt><dd>{route}</dd></div>
        <div><dt>Next win</dt><dd>{nextWin}</dd></div>
        <div><dt>Evidence</dt><dd>{evidence}</dd></div>
      </dl>
      <button className="training-field-guide__action" onClick={onOpen}>
        <span className="training-field-guide__selector" aria-hidden="true" />
        Open route notes
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </section>
  )
}
