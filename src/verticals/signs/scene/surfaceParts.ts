import { BufferGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { BOX_FACES } from '../../../core/preview/physicalSurface'
import { EDGE_SEGMENTS, panelEdgeRadius } from './sceneGeometry'

// Cara y cascara de una geometria (SPEC 12, version 2.1, D50). El bloom selecciona mallas
// enteras, y en back la cara de un cartel opaco no emite: si panel y letras fueran una sola
// malla, la cara apagada entraria al bloom con los cantos. Se dibujan como dos mallas sobre
// los mismos atributos: la cara, con el grupo frontal, y la cascara, con los cantos y la
// cara trasera. Los atributos se comparten, asi la GPU recibe un solo buffer.
// Liberar una parte libera los buffers compartidos: las dos se liberan juntas, al desmontar.

export type SurfaceParts = { face: BufferGeometry; shell: BufferGeometry }

function subset(source: BufferGeometry, keep: (materialIndex: number) => boolean): BufferGeometry {
  const part = new BufferGeometry()
  // Con indice (TextGeometry) o sin el (RoundedBoxGeometry): los grupos cuentan lo mismo.
  part.setIndex(source.index)
  for (const [name, attribute] of Object.entries(source.attributes)) {
    part.setAttribute(name, attribute)
  }
  for (const group of source.groups) {
    const materialIndex = group.materialIndex ?? 0
    if (keep(materialIndex)) {
      part.addGroup(group.start, group.count, materialIndex)
    }
  }
  return part
}

export function splitSurface(source: BufferGeometry, faceIndex: number): SurfaceParts {
  return {
    face: subset(source, (index) => index === faceIndex),
    shell: subset(source, (index) => index !== faceIndex),
  }
}

export function disposeSurfaceParts(parts: SurfaceParts): void {
  parts.face.dispose()
  parts.shell.dispose()
}

// El panel con los cantos redondeados (SPEC 12, version 2.4), en metros. RoundedBoxGeometry
// dobla cada cara hasta la mitad del canto, a 45 grados, y conserva los seis grupos: la cara
// lleva su mitad del redondeo y la cascara el resto, asi la particion del bloom sigue igual.
// El radio vive en metros y no escala bien con scale, por eso la geometria se arma a la medida
// objetivo y solo la transicion del slider la estira, lo que dura el damp. La arma y la libera
// quien la dibuja, cuando cambia la medida y al desmontar.
export function roundedPanelParts(width: number, height: number, thickness: number): SurfaceParts {
  const geometry = new RoundedBoxGeometry(width, height, thickness, EDGE_SEGMENTS, panelEdgeRadius(thickness))
  return splitSurface(geometry, BOX_FACES.front)
}
