import { Color, PerspectiveCamera, Vector3 } from 'three'
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
  SUPPORT_SHADOW_COLOR,
  LETTERS,
  SIGN_MODE_BACK_FACE,
  SIGN_STUDIO_LIGHT,
  SIGN_VIEW,
  EDGE_RADIUS_M,
  STANDOFF,
  haloBox,
  haloCells,
  haloPeak,
  haloProfile,
  lettersContour,
  HALO_LETTERS_BAND,
  SHADOW_RECEIVER,
  TINT,
  floorReceiver,
  photoShadowOpacity,
  photoShadowVolume,
  tintRect,
  tintedLightColor,
  wallReceiver,
  panelEdgeRadius,
  standoffPositions,
  wallGap,
  photoCameraPose,
  containBox,
  zoomBy,
  zoomFromPinch,
  groundPointAt,
  orbitPosition,
  photoCameraDistance,
  signFrameDistance,
  signModeLightingParams,
  signZoomFactor,
  layoutLetters,
  lampPosition,
  lightingParams,
  scenePalette,
  signBoxMeters,
  signPlacement,
  supportShadowBox,
  TOTEM_BASE_DEPTH,
  TOTEM_BASE_HEIGHT,
  TOTEM_POST_DEPTH_FACTOR,
  TOTEM_POST_HEIGHT,
  TOTEM_STRUCTURE_METALNESS,
  TOTEM_STRUCTURE_ROUGHNESS,
  totemLayout,
  totemStructureColor,
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
    const halo = haloBox(placement, 'flush')
    expect(halo.size[0]).toBeCloseTo(placement.box.width + 2 * HALO.bandRatio * placement.box.height, 10)
    expect(halo.size[1]).toBeCloseTo(placement.box.height * (1 + 2 * HALO.bandRatio), 10)
    expect(halo.z).toBeLessThan(-SET.sign.thickness / 2)
  })

  // Version 2.4, D68: con standoff la pared se aleja y halo y sombra se corren con ella.
  it('con standoff halo y sombra se corren la separacion de pared', () => {
    const config = clientOrFail('northline')
    const placement = signPlacement(defaultSelection(config), factorOf('northline'))
    expect(haloBox(placement, 'standoff').z).toBeCloseTo(haloBox(placement, 'flush').z - STANDOFF.wallGap, 10)
    expect(supportShadowBox(placement, 'standoff').position[2]).toBeCloseTo(supportShadowBox(placement, 'flush').position[2] - STANDOFF.wallGap, 10)
    expect(haloBox(placement, null).z).toBe(haloBox(placement, 'flush').z)
    expect(wallGap('standoff')).toBe(0.03)
  })

  // 10.2
  it('la sombra es mas ancha que alta y queda por debajo del cartel', () => {
    const config = clientOrFail('northline')
    const placement = signPlacement(defaultSelection(config), factorOf('northline'))
    const shadow = supportShadowBox(placement, 'flush')
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
    expect(LIGHTING.none.faceEmissiveIntensity).toBe(0)
    expect(LIGHTING.none.edgeEmissiveIntensity).toBe(0)
    expect(LIGHTING.none.haloOpacity).toBe(0)
    expect(LIGHTING.none.lampIntensity).toBe(0)
  })

  // 12.4
  it('la emision de los cantos y el halo crecen de none a back', () => {
    expect(LIGHTING.none.edgeEmissiveIntensity).toBeLessThan(LIGHTING.front.edgeEmissiveIntensity)
    expect(LIGHTING.front.edgeEmissiveIntensity).toBeLessThan(LIGHTING.back.edgeEmissiveIntensity)
    expect(LIGHTING.front.haloOpacity).toBeLessThan(LIGHTING.back.haloOpacity)
  })

  it('en back la cara emite menos que en front, para que el texto se lea', () => {
    expect(LIGHTING.back.faceEmissiveIntensity).toBeLessThan(LIGHTING.front.faceEmissiveIntensity)
    expect(LIGHTING.back.haloOpacity).toBe(1)
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
    expect(lampPosition('none', placement, 'flush')).toBeNull()
    const front = lampPosition('front', placement, 'flush')
    const back = lampPosition('back', placement, 'standoff')
    if (front === null || back === null) {
      throw new Error('front y back tienen que tener lampara')
    }
    expect(front[2]).toBeGreaterThan(0)
    expect(back[2]).toBeLessThan(0)
    expect(front[1]).toBeGreaterThan(placement.box.height / 2)
  })

  // 12.5
  it('en modo cartel no hay halo y back apaga la cara, con los cantos encendidos', () => {
    for (const mode of ['none', 'front', 'back']) {
      expect(signModeLightingParams(mode).haloOpacity).toBe(0)
    }
    expect(signModeLightingParams('none')).toEqual({ ...LIGHTING.none, haloOpacity: 0 })
    expect(signModeLightingParams('front')).toEqual({ ...LIGHTING.front, haloOpacity: 0 })
    const back = signModeLightingParams('back')
    expect(back.faceEmissiveIntensity).toBe(0)
    expect(back.faceShade).toBe(SIGN_MODE_BACK_FACE.faceShade)
    expect(back.faceShade).toBeGreaterThan(0)
    expect(back.faceShade).toBeLessThan(0.25)
    expect(back.edgeEmissiveIntensity).toBe(LIGHTING.back.edgeEmissiveIntensity)
    // En modo vista la cara no se oscurece en ningun modo.
    expect([LIGHTING.none.faceShade, LIGHTING.front.faceShade, LIGHTING.back.faceShade]).toEqual([0, 0, 0])
    expect(() => signModeLightingParams('neon')).toThrow(/neon/)
  })

  it('lanza con un modo desconocido, con el modo en el mensaje', () => {
    const config = clientOrFail('northline')
    const placement = signPlacement(defaultSelection(config), factorOf('northline'))
    expect(() => lightingParams('neon')).toThrow(/neon/)
    expect(() => lampPosition('neon', placement, 'flush')).toThrow(/neon/)
  })
})

