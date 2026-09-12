import { Color } from 'three'
import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../../clients'
import { defaultSelection } from '../../../core/clientConfig'
import { themeFromClient } from '../../../core/theme'
import { lengthToMeters } from '../visuals'
import {
  HALO,
  LIGHTING,
  SET,
  SIGN_TEXT,
  SUPPORT_SHADOW,
  haloBox,
  lampPosition,
  lightingParams,
  scenePalette,
  signBoxMeters,
  signPlacement,
  supportShadowBox,
} from './sceneGeometry'
import { hasWebGL } from './webgl'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

function factorOf(slug: string): number {
  return lengthToMeters(clientOrFail(slug).units.length)
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

  // 10.1
  it('el cartel se dibuja centrado en el origen, sin importar el tipo', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      for (const type of ['facade', 'totem']) {
        const placement = signPlacement({ ...defaultSelection(config), type }, factorOf(slug))
        expect(Object.keys(placement)).toEqual(['box'])
        expect(placement.box.width).toBeGreaterThan(0)
        expect(placement.box.height).toBeGreaterThan(0)
      }
    }
  })

  // 10.1
  it('el tipo no cambia la caja: totem perdio su geometria pero sigue siendo cotizable', () => {
    const config = clientOrFail('northline')
    const base = defaultSelection(config)
    const facade = signPlacement({ ...base, type: 'facade' }, factorOf('northline'))
    const totem = signPlacement({ ...base, type: 'totem' }, factorOf('northline'))
    expect(totem.box).toEqual(facade.box)
  })
})

describe('haloBox y supportShadowBox', () => {
  // 10.2
  it('el halo es mas grande que el cartel y queda detras de su cara', () => {
    const config = clientOrFail('norte')
    const placement = signPlacement(defaultSelection(config), factorOf('norte'))
    const halo = haloBox(placement)
    expect(halo.size[0]).toBeCloseTo(placement.box.width + 2 * HALO.padding, 10)
    expect(halo.size[1]).toBeCloseTo(placement.box.height + 2 * HALO.padding, 10)
    expect(halo.z).toBeLessThan(-SET.sign.thickness / 2)
  })

  // 10.2
  it('la sombra es mas ancha que alta y queda por debajo del cartel', () => {
    const config = clientOrFail('northline')
    const placement = signPlacement(defaultSelection(config), factorOf('northline'))
    const shadow = supportShadowBox(placement)
    expect(shadow.size[0]).toBeGreaterThan(placement.box.width)
    expect(shadow.size[1]).toBeLessThan(placement.box.height)
    expect(shadow.position[1]).toBeLessThan(0)
    expect(shadow.position[2]).toBeLessThan(0)
    expect(SUPPORT_SHADOW.opacity).toBeLessThan(0.5)
  })
})

describe('lightingParams y lampPosition', () => {
  // 12.4
  it('los tres modos existen y none no enciende nada', () => {
    expect(lightingParams('none')).toEqual(LIGHTING.none)
    expect(LIGHTING.none.emissiveIntensity).toBe(0)
    expect(LIGHTING.none.haloIntensity).toBe(0)
    expect(LIGHTING.none.lampIntensity).toBe(0)
  })

  // 12.4
  it('la emision y el halo crecen de none a back', () => {
    expect(LIGHTING.none.emissiveIntensity).toBeLessThan(LIGHTING.front.emissiveIntensity)
    expect(LIGHTING.front.emissiveIntensity).toBeLessThan(LIGHTING.back.emissiveIntensity)
    expect(LIGHTING.front.haloIntensity).toBeLessThan(LIGHTING.back.haloIntensity)
  })

  // 10.3
  it('cada modo lleva su caida: front es un foco y back un lavado', () => {
    expect(LIGHTING.back.lampDecay).toBeLessThan(LIGHTING.front.lampDecay)
    expect(LIGHTING.back.lampDistance).toBeGreaterThan(LIGHTING.front.lampDistance)
  })

  // 12.5
  it('lampPosition da null en none, adelante en front y detras en back', () => {
    const config = clientOrFail('northline')
    const placement = signPlacement(defaultSelection(config), factorOf('northline'))
    expect(lampPosition('none', placement)).toBeNull()
    const front = lampPosition('front', placement)
    const back = lampPosition('back', placement)
    if (front === null || back === null) {
      throw new Error('front y back tienen que tener lampara')
    }
    expect(front[2]).toBeGreaterThan(0)
    expect(back[2]).toBeLessThan(0)
    expect(front[1]).toBeGreaterThan(placement.box.height / 2)
  })

  // 12.5
  it('lanza con un modo desconocido, con el modo en el mensaje', () => {
    const config = clientOrFail('northline')
    const placement = signPlacement(defaultSelection(config), factorOf('northline'))
    expect(() => lightingParams('neon')).toThrow(/neon/)
    expect(() => lampPosition('neon', placement)).toThrow(/neon/)
  })
})

describe('scenePalette', () => {
  // 10.4
  it('queda solo lo que el cartel necesita, derivado del tema y sin negros', () => {
    for (const slug of listClientSlugs()) {
      const palette = scenePalette(themeFromClient(clientOrFail(slug)))
      expect(Object.keys(palette).sort()).toEqual(['shadow', 'signText'])
      for (const [nombre, color] of Object.entries(palette)) {
        expect(luminance(color), `${slug}.${nombre}`).toBeGreaterThan(0.02)
      }
    }
  })

  // 10.4
  it('el glifo es mas oscuro que la sombra: tiene que leerse sobre una cara clara', () => {
    for (const slug of listClientSlugs()) {
      const palette = scenePalette(themeFromClient(clientOrFail(slug)))
      expect(luminance(palette.signText), slug).toBeLessThan(luminance(palette.shadow))
    }
  })

  it('lanza si falta una variable del tema', () => {
    expect(() => scenePalette({ '--q-primary': '#101317' })).toThrow(/--q-text/)
  })
})

describe('SIGN_TEXT', () => {
  // 10.5
  it('el texto deja margen a los cuatro lados de la cara', () => {
    expect(SIGN_TEXT.marginRatio).toBeGreaterThan(0)
    expect(SIGN_TEXT.marginRatio).toBeLessThan(0.5)
    expect(SIGN_TEXT.maxHeightRatio).toBeLessThan(1)
  })
})

describe('hasWebGL', () => {
  // 12.10
  it('devuelve false en entorno node y no lanza', () => {
    expect(hasWebGL()).toBe(false)
  })
})
