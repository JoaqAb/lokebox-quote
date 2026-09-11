import { validateClientConfig } from '../core/clientConfig'
import type { ClientConfig } from '../core/types'
import northline from './northline.json'
import norte from './norte.json'

// Registro de clientes de la demo. Imports estaticos: el bundle los resuelve en build.
// Agregar un cliente nuevo es agregar un JSON y una linea aca.
const RAW_CLIENTS: Record<string, unknown> = {
  northline,
  norte,
}

// Cada config se valida una sola vez y se guarda ya validada.
const cache = new Map<string, ClientConfig>()

export function listClientSlugs(): string[] {
  return Object.keys(RAW_CLIENTS)
}

export function getClient(slug: string): ClientConfig | null {
  const cached = cache.get(slug)
  if (cached !== undefined) {
    return cached
  }
  if (!Object.hasOwn(RAW_CLIENTS, slug)) {
    return null
  }
  const config = validateClientConfig(RAW_CLIENTS[slug])
  cache.set(slug, config)
  return config
}