describe('scenePalette', () => {
  // 10.4
  // Editada en TAREA_019: la sombra deja de derivarse del tema y pasa a ser la constante de
  // escena; el texto sigue derivado y sin negros.
  it('queda solo lo que el cartel necesita: texto derivado del tema y sin negros, sombra de escena', () => {
    for (const slug of listClientSlugs()) {
      const palette = scenePalette(themeFromClient(clientOrFail(slug)))
      expect(Object.keys(palette).sort()).toEqual(['shadow', 'signText'])
      expect(luminance(palette.signText), `${slug}.signText`).toBeGreaterThan(0.02)
      expect(palette.shadow, slug).toBe(SUPPORT_SHADOW_COLOR)
    }
  })

  // Editada en TAREA_019: la sombra es casi negra y oscurece a cualquier fondo; el glifo,
  // que sigue saliendo del tema, queda por encima de ella.
  it('la sombra es casi negra y mas oscura que el glifo del texto', () => {
    expect(luminance(SUPPORT_SHADOW_COLOR)).toBeLessThan(0.01)
    for (const slug of listClientSlugs()) {
      const palette = scenePalette(themeFromClient(clientOrFail(slug)))
      expect(luminance(palette.shadow), slug).toBeLessThan(luminance(palette.signText))
    }
  })

  it('el color de la sombra no depende del tema: dos temas distintos dan la misma sombra', () => {
    const claro = scenePalette({ '--q-primary': '#f2f1ee', '--q-text': '#c7c2b9' })
    const oscuro = scenePalette({ '--q-primary': '#101317', '--q-text': '#f4f2ef' })
    expect(claro.signText).not.toBe(oscuro.signText)
    expect(claro.shadow).toBe(SUPPORT_SHADOW_COLOR)
    expect(oscuro.shadow).toBe(SUPPORT_SHADOW_COLOR)
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

describe('layoutLetters', () => {
  // Medida fija para el test: cada caracter avanza 0,5 de alto de letra y el espacio 0,25.
  const measure = (char: string): number => (char === ' ' ? 0.25 : 0.5)

  it('una caja por letra, sin caja para el espacio, centrada en 0', () => {
    const { boxes, totalWidth } = layoutLetters('AB C', 2, measure)
    // Avances en metros: 1 + 1 + 0,5 + 1 = 3,5.
    expect(totalWidth).toBeCloseTo(3.5, 10)
    expect(boxes.map((box) => box.char)).toEqual(['A', 'B', 'C'])
    expect(boxes.map((box) => box.x)).toEqual([-1.25, -0.25, 1.25])
    expect(boxes[0].width).toBeCloseTo(1 * LETTERS.fill, 10)
  })

  it('el ancho escala con el alto de letra', () => {
    const chico = layoutLetters('NORTE', 0.3, measure)
    const grande = layoutLetters('NORTE', 0.9, measure)
    expect(grande.totalWidth / chico.totalWidth).toBeCloseTo(3, 10)
    expect(grande.boxes).toHaveLength(5)
  })

  it('texto sin letras no dibuja cajas', () => {
    expect(layoutLetters('   ', 1, measure).boxes).toHaveLength(0)
  })
})

describe('halo de nueve celdas', () => {
  const placement = { box: { width: 2.4, height: 0.9 } }

  // Version 2.4, D65: banda de 0,3 del alto del cartel por lado.
  it('ninguna celda pasa la banda de 0,3 del alto del cartel', () => {
    const margin = placement.box.height * HALO.bandRatio
    expect(HALO.bandRatio).toBe(0.3)
    for (const cell of haloCells(placement)) {
      const right = Math.abs(cell.position[0]) + cell.size[0] / 2
      const top = Math.abs(cell.position[1]) + cell.size[1] / 2
      expect(right, cell.kind).toBeLessThanOrEqual(placement.box.width / 2 + margin + 1e-9)
      expect(top, cell.kind).toBeLessThanOrEqual(placement.box.height / 2 + margin + 1e-9)
    }
  })

  it('el perfil baja de 1 a 0, con derivada 0 en el borde y pendiente de hasta 1,5 veces la media', () => {
    expect(haloProfile(0)).toBe(1)
    expect(haloProfile(1)).toBe(0)
    const h = 1e-4
    expect((haloProfile(1) - haloProfile(1 - h)) / h).toBeCloseTo(0, 3)
    let previous = haloProfile(0)
    for (let i = 1; i <= 100; i += 1) {
      const value = haloProfile(i / 100)
      expect(value).toBeLessThanOrEqual(previous)
      expect(previous - value).toBeLessThanOrEqual(1.5 / 100 + 1e-9)
      previous = value
    }
  })

  it('el pico sale de la luz ambiente: pleno con poca luz, menor de dia, nunca negativo', () => {
    expect(haloPeak(0.35)).toBe(HALO.maxOpacity)
    expect(haloPeak(0.1)).toBe(HALO.maxOpacity)
    expect(haloPeak(0.9)).toBeLessThan(HALO.maxOpacity / 4)
    expect(haloPeak(0.9)).toBeGreaterThan(0)
    expect(haloPeak(1.2)).toBe(0)
  })
})

describe('contorno del halo en letters', () => {
  it('es la caja de la tinta en metros, con su centro, aunque no sea simetrica', () => {
    const contour = lettersContour({ minX: -2.1, maxX: 1.9, minY: -0.52, maxY: 0.52 }, 0.5)
    expect(contour.box.width).toBeCloseTo(2, 10)
    expect(contour.box.height).toBeCloseTo(0.52, 10)
    expect(contour.center[0]).toBeCloseTo(-0.05, 10)
    expect(contour.center[1]).toBeCloseTo(0, 10)
  })
})

describe('halo de letters (version 2.5, D75)', () => {
  it('la banda de letters es una fraccion del alto de letra entre 0,5 y 1,0, mas ancha que la del panel', () => {
    expect(HALO_LETTERS_BAND).toBeGreaterThanOrEqual(0.5)
    expect(HALO_LETTERS_BAND).toBeLessThanOrEqual(1)
    expect(HALO_LETTERS_BAND).toBeGreaterThan(HALO.bandRatio)
  })
})

describe('sombra proyectada en vista (version 2.5, D76)', () => {
  const box = { width: 2.4, height: 0.9 }

  it('el receptor de pared va detras del halo y mide el contorno mas el margen', () => {
    const wall = wallReceiver(box, 'standoff')
    expect(wall.z).toBeLessThan(haloBox({ box }, 'standoff').z)
    expect(wall.size).toEqual([box.width + 2 * SHADOW_RECEIVER.margin, box.height + 2 * SHADOW_RECEIVER.margin])
    expect(wallReceiver(box, 'flush').z).toBeGreaterThan(wall.z)
  })

  it('el receptor de piso cubre el totem mas el margen de piso, y sin linea de fachada llega al margen atras', () => {
    const volume = totemLayout(box).volume
    const free = floorReceiver(volume, null)
    expect(free.size).toEqual([volume.width + 2 * SHADOW_RECEIVER.floorMargin, volume.depth + 2 * SHADOW_RECEIVER.floorMargin])
    expect(free.centerZ).toBeCloseTo(0, 10)
    expect(SHADOW_RECEIVER.floorMargin).toBeGreaterThan(SHADOW_RECEIVER.margin)
  })

  // Version 2.7, D85: el receptor de piso termina en la linea de fachada.
  it('con linea de fachada el receptor termina en su profundidad, detras del apoyo', () => {
    const volume = totemLayout(box).volume
    const front = volume.depth / 2 + SHADOW_RECEIVER.floorMargin
    const clipped = floorReceiver(volume, -1.2)
    expect(clipped.centerZ + clipped.size[1] / 2).toBeCloseTo(front, 10)
    expect(clipped.centerZ - clipped.size[1] / 2).toBeCloseTo(-1.2, 10)
    // Una linea mas lejos que el margen no lo agranda, y una delante del apoyo lo deja en el apoyo.
    expect(floorReceiver(volume, -9).size[1]).toBeCloseTo(2 * front, 10)
    expect(floorReceiver(volume, 0.4).centerZ - floorReceiver(volume, 0.4).size[1] / 2).toBeCloseTo(0, 10)
  })

  it('groundPointAt devuelve el apoyo en (x, y) del anclaje y la linea de fachada detras de el', () => {
    const ground = { x: 0.23, y: 0.925, metersToWidth: 0.13 }
    const aspect = 16 / 9
    const pose = photoCameraPose(ground, { yawDeg: 0, pitchDeg: 0 }, 40, aspect)
    const origin = groundPointAt(pose, 40, aspect, ground.x, ground.y)
    if (origin === null) {
      throw new Error('el rayo del apoyo tiene que bajar al piso')
    }
    origin.forEach((value) => {
      expect(value).toBeCloseTo(0, 9)
    })
    const wall = groundPointAt(pose, 40, aspect, ground.x, 0.863)
    if (wall === null) {
      throw new Error('el rayo de la linea de fachada tiene que bajar al piso')
    }
    expect(wall[2]).toBeLessThan(-1)
    expect(wall[1]).toBe(0)
    // Proyectado de vuelta con la misma camara, cae en (x del apoyo, wallY).
    const camera = new PerspectiveCamera(40, aspect, 0.05, 200)
    camera.position.set(...pose.position)
    camera.lookAt(...pose.target)
    camera.updateMatrixWorld()
    const ndc = new Vector3(...wall).project(camera)
    expect((ndc.x + 1) / 2).toBeCloseTo(ground.x, 9)
    expect((1 - ndc.y) / 2).toBeCloseTo(0.863, 9)
    // Por encima del horizonte el rayo no baja al piso.
    expect(groundPointAt(pose, 40, aspect, ground.x, 0.2)).toBeNull()
  })

  it('la camara de sombra de vista cubre el receptor', () => {
    const volume = { width: 2.4, height: 0.9, depth: SET.sign.thickness }
    const wall = photoShadowVolume(volume, false)
    expect(wall.width).toBeCloseTo(volume.width + 2 * SHADOW_RECEIVER.margin, 10)
    expect(wall.depth).toBeGreaterThan(volume.depth + 2 * STANDOFF.wallGap)
    const floor = photoShadowVolume(volume, true)
    expect(floor.depth).toBeCloseTo(volume.depth + 2 * SHADOW_RECEIVER.floorMargin, 10)
  })

  it('a mas ambiente, menos sombra; sin key, nada', () => {
    const day = { ambient: 0.9, keyIntensity: 1.4, keyAzimuthDeg: -25, keyElevationDeg: 35 }
    expect(photoShadowOpacity(day)).toBeGreaterThan(photoShadowOpacity({ ...day, ambient: 1.4 }))
    expect(photoShadowOpacity(day)).toBeLessThanOrEqual(SHADOW_RECEIVER.maxOpacity)
    expect(photoShadowOpacity({ ...day, keyIntensity: 0 })).toBe(0)
    expect(photoShadowOpacity({ ...day, keyIntensity: 0, ambient: 0 })).toBe(0)
  })
})

describe('casado de tono (version 2.5, D77)', () => {
  it('el rectangulo esta centrado en el anchor y no depende del cartel', () => {
    const rect = tintRect(0.5, 0.38)
    expect(rect.left + rect.width / 2).toBeCloseTo(0.5, 10)
    expect(rect.top + rect.height / 2).toBeCloseTo(0.38, 10)
    expect([rect.width, rect.height]).toEqual([TINT.rectWidth, TINT.rectHeight])
  })

  it('sin tinte la luz es blanca, y con tinte mezcla segun la fuerza', () => {
    expect(tintedLightColor(null)).toEqual([1, 1, 1])
    const tint: [number, number, number] = [1.3, 0.95, 0.6]
    const mixed = tintedLightColor(tint)
    mixed.forEach((value, index) => {
      expect(value).toBeCloseTo(1 - TINT.strength + TINT.strength * tint[index], 10)
    })
  })
})

describe('separadores del standoff', () => {
  it('cuatro, uno por esquina, metidos hacia adentro y entre el panel y la pared', () => {
    const box = { width: 2.4, height: 0.9 }
    const positions = standoffPositions(box)
    expect(positions).toHaveLength(4)
    for (const [x, y, z] of positions) {
      expect(Math.abs(x)).toBeCloseTo(box.width / 2 - STANDOFF.inset, 10)
      expect(Math.abs(y)).toBeCloseTo(box.height / 2 - STANDOFF.inset, 10)
      expect(z).toBeCloseTo(-SET.sign.thickness / 2 - STANDOFF.wallGap / 2, 10)
    }
    expect(new Set(positions.map(([x, y]) => `${String(Math.sign(x))}${String(Math.sign(y))}`)).size).toBe(4)
    expect([STANDOFF.wallGap, STANDOFF.diameter, STANDOFF.metalness]).toEqual([0.03, 0.02, 1])
  })

  it('en un panel chico el inset no pasa de un cuarto del lado', () => {
    const [[x, y]] = standoffPositions({ width: 0.2, height: 0.16 })
    expect(Math.abs(x)).toBeCloseTo(0.1 - 0.05, 10)
    expect(Math.abs(y)).toBeCloseTo(0.08 - 0.04, 10)
  })
})

describe('cantos del panel', () => {
  it('radio de 4 mm con tope de 0,3 del espesor', () => {
    expect(panelEdgeRadius(SET.sign.thickness)).toBe(EDGE_RADIUS_M)
    expect(EDGE_RADIUS_M).toBe(0.004)
    expect(panelEdgeRadius(0.01)).toBeCloseTo(0.003, 10)
  })
})

describe('camara del viewer', () => {
  it('de frente y sin espesor, la distancia encuadra el cartel con 12 por ciento de margen por lado', () => {
    const aspect = 16 / 9
    const tan = Math.tan((SIGN_VIEW.fovDeg * Math.PI) / 360)
    // Cartel ancho: manda el ancho.
    const ancho = signFrameDistance({ width: 6, height: 1, depth: 0 }, [0, 0, 1], aspect)
    expect(2 * ancho * tan * aspect).toBeCloseTo(6 * 1.24, 10)
    // Cartel alto: manda el alto.
    const alto = signFrameDistance({ width: 1, height: 2, depth: 0 }, [0, 0, 1], aspect)
    expect(2 * alto * tan).toBeCloseTo(2 * 1.24, 10)
  })

  // Proyecta una esquina con la camara en direction a distance y devuelve su posicion en
  // fraccion del semicuadro: 1 es el borde del cuadro.
  function projectCorner(corner: [number, number, number], direction: [number, number, number], distance: number, aspect: number) {
    const tan = Math.tan((SIGN_VIEW.fovDeg * Math.PI) / 360)
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
    const inside = 1 / (1 + 2 * SIGN_VIEW.marginRatio)
    // Un panel ancho y el conjunto de 18 letras, las dos formas mas exigentes.
    const volumes = [
      { width: 6.096, height: 2.438, depth: SET.sign.thickness },
      { width: 11, height: 0.9, depth: 0.15 },
    ]
    for (const volume of volumes) {
      for (const polar of [SIGN_VIEW.minPolar, SIGN_VIEW.maxPolar]) {
        for (let azimuth = 0; azimuth < 360; azimuth += 5) {
          const a = (azimuth * Math.PI) / 180
          const direction: [number, number, number] = [Math.sin(polar) * Math.sin(a), Math.cos(polar), Math.sin(polar) * Math.cos(a)]
          const distance = signFrameDistance(volume, direction, aspect)
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
    const tan = Math.tan((SIGN_VIEW.fovDeg * Math.PI) / 360)
    const direction: [number, number, number] = [0, Math.cos(SIGN_VIEW.startPolar), Math.sin(SIGN_VIEW.startPolar)]
    for (const [width, height] of [[2.438, 0.914], [6.096, 2.438], [2.5, 1], [6, 0.3]]) {
      const previous = Math.max((height * 1.3) / 2 / tan, (width * 1.3) / 2 / (tan * aspect))
      expect(signFrameDistance({ width, height, depth: SET.sign.thickness }, direction, aspect)).toBeLessThan(previous)
    }
  })

  it('la luz del modo cartel es la de estudio del producto: key sin ambiente', () => {
    expect(SIGN_STUDIO_LIGHT.ambient).toBe(0)
    expect(SIGN_STUDIO_LIGHT.keyIntensity).toBeGreaterThan(0)
    expect(SIGN_STUDIO_LIGHT.keyElevationDeg).toBeGreaterThan(0)
  })

  it('en modo vista un metro ocupa metersToWidth del ancho de la foto', () => {
    const aspect = 16 / 9
    const d = photoCameraDistance(0.1, 40, aspect)
    const visibleWidth = 2 * d * Math.tan((40 * Math.PI) / 360) * aspect
    expect(1 / visibleWidth).toBeCloseTo(0.1, 10)
  })

  it('orbitPosition: yaw positivo a la derecha, pitch negativo por debajo, a la distancia pedida', () => {
    const [x, y, z] = orbitPosition(30, -10, 5)
    expect(x).toBeGreaterThan(0)
    expect(y).toBeLessThan(0)
    expect(z).toBeGreaterThan(0)
    expect(Math.hypot(x, y, z)).toBeCloseTo(5, 10)
    expect(orbitPosition(0, 0, 3)).toEqual([0, 0, 3])
  })

  // Version 2.6, D81: la camara de vista mira con los angulos del anchor y el anclaje cae en (x, y).
  it('photoCameraPose deja el anclaje en (x, y) de la foto, con cualquier yaw y pitch', () => {
    for (const [x, y, yaw, pitch] of [[0.23, 0.925, 0, 0], [0.501, 0.2, 0, 0], [0.7, 0.4, 20, -8], [0.3, 0.6, -35, 10]]) {
      const aspect = 16 / 9
      const pose = photoCameraPose({ x, y, metersToWidth: 0.13 }, { yawDeg: yaw, pitchDeg: pitch }, 40, aspect)
      const camera = new PerspectiveCamera(40, aspect, 0.05, 200)
      camera.position.set(...pose.position)
      camera.lookAt(...pose.target)
      camera.updateMatrixWorld()
      const ndc = new Vector3(0, 0, 0).project(camera)
      expect((ndc.x + 1) / 2).toBeCloseTo(x, 9)
      expect((1 - ndc.y) / 2).toBeCloseTo(y, 9)
    }
  })

  it('con pitch 0 mira horizontal y la altura sale de los datos: 1,84 m en el totem de northline', () => {
    const pose = photoCameraPose({ x: 0.23, y: 0.925, metersToWidth: 0.13 }, { yawDeg: 0, pitchDeg: 0 }, 40, 16 / 9)
    expect(pose.target[1]).toBeCloseTo(pose.position[1], 12)
    expect(pose.position[1]).toBeCloseTo(1.84, 2)
    const norte = photoCameraPose({ x: 0.25, y: 0.9, metersToWidth: 0.11 }, { yawDeg: 0, pitchDeg: 0 }, 40, 16 / 9)
    expect(norte.position[1]).toBeCloseTo(2.04, 1)
  })

  it('el zoom del modo cartel va de 1 a 0,55 de la base y no aleja nunca', () => {
    const range = { min: 1, max: 2.5 }
    expect(signZoomFactor(1, range)).toBe(1)
    expect(signZoomFactor(2.5, range)).toBeCloseTo(0.55, 10)
    expect(signZoomFactor(0, range)).toBe(1)
    expect(signZoomFactor(9, range)).toBeCloseTo(0.55, 10)
  })

  it('el polar del modo cartel nunca llega a verlo desde abajo', () => {
    expect(SIGN_VIEW.maxPolar).toBeLessThan(Math.PI / 2)
    expect(SIGN_VIEW.minPolar).toBe(0.6)
    expect(SIGN_VIEW.startPolar).toBeGreaterThanOrEqual(SIGN_VIEW.minPolar)
    expect(SIGN_VIEW.startPolar).toBeLessThanOrEqual(SIGN_VIEW.maxPolar)
  })
})

describe('totem de verdad', () => {
  it('base de 0 a 0,08, poste hasta 1,10 y panel desde ahi, con la caja completa', () => {
    const layout = totemLayout({ width: 2.4, height: 0.9 })
    expect(layout.base.position[1] - layout.base.size[1] / 2).toBe(0)
    expect(layout.base.size[1]).toBe(TOTEM_BASE_HEIGHT)
    expect(layout.post.position[1] - layout.post.size[1] / 2).toBeCloseTo(TOTEM_BASE_HEIGHT, 10)
    expect(layout.post.position[1] + layout.post.size[1] / 2).toBeCloseTo(TOTEM_POST_HEIGHT, 10)
    expect(layout.panelY - 0.9 / 2).toBeCloseTo(TOTEM_POST_HEIGHT, 10)
    expect(layout.volume.height).toBeCloseTo(TOTEM_POST_HEIGHT + 0.9, 10)
    expect(layout.center[1]).toBeCloseTo(layout.volume.height / 2, 10)
    expect(layout.volume.depth).toBe(TOTEM_BASE_DEPTH)
    expect(layout.post.size[2]).toBeCloseTo(SET.sign.thickness * TOTEM_POST_DEPTH_FACTOR, 10)
    // La sombra va en el piso, 1,6 veces la base.
    expect(layout.shadow.size[0]).toBeCloseTo(layout.base.size[0] * 1.6, 10)
    expect(layout.shadow.size[2]).toBeCloseTo(TOTEM_BASE_DEPTH * 1.6, 10)
  })

  it('en los extremos del rango de los dos clientes la base es mas angosta que el panel y mas ancha que el poste', () => {
    for (const slug of listClientSlugs()) {
      const client = clientOrFail(slug)
      const factor = factorOf(slug)
      const { width, height } = client.options
      for (const w of [width.min, width.max]) {
        for (const h of [height.min, height.max]) {
          const panel = { width: w * factor, height: h * factor }
          const layout = totemLayout(panel)
          const [baseWidth] = layout.base.size
          const [postWidth] = layout.post.size
          expect(baseWidth, `${slug} ${String(w)}x${String(h)}`).toBeLessThan(panel.width)
          expect(baseWidth, `${slug} ${String(w)}x${String(h)}`).toBeGreaterThan(postWidth)
          expect(postWidth).toBeGreaterThanOrEqual(0.12)
          expect(postWidth).toBeLessThanOrEqual(0.35)
          expect(baseWidth).toBeGreaterThanOrEqual(0.5)
          expect(layout.volume.width).toBe(panel.width)
        }
      }
    }
  })

  it('la caja del totem entra en el cuadro desde cualquier azimut en los dos polares extremos', () => {
    const aspect = 16 / 9
    const inside = 1 / (1 + 2 * SIGN_VIEW.marginRatio)
    const tan = Math.tan((SIGN_VIEW.fovDeg * Math.PI) / 360)
    for (const slug of listClientSlugs()) {
      const { width, height } = clientOrFail(slug).options
      const factor = factorOf(slug)
      for (const [w, h] of [[width.min, height.max], [width.max, height.max], [width.max, height.min]]) {
        const { volume } = totemLayout({ width: w * factor, height: h * factor })
        for (const polar of [SIGN_VIEW.minPolar, SIGN_VIEW.maxPolar]) {
          for (let azimuth = 0; azimuth < 360; azimuth += 15) {
            const a = (azimuth * Math.PI) / 180
            const z = [Math.sin(polar) * Math.sin(a), Math.cos(polar), Math.sin(polar) * Math.cos(a)] as [number, number, number]
            const distance = signFrameDistance(volume, z, aspect)
            const flat = Math.hypot(z[0], z[2])
            const x = [z[2] / flat, 0, -z[0] / flat]
            const y = [z[1] * x[2], z[2] * x[0] - z[0] * x[2], -z[1] * x[0]]
            for (const sx of [-1, 1]) {
              for (const sy of [-1, 1]) {
                for (const sz of [-1, 1]) {
                  const p = [(sx * volume.width) / 2, (sy * volume.height) / 2, (sz * volume.depth) / 2]
                  const dot = (u: number[]) => u[0] * p[0] + u[1] * p[1] + u[2] * p[2]
                  const along = distance - dot(z)
                  expect(Math.abs(dot(x)) / (along * tan * aspect)).toBeLessThanOrEqual(inside + 1e-9)
                  expect(Math.abs(dot(y)) / (along * tan)).toBeLessThanOrEqual(inside + 1e-9)
                }
              }
            }
          }
        }
      }
    }
  })

  it('poste y base van en el muted del tema, con metalness 0,2 y roughness 0,6', () => {
    for (const slug of listClientSlugs()) {
      const client = clientOrFail(slug)
      const color = totemStructureColor(themeFromClient(client))
      expect(new Color(color).getHexString()).toBe(new Color(client.brand.colors.muted).getHexString())
    }
    expect(TOTEM_STRUCTURE_METALNESS).toBe(0.2)
    expect(TOTEM_STRUCTURE_ROUGHNESS).toBe(0.6)
  })
})

describe('zona del preview (version 2.8, D91 y D92)', () => {
  it('la caja contain entra entera y centrada, con la proporcion de la foto', () => {
    const wide = containBox({ width: 1040, height: 848 }, 16 / 9)
    expect(wide.width).toBe(1040)
    expect(wide.height).toBeCloseTo(585, 10)
    expect(wide.top).toBeCloseTo((848 - 585) / 2, 10)
    const tall = containBox({ width: 390, height: 354 }, 16 / 9)
    expect(tall.width).toBe(390)
    const narrow = containBox({ width: 1200, height: 400 }, 16 / 9)
    expect(narrow.height).toBe(400)
    expect(narrow.left).toBeCloseTo((1200 - 400 * (16 / 9)) / 2, 10)
    expect(containBox({ width: 0, height: 300 }, 16 / 9).width).toBe(0)
  })

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
