import type { PriceResult } from '../types'

// Fila de la tabla leads, con las columnas exactas de SPEC 9.
// id, created_at y status los pone la base.

export type LeadChannel = 'whatsapp' | 'form'

export type LeadContact = { name: string; value: string; note: string }

export type LeadRowInput = {
  clientSlug: string
  channel: LeadChannel
  selection: Record<string, unknown>
  result: PriceResult
  contact?: LeadContact
}

const MAX_TEXT = 500

function trimmed(value: string): string {
  return value.trim().slice(0, MAX_TEXT)
}

export function buildLeadRow(input: LeadRowInput): Record<string, unknown> {
  const contact = input.contact
  return {
    client_slug: input.clientSlug,
    channel: input.channel,
    selection: input.selection,
    price_total: input.result.total,
    price_min: input.result.min,
    price_max: input.result.max,
    // Sin contacto el lead viene del CTA de WhatsApp: van en null, no en string vacio.
    contact_name: contact === undefined ? null : trimmed(contact.name),
    contact_value: contact === undefined ? null : trimmed(contact.value),
    note: contact === undefined ? null : trimmed(contact.note),
  }
}
