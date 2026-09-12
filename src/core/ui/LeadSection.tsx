import { useState } from 'react'
import type { LeadContact } from '../lead/leadRow'
import { whatsappLink } from '../lead/whatsapp'
import type { ClientTexts, CtaMode } from '../types'
import { LeadForm } from './LeadForm'
import { ThanksScreen } from './ThanksScreen'

// Unico componente con estado del flujo del lead. No hay estado de error:
// un insert fallido termina igual en thanks, por SPEC 7.3.

type LeadState = 'idle' | 'form' | 'sending' | 'thanks'

type LeadSectionProps = {
  cta: CtaMode
  texts: ClientTexts
  whatsappNumber: string
  whatsappMessage: string
  onSubmitForm: (contact: LeadContact) => Promise<void>
  onWhatsappClick: () => void
  quoteHref?: string
}

const PRIMARY =
  'flex min-h-11 items-center justify-center rounded-xl border border-[var(--q-accent)] bg-[var(--q-accent)] px-4 text-sm font-semibold text-[var(--q-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-accent)]'
const SECONDARY =
  'flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-[var(--q-text)] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-accent)]'

export function LeadSection({
  cta,
  texts,
  whatsappNumber,
  whatsappMessage,
  onSubmitForm,
  onWhatsappClick,
  quoteHref,
}: LeadSectionProps) {
  const [state, setState] = useState<LeadState>('idle')

  const showWhatsapp = cta === 'whatsapp' || cta === 'both'
  const showForm = cta === 'form' || cta === 'both'

  async function handleSubmit(contact: LeadContact): Promise<void> {
    // Guard de doble submit: solo se envia desde el estado form.
    if (state !== 'form') {
      return
    }
    setState('sending')
    await onSubmitForm(contact)
    setState('thanks')
  }

  if (state === 'thanks') {
    return (
      <section className="mt-8">
        <ThanksScreen texts={texts} quoteHref={quoteHref} />
      </section>
    )
  }

  return (
    <section className="mt-8 flex flex-col gap-3">
      {state === 'idle' ? (
        <>
          {showWhatsapp ? (
            <a
              href={whatsappLink(whatsappNumber, whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onWhatsappClick}
              className={PRIMARY}
            >
              {texts.ctaWhatsapp}
            </a>
          ) : null}
          {showForm ? (
            <button
              type="button"
              className={showWhatsapp ? SECONDARY : PRIMARY}
              onClick={() => {
                setState('form')
              }}
            >
              {texts.ctaForm}
            </button>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-[var(--q-text)]">{texts.formTitle}</p>
          <LeadForm
            texts={texts}
            sending={state === 'sending'}
            onSubmit={(contact) => {
              void handleSubmit(contact)
            }}
          />
        </>
      )}
    </section>
  )
}
