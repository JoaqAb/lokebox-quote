import { Color } from 'three'
import type { SignSelection } from '../../../core/types'

// Medidas y colores del cartel. Puro, sin React y sin JSX.
// Desde el pivote de TAREA_010 no hay set: la fachada, la vereda, la vidriera y el poste
// del totem salieron con la escena. Lo que queda es el cartel, su halo y su sombra de
// apoyo, que se componen sobre la foto del cliente.
// Ningun componente de escena escribe un numero ni un color: todo sale de aca.
// La escena trabaja siempre en metros (SPEC 12).

export const SET = {
  sign: { thickness: 0.14 },
} as const

export type Vec3 = [number, number, number]

export type SignBox = {
  width: number
  height: number
}

// Lambda del damp de la escena. Con 12 el acomodamiento es de unos 200 ms.
export const DAMP_LAMBDA = 12

// El damp se acerca al objetivo sin llegar nunca. Por debajo de esta distancia se cierra
// exacto, para que el estado final sea el del JSON y no un valor que oscila para siempre.
export const SETTLE_EPSILON = 0.0005

// Geometrias unitarias: una sola de cada una, el tamano se aplica con scale.
export const UNIT_BOX: Vec3 = [1, 1, 1]
export const UNIT_PLANE: [number, number] = [1, 1]

// Por debajo de esto una pieza no se dibuja: geometria degenerada o luz apagada.
export const VISIBLE_EPSILON = 0.01

export type SignPlacement = {
  box: SignBox
}

// El cartel se dibuja centrado en el origen: el anclaje sobre la foto lo resuelve la
// capa de composicion, no la escena. Asi el mismo cartel sirve para cualquier foto.
export function signBoxMeters(selection: SignSelection, lengthToMeters: number): SignBox {
  return {
    width: selection.width * lengthToMeters,
    height: selection.height * lengthToMeters,
  }
}

export function signPlacement(selection: SignSelection, lengthToMeters: number): SignPlacement {
  return { box: signBoxMeters(selection, lengthToMeters) }
}

// El halo del modo back, solo en modo vista (SPEC 12, version 1.12): el degradado radial
// detras del cartel, con un margen de 0,12 del alto del cartel por lado y opacidad maxima
// 0,55. Se arma en nueve celdas: el centro queda tapado por el cartel, los bordes llevan
// el perfil del degradado a lo largo del eje y las esquinas el cuarto de circulo, asi no
// hay borde duro en ningun punto.
export const HALO = { marginRatio: 0.12, maxOpacity: 0.55, gap: 0.008 } as const

export type HaloCell = {
  kind: HaloCellKind
  position: [number, number]
  size: [number, number]
}

export type HaloCellKind = 'center' | 'left' | 'right' | 'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

export function haloMargin(placement: SignPlacement): number {
  return placement.box.height * HALO.marginRatio
}

export function haloBox(placement: SignPlacement): { z: number; size: [number, number] } {
  const margin = haloMargin(placement)
  return {
    z: -SET.sign.thickness / 2 - HALO.gap,
    size: [placement.box.width + 2 * margin, placement.box.height + 2 * margin],
  }
}

// Las nueve celdas del halo, en metros, centradas en el origen del cartel.
export function haloCells(placement: SignPlacement): HaloCell[] {
  const { width, height } = placement.box
  const m = haloMargin(placement)
  const ex = width / 2 + m / 2
  const ey = height / 2 + m / 2
  return [
    { kind: 'center', position: [0, 0], size: [width, height] },
    { kind: 'left', position: [-ex, 0], size: [m, height] },
    { kind: 'right', position: [ex, 0], size: [m, height] },
    { kind: 'top', position: [0, ey], size: [width, m] },
    { kind: 'bottom', position: [0, -ey], size: [width, m] },
    { kind: 'topLeft', position: [-ex, ey], size: [m, m] },
    { kind: 'topRight', position: [ex, ey], size: [m, m] },
    { kind: 'bottomLeft', position: [-ex, -ey], size: [m, m] },
    { kind: 'bottomRight', position: [ex, -ey], size: [m, m] },
  ]
}

// Coordenadas de textura de cada celda sobre el degradado radial, en el orden de los
// vertices de un PlaneGeometry de 1 x 1: arriba izquierda, arriba derecha, abajo izquierda,
// abajo derecha. 0,5 es el centro del degradado (opacidad plena) y 0 o 1 su borde (cero).
export function haloCellUv(kind: HaloCellKind): number[] {
  const inner = 0.5
  const u = { left: [0, inner], right: [inner, 1], mid: [inner, inner] }
  const v = { top: [1, inner], bottom: [inner, 0], mid: [inner, inner] }
  const column = kind === 'left' || kind === 'topLeft' || kind === 'bottomLeft' ? u.left : kind === 'right' || kind === 'topRight' || kind === 'bottomRight' ? u.right : u.mid
  const row = kind === 'top' || kind === 'topLeft' || kind === 'topRight' ? v.top : kind === 'bottom' || kind === 'bottomLeft' || kind === 'bottomRight' ? v.bottom : v.mid
  return [column[0], row[0], column[1], row[0], column[0], row[1], column[1], row[1]]
}

