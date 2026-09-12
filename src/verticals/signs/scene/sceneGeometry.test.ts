import { Color } from 'three'
import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../../clients'
import { defaultSelection } from '../../../core/clientConfig'
import { themeFromClient } from '../../../core/theme'
import type { SignSelection } from '../../../core/types'
import { lengthToMeters } from '../visuals'
import {
  AUTO_ORBIT,
  CAMERA,
  HALO,
  LAMP,
  LIGHTING,
  ORBIT,
  PREVIEW_ASPECT,
  SET,
  TOTEM,
  WINDOW_TOP,
  autoAzimuth,
  haloBox,
  lampPosition,
  lightingParams,
  scenePalette,
  signBoxMeters,
  signPlacement,
  visibleHalfSizeAt,
  type SignPlacement,
} from './sceneGeometry'
import { hasWebGL } from './webgl'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

// Los cuatro extremos de ancho y alto de un cliente.
function extremeSelections(slug: string, type = 'facade'): SignSelection[] {
  const config = clientOrFail(slug)
  const base = { ...defaultSelection(config), type }
  const { width, height } = config.options
  return [
    { ...base, width: width.min, height: height.min },
    { ...base, width: width.min, height: height.max },
    { ...base, width: width.max, height: height.min },
    { ...base, width: width.max, height: height.max },
  ]
}

function factorOf(slug: string): number {
  return lengthToMeters(clientOrFail(slug).units.length)
}

function totemPlacement(slug: string, width: number, height: number): SignPlacement {
  const base = defaultSelection(clientOrFail(slug))
  return signPlacement({ ...base, type: 'totem', width, height }, factorOf(slug))
}

function luminance(hex: string): number {
  const color = new Color(hex)
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722
}

describe('signBoxMeters', () => {
  // 12.6
  it('convierte a metros segun la unidad del cliente', () => {
    const northline = clientOrFail('northline')
    const en = signBoxMeters(
      { ...defaultSelection(northline), width: 8, height: 3 },
      lengthToMeters('ft'),
    )
    expect(en.width).toBeCloseTo(2.4384, 6)
    expect(en.height).toBeCloseTo(0.9144, 6)

    const norte = clientOrFail('norte')
    const es = signBoxMeters(
      { ...defaultSelection(norte), width: 2.5, height: 1 },
      lengthToMeters('m'),
    )
    expect(es.width).toBe(2.5)
    expect(es.height).toBe(1)
  })

  // 12.7
  it('en los cuatro extremos de los dos clientes el cartel entra en la fachada', () => {
    for (const slug of listClientSlugs()) {
      const factor = lengthToMeters(clientOrFail(slug).units.length)
      for (const selection of extremeSelections(slug)) {
        const box = signBoxMeters(selection, factor)
        expect(box.width / 2).toBeLessThanOrEqual(SET.facade.width / 2 - 0.3)
        expect(box.centerY + box.height / 2).toBeLessThanOrEqual(SET.facade.height - 0.2)
      }
    }
  })

  // 12.8
  it('en los mismos casos el cartel queda por encima de la vidriera', () => {
    for (const slug of listClientSlugs()) {
      const factor = lengthToMeters(clientOrFail(slug).units.length)
      for (const selection of extremeSelections(slug)) {
        const box = signBoxMeters(selection, factor)
        expect(box.centerY - box.height / 2).toBeGreaterThanOrEqual(WINDOW_TOP + 0.2)
      }
    }
  })
})

describe('scenePalette', () => {
  // 12.9
  it('deriva del tema: la fachada es el primary y la vereda es mas oscura', () => {
    for (const slug of listClientSlugs()) {
      const theme = themeFromClient(clientOrFail(slug))
      const palette = scenePalette(theme)
      expect(palette.facade.toLowerCase()).toBe(theme['--q-primary'].toLowerCase())
      expect(palette.doorFrame.toLowerCase()).toBe(theme['--q-bg'].toLowerCase())
      expect(palette.glass.toLowerCase()).toBe(theme['--q-accent'].toLowerCase())
      expect(luminance(palette.sidewalk)).toBeLessThan(luminance(palette.facade))
    }
  })

  it('lanza si falta una variable del tema', () => {
    expect(() => scenePalette({ '--q-primary': '#101317' })).toThrow(/--q-bg/)
  })
})

describe('hasWebGL', () => {
  // 12.10
  it('devuelve false en entorno node y no lanza', () => {
    expect(hasWebGL()).toBe(false)
  })
})


