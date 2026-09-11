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
  directionalIntensity: 0.8,
  directionalPosition: [3, 7, 6],
}

// Orbita limitada de SPEC 12. Sin pan y sin zoom. El barrido lo maneja AutoOrbit.
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

// Geometrias unitarias: una sola de cada una, el tamano se aplica con scale.
export const UNIT_BOX: Vec3 = [1, 1, 1]
export const UNIT_PLANE: [number, number] = [1, 1]

// Por debajo de esto una pieza no se dibuja: geometria degenerada o luz apagada.
export const VISIBLE_EPSILON = 0.01

// Totem: de pie sobre la vereda, delante del local y centrado en x.
export const TOTEM = {
  x: 0,
  z: 3.2,
  clearance: 1.6,
  post: { widthFactor: 0.12, minWidth: 0.2, maxWidth: 0.6, depth: 0.2, overlap: 0.12 },
} as const

const FACADE_TYPE = 'facade'
const TOTEM_TYPE = 'totem'

export type PostBox = { position: Vec3; size: Vec3 }

export type SignPlacement = {
  box: SignBox
  position: Vec3
  post: PostBox | null
}

function unknownType(where: string, type: string): never {
  throw new Error(`${where}: tipo de cartel desconocido: "${type}"`)
}

export function signBoxMeters(selection: SignSelection, lengthToMeters: number): SignBox {
  const width = selection.width * lengthToMeters
  const height = selection.height * lengthToMeters
  if (selection.type === FACADE_TYPE) {
    return { width, height, centerY: WINDOW_TOP + SET.sign.gapOverWindow + height / 2 }
  }
  if (selection.type === TOTEM_TYPE) {
    return { width, height, centerY: TOTEM.clearance + height / 2 }
  }
  return unknownType('signBoxMeters', selection.type)
}

export function signPlacement(selection: SignSelection, lengthToMeters: number): SignPlacement {
  const box = signBoxMeters(selection, lengthToMeters)
  if (selection.type === FACADE_TYPE) {
    return { box, position: [0, box.centerY, SET.sign.z], post: null }
  }
  if (selection.type === TOTEM_TYPE) {
    // El poste va del piso al borde inferior del cartel mas el solapamiento,
    // para que no se vea la junta. Su ancho escala con el del cartel.
    const height = TOTEM.clearance + TOTEM.post.overlap
    const width = Math.min(
      Math.max(box.width * TOTEM.post.widthFactor, TOTEM.post.minWidth),
      TOTEM.post.maxWidth,
    )
    return {
      box,
      position: [TOTEM.x, box.centerY, TOTEM.z],
      post: {
        position: [TOTEM.x, height / 2, TOTEM.z],
        size: [width, height, TOTEM.post.depth],
      },
    }
  }
  return unknownType('signPlacement', selection.type)
}

// El marco del preview es aspect-video. Sirve para probar por test, y no a ojo,
// que el cartel entra en cuadro. La camara no se mueve en z.
export const PREVIEW_ASPECT = 16 / 9

export function visibleHalfSizeAt(
  z: number,
  aspect: number,
): { halfWidth: number; halfHeight: number } {
  const distance = Math.abs(CAMERA.position[2] - z)
  const halfHeight = Math.tan(((CAMERA.fov * Math.PI) / 180) / 2) * distance
  return { halfWidth: halfHeight * aspect, halfHeight }
}

// El halo del modo back: un plano apenas mas grande que el cartel, justo detras.
// Es plano y no caja porque solo se ve de frente: el azimut esta clampeado a +-0.4.
export const HALO = { padding: 0.35, gap: 0.008 } as const

// Terminacion del poste del totem. Su color sale de la paleta.
export const POST_FINISH = { metalness: 0.35, roughness: 0.6 } as const

// La unica luz dinamica de la escena. Nunca hay mas de una, en ningun modo.
export const LAMP = { decay: 2, distance: 8, frontOffsetY: 0.45, frontOffsetZ: 0.85 } as const

export type LightingParams = {
  emissiveIntensity: number
  haloIntensity: number
  lampIntensity: number
}

export const LIGHTING: Record<'none' | 'front' | 'back', LightingParams> = {
  none: { emissiveIntensity: 0, haloIntensity: 0, lampIntensity: 0 },
  front: { emissiveIntensity: 0.18, haloIntensity: 0, lampIntensity: 18 },
  back: { emissiveIntensity: 0.9, haloIntensity: 1.4, lampIntensity: 6 },
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

export function haloBox(placement: SignPlacement): { position: Vec3; size: [number, number] } {
  const z = placement.position[2] - SET.sign.thickness / 2 - HALO.gap
  return {
    position: [placement.position[0], placement.position[1], z],
    size: [placement.box.width + 2 * HALO.padding, placement.box.height + 2 * HALO.padding],
  }
}

export function lampPosition(mode: string, placement: SignPlacement): Vec3 | null {
  const [x, y, z] = placement.position
  if (mode === NONE_MODE) {
    return null
  }
  if (mode === FRONT_MODE) {
    // La lampara de brazo que lleva un cartel frontal: por delante y por arriba.
    return [x, y + placement.box.height / 2 + LAMP.frontOffsetY, z + LAMP.frontOffsetZ]
  }
  if (mode === BACK_MODE) {
    // En el mismo z del halo y centrada: lava la superficie de atras.
    return [x, y, haloBox(placement).position[2]]
  }
  throw new Error(`lampPosition: modo de iluminacion desconocido: "${mode}"`)
}

// Barrido lento de camara cuando nadie toca nada. autoRotate de OrbitControls no sirve:
// con el azimut clampeado gira hasta el tope y se queda pegado.
export const AUTO_ORBIT = {
  amplitude: 0.3,
  periodSeconds: 16,
  idleMs: 2500,
  reacquireLambda: 2,
  snapEpsilon: 0.02,
} as const

export function autoAzimuth(elapsedSeconds: number): number {
  return AUTO_ORBIT.amplitude * Math.sin((2 * Math.PI * elapsedSeconds) / AUTO_ORBIT.periodSeconds)
}

export type ScenePalette = {
  facade: string
  sidewalk: string
  doorFrame: string
  windowFrame: string
  glass: string
  post: string
  glassEmissiveIntensity: number
}

// Cuanto se oscurece el primary del cliente para la vereda.
const SIDEWALK_FACTOR = 0.55

// Cuanto se oscurece el muted del cliente para el poste del totem.
const POST_FACTOR = 0.45

// Brillo del vidrio. Es ambiente de noche, no el modo de luz del cartel.
// Baja de 0.12 a 0.07 para que la vidriera deje de ser lo mas brillante de la escena
// y el cartel sin luz se lea por reflexion, que es lo fisicamente correcto.
const GLASS_EMISSIVE_INTENSITY = 0.07

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
  const muted = readColor(theme, '--q-muted')
  return {
    facade: `#${primary.getHexString()}`,
    sidewalk: `#${primary.clone().multiplyScalar(SIDEWALK_FACTOR).getHexString()}`,
    doorFrame: `#${bg.getHexString()}`,
    windowFrame: `#${bg.getHexString()}`,
    glass: `#${accent.getHexString()}`,
    post: `#${muted.clone().multiplyScalar(POST_FACTOR).getHexString()}`,
    glassEmissiveIntensity: GLASS_EMISSIVE_INTENSITY,
  }
}
