import { verticalOf, type RegisteredVertical } from '../app/verticals'
import { getClient } from '../clients'
import { verticalContextOf } from '../core/clientConfig'
import type { ClientConfig } from '../core/types'

// Resolucion del cliente de la ruta, compartida por las dos paginas genericas: el cotizador
// (QuotePage) y la hoja de cotizacion (QuoteSheetPage). Vive aparte para que la hoja no tenga que
// importar el modulo del cotizador.
// Desde la version 2.13 (D133) busca la vertical del cliente en el registro de src/app y le pide
// que valide su parte del JSON. Un campo vertical que no esta en el registro es error de config
// (SPEC 4.3). Si el cliente no existe o su config no valida, se muestra ErrorScreen y no se
// renderiza nada a medias (SPEC 10).

export type ResolvedClient = {
  config: ClientConfig
  vertical: RegisteredVertical
  // La config de la vertical, que solo lee su propia logica.
  verticalConfig: unknown
}

export type Resolution = ({ ok: true } & ResolvedClient) | { ok: false; detail: string }

// Cada cliente se resuelve una sola vez, igual que getClient valida su config una sola vez.
const cache = new Map<string, ResolvedClient>()

export function resolveClient(slug: string): Resolution {
  const cached = cache.get(slug)
  if (cached !== undefined) {
    return { ok: true, ...cached }
  }
  try {
    const config = getClient(slug)
    if (config === null) {
      return { ok: false, detail: `/d/${slug}` }
    }
    const vertical = verticalOf(config.vertical)
    if (vertical === null) {
      return { ok: false, detail: `/d/${slug}: vertical "${config.vertical}"` }
    }
    const resolved = { config, vertical, verticalConfig: vertical.logic.validate(config.json, verticalContextOf(config)) }
    cache.set(slug, resolved)
    return { ok: true, ...resolved }
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) }
  }
}
