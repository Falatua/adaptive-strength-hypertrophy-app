import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export function Modal({ open, title, description, onClose, children, wide }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={dialogRef} className={`modal ${wide ? 'modal--wide' : ''}`} onCancel={onClose} onClose={onClose}>
      <div className="modal__header">
        <div>
          <p className="eyebrow">ForgePath decision</p>
          <h2>{title}</h2>
          {description && <p className="muted">{description}</p>}
        </div>
        <button className="icon-button" onClick={onClose} aria-label={`Close ${title}`}><X size={20} /></button>
      </div>
      <div className="modal__body">{children}</div>
    </dialog>
  )
}