// Sombra de apoyo: ancha y baja, justo debajo del cartel, para que no flote sobre la foto.
export const SUPPORT_SHADOW = {
  widthRatio: 1.04,
  heightRatio: 0.55,
  gap: 0.02,
  opacity: 0.24,
  offsetRatio: -0.62,
} as const

export function supportShadowBox(
  placement: SignPlacement,
): { position: Vec3; size: [number, number] } {
  return {
    position: [
      0,
      placement.box.height * SUPPORT_SHADOW.offsetRatio,
      -SET.sign.thickness / 2 - SUPPORT_SHADOW.gap,
    ],
    size: [
      placement.box.width * SUPPORT_SHADOW.widthRatio,
      placement.box.height * SUPPORT_SHADOW.heightRatio,
    ],
  }
}

// Letras corporeas (SPEC 12): una caja por letra. El alto de la caja es el alto de letra
// de la seleccion y su ancho, el avance del caracter medido con measureText a ese alto.
// fill deja un poco de aire entre cajas vecinas para que se lean separadas.
export const LETTERS = { fill: 0.9, glyphGap: 0.002 } as const

export type LetterBox = {
  char: string
  // Centro de la caja en x, en metros, con 0 en el centro de la palabra.
  x: number
  width: number
}

// Reparte el texto en cajas. Los espacios ocupan su avance pero no llevan caja: en letras
// corporeas un espacio es pared. measure devuelve el avance del caracter en unidades de
// alto de letra; se inyecta para que la funcion siga siendo pura y se pueda probar.
export function layoutLetters(
  text: string,
  letterHeight: number,
  measure: (char: string) => number,
): { boxes: LetterBox[]; totalWidth: number } {
  const chars = [...text]
  const advances = chars.map((char) => measure(char) * letterHeight)
  const totalWidth = advances.reduce((acc, value) => acc + value, 0)
  const boxes: LetterBox[] = []
  let cursor = -totalWidth / 2
  chars.forEach((char, index) => {
    const advance = advances[index]
    if (char.trim().length > 0) {
      boxes.push({ char, x: cursor + advance / 2, width: advance * LETTERS.fill })
    }
    cursor += advance
  })
  return { boxes, totalWidth }
}

// Los glifos del texto van sobre la cara del cartel, con margen a los cuatro lados.
export const SIGN_TEXT = { marginRatio: 0.12, maxHeightRatio: 0.62, gap: 0.002 } as const

// La unica luz dinamica de la escena. Nunca hay mas de una, en ningun modo.
export const LAMP = { frontOffsetY: 0.5, frontOffsetZ: 1.6 } as const

export type LightingParams = {
  // Emision de la cara frontal. En back es baja: el texto del cartel tiene que leerse.
  faceEmissiveIntensity: number
  // Emision de los cantos y la cara trasera. En back es la que da la luz del cartel.
  edgeEmissiveIntensity: number
  // Opacidad del halo, que solo se dibuja en modo vista.
  haloOpacity: number
  lampIntensity: number
  // Cada modo tiene su caida: front es un foco sobre la cara y back un lavado hacia atras.
  lampDecay: number
  lampDistance: number
}

export const LIGHTING: Record<'none' | 'front' | 'back', LightingParams> = {
  none: {
    faceEmissiveIntensity: 0,
    edgeEmissiveIntensity: 0,
    haloOpacity: 0,
    lampIntensity: 0,
    lampDecay: 2,
    lampDistance: 8,
  },
  front: {
    faceEmissiveIntensity: 0.7,
    edgeEmissiveIntensity: 0.7,
    haloOpacity: 0,
    lampIntensity: 9,
    lampDecay: 2,
    lampDistance: 8,
  },
  back: {
    faceEmissiveIntensity: 0.3,
    edgeEmissiveIntensity: 2.4,
    haloOpacity: HALO.maxOpacity,
    lampIntensity: 16,
    lampDecay: 1,
    lampDistance: 16,
  },
}

const NONE_MODE = 'none'
const FRONT_MODE = 'front'
const BACK_MODE = 'back'

export function lightingParams(mode: string): LightingParams {
  if (mode === NONE_MODE || mode === FRONT_MODE || mode === BACK_MODE) {
    return LIGHTING[mode]
  }
  throw new Error(`lightingParams: modo de iluminacion desconocido: "${mode}"`)
}

