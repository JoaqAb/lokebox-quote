import { describe, expect, it } from 'vitest'
import {
  STUDIO_LIGHT,
  STUDIO_VIEW,
  frameDistance,
  orbitPosition,
  startDirection,
  studioZoomFactor,
  zoomBy,
  zoomFromPinch,
} from './studioView'

// Tests del modo de estudio, movidos de la escena de carteles con el codigo en TAREA_033 (D143),
// sin cambiar ninguna asercion. Las medidas son las de los casos de carteles que los originaron:
// PANEL_THICKNESS es el espesor del panel de carteles, 0,14 m, que el core no conoce.
const PANEL_THICKNESS = 0.14

describe('camara del modo de estudio', () => {
  it('de frente y sin espesor, la distancia encuadra el cartel con 12 por ciento de margen por lado', () => {
    const aspect = 16 / 9
    const tan = Math.tan((STUDIO_VIEW.fovDeg * Math.PI) / 360)
    // Cartel ancho: manda el ancho.
    const ancho = frameDistance({ width: 6, height: 1, depth: 0 }, [0, 0, 1], aspect)
    expect(2 * ancho * tan * aspect).toBeCloseTo(6 * 1.24, 10)
    // Cartel alto: manda el alto.
    const alto = frameDistance({ width: 1, height: 2, depth: 0 }, [0, 0, 1], aspect)
    expect(2 * alto * tan).toBeCloseTo(2 * 1.24, 10)
  })

  // Proyecta una esquina con la camara en direction a distance y devuelve su posicion en
  // fraccion del semicuadro: 1 es el borde del cuadro.
  function projectCorner(corner: [number, number, number], direction: [number, number, number], distance: number, aspect: number) {
    const tan = Math.tan((STUDIO_VIEW.fovDeg * Math.PI) / 360)
    const [zx, zy, zz] = direction
    const flat = Math.hypot(zx, zz)
    const x = [zz / flat, 0, -zx / flat]
    const y = [zy * x[2], zz * x[0] - zx * x[2], -zy * x[0]]
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    const depth = distance - dot(corner, direction)
    return { u: dot(corner, x) / (depth * tan * aspect), v: dot(corner, y) / (depth * tan) }
  }

  function corners(width: number, height: number, depth: number): [number, number, number][] {
    const list: [number, number, number][] = []
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          list.push([(sx * width) / 2, (sy * height) / 2, (sz * depth) / 2])
        }
      }
    }
    return list
  }

  it('girando 360 grados en los dos polares extremos, ninguna esquina sale del cuadro y alguna toca el margen', () => {
    const aspect = 16 / 9
    const inside = 1 / (1 + 2 * STUDIO_VIEW.marginRatio)
    // Un panel ancho y el conjunto de 18 letras, las dos formas mas exigentes.
    const volumes = [
      { width: 6.096, height: 2.438, depth: PANEL_THICKNESS },
      { width: 11, height: 0.9, depth: 0.15 },
    ]
    for (const volume of volumes) {
      for (const polar of [STUDIO_VIEW.minPolar, STUDIO_VIEW.maxPolar]) {
        for (let azimuth = 0; azimuth < 360; azimuth += 5) {
          const a = (azimuth * Math.PI) / 180
          const direction: [number, number, number] = [Math.sin(polar) * Math.sin(a), Math.cos(polar), Math.sin(polar) * Math.cos(a)]
          const distance = frameDistance(volume, direction, aspect)
          const projected = corners(volume.width, volume.height, volume.depth).map((corner) => projectCorner(corner, direction, distance, aspect))
          const worst = Math.max(...projected.map(({ u, v }) => Math.max(Math.abs(u), Math.abs(v))))
          expect(worst).toBeLessThanOrEqual(inside + 1e-9)
          expect(worst).toBeCloseTo(inside, 9)
        }
      }
    }
  })

  it('de frente el panel queda mas cerca que con el 15 por ciento fijo sobre ancho y alto', () => {
    const aspect = 16 / 9
    const tan = Math.tan((STUDIO_VIEW.fovDeg * Math.PI) / 360)
    const direction: [number, number, number] = [0, Math.cos(STUDIO_VIEW.startPolar), Math.sin(STUDIO_VIEW.startPolar)]
    for (const [width, height] of [[2.438, 0.914], [6.096, 2.438], [2.5, 1], [6, 0.3]]) {
      const previous = Math.max((height * 1.3) / 2 / tan, (width * 1.3) / 2 / (tan * aspect))
      expect(frameDistance({ width, height, depth: PANEL_THICKNESS }, direction, aspect)).toBeLessThan(previous)
    }
  })

  it('la luz del modo cartel es la de estudio del producto: key sin ambiente', () => {
    expect(STUDIO_LIGHT.ambient).toBe(0)
    expect(STUDIO_LIGHT.keyIntensity).toBeGreaterThan(0)
    expect(STUDIO_LIGHT.keyElevationDeg).toBeGreaterThan(0)
  })

  it('orbitPosition: yaw positivo a la derecha, pitch negativo por debajo, a la distancia pedida', () => {
    const [x, y, z] = orbitPosition(30, -10, 5)
    expect(x).toBeGreaterThan(0)
    expect(y).toBeLessThan(0)
    expect(z).toBeGreaterThan(0)
    expect(Math.hypot(x, y, z)).toBeCloseTo(5, 10)
    expect(orbitPosition(0, 0, 3)).toEqual([0, 0, 3])
  })

  it('el zoom del modo cartel va de 1 a 0,55 de la base y no aleja nunca', () => {
    const range = { min: 1, max: 2.5 }
    expect(studioZoomFactor(1, range)).toBe(1)
    expect(studioZoomFactor(2.5, range)).toBeCloseTo(0.55, 10)
    expect(studioZoomFactor(0, range)).toBe(1)
    expect(studioZoomFactor(9, range)).toBeCloseTo(0.55, 10)
  })

  it('el polar del modo cartel nunca llega a verlo desde abajo', () => {
    expect(STUDIO_VIEW.maxPolar).toBeLessThan(Math.PI / 2)
    expect(STUDIO_VIEW.minPolar).toBe(0.6)
    expect(STUDIO_VIEW.startPolar).toBeGreaterThanOrEqual(STUDIO_VIEW.minPolar)
    expect(STUDIO_VIEW.startPolar).toBeLessThanOrEqual(STUDIO_VIEW.maxPolar)
  })
})

