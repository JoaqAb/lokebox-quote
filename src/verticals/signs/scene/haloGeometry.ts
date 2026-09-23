import { BufferGeometry, Float32BufferAttribute } from 'three'
import { HALO, haloCellOutward, haloProfile, type HaloCellKind } from './sceneGeometry'

// Geometrias de las nueve celdas del halo (SPEC 12, version 2.4, D65). Cada celda es de 1 x 1
// y se escala por frame: el tamano no vive en la geometria. El perfil va en el alpha de cada
// vertice (color de cuatro componentes, con el rgb en 1: el color lo pone el material), asi
// no hay textura que muestrear ni un borde de malla con alpha distinto de 0.
// - centro: alpha 1 en toda la celda, detras del cartel.
// - borde: una tira de HALO.rings anillos a lo largo de la normal al contorno, del perfil 1
//   pegado al cartel al 0 en el borde de la banda.
// - esquina: un cuarto de circulo con centro en la esquina del cartel, en anillos y tramos. Lo
//   que queda de la celda fuera del radio no se dibuja: ahi el halo ya es 0.
// Se crean una vez y se liberan con disposeHaloGeometry al desmontar el preview.

export type HaloMesh = { positions: number[]; alphas: number[]; indices: number[] }

function stripMesh(kind: HaloCellKind): HaloMesh {
  const [ox, oy] = haloCellOutward(kind)
  const positions: number[] = []
  const alphas: number[] = []
  const indices: number[] = []
  for (let ring = 0; ring <= HALO.rings; ring += 1) {
    const t = ring / HALO.rings
    // Del lado del cartel (-0,5 en la direccion de afuera) al borde (+0,5).
    const along = t - 0.5
    const ends: [number, number][] = ox !== 0 ? [[along * ox, -0.5], [along * ox, 0.5]] : [[-0.5, along * oy], [0.5, along * oy]]
    for (const [x, y] of ends) {
      positions.push(x, y, 0)
      alphas.push(haloProfile(t))
    }
    if (ring > 0) {
      const a = (ring - 1) * 2
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  return { positions, alphas, indices }
}

function cornerMesh(kind: HaloCellKind): HaloMesh {
  const [ox, oy] = haloCellOutward(kind)
  // La esquina del cartel es la esquina de la celda del lado de adentro.
  const cx = -0.5 * ox
  const cy = -0.5 * oy
  const positions: number[] = []
  const alphas: number[] = []
  const indices: number[] = []
  const perRing = HALO.arcSegments + 1
  for (let ring = 0; ring <= HALO.rings; ring += 1) {
    const t = ring / HALO.rings
    for (let step = 0; step <= HALO.arcSegments; step += 1) {
      const angle = (step / HALO.arcSegments) * (Math.PI / 2)
      positions.push(cx + ox * t * Math.cos(angle), cy + oy * t * Math.sin(angle), 0)
      alphas.push(haloProfile(t))
    }
    if (ring > 0) {
      for (let step = 0; step < HALO.arcSegments; step += 1) {
        const a = (ring - 1) * perRing + step
        const b = a + perRing
        indices.push(a, b, a + 1, a + 1, b, b + 1)
      }
    }
  }
  return { positions, alphas, indices }
}

function centerMesh(): HaloMesh {
  return {
    positions: [-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0],
    alphas: [1, 1, 1, 1],
    indices: [0, 1, 2, 2, 1, 3],
  }
}

// Datos de la celda, puros, para los tests y para armar la geometria.
export function haloCellMesh(kind: HaloCellKind): HaloMesh {
  const [ox, oy] = haloCellOutward(kind)
  if (ox === 0 && oy === 0) {
    return centerMesh()
  }
  return ox !== 0 && oy !== 0 ? cornerMesh(kind) : stripMesh(kind)
}

const cache = new Map<HaloCellKind, BufferGeometry>()

export function haloCellGeometry(kind: HaloCellKind): BufferGeometry {
  const known = cache.get(kind)
  if (known !== undefined) {
    return known
  }
  const mesh = haloCellMesh(kind)
  const colors = mesh.alphas.flatMap((alpha) => [1, 1, 1, alpha])
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(mesh.positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 4))
  geometry.setIndex(mesh.indices)
  cache.set(kind, geometry)
  return geometry
}

export function disposeHaloGeometry(): void {
  for (const geometry of cache.values()) {
    geometry.dispose()
  }
  cache.clear()
}
