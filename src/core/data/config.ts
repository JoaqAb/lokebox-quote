// Configuracion de la capa de datos. Pura y testeable: no lee import.meta.env adentro,
// recibe el objeto, asi el test no necesita entorno de navegador.

export type DataConfig = { url: string; key: string }

function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export function dataConfigFrom(env: Record<string, string | undefined>): DataConfig | null {
  const url = (env.VITE_SUPABASE_URL ?? '').trim()
  const key = (env.VITE_SUPABASE_ANON_KEY ?? '').trim()
  if (url.length === 0 || key.length === 0) {
    return null
  }
  return { url: withoutTrailingSlash(url), key }
}

export function restUrl(config: DataConfig, table: string): string {
  return `${withoutTrailingSlash(config.url)}/rest/v1/${table}`
}

// Los cuatro headers de PostgREST. return=minimal: no queremos el body de vuelta.
export function restHeaders(config: DataConfig): Record<string, string> {
  return {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }
}
