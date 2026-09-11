// Validacion del formulario de lead. Pura, sin texto: los errores se muestran
// con aria-invalid y borde de acento, no con mensajes.

export type LeadFormErrors = { name: boolean; contact: boolean }

const MIN_DIGITS = 6

function looksLikeEmail(value: string): boolean {
  const at = value.indexOf('@')
  return at > 0 && at < value.length - 1
}

function digitCount(value: string): number {
  return (value.match(/\d/g) ?? []).length
}

export function validateLeadForm(values: { name: string; contact: string }): LeadFormErrors {
  const contact = values.contact.trim()
  return {
    name: values.name.trim().length === 0,
    // Cubre mail y telefono sin pedir un formato exacto.
    contact: contact.length === 0 || (!looksLikeEmail(contact) && digitCount(contact) < MIN_DIGITS),
  }
}
