import { Color } from 'three'
import type { SignSelection } from '../../../core/types'

// Medidas, posiciones y colores de la escena. Puro, sin React y sin JSX.
// Ningun componente de escena escribe un numero de set ni un color: todo sale de aca.
// La escena trabaja siempre en metros (SPEC 12).

export const SET = {
  sidewalk: { width: 20, depth: 8 },
  facade: { width: 9, height: 6, depth: 0.4 },
  door: { width: 1.1, height: 2.2, depth: 0.08, x: -2.6 },
  window: { width: 4.2, height: 1.8, depth: 0.08, x: 1.2, sill: 0.9 },
  sign: { thickness: 0.14, z: 0.09, gapOverWindow: 0.35 },
} as const

// La cara frontal de la fachada esta en z = 0. Puerta y vidriera se apoyan sobre ella
// con su cara frontal 4 cm adelante, para que no haya z-fighting.
const FRONT_FACE_Z = 0.04

// Borde superior de la vidriera. El cartel nunca baja de aca.
export const WINDOW_TOP = SET.window.sill + SET.window.height

export type Vec3 = [number, number, number]

export type SignBox = {
  width: number
  height: number
  centerY: number
}

// Ubicacion de cada pieza fija del set.
export const PLACEMENT: {
  sidewalk: { position: Vec3; rotation: Vec3 }
  facade: { position: Vec3; size: Vec3 }
  door: { position: Vec3; size: Vec3 }
  window: { position: Vec3; size: Vec3 }
  contactShadow: { position: Vec3; scale: number }
} = {
  // Plano horizontal con el borde de atras en z = 0 y el resto hacia la camara.
  sidewalk: {
    position: [0, 0, SET.sidewalk.depth / 2],
    rotation: [-Math.PI / 2, 0, 0],
  },
  // Caja con la cara frontal en z = 0 y la base en y = 0.
  facade: {
    position: [0, SET.facade.height / 2, -SET.facade.depth / 2],
    size: [SET.facade.width, SET.facade.height, SET.facade.depth],
  },
  door: {
    position: [SET.door.x, SET.door.height / 2, FRONT_FACE_Z - SET.door.depth / 2],
    size: [SET.door.width, SET.door.height, SET.door.depth],
  },
  window: {
    position: [
      SET.window.x,
      SET.window.sill + SET.window.height / 2,
      FRONT_FACE_Z - SET.window.depth / 2,
    ],
    size: [SET.window.width, SET.window.height, SET.window.depth],
  },
  // Apenas por encima de la vereda, para no pelear con el plano.
  contactShadow: {
    position: [0, 0.02, SET.sidewalk.depth / 2],
    scale: SET.sidewalk.width,
  },
}

export const CAMERA: { fov: number; position: Vec3; target: Vec3 } = {
  fov: 36,
  position: [0, 3.2, 12],
  target: [0, 3.2, 0],
}

export const LIGHTS: {
  ambientIntensity: number
  directionalIntensity: number
  directionalPosition: Vec3
} = {
  ambientIntensity: 0.35,
  directionalIntensity: 0.6,
  directionalPosition: [3, 7, 6],
}

// Orbita limitada de SPEC 12. Sin pan y sin zoom. La autorotacion es TAREA_004.
export const ORBIT = {
  enablePan: false,
  enableZoom: false,
  enableDamping: true,
  dampingFactor: 0.08,
  rotateSpeed: 0.45,
  minAzimuthAngle: -0.4,
  maxAzimuthAngle: 0.4,
  minPolarAngle: 1.15,
  maxPolarAngle: 1.52,
} as const

export const CONTACT_SHADOW = { opacity: 0.5, blur: 2.4, resolution: 512 } as const

// Lambda del damp de la escena. Con 12 el acomodamiento es de unos 200 ms.
export const DAMP_LAMBDA = 12

// El damp se acerca al objetivo sin llegar nunca. Por debajo de esta distancia se cierra
// exacto, para que el estado final sea el del JSON y no un valor que oscila para siempre.
export const SETTLE_EPSILON = 0.0005

// Caja unitaria del cartel: una sola geometria, el tamano se aplica con scale.
export const UNIT_BOX: Vec3 = [1, 1, 1]

export function signBoxMeters(selection: SignSelection, lengthToMeters: number): SignBox {
  const width = selection.width * lengthToMeters
  const height = selection.height * lengthToMeters
  return {
    width,
    height,
    centerY: WINDOW_TOP + SET.sign.gapOverWindow + height / 2,
  }
}

export type ScenePalette = {
  facade: string
  sidewalk: string
  doorFrame: string
  windowFrame: string
  glass: string
  glassEmissiveIntensity: number
}

// Cuanto se oscurece el primary del cliente para la vereda.
const SIDEWALK_FACTOR = 0.55

// Brillo del vidrio. Es ambiente de noche, no el modo de luz del cartel (TAREA_004).
const GLASS_EMISSIVE_INTENSITY = 0.12

function readColor(theme: Record<string, string>, key: string): Color {
  const value = theme[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`scenePalette: falta la variable de tema "${key}"`)
  }
  return new Color(value)
}

// Los colores de la escena se derivan del tema del cliente con operaciones de color.
// El color del cartel no sale de aca: sale del visual del material.
export function scenePalette(theme: Record<string, string>): ScenePalette {
  const primary = readColor(theme, '--q-primary')
  const bg = readColor(theme, '--q-bg')
  const accent = readColor(theme, '--q-accent')
  return {
    facade: `#${primary.getHexString()}`,
    sidewalk: `#${primary.clone().multiplyScalar(SIDEWALK_FACTOR).getHexString()}`,
    doorFrame: `#${bg.getHexString()}`,
    windowFrame: `#${bg.getHexString()}`,
    glass: `#${accent.getHexString()}`,
    glassEmissiveIntensity: GLASS_EMISSIVE_INTENSITY,
  }
}