describe('signBoxMeters y signPlacement con totem', () => {
  // 12.1
  it('el centro del cartel de totem sale de la altura libre, en los dos clientes', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      const selection: SignSelection = { ...defaultSelection(config), type: 'totem' }
      const box = signBoxMeters(selection, factorOf(slug))
      expect(box.centerY).toBeCloseTo(TOTEM.clearance + box.height / 2, 10)
    }
  })

  // 12.2
  it('facade deja el cartel sobre la fachada y sin poste', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      const placement = signPlacement(defaultSelection(config), factorOf(slug))
      expect(placement.position).toEqual([0, placement.box.centerY, SET.sign.z])
      expect(placement.post).toBeNull()
    }
  })

  // 12.3
  it('totem deja el cartel sobre la vereda, con el poste del alto fijo y del ancho clampeado', () => {
    const expectedWidths: Record<string, [number, number, number]> = {
      northline: [2, 11, 20],
      norte: [0.6, 3.3, 6],
    }
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      const heights = config.options.height
      for (const width of expectedWidths[slug]) {
        const placement = totemPlacement(slug, width, heights.default)
        expect(placement.position).toEqual([TOTEM.x, placement.box.centerY, TOTEM.z])
        const post = placement.post
        if (post === null) {
          throw new Error('el totem tiene que tener poste')
        }
        expect(post.size[1]).toBeCloseTo(TOTEM.clearance + TOTEM.post.overlap, 10)
        expect(post.size[2]).toBe(TOTEM.post.depth)
        expect(post.position).toEqual([TOTEM.x, post.size[1] / 2, TOTEM.z])
        const free = placement.box.width * TOTEM.post.widthFactor
        const clamped = Math.min(Math.max(free, TOTEM.post.minWidth), TOTEM.post.maxWidth)
        expect(post.size[0]).toBeCloseTo(clamped, 10)
      }
      // El minimo y el maximo se tocan de verdad con los rangos de cada cliente.
      const narrow = totemPlacement(slug, config.options.width.min, heights.default)
      const wide = totemPlacement(slug, config.options.width.max, heights.default)
      expect(narrow.post?.size[0]).toBe(TOTEM.post.minWidth)
      expect(wide.post?.size[0]).toBe(TOTEM.post.maxWidth)
    }
  })

  // 12.4
  it('las dos funciones lanzan con un tipo desconocido, con el id en el mensaje', () => {
    const config = clientOrFail('northline')
    const selection: SignSelection = { ...defaultSelection(config), type: 'banner' }
    expect(() => signBoxMeters(selection, 1)).toThrow(/banner/)
    expect(() => signPlacement(selection, 1)).toThrow(/banner/)
  })

  // 12.5
  it('en los cuatro extremos el totem entra en cuadro, en los dos clientes', () => {
    const visible = visibleHalfSizeAt(TOTEM.z, PREVIEW_ASPECT)
    const visibleTop = CAMERA.position[1] + visible.halfHeight
    for (const slug of listClientSlugs()) {
      for (const selection of extremeSelections(slug, 'totem')) {
        const placement = signPlacement(selection, factorOf(slug))
        expect(placement.box.width / 2).toBeLessThanOrEqual(visible.halfWidth - 0.2)
        expect(placement.box.centerY + placement.box.height / 2).toBeLessThanOrEqual(visibleTop)
      }
    }
  })

  // 12.6
  it('en los mismos casos el borde inferior queda a la altura libre y el poste lo alcanza', () => {
    for (const slug of listClientSlugs()) {
      for (const selection of extremeSelections(slug, 'totem')) {
        const placement = signPlacement(selection, factorOf(slug))
        expect(placement.box.centerY - placement.box.height / 2).toBeCloseTo(TOTEM.clearance, 10)
        const post = placement.post
        if (post === null) {
          throw new Error('el totem tiene que tener poste')
        }
        expect(post.size[1]).toBeGreaterThanOrEqual(TOTEM.clearance)
      }
    }
  })
})

describe('iluminacion', () => {
  // 12.7
  it('lightingParams devuelve la tabla de los tres modos y lanza con cualquier otro', () => {
    expect(lightingParams('none')).toEqual(LIGHTING.none)
    expect(lightingParams('front')).toEqual(LIGHTING.front)
    expect(lightingParams('back')).toEqual(LIGHTING.back)
    expect(lightingParams('none').lampIntensity).toBe(0)
    expect(lightingParams('back').haloIntensity).toBeGreaterThan(0)
    expect(() => lightingParams('neon')).toThrow(/neon/)
  })

  // 12.8
  it('el halo es mas grande que el cartel y queda entre el apoyo y la cara trasera', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      const base = defaultSelection(config)
      for (const type of ['facade', 'totem']) {
        const placement = signPlacement({ ...base, type }, factorOf(slug))
        const halo = haloBox(placement)
        expect(halo.size[0]).toBeCloseTo(placement.box.width + 2 * HALO.padding, 10)
        expect(halo.size[1]).toBeCloseTo(placement.box.height + 2 * HALO.padding, 10)
        const backFace = placement.position[2] - SET.sign.thickness / 2
        expect(halo.position[2]).toBeLessThan(backFace)
        expect(halo.position[2]).toBeCloseTo(backFace - HALO.gap, 10)
      }
      // En facade el apoyo es la cara frontal de la fachada, en z = 0.
      const facade = signPlacement({ ...base, type: 'facade' }, factorOf(slug))
      expect(haloBox(facade).position[2]).toBeGreaterThan(0)
    }
  })

  // 12.9
  it('la luz dinamica esta donde corresponde en cada modo y en los dos tipos', () => {
    for (const slug of listClientSlugs()) {
      const base = defaultSelection(clientOrFail(slug))
      for (const type of ['facade', 'totem']) {
        const placement = signPlacement({ ...base, type }, factorOf(slug))
        expect(lampPosition('none', placement)).toBeNull()

        const front = lampPosition('front', placement)
        if (front === null) {
          throw new Error('front tiene que tener luz')
        }
        expect(front[1]).toBeGreaterThan(placement.position[1] + placement.box.height / 2)
        expect(front[2]).toBeGreaterThan(placement.position[2])
        expect(front[1]).toBeCloseTo(
          placement.position[1] + placement.box.height / 2 + LAMP.frontOffsetY,
          10,
        )

        const back = lampPosition('back', placement)
        if (back === null) {
          throw new Error('back tiene que tener luz')
        }
        expect(back[2]).toBeCloseTo(haloBox(placement).position[2], 10)
        expect(back[1]).toBeCloseTo(placement.position[1], 10)
      }
    }
  })
})

