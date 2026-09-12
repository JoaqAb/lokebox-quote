import { describe, expect, it } from 'vitest'
import { PERF, nextTier, type PerfTier } from './perfTier'

describe('nextTier', () => {
  // 12.12
  it('baja de a un nivel por debajo del umbral, no se mueve por encima y del 2 no baja', () => {
    const flojo = PERF.minFps - 1
    const sobrado = PERF.minFps + 15

    expect(nextTier(0, flojo)).toBe(1)
    expect(nextTier(1, flojo)).toBe(2)
    expect(nextTier(2, flojo)).toBe(2)

    expect(nextTier(0, sobrado)).toBe(0)
    expect(nextTier(1, sobrado)).toBe(1)
    expect(nextTier(2, sobrado)).toBe(2)

    // Justo en el umbral todavia no baja.
    expect(nextTier(0, PERF.minFps)).toBe(0)

    // El descenso es monotono: desde cualquier nivel, nunca devuelve uno mas alto.
    const niveles: PerfTier[] = [0, 1, 2]
    for (const nivel of niveles) {
      expect(nextTier(nivel, flojo)).toBeGreaterThanOrEqual(nivel)
      expect(nextTier(nivel, sobrado)).toBe(nivel)
    }
  })
})

describe('PERF.dpr', () => {
  // 12.13
  it('el techo baja nivel a nivel y el nivel 0 es el dpr inicial del Canvas', () => {
    expect(PERF.dpr[0][1]).toBeGreaterThan(PERF.dpr[1][1])
    expect(PERF.dpr[1][1]).toBeGreaterThan(PERF.dpr[2][1])
    expect(PERF.dpr[2]).toEqual([1, 1])
    // SignPreview le pasa al Canvas exactamente PERF.dpr[0]: una sola fuente de verdad.
    expect(PERF.dpr[0]).toEqual([1, 1.75])
    for (const tier of [0, 1, 2] as PerfTier[]) {
      expect(PERF.dpr[tier][0]).toBe(1)
    }
  })
})

// Umbrales recalibrados en TAREA_008 (SPEC 12, version 1.6).
describe('umbrales de PERF', () => {
  // 7.1
  it('el umbral queda por debajo de todo techo de vsync habitual', () => {
    for (const hz of [30, 60, 90, 120]) {
      expect(PERF.minFps, `una pantalla sana a ${String(hz)} Hz no puede degradarse`).toBeLessThan(
        hz,
      )
    }
    // Por debajo de 24 la escena si se ve a los tirones: el umbral no es simbolico.
    expect(PERF.minFps).toBeGreaterThanOrEqual(20)
  })

  // 7.1
  it('el calentamiento cubre la compilacion de shaders y la ventana no es mas corta', () => {
    expect(PERF.warmupMs).toBeGreaterThanOrEqual(2000)
    expect(PERF.windowMs).toBeGreaterThanOrEqual(PERF.warmupMs)
  })

  // 7.1
  it('una pantalla a 30 Hz no baja de nivel, que era la causa raiz de TAREA_008', () => {
    expect(nextTier(0, 30)).toBe(0)
    expect(nextTier(1, 30)).toBe(1)
  })
})