export function lampPosition(mode: string, placement: SignPlacement): Vec3 | null {
  if (mode === NONE_MODE) {
    return null
  }
  if (mode === FRONT_MODE) {
    // La lampara de brazo que lleva un cartel frontal: por delante y por arriba.
    return [0, placement.box.height / 2 + LAMP.frontOffsetY, LAMP.frontOffsetZ]
  }
  if (mode === BACK_MODE) {
    // En el mismo z del halo y centrada: lava la superficie de atras.
    return [0, 0, haloBox(placement).z]
  }
  throw new Error(`lampPosition: modo de iluminacion desconocido: "${mode}"`)
}

export type ScenePalette = {
  // Color de la sombra de apoyo y color de los glifos del texto del cartel.
  shadow: string
  signText: string
}

function readColor(theme: Record<string, string>, key: string): Color {
  const value = theme[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`scenePalette: falta la variable de tema "${key}"`)
  }
  return new Color(value)
}

// Mezcla entre dos colores del tema. Reemplaza a multiplyScalar, que sobre una paleta
// clara devuelve gris sucio en vez de un tono mas oscuro del mismo color.
function blend(from: Color, to: Color, amount: number): string {
  return `#${from.clone().lerp(to, amount).getHexString()}`
}

const MIX = {
  shadow: 0.75,
  // Los tres materiales del MVP son claros, asi que la letra va oscura en los tres.
  signText: 0.88,
}

// Lo poco que queda de paleta se deriva del tema del cliente. El color del cartel no sale
// de aca: sale del visual del material.
export function scenePalette(theme: Record<string, string>): ScenePalette {
  const primary = readColor(theme, '--q-primary')
  const text = readColor(theme, '--q-text')
  return {
    shadow: blend(primary, text, MIX.shadow),
    signText: blend(primary, text, MIX.signText),
  }
}

// Camara del viewer (SPEC 12, version 1.12). En perspectiva en los dos modos; se orbita la
// camara alrededor del cartel, que queda siempre en el origen y sin rotar.
export const SIGN_VIEW = {
  fovDeg: 30,
  // Margen por lado alrededor del ancho y el alto del cartel en la distancia base.
  marginRatio: 0.15,
  minPolar: 0.6,
  maxPolar: 1.5,
  // Polar al entrar al modo cartel: apenas por encima del frente, dentro del rango.
  startPolar: 1.45,
  // Distancia minima del zoom, en fraccion de la base. El maximo es la base: solo acercar.
  nearFactor: 0.55,
  near: 0.05,
  far: 200,
} as const

function tanHalf(fovDeg: number): number {
  return Math.tan((fovDeg * Math.PI) / 360)
}

// Distancia base del modo cartel: la que encuadra ancho y alto con el margen por lado,
// con fov vertical y el aspecto del canvas. Manda la mas lejana de las dos.
export function signFrameDistance(box: SignBox, aspect: number): number {
  const scale = 1 + 2 * SIGN_VIEW.marginRatio
  const t = tanHalf(SIGN_VIEW.fovDeg)
  const byHeight = (box.height * scale) / 2 / t
  const byWidth = (box.width * scale) / 2 / (t * aspect)
  return Math.max(byHeight, byWidth)
}

// Distancia del modo vista: aquella en la que un metro de cartel ocupa metersToWidth del
// ancho de la foto, con el fov vertical del anchor y el aspecto del cuadro.
export function photoCameraDistance(metersToWidth: number, fovDeg: number, aspect: number): number {
  return 1 / (metersToWidth * 2 * tanHalf(fovDeg) * aspect)
}

// Posicion de la camara en una orbita alrededor del origen. yaw positivo va a la derecha
// del frente del cartel y pitch negativo por debajo de su centro.
export function orbitPosition(yawDeg: number, pitchDeg: number, distance: number): Vec3 {
  const yaw = (yawDeg * Math.PI) / 180
  const pitch = (pitchDeg * Math.PI) / 180
  return [
    distance * Math.cos(pitch) * Math.sin(yaw),
    distance * Math.sin(pitch),
    distance * Math.cos(pitch) * Math.cos(yaw),
  ]
}

// Corrimiento de la vista (lens shift) para que el centro del cartel caiga en (x, y) de la
// foto. Es el offset de setViewOffset, en pixeles del canvas.
export function lensShift(x: number, y: number, width: number, height: number): [number, number] {
  return [(0.5 - x) * width, (0.5 - y) * height]
}

// El control de zoom va de min a max. En modo cartel lo traduce a distancia: min es la base
// y max es nearFactor de la base.
export function signZoomFactor(zoom: number, range: { min: number; max: number }): number {
  const t = (zoom - range.min) / (range.max - range.min)
  return 1 - Math.min(1, Math.max(0, t)) * (1 - SIGN_VIEW.nearFactor)
}
