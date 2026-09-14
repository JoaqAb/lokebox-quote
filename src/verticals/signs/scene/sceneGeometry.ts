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

// El halo del modo back: un plano apenas mas grande que el cartel, justo detras.
// En modo letters el margen es proporcional al alto de letra: el fijo del panel, sobre
// letras de 30 cm, deja un rectangulo blanco detras que se lee como otro cartel.
export const HALO = { padding: 0.55, letterPaddingRatio: 0.3, gap: 0.008 } as const

export function haloBox(
  placement: SignPlacement,
  padding: number = HALO.padding,
): { z: number; size: [number, number] } {
  return {
    z: -SET.sign.thickness / 2 - HALO.gap,
    size: [placement.box.width + 2 * padding, placement.box.height + 2 * padding],
  }
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
  emissiveIntensity: number
  haloIntensity: number
  lampIntensity: number
  // Cada modo tiene su caida: front es un foco sobre la cara y back un lavado hacia atras.
  lampDecay: number
  lampDistance: number
}

export const LIGHTING: Record<'none' | 'front' | 'back', LightingParams> = {
  none: { emissiveIntensity: 0, haloIntensity: 0, lampIntensity: 0, lampDecay: 2, lampDistance: 8 },
  front: {
    emissiveIntensity: 0.7,
    haloIntensity: 0,
    lampIntensity: 9,
    lampDecay: 2,
    lampDistance: 8,
  },
  back: {
    emissiveIntensity: 1.15,
    haloIntensity: 3.2,
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
