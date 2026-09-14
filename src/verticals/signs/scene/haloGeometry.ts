import { Float32BufferAttribute, PlaneGeometry } from 'three'
import { haloCellUv, type HaloCellKind } from './sceneGeometry'

// Geometrias de las nueve celdas del halo (SPEC 12, version 1.12). Un plano de 1 x 1 por
// tipo de celda, con sus coordenadas de textura sobre el degradado radial. Se crean una vez
// y se escalan por frame: el tamano no vive en la geometria. Mismo patron de cache y
// dispose que la textura de la sombra de apoyo.

const cache = new Map<HaloCellKind, PlaneGeometry>()

export function haloCellGeometry(kind: HaloCellKind): PlaneGeometry {
  const known = cache.get(kind)
  if (known !== undefined) {
    return known
  }
  const geometry = new PlaneGeometry(1, 1)
  geometry.setAttribute('uv', new Float32BufferAttribute(haloCellUv(kind), 2))
  cache.set(kind, geometry)
  return geometry
}

export function disposeHaloGeometry(): void {
  for (const geometry of cache.values()) {
    geometry.dispose()
  }
  cache.clear()
}
