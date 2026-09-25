import { MeshPhysicalMaterial } from 'three'
import type { Finish, MaterialVisual } from '../types'
import { disposeSurfaceTextures, setSurfaceRepeat, surfaceTextures, type FinishTextures } from './finishTextures'

// Materiales fisicos de una superficie de la escena (SPEC 12, version 2.1, y SPEC 21.5): un
// MeshPhysicalMaterial por cara, con los parametros fisicos del visual del JSON y los mapas de su
// acabado. Cada cara lleva su clon de los mapas, con la repeticion de su propia medida, y su
// direccion de anisotropia. Aca solo se arma, se cambia de acabado, se repite el mapa y se
// libera: los parametros los aplica la vertical en su frame loop, con setPhysical. En el core
// desde TAREA_033 (D143).

// Medidas de la superficie en metros: ancho, alto y profundidad.
export type SurfaceSize = { width: number; height: number; depth: number }

export type SurfaceSlot = {
  front: boolean
  // Direccion de la anisotropia respecto de la u de la cara.
  anisotropyRotation: number
  // Metros que cubre una unidad de u y una de v en esta cara.
  uv: (size: SurfaceSize) => [number, number]
}

export type Surface = {
  materials: MeshPhysicalMaterial[]
  slots: SurfaceSlot[]
  finish: Finish | null
  textures: FinishTextures[]
}

// Orden de las caras de BoxGeometry, que RoundedBoxGeometry conserva: +x, -x, +y, -y, frente,
// atras.
export const BOX_FACES = { count: 6, front: 4 } as const

// En la caja, la u de los cantos laterales corre a lo largo de la profundidad: un cuarto de
// vuelta deja la veta a lo largo del canto, que es su direccion propia. La de arriba y la de
// abajo ya corren a lo ancho. BoxGeometry cubre cada cara con una UV de 0 a 1.
export const QUARTER_TURN = Math.PI / 2

export const BOX_SLOTS: SurfaceSlot[] = Array.from({ length: BOX_FACES.count }, (_unused, index): SurfaceSlot => {
  if (index <= 1) {
    return { front: false, anisotropyRotation: QUARTER_TURN, uv: (size) => [size.depth, size.height] }
  }
  if (index <= 3) {
    return { front: false, anisotropyRotation: 0, uv: (size) => [size.width, size.depth] }
  }
  return { front: index === BOX_FACES.front, anisotropyRotation: 0, uv: (size) => [size.width, size.height] }
})

export function createSurface(slots: SurfaceSlot[]): Surface {
  const materials = slots.map((slot) => {
    const material = new MeshPhysicalMaterial()
    material.anisotropyRotation = slot.anisotropyRotation
    return material
  })
  return { materials, slots, finish: null, textures: [] }
}

function releaseTextures(surface: Surface): void {
  for (const textures of surface.textures) {
    disposeSurfaceTextures(textures)
  }
  surface.textures = []
}

// Cambia los mapas al acabado pedido. El cambio es de golpe: un mapa no se amortigua.
export function applyFinish(surface: Surface, finish: Finish): void {
  if (surface.finish === finish) {
    return
  }
  releaseTextures(surface)
  surface.textures = surface.materials.map((material) => {
    const textures = surfaceTextures(finish)
    material.roughnessMap = textures.roughness
    material.normalMap = textures.normal
    material.needsUpdate = true
    return textures
  })
  surface.finish = finish
}

export function repeatSurface(surface: Surface, size: SurfaceSize): void {
  if (surface.finish === null) {
    return
  }
  const finish = surface.finish
  surface.slots.forEach((slot, index) => {
    const [u, v] = slot.uv(size)
    setSurfaceRepeat(surface.textures[index], finish, u, v)
  })
}

export function disposeSurface(surface: Surface): void {
  releaseTextures(surface)
  for (const material of surface.materials) {
    material.dispose()
  }
}

// Parametros fisicos del visual que se amortiguan con la pieza. El acabado y sus mapas cambian
// de golpe.
export const PHYSICAL_KEYS = ['metalness', 'roughness', 'specularIntensity', 'clearcoat', 'clearcoatRoughness', 'anisotropy', 'normalScale'] as const

export type PhysicalParams = Record<(typeof PHYSICAL_KEYS)[number], number>

export function physicalParamsOf(visual: MaterialVisual): PhysicalParams {
  return Object.fromEntries(PHYSICAL_KEYS.map((key) => [key, visual[key]])) as PhysicalParams
}

export function setPhysical(material: MeshPhysicalMaterial, params: PhysicalParams): void {
  material.metalness = params.metalness
  material.roughness = params.roughness
  material.specularIntensity = params.specularIntensity
  material.clearcoat = params.clearcoat
  material.clearcoatRoughness = params.clearcoatRoughness
  material.anisotropy = params.anisotropy
  material.normalScale.setScalar(params.normalScale)
}
