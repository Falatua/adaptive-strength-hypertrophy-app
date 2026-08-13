import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * A panel whose body can be folded away. Progress and You carry more detail than any one visit needs,
 * so each section keeps its heading visible and hides its body until asked for. The heading keeps its
 * own controls: the toggle is a separate button, never a click target wrapped around them.
 */
export function CollapsiblePanel({ className = 'panel', header, label, ariaLabel, defaultOpen = false, children }: {
  className?: string
  header: ReactNode
  label: string
  ariaLabel?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()
  return (
    <section className={`${className} panel--collapsible ${open ? 'is-open' : 'is-closed'}`} aria-label={ariaLabel}>
      <div className="panel__collapse-row">
        {header}
        <button
          type="button"
          className="panel__collapse-toggle"
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={`${open ? 'Hide' : 'Show'} ${label}`}
          onClick={() => setOpen((current) => !current)}
        >
          <ChevronDown size={18} />
        </button>
      </div>
      <div id={bodyId} hidden={!open}>{children}</div>
    </section>
  )
}
