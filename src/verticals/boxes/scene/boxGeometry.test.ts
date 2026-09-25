import { describe, expect, it } from 'vitest'
import { STUDIO_VIEW, frameDistance } from '../../../core/preview/studioView'
import { boxRig, edgeRadius, frameOf, groupPose, logoSize, rigBounds, type BoxDims } from './boxGeometry'

const dims: BoxDims = { length: 0.254, width: 0.2032, height: 0.1016, thickness: 0.003, lidDepth: 0.4 }

describe('geometria de la caja (SPEC 21.5)', () => {
  it('cerrada, las tres formas miden el interior mas el espesor y apoyan en el piso', () => {
    for (const shape of ['mailer', 'two-piece', 'shipping'] as const) {
      const { min, max } = rigBounds(boxRig(shape, dims), 0)
      expect(min[1], shape).toBeCloseTo(0, 12)
      expect(max[0] - min[0], shape).toBeGreaterThanOrEqual(dims.length + 2 * dims.thickness - 1e-12)
      expect(max[2] - min[2], shape).toBeGreaterThanOrEqual(dims.width + 2 * dims.thickness - 1e-12)
      expect(max[1], shape).toBeGreaterThanOrEqual(dims.height + 2 * dims.thickness - 1e-12)
    }
  })

  it('abierta: la tapa del mailer y las solapas suben, la tapa de two-piece queda al costado en el piso', () => {
    const closedMailer = rigBounds(boxRig('mailer', dims), 0)
    const openMailer = rigBounds(boxRig('mailer', dims), 1)
    expect(openMailer.max[1]).toBeGreaterThan(closedMailer.max[1] + dims.width / 2)
    const shipping = rigBounds(boxRig('shipping', dims), 1)
    expect(shipping.max[1]).toBeGreaterThan(dims.height + dims.width / 3)
    const lid = boxRig('two-piece', dims).groups[1]
    const pose = groupPose(lid, 1)
    expect(pose.position[1]).toBeCloseTo(0, 12)
    expect(pose.position[0]).toBeGreaterThan(dims.length)
  })

  it('la caja de encuadre es la de la caja tal como esta: cerrada centrada, abierta con la tapa', () => {
    for (const shape of ['mailer', 'two-piece', 'shipping'] as const) {
      const rig = boxRig(shape, dims)
      for (const open of [0, 0.5, 1]) {
        const frame = frameOf(rig, open)
        const bounds = rigBounds(rig, open)
        for (let i = 0; i < 3; i += 1) {
          const size = [frame.volume.width, frame.volume.height, frame.volume.depth][i]
          expect(frame.center[i] - size / 2).toBeCloseTo(bounds.min[i], 12)
          expect(frame.center[i] + size / 2).toBeCloseTo(bounds.max[i], 12)
        }
      }
      const frame = frameOf(rig, 0)
      expect(frameDistance(frame.volume, [0, Math.cos(STUDIO_VIEW.startPolar), Math.sin(STUDIO_VIEW.startPolar)], 4 / 3)).toBeGreaterThan(0)
    }
  })

  it('cantos con radio nombrado y tope en el espesor; logo centrado con ancho relativo', () => {
    expect(edgeRadius(0.003)).toBe(0.0012)
    expect(edgeRadius(0.002)).toBeCloseTo(0.0009, 12)
    const [width, height] = logoSize([0.3, 0.2], 4)
    expect(width).toBeCloseTo(0.186, 12)
    expect(height).toBeCloseTo(0.0465, 12)
    const [narrow] = logoSize([0.3, 0.05], 4)
    expect(narrow).toBeCloseTo(0.1, 12)
  })
})
