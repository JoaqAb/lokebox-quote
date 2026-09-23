import { MeshPhysicalMaterial } from 'three'
import {
  disposeSurfaceTextures,
  setSurfaceRepeat,
  surfaceTextures,
  type FinishTextures,
} from '../../../core/preview/finishTextures'
import type { Finish } from '../../../core/types'
import { STANDOFF } from './sceneGeometry'
import { PANEL_FACES } from './surfaceParts'
import { TEXT_FACE } from './typeface'

// Materiales de una superficie del cartel (SPEC 12, version 2.1): el panel, las letras
// corporeas o el relieve. Uno por cara, compartidos por la malla de la cara y la de la
// cascara, y en las letras por todas las letras: todas miden lo mismo y se ven igual.
// Cada cara lleva su clon de los mapas del acabado, con la repeticion de su propia medida,
// y su direccion de anisotropia.
// Los parametros se aplican por frame desde SignBoard, con el damp del cartel; aca solo se
// arma, se cambia de acabado, se repite el mapa y se libera.

// Medidas de la superficie en metros: ancho, alto y profundidad.
export type SurfaceSize = { width: number; height: number; depth: number }

type Slot = {
  front: boolean
  // Direccion de la anisotropia respecto de la u de la cara.
  anisotropyRotation: number
  // Metros que cubre una unidad de u y una de v en esta cara.
  uv: (size: SurfaceSize) => [number, number]
}

export type Surface = {
  materials: MeshPhysicalMaterial[]
  slots: Slot[]
  finish: Finish | null
  textures: FinishTextures[]
}

// En la caja, la u de los cantos laterales corre a lo largo de la profundidad: un cuarto de
// vuelta deja la veta a lo largo del canto, que es su direccion propia. La de arriba y la de
// abajo ya corren a lo ancho. BoxGeometry cubre cada cara con una UV de 0 a 1.
const QUARTER_TURN = Math.PI / 2
const STANDOFF_FINISH: Finish = 'brushed'
const PANEL_SLOTS: Slot[] = Array.from({ length: PANEL_FACES.count }, (_unused, index): Slot => {
  if (index <= 1) {
    return { front: false, anisotropyRotation: QUARTER_TURN, uv: (size) => [size.depth, size.height] }
  }
  if (index <= 3) {
    return { front: false, anisotropyRotation: 0, uv: (size) => [size.width, size.depth] }
  }
  return { front: index === PANEL_FACES.front, anisotropyRotation: 0, uv: (size) => [size.width, size.height] }
})

// En las letras la UV sale de la posicion en alto de mayuscula: una unidad es el alto de la
// letra. Las tapas son horizontales; en los cantos la u sigue el contorno y la v la
// profundidad, asi la veta corre a lo largo del contorno.
const LETTER_SLOTS: Slot[] = [TEXT_FACE.front, TEXT_FACE.sides, TEXT_FACE.back].map(
  (index): Slot =>
    index === TEXT_FACE.sides
      ? { front: false, anisotropyRotation: 0, uv: (size) => [size.height, size.depth] }
      : { front: index === TEXT_FACE.front, anisotropyRotation: 0, uv: (size) => [size.height, size.height] },
)

function createSurface(slots: Slot[]): Surface {
  const materials = slots.map((slot) => {
    const material = new MeshPhysicalMaterial()
    material.anisotropyRotation = slot.anisotropyRotation
    return material
  })
  return { materials, slots, finish: null, textures: [] }
}

export function panelSurface(): Surface {
  return createSurface(PANEL_SLOTS)
}

export function letterSurface(): Surface {
  return createSurface(LETTER_SLOTS)
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

// Material de los separadores (version 2.4): metal cepillado, con la veta a lo largo del eje.
// Los parametros son constantes del producto (STANDOFF), no del cliente.
export type StandoffSurface = { material: MeshPhysicalMaterial; textures: FinishTextures }

export function standoffSurface(): StandoffSurface {
  const textures = surfaceTextures(STANDOFF_FINISH)
  // El cilindro va de u alrededor y v a lo largo: la veta corre en v.
  setSurfaceRepeat(textures, STANDOFF_FINISH, Math.PI * STANDOFF.diameter, STANDOFF.wallGap)
  const material = new MeshPhysicalMaterial({
    color: STANDOFF.color,
    metalness: STANDOFF.metalness,
    roughness: STANDOFF.roughness,
    anisotropy: STANDOFF.anisotropy,
    anisotropyRotation: QUARTER_TURN,
    roughnessMap: textures.roughness,
    normalMap: textures.normal,
  })
  material.normalScale.setScalar(STANDOFF.normalScale)
  return { material, textures }
}

export function disposeStandoffSurface(surface: StandoffSurface): void {
  disposeSurfaceTextures(surface.textures)
  surface.material.dispose()
}
