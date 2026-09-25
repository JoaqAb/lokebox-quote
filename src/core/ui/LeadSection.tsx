import { useState } from 'react'
import type { LeadContact } from '../lead/leadRow'
import { whatsappLink } from '../lead/whatsapp'
import type { ClientTexts, CtaMode } from '../types'
import { LeadForm } from './LeadForm'
import { ThanksScreen } from './ThanksScreen'

// Unico componente con estado del flujo del lead. No hay estado de error:
// un insert fallido termina igual en thanks, por SPEC 7.3.
// Desde la version 2.13 (D131, SPEC 7.4) el clic de WhatsApp tambien pasa a thanks: el enlace
// nativo abre wa.me en otra pestana, el insert sale sin esperarse y el bloque muestra la
// confirmacion con el boton a la hoja, igual que el formulario.
// Desde la version 2.8 (D93) vive en el bloque fijo de precio: los botones van en una fila, y el
// formulario y la confirmacion se abren en el mismo bloque.

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

const PRIMARY = 'q-control q-on'
const SECONDARY = 'q-control q-off'

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
      <section data-cta className="mt-3">
        <ThanksScreen texts={texts} quoteHref={quoteHref} />
      </section>
    )
  }

  return (
    <section data-cta className="mt-3 flex flex-col gap-2">
      {state === 'idle' ? (
        <div className="flex gap-2">
          {showWhatsapp ? (
            <a
              href={whatsappLink(whatsappNumber, whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                onWhatsappClick()
                setState('thanks')
              }}
              className={`${PRIMARY} flex-1`}
            >
              {texts.ctaWhatsapp}
            </a>
          ) : null}
          {showForm ? (
            <button
              type="button"
              className={`${showWhatsapp ? SECONDARY : PRIMARY} flex-1`}
              onClick={() => {
                setState('form')
              }}
            >
              {texts.ctaForm}
            </button>
          ) : null}
        </div>
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