describe('zoom del preview (version 2.8, D91 y D92)', () => {
  it('la rueda y el pinch acercan y alejan dentro del rango de SPEC 12', () => {
    const range = { min: 1, max: 2.5 }
    expect(zoomBy(1, -100, range)).toBeGreaterThan(1)
    expect(zoomBy(1, 100, range)).toBe(1)
    expect(zoomBy(2.4, -1000, range)).toBe(2.5)
    expect(zoomFromPinch(1, 100, 200, range)).toBe(2)
    expect(zoomFromPinch(2, 100, 20, range)).toBe(1)
    expect(zoomFromPinch(1.5, 0, 50, range)).toBe(1.5)
  })
})

describe('arranque de la camara por vista (D151)', () => {
  it('sin arranque, la direccion es exactamente la de siempre: de frente con startPolar', () => {
    expect(startDirection()).toStrictEqual(orbitPosition(0, 90 - (STUDIO_VIEW.startPolar * 180) / Math.PI, 1))
    const [x, y, z] = startDirection()
    expect(x).toBe(0)
    expect(y).toBeCloseTo(Math.cos(STUDIO_VIEW.startPolar), 12)
    expect(z).toBeCloseTo(Math.sin(STUDIO_VIEW.startPolar), 12)
  })

  it('con arranque, la direccion es la de orbitPosition con ese azimut y ese polar', () => {
    const polar = 1
    expect(startDirection({ azimuthDeg: 35, polar })).toStrictEqual(orbitPosition(35, 90 - (polar * 180) / Math.PI, 1))
    const [x, y, z] = startDirection({ azimuthDeg: 35, polar })
    expect(y).toBeCloseTo(Math.cos(polar), 12)
    expect(x).toBeCloseTo(Math.sin(polar) * Math.sin((35 * Math.PI) / 180), 12)
    expect(z).toBeCloseTo(Math.sin(polar) * Math.cos((35 * Math.PI) / 180), 12)
  })

  it('un polar fuera de la orbita lanza con el valor en el mensaje', () => {
    expect(() => startDirection({ azimuthDeg: 0, polar: 0.5 })).toThrow(/0\.5/)
    expect(() => startDirection({ azimuthDeg: 0, polar: 1.6 })).toThrow(/1\.6/)
    expect(() => startDirection({ azimuthDeg: 0, polar: Number.NaN })).toThrow(/NaN/)
    expect(() => startDirection({ azimuthDeg: 0, polar: STUDIO_VIEW.minPolar })).not.toThrow()
    expect(() => startDirection({ azimuthDeg: 0, polar: STUDIO_VIEW.maxPolar })).not.toThrow()
  })
})
