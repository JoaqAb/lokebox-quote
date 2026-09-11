// Mensaje de WhatsApp desde la plantilla del cliente. Puro.

const PLACEHOLDER = /\{([A-Za-z0-9_]+)\}/g

export function buildWhatsappMessage(template: string, tokens: Record<string, string>): string {
  return template.replace(PLACEHOLDER, (_match: string, key: string): string => {
    const value = tokens[key]
    if (value === undefined) {
      // Es un error de la config del cliente: no se manda un mensaje a medias.
      throw new Error(`buildWhatsappMessage: no hay valor para el placeholder "${key}"`)
    }
    return value
  })
}

export function whatsappLink(number: string, message: string): string {
  const digits = number.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
