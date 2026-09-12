import { getClient } from '../clients'
import type { ClientConfig } from '../core/types'

// Resolucion del cliente de la ruta, compartida por las dos paginas que deciden vertical:
// el cotizador (QuotePage) y la hoja de cotizacion (QuoteSheetPage). Vive aparte para que
// la hoja no tenga que importar el modulo del cotizador, que arrastra el preview 3D.
// Si el cliente no existe o su config no valida, se muestra ErrorScreen y no se renderiza
// nada a medias (SPEC 10).

export const SIGNS_VERTICAL = 'signs'

export type Resolution = { ok: true; config: ClientConfig } | { ok: false; detail: string }

export function resolveClient(slug: string): Resolution {
  try {
    const config = getClient(slug)
    if (config === null) {
      return { ok: false, detail: `/d/${slug}` }
    }
    if (config.vertical !== SIGNS_VERTICAL) {
      return { ok: false, detail: `/d/${slug}: vertical "${config.vertical}"` }
    }
    return { ok: true, config }
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) }
  }
}
