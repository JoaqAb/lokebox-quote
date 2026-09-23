import { BoxGeometry, BufferGeometry } from 'three'

// Cara y cascara de una geometria (SPEC 12, version 2.1, D50). El bloom selecciona mallas
// enteras, y en back la cara de un cartel opaco no emite: si panel y letras fueran una sola
// malla, la cara apagada entraria al bloom con los cantos. Se dibujan como dos mallas sobre
// los mismos atributos: la cara, con el grupo frontal, y la cascara, con los cantos y la
// cara trasera. Los atributos se comparten, asi la GPU recibe un solo buffer.
// Liberar una parte libera los buffers compartidos: las dos se liberan juntas, al desmontar.

export type SurfaceParts = { face: BufferGeometry; shell: BufferGeometry }

function subset(source: BufferGeometry, keep: (materialIndex: number) => boolean): BufferGeometry {
  const part = new BufferGeometry()
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

// Orden de las caras de BoxGeometry: +x, -x, +y, -y, frente, atras.
export const PANEL_FACES = { count: 6, front: 4 } as const

// El panel en unidades, escalado por frame. Uno solo mientras vive el preview.
let panel: SurfaceParts | null = null

export function panelParts(): SurfaceParts {
  if (panel === null) {
    panel = splitSurface(new BoxGeometry(1, 1, 1), PANEL_FACES.front)
  }
  return panel
}

export function disposePanelParts(): void {
  if (panel !== null) {
    disposeSurfaceParts(panel)
  }
  panel = null
}
