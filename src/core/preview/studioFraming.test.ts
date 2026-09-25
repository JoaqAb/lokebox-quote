import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { stripView } from './studioFraming'
import { STUDIO_VIEW, frameDistance, type FrameVolume, type Vec3 } from './studioView'

// Encuadre con la franja de controles (D155, D160): con franja 0 es el de siempre; con franja, la
// huella entra en el canvas menos la franja, centrada en ese rectangulo, con el mismo margen.

const VOLUMES: FrameVolume[] = [
  { width: 6.096, height: 2.438, depth: 0.14 },
  { width: 11, height: 0.9, depth: 0.15 },
  { width: 0.3, height: 0.15, depth: 0.2 },
]

function directionOf(azimuthDeg: number, polar: number): Vec3 {
  const a = (azimuthDeg * Math.PI) / 180
  return [Math.sin(polar) * Math.sin(a), Math.cos(polar), Math.sin(polar) * Math.cos(a)]
}

function corners({ width, height, depth }: FrameVolume): Vector3[] {
  const list: Vector3[] = []
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        list.push(new Vector3((sx * width) / 2, (sy * height) / 2, (sz * depth) / 2))
      }
    }
  }
  return list
}

// La camara del modo de estudio en direction a la distancia del encuadre, con el corrimiento de la
// franja, y el target y las esquinas en pixeles del canvas: x desde la izquierda, y desde arriba.
function project(volume: FrameVolume, direction: Vec3, width: number, height: number, strip: number) {
  const { visibleRatio, offsetY } = stripView(height, strip)
  const aspect = width / height
  const distance = frameDistance(volume, direction, aspect, visibleRatio)
  const camera = new PerspectiveCamera(STUDIO_VIEW.fovDeg, aspect, STUDIO_VIEW.near, STUDIO_VIEW.far)
  if (offsetY > 0) {
    camera.setViewOffset(width, height, 0, offsetY, width, height)
  }
  camera.updateProjectionMatrix()
  camera.position.set(direction[0] * distance, direction[1] * distance, direction[2] * distance)
  camera.lookAt(0, 0, 0)
  camera.updateMatrixWorld()
  const toPixel = (point: Vector3) => {
    const ndc = point.clone().project(camera)
    return { x: ((ndc.x + 1) / 2) * width, y: ((1 - ndc.y) / 2) * height }
  }
  return { center: toPixel(new Vector3(0, 0, 0)), corners: corners(volume).map(toPixel) }
}

describe('encuadre de estudio con la franja de controles', () => {
  it('con franja 0 el resultado es el de hoy: sin corrimiento y la misma distancia exacta', () => {
    expect(stripView(640, 0)).toEqual({ visibleRatio: 1, offsetY: 0 })
    for (const volume of VOLUMES) {
      for (let azimuth = 0; azimuth < 360; azimuth += 15) {
        const direction = directionOf(azimuth, STUDIO_VIEW.startPolar)
        expect(frameDistance(volume, direction, 16 / 9, stripView(640, 0).visibleRatio)).toBe(frameDistance(volume, direction, 16 / 9))
      }
    }
  })

  it('con franja, el target cae en el centro del rectangulo visible y la huella entra con el margen', () => {
    // Mobile de 390 de ancho con la zona de cajas, y escritorio: la franja de 56 px al pie.
    const sizes = [
      { width: 390, height: 292, strip: 56 },
      { width: 1040, height: 900, strip: 56 },
    ]
    const inside = 1 / (1 + 2 * STUDIO_VIEW.marginRatio)
    for (const { width, height, strip } of sizes) {
      const visible = height - strip
      for (const volume of VOLUMES) {
        for (const polar of [STUDIO_VIEW.minPolar, 1, STUDIO_VIEW.maxPolar]) {
          for (let azimuth = 0; azimuth < 360; azimuth += 15) {
            const { center, corners: points } = project(volume, directionOf(azimuth, polar), width, height, strip)
            expect(center.x).toBeCloseTo(width / 2, 6)
            expect(center.y).toBeCloseTo(visible / 2, 6)
            // Fraccion del semicuadro visible, con 1 en el borde: ninguna esquina sale del margen
            // y alguna lo toca.
            const worst = Math.max(...points.map(({ x, y }) => Math.max(Math.abs(x - width / 2) / (width / 2), Math.abs(y - visible / 2) / (visible / 2))))
            expect(worst).toBeLessThanOrEqual(inside + 1e-9)
            expect(worst).toBeCloseTo(inside, 6)
            // Nada de la huella queda debajo del borde de arriba de la franja.
            expect(Math.max(...points.map(({ y }) => y))).toBeLessThan(visible)
          }
        }
      }
    }
  })

  it('una franja negativa o que tapa todo el canvas lanza con los valores en el mensaje', () => {
    expect(() => stripView(300, -1)).toThrow('-1')
    expect(() => stripView(300, 300)).toThrow('300')
  })

  it('con franja la camara se aleja: el cuadro vertical es mas bajo', () => {
    const direction = directionOf(35, 1)
    const without = frameDistance(VOLUMES[0], direction, 390 / 292)
    const withStrip = frameDistance(VOLUMES[0], direction, 390 / 292, stripView(292, 56).visibleRatio)
    expect(withStrip).toBeGreaterThan(without)
  })
})
