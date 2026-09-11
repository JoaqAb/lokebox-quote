import { validateClientConfig } from '../core/clientConfig'
import type { ClientConfig } from '../core/types'

// Registro de clientes por descubrimiento de archivos (SPEC 4.3).
// Agregar un cliente es agregar su JSON y su logo: nadie edita este archivo.
// El nombre del archivo manda como slug y tiene que coincidir con el slug de adentro.

const JSON_SUFFIX = '.json'

const modules: Record<string, unknown> = import.meta.glob('./*.json', {
  eager: true,
  import: 'default',
})

function slugFromPath(path: string): string {
  const file = path.slice(path.lastIndexOf('/') + 1)
  return file.slice(0, file.length - JSON_SUFFIX.length)
}

const RAW_CLIENTS = new Map<string, unknown>()
for (const [path, raw] of Object.entries(modules)) {
  RAW_CLIENTS.set(slugFromPath(path), raw)
}

// Cada config se valida una sola vez y se guarda ya validada.
const cache = new Map<string, ClientConfig>()

export function listClientSlugs(): string[] {
  return [...RAW_CLIENTS.keys()].sort()
}

export function getClient(slug: string): ClientConfig | null {
  const cached = cache.get(slug)
  if (cached !== undefined) {
    return cached
  }
  const raw = RAW_CLIENTS.get(slug)
  if (raw === undefined) {
    return null
  }
  const config = validateClientConfig(raw)
  if (config.slug !== slug) {
    throw new Error(
      `Cliente "${slug}": el archivo se llama "${slug}${JSON_SUFFIX}" y su slug de adentro es "${config.slug}".`,
    )
  }
  cache.set(slug, config)
  return config
}
