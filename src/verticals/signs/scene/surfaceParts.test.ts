import { Box3, Vector3, type BufferGeometry } from 'three'
import { describe, expect, it } from 'vitest'
import { HALO, SET, haloProfile, type HaloCellKind } from './sceneGeometry'
import { haloCellMesh } from './haloGeometry'
import { BOX_FACES } from '../../../core/preview/physicalSurface'
import { disposeSurfaceParts, roundedPanelParts } from './surfaceParts'

// Normales de cada vertice de los grupos de una parte.
function normals(part: BufferGeometry): Vector3[] {
  const normal = part.getAttribute('normal')
  const values: Vector3[] = []
  for (const group of part.groups) {
    for (let index = group.start; index < group.start + group.count; index += 1) {
      values.push(new Vector3().fromBufferAttribute(normal, index))
    }
  }
  return values
}

// Cuanto mira al frente respecto de lo que mira a un costado: positivo si el frente manda.
function frontness(normal: Vector3): number {
  return normal.z - Math.max(Math.abs(normal.x), Math.abs(normal.y))
}

describe('panel con cantos redondeados (version 2.4)', () => {
  const parts = roundedPanelParts(2.4, 0.9, SET.sign.thickness)

  it('mide el panel y comparte los atributos entre cara y cascara', () => {
    const box = new Box3().setFromBufferAttribute(parts.face.getAttribute('position') as never)
    expect(box.getSize(new Vector3()).toArray().map((value) => Number(value.toFixed(6)))).toEqual([2.4, 0.9, SET.sign.thickness])
    expect(parts.face.getAttribute('position')).toBe(parts.shell.getAttribute('position'))
  })

  // El redondeo parte cada canto a 45 grados: la cara se queda con lo que mira mas al frente
  // que a un costado, hasta la esquina, donde las tres caras se tocan en el octante de esfera.
  it('la cara es el grupo del frente y mira mas al frente que a los costados', () => {
    expect(parts.face.groups.map((group) => group.materialIndex)).toEqual([BOX_FACES.front])
    const face = normals(parts.face)
    expect(face.length).toBeGreaterThan(0)
    for (const normal of face) {
      expect(frontness(normal)).toBeGreaterThanOrEqual(-1e-6)
    }
    expect(Math.max(...face.map((normal) => normal.z))).toBeCloseTo(1, 6)
    expect(Math.min(...face.map((normal) => normal.z))).toBeCloseTo(1 / Math.sqrt(3), 6)
  })

  it('la cascara son las otras cinco caras y ninguna mira mas al frente que a un costado', () => {
    expect(parts.shell.groups.map((group) => group.materialIndex).sort()).toEqual([0, 1, 2, 3, 5])
    const shell = normals(parts.shell)
    for (const normal of shell) {
      expect(frontness(normal)).toBeLessThanOrEqual(1e-6)
    }
    expect(Math.min(...shell.map((normal) => normal.z))).toBeCloseTo(-1, 6)
  })

  it('se libera sin romper', () => {
    const other = roundedPanelParts(1, 1, SET.sign.thickness)
    expect(() => {
      disposeSurfaceParts(other)
    }).not.toThrow()
  })
})

describe('celdas del halo (version 2.4, D65)', () => {
  const kinds: HaloCellKind[] = ['left', 'right', 'top', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight']

  it('el alpha de cada vertice es el perfil de su distancia al contorno, 1 pegado al cartel y 0 en el borde', () => {
    for (const kind of kinds) {
      const mesh = haloCellMesh(kind)
      const corner = kind.length > 6
      for (let index = 0; index < mesh.alphas.length; index += 1) {
        const x = mesh.positions[index * 3]
        const y = mesh.positions[index * 3 + 1]
        // Distancia al contorno en unidades de la banda: desde el lado o desde la esquina.
        const sx = kind.includes('eft') ? -1 : kind.includes('ight') ? 1 : 0
        const sy = kind.startsWith('top') ? 1 : kind.startsWith('bottom') ? -1 : 0
        const dx = sx === 0 ? 0 : x * sx + 0.5
        const dy = sy === 0 ? 0 : y * sy + 0.5
        const t = corner ? Math.hypot(dx, dy) : dx + dy
        expect(mesh.alphas[index], kind).toBeCloseTo(haloProfile(t), 6)
      }
      expect(Math.max(...mesh.alphas)).toBe(1)
      expect(Math.min(...mesh.alphas)).toBe(0)
    }
  })

  it('el centro va pleno y cada borde lleva un anillo por tramo del perfil', () => {
    expect(haloCellMesh('center').alphas).toEqual([1, 1, 1, 1])
    expect(haloCellMesh('right').alphas).toHaveLength(2 * (HALO.rings + 1))
    expect(haloCellMesh('topLeft').alphas).toHaveLength((HALO.rings + 1) * (HALO.arcSegments + 1))
  })
})
