import type {
  ClientConfig,
  LightingVisual,
  MaterialVisual,
  SignSelection,
} from '../../core/types'

// Lo que el preview necesita para dibujar, y nada mas. Funcion pura, sin React.
// El preview no recibe ClientConfig y no busca nada por id: eso se resuelve aca.

export type SignVisual = {
  material: MaterialVisual
  lighting: LightingVisual
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

export function resolveSignVisual(config: ClientConfig, selection: SignSelection): SignVisual {
  const material = findById(config.options.materials, selection.materialId, 'material')
  const lighting = findById(config.options.lighting, selection.lightingId, 'iluminacion')
  return {
    material: material.visual,
    lighting: lighting.visual,
    lengthToMeters: lengthToMeters(config.units.length),
  }
}
