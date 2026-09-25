import { getClient } from '../../clients'
import { validateClientConfig, verticalContextOf } from '../../core/clientConfig'
import type { ClientConfig } from '../../core/types'
import { validateSigns } from './config'
import type { SignsConfig } from './types'

// Ayudas de los tests de la vertical: un cliente del registro, o un JSON armado en el test, pasado
// por las dos validaciones en el orden de la app (el core y despues la vertical, SPEC 4.4). Solo
// las importan los tests.

export function signsConfigOf(slug: string): SignsConfig {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return validateSigns(client.json, verticalContextOf(client))
}

// Lo que hasta la version 2.12 devolvia validateClientConfig con todo el JSON: la config del core
// y la de la vertical juntas, con el texts del cliente entero. Mismos errores, mismo orden de capas.
export type ValidatedSignsClient = Omit<ClientConfig, 'texts'> & Omit<SignsConfig, 'texts'> & { texts: ClientConfig['texts'] & SignsConfig['texts'] }

export function validateSignsJson(raw: unknown): ValidatedSignsClient {
  const core = validateClientConfig(raw)
  const signs = validateSigns(core.json, verticalContextOf(core))
  return { ...core, ...signs, texts: { ...core.texts, ...signs.texts } }
}

// Un cliente del registro validado con validateSignsJson, como lo devolvia getClient hasta 2.12.
export function signsClientOf(slug: string): ValidatedSignsClient {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return validateSignsJson(client.json)
}
