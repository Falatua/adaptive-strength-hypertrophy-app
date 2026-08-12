import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | null
  onCommit: (value: number) => void
}

// A number cell that stays exactly as typed while it is being edited.
// Clearing it leaves it blank instead of snapping to 0, so the next digit reads "1", never "01".
// The store only hears about complete numbers; an empty cell keeps the last committed value.
export function NumberField({ value, onCommit, onBlur, ...inputProps }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? (value === null ? '' : String(value))

  return (
    <input
      {...inputProps}
      type="number"
      value={display}
      onChange={(event) => {
        const raw = event.target.value
        setDraft(raw)
        const parsed = Number(raw)
        if (raw.trim() !== '' && Number.isFinite(parsed)) onCommit(parsed)
      }}
      onBlur={(event) => {
        // Leaving a cell empty is not a value, so the committed number stands.
        setDraft(null)
        onBlur?.(event)
      }}
    />
  )
}
