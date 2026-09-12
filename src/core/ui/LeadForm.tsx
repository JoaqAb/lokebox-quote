import { useState } from 'react'
import { validateLeadForm, type LeadFormErrors } from '../lead/validateLeadForm'
import type { LeadContact } from '../lead/leadRow'
import type { ClientTexts } from '../types'

// Formulario de lead. Los errores no muestran texto: aria-invalid y borde de acento.

const FIELD_BASE =
  'w-full rounded-xl q-panel px-3 py-2 text-sm text-[var(--q-text)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-accent)]'
const FIELD_OK = `${FIELD_BASE} min-h-11 border q-hairline`
const FIELD_ERROR = `${FIELD_BASE} min-h-11 border border-[var(--q-accent)]`
const NOTE_CLASS = `${FIELD_BASE} min-h-20 border q-hairline`

type LeadFormProps = {
  texts: ClientTexts
  sending: boolean
  onSubmit: (contact: LeadContact) => void
}

export function LeadForm({ texts, sending, onSubmit }: LeadFormProps) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<LeadFormErrors>({ name: false, contact: false })

  function handleSubmit(): void {
    if (sending) {
      return
    }
    const found = validateLeadForm({ name, contact })
    setErrors(found)
    if (found.name || found.contact) {
      return
    }
    onSubmit({ name, value: contact, note })
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        handleSubmit()
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--q-muted)]">{texts.formName}</span>
        <input
          type="text"
          value={name}
          aria-invalid={errors.name}
          className={errors.name ? FIELD_ERROR : FIELD_OK}
          onChange={(event) => {
            setName(event.currentTarget.value)
          }}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--q-muted)]">{texts.formContact}</span>
        <input
          type="text"
          value={contact}
          aria-invalid={errors.contact}
          className={errors.contact ? FIELD_ERROR : FIELD_OK}
          onChange={(event) => {
            setContact(event.currentTarget.value)
          }}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--q-muted)]">{texts.formNote}</span>
        <textarea
          value={note}
          rows={3}
          className={NOTE_CLASS}
          onChange={(event) => {
            setNote(event.currentTarget.value)
          }}
        />
      </label>

      <button
        type="submit"
        disabled={sending}
        className="min-h-11 w-full rounded-xl border border-[var(--q-accent)] bg-[var(--q-accent)] px-4 text-sm font-semibold text-[var(--q-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-accent)] disabled:opacity-60"
      >
        {sending ? texts.formSending : texts.formSubmit}
      </button>
    </form>
  )
}
