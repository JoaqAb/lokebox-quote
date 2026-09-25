import type { MaterialVisual } from '../../core/types'
import { TOTEM_TYPE_ID } from './config'
import type { LightingVisual, Mount, PricingMode, SignSelection, SignsConfig } from './types'

// Lo que el preview necesita para dibujar, y nada mas. Funcion pura, sin React.
// El preview no recibe la config y no busca nada por id: eso se resuelve aca.

export type SignVisual = {
  mode: PricingMode
  material: MaterialVisual
  lighting: LightingVisual
  // Profundidad de las letras en metros. Solo la usa el modo letters.
  depthMeters: number
  // El tipo totem se dibuja con poste y base (SPEC 12, version 1.15).
  totem: boolean
  // Montaje del panel (SPEC 10, version 2.4, D68). null en letters, que no monta un panel.
  mount: Mount | null
  lengthToMeters: number
}

const METERS_PER_FOOT = 0.3048

export function lengthToMeters(unit: string): number {
  if (unit === 'm') {
    return 1
  }
  if (unit === 'ft') {
    return METERS_PER_FOOT
  }
  throw new Error(`lengthToMeters: unidad de longitud desconocida: "${unit}"`)
}

function findById<T extends { id: string }>(list: T[], id: string, what: string): T {
  const found = list.find((item) => item.id === id)
  if (found === undefined) {
    throw new Error(`resolveSignVisual: ${what} invalido: "${id}"`)
  }
  return found
}

export function resolveSignVisual(config: SignsConfig, selection: SignSelection): SignVisual {
  const material = findById(config.options.materials, selection.materialId, 'material')
  const lighting = findById(config.options.lighting, selection.lightingId, 'iluminacion')
  const signType = findById(config.options.types, selection.type, 'tipo de cartel')
  const depth = findById(config.options.depths, selection.depthId, 'profundidad')
  return {
    mode: signType.pricing,
    material: material.visual,
    lighting: lighting.visual,
    depthMeters: depth.visual.depthMeters,
    totem: signType.id === TOTEM_TYPE_ID,
    mount: signType.visual?.mount ?? null,
    lengthToMeters: lengthToMeters(config.units.length),
  }
}
