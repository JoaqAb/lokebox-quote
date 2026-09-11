import { dataConfigFrom, restHeaders, restUrl, type DataConfig } from './config'

// Unico punto de escritura contra la base. Solo inserta: nunca hace select,
// nunca lanza, nunca devuelve el body y nunca toca la pantalla (SPEC 7.3).
// Sin reintentos y sin cola: un lead perdido es aceptable, un usuario bloqueado no.

export type InsertOutcome = 'ok' | 'skipped' | 'failed'

// La config se toma una sola vez, al cargar el modulo.
const config: DataConfig | null = dataConfigFrom(import.meta.env)

let warnedAboutMissingConfig = false

export async function insertRow(
  table: string,
  row: Record<string, unknown>,
): Promise<InsertOutcome> {
  if (config === null) {
    if (!warnedAboutMissingConfig) {
      warnedAboutMissingConfig = true
      console.warn(
        'insertRow: sin VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, los inserts quedan en no-op',
      )
    }
    return 'skipped'
  }

  try {
    const response = await fetch(restUrl(config, table), {
      method: 'POST',
      headers: restHeaders(config),
      body: JSON.stringify(row),
    })
    if (!response.ok) {
      console.error(`insertRow: ${table} respondio ${String(response.status)}`)
      return 'failed'
    }
    return 'ok'
  } catch (error) {
    console.error(`insertRow: ${table} fallo`, error)
    return 'failed'
  }
}
