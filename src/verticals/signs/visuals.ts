import type {
  ClientConfig,
  LightingVisual,
  MaterialVisual,
  PricingMode,
  SignSelection,
} from '../../core/types'
import { TOTEM_TYPE_ID } from '../../core/clientConfig'

// Lo que el preview necesita para dibujar, y nada mas. Funcion pura, sin React.
// El preview no recibe ClientConfig y no busca nada por id: eso se resuelve aca.

export type SignVisual = {
  mode: PricingMode
  material: MaterialVisual
  lighting: LightingVisual
  // Profundidad de las letras en metros. Solo la usa el modo letters.
  depthMeters: number
  // El tipo totem se dibuja con poste y base (SPEC 12, version 1.15).
  totem: boolean
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

// Simbolo visible de la unidad de area, derivado de units.area del cliente. Vive en la
// vertical por la misma razon que lengthToMeters: core no sabe en que se mide un cartel.
// Un cliente nuevo con otra unidad se resuelve aca y sigue sin tocar su JSON.
export function areaUnitSymbol(unit: string): string {
  if (unit === 'm2') {
    return 'm²'
  }
  if (unit === 'sqft') {
    return 'sq ft'
  }
  throw new Error(`areaUnitSymbol: unidad de area desconocida: "${unit}"`)
}

function findById<T extends { id: string }>(list: T[], id: string, what: string): T {
  const found = list.find((item) => item.id === id)
  if (found === undefined) {
    throw new Error(`resolveSignVisual: ${what} invalido: "${id}"`)
  }
  return found
}

export function resolveSignVisual(config: ClientConfig, selection: SignSelection): SignVisual {
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
    lengthToMeters: lengthToMeters(config.units.length),
  }
}
