import { MeshPhysicalMaterial } from 'three'
import { disposeSurfaceTextures, setSurfaceRepeat, surfaceTextures, type FinishTextures } from '../../../core/preview/finishTextures'
import { BOX_SLOTS, QUARTER_TURN, createSurface, type Surface, type SurfaceSlot } from '../../../core/preview/physicalSurface'
import type { Finish } from '../../../core/types'
import { STANDOFF } from './sceneGeometry'
import { TEXT_FACE } from './typeface'

// Materiales de una superficie del cartel (SPEC 12, version 2.1): el panel, las letras
// corporeas o el relieve. Uno por cara, compartidos por la malla de la cara y la de la
// cascara, y en las letras por todas las letras: todas miden lo mismo y se ven igual.
// Desde TAREA_033 (D143) el armado, el acabado, la repeticion y la liberacion son del core
// (physicalSurface); aca quedan las caras de las letras y los separadores.
// Los parametros se aplican por frame desde SignBoard, con el damp del cartel.

const STANDOFF_FINISH: Finish = 'brushed'

// En las letras la UV sale de la posicion en alto de mayuscula: una unidad es el alto de la
// letra. Las tapas son horizontales; en los cantos la u sigue el contorno y la v la
// profundidad, asi la veta corre a lo largo del contorno.
const LETTER_SLOTS: SurfaceSlot[] = [TEXT_FACE.front, TEXT_FACE.sides, TEXT_FACE.back].map(
  (index): SurfaceSlot =>
    index === TEXT_FACE.sides
      ? { front: false, anisotropyRotation: 0, uv: (size) => [size.height, size.depth] }
      : { front: index === TEXT_FACE.front, anisotropyRotation: 0, uv: (size) => [size.height, size.height] },
)

export function panelSurface(): Surface {
  return createSurface(BOX_SLOTS)
}

export function letterSurface(): Surface {
  return createSurface(LETTER_SLOTS)
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