describe('scenePalette con el poste', () => {
  // 12.10
  it('devuelve el color del poste derivado de muted, mas oscuro, y lanza si falta', () => {
    for (const slug of listClientSlugs()) {
      const theme = themeFromClient(clientOrFail(slug))
      const palette = scenePalette(theme)
      expect(luminance(palette.post)).toBeLessThan(luminance(theme['--q-muted']))
      expect(luminance(palette.post)).toBeGreaterThan(0)
    }
    const sinMuted = themeFromClient(clientOrFail('northline'))
    delete sinMuted['--q-muted']
    expect(() => scenePalette(sinMuted)).toThrow(/--q-muted/)
  })
})

describe('autoAzimuth', () => {
  // 12.11
  it('barre dentro del clamp, pasa por los dos extremos y por el cero', () => {
    // La amplitud queda adentro del clamp por los dos lados: el barrido nunca lo toca.
    expect(AUTO_ORBIT.amplitude).toBeLessThan(ORBIT.maxAzimuthAngle)
    expect(AUTO_ORBIT.amplitude).toBeLessThan(-ORBIT.minAzimuthAngle)

    const samples: number[] = []
    const steps = 400
    for (let i = 0; i <= steps; i += 1) {
      const value = autoAzimuth((AUTO_ORBIT.periodSeconds * i) / steps)
      expect(Math.abs(value)).toBeLessThanOrEqual(AUTO_ORBIT.amplitude + 1e-12)
      samples.push(value)
    }
    expect(Math.max(...samples)).toBeCloseTo(AUTO_ORBIT.amplitude, 4)
    expect(Math.min(...samples)).toBeCloseTo(-AUTO_ORBIT.amplitude, 4)
    expect(Math.min(...samples.map((value) => Math.abs(value)))).toBeLessThan(1e-6)
    expect(autoAzimuth(0)).toBeCloseTo(0, 10)
  })
})

// Limites de orbita ampliados en TAREA_008 (SPEC 12, version 1.6).
describe('limites de ORBIT', () => {
  // 7.2
  it('el azimut es simetrico y mas ancho que el del bloque 2', () => {
    expect(ORBIT.maxAzimuthAngle).toBe(-ORBIT.minAzimuthAngle)
    expect(ORBIT.maxAzimuthAngle).toBeGreaterThan(0.4)
  })

  // 7.2
  it('el polar maximo se queda por debajo de pi/2, para no rasar la vereda', () => {
    expect(ORBIT.maxPolarAngle).toBeLessThan(Math.PI / 2)
    expect(ORBIT.minPolarAngle).toBeLessThan(ORBIT.maxPolarAngle)
    expect(ORBIT.minPolarAngle).toBeGreaterThan(0)
  })

  // 7.2
  it('el zoom es un rango creciente y positivo, con la distancia inicial adentro', () => {
    expect(ORBIT.enableZoom).toBe(true)
    expect(ORBIT.minDistance).toBeGreaterThan(0)
    expect(ORBIT.maxDistance).toBeGreaterThan(ORBIT.minDistance)
    const inicial = Math.hypot(
      CAMERA.position[0] - CAMERA.target[0],
      CAMERA.position[1] - CAMERA.target[1],
      CAMERA.position[2] - CAMERA.target[2],
    )
    expect(inicial).toBeGreaterThanOrEqual(ORBIT.minDistance)
    expect(inicial).toBeLessThanOrEqual(ORBIT.maxDistance)
  })

  // 7.2
  it('a la distancia maxima el borde de la vereda no entra en cuadro', () => {
    const semiAlto = Math.tan(((CAMERA.fov * Math.PI) / 180) / 2) * ORBIT.maxDistance
    const semiAncho = semiAlto * (16 / 9)
    expect(semiAncho).toBeLessThan(SET.sidewalk.width / 2)
  })

  // 7.2
  it('el barrido sigue sin llegar al tope del clamp nuevo', () => {
    expect(AUTO_ORBIT.amplitude).toBeLessThan(ORBIT.maxAzimuthAngle)
  })
})
