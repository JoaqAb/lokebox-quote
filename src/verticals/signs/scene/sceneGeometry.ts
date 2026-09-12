import { Color } from 'three'
import type { SignSelection } from '../../../core/types'

// Medidas, posiciones y colores de la escena. Puro, sin React y sin JSX.
// Ningun componente de escena escribe un numero de set ni un color: todo sale de aca.
// La escena trabaja siempre en metros (SPEC 12).

export const SET = {
  // La vereda y la fachada se extienden mas alla de lo que ve la camara en todo el clamp,
  // y detras va un plano de fondo. Con 9 m de ancho se veia el canto de la pared y el
  // vacio en cuanto la orbita se movia (defecto 6 de TAREA_009). El alto y la profundidad
  // se midieron en captura contra el clamp nuevo: con la pared en 9 m de alto y la vereda
  // en 8 m de fondo, en el extremo de azimut entraban en cuadro su borde superior y su
  // borde delantero.
  sidewalk: { width: 200, depth: 26 },
  facade: { width: 160, height: 34, depth: 0.4 },
  backdrop: { width: 400, height: 80, z: -18 },
  door: { width: 1.1, height: 2.4, depth: 0.1, x: -2.6 },
  // El marco es lo que hace que puerta y vidriera se lean como referencia de escala:
  // sin el son rectangulos del mismo tono que la pared (defecto 3).
  frame: { thickness: 0.09, depth: 0.06 },
  window: { width: 4.2, height: 1.8, depth: 0.1, x: 1.2, sill: 0.9, mullions: 2 },
  // Zocalo corrido a lo largo del frente: da pie a la pared y marca el piso.
  base: { height: 0.35, depth: 0.12 },
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
  backdrop: { position: Vec3; size: [number, number] }
  base: { position: Vec3; size: Vec3 }
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
  // Plano de fondo detras de todo: cierra el cuadro en cualquier punto del clamp.
  backdrop: {
    position: [0, SET.backdrop.height / 2 - 2, SET.backdrop.z],
    size: [SET.backdrop.width, SET.backdrop.height],
  },
  base: {
    position: [0, SET.base.height / 2, SET.base.depth / 2],
    size: [SET.facade.width, SET.base.height, SET.base.depth],
  },
}

// Marcos de puerta y vidriera, como cuatro cajas finas alrededor del hueco. Son cajas
// simples, autorizadas por SPEC 12 como referencia de escala.
export function frameBars(
  center: Vec3,
  size: [number, number],
): { position: Vec3; size: Vec3 }[] {
  const [cx, cy, cz] = center
  const [w, h] = size
  const t = SET.frame.thickness
  const d = SET.frame.depth
  return [
    { position: [cx, cy + h / 2 + t / 2, cz], size: [w + 2 * t, t, d] },
    { position: [cx, cy - h / 2 - t / 2, cz], size: [w + 2 * t, t, d] },
    { position: [cx - w / 2 - t / 2, cy, cz], size: [t, h, d] },
    { position: [cx + w / 2 + t / 2, cy, cz], size: [t, h, d] },
  ]
}

// Divisiones verticales de la vidriera, repartidas parejo.
export function mullionBars(): { position: Vec3; size: Vec3 }[] {
  const { width, height, sill, x } = SET.window
  const cy = sill + height / 2
  const cz = PLACEMENT.window.position[2]
  const bars: { position: Vec3; size: Vec3 }[] = []
  for (let i = 1; i <= SET.window.mullions; i += 1) {
    const t = i / (SET.window.mullions + 1)
    bars.push({
      position: [x - width / 2 + width * t, cy, cz],
      size: [SET.frame.thickness, height, SET.frame.depth],
    })
  }
  return bars
}

// Composicion rehecha en TAREA_009, desbloqueada por SPEC 12. El objetivo baja de 3,2 a
// 2,4 porque la banda que importa es la de puerta, vidriera y cartel (y = 0 a 4,5), y con
// el objetivo en 3,2 la mitad del cuadro era pared vacia. La distancia baja de 12 a 9,5
// para que el cartel llene el cuadro como objeto principal.
export const CAMERA: { fov: number; position: Vec3; target: Vec3 } = {
  fov: 34,
  position: [0, 2.8, 9.5],
  target: [0, 2.4, 0],
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

// Orbita limitada de SPEC 12, remedida en TAREA_009 contra la fachada extendida.
// Los topes estan verificados en captura en los cinco extremos, no a ojo.
// Con la fachada de 160 x 34 y el fondo detras, el vacio desaparece y el azimut puede
// casi duplicarse: de 0,55 a 1,0 rad. El polar minimo baja de 1,15 a 0,9 por lo mismo.
// El maximo se queda apenas por debajo de pi/2: pasado ese valor la camara rasa la vereda.
// El zoom ahora se puede alejar, que antes no: el tope de 13 m no es por vacio sino por
// composicion, porque mas lejos el cartel deja de ser el objeto principal del cuadro.
// El minimo de 6,5 m es donde el cartel todavia entra entero.
export const ORBIT = {
  enablePan: false,
  enableZoom: true,
  minDistance: 6.5,
  maxDistance: 13,
  enableDamping: true,
  dampingFactor: 0.08,
  rotateSpeed: 0.45,
  minAzimuthAngle: -1.0,
  maxAzimuthAngle: 1.0,
  minPolarAngle: 0.9,
  maxPolarAngle: 1.57,
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
// Margen de resplandor alrededor del cartel. El halo es lo que hace que el anillo de
// fachada sea mas luminoso en back que en front (SPEC 12): la lampara no puede, porque
// esta a un centimetro de la pared y la ilumina en incidencia rasante. Con 0,9 el halo
// medía casi el triple que el cartel y le robaba el protagonismo; con 0,42 el anillo no
// llegaba a superar a front. 0,55 es el valor medido que cumple los tres criterios.
export const HALO = { padding: 0.55, gap: 0.008 } as const

// Terminacion del poste del totem. Su color sale de la paleta.
export const POST_FINISH = { metalness: 0.35, roughness: 0.6 } as const

// La unica luz dinamica de la escena. Nunca hay mas de una, en ningun modo.
// La lampara de front va bien adelante del cartel: pegada a la pared lavaba la pared
// tanto como la cara y el contraste local del cartel bajaba en vez de subir.
// La caida y el alcance los pone cada modo, en LIGHTING.
export const LAMP = { frontOffsetY: 0.5, frontOffsetZ: 1.6 } as const

export type LightingParams = {
  emissiveIntensity: number
  haloIntensity: number
  lampIntensity: number
  // Cada modo tiene su caida: front es un foco sobre la cara y back es un lavado de
  // pared. Con la misma caida para los dos, la luz de back quedaba encerrada en los 9 cm
  // que hay entre el cartel y la pared y no llegaba a iluminar el anillo de fachada.
  lampDecay: number
  lampDistance: number
}

export const LIGHTING: Record<'none' | 'front' | 'back', LightingParams> = {
  none: { emissiveIntensity: 0, haloIntensity: 0, lampIntensity: 0, lampDecay: 2, lampDistance: 8 },
  front: { emissiveIntensity: 0.7, haloIntensity: 0, lampIntensity: 9, lampDecay: 2, lampDistance: 8 },
  back: {
    emissiveIntensity: 1.15,
    haloIntensity: 3.2,
    lampIntensity: 34,
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
  backdrop: string
  doorFrame: string
  windowFrame: string
  glass: string
  post: string
  base: string
  glassEmissiveIntensity: number
  // Color de la direccional al caer la tarde, color de la sombra de apoyo y color de
  // los glifos del texto del cartel.
  duskLight: string
  shadow: string
  signText: string
  // Color de la direccional en dia pleno. Sale del fondo del tema y no de un blanco
  // escrito aca: ningun componente de escena lleva un hexadecimal (SPEC 12).
  dayLight: string
}

// Brillo del vidrio. Es ambiente, no el modo de luz del cartel. Bajo a proposito: la
// vidriera dejo de competir con el cartel, que tiene que ser lo de mayor contraste
// del cuadro (defecto 5 de TAREA_009).
const GLASS_EMISSIVE_INTENSITY = 0.02

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

// Cuanto del texto entra en cada superficie. Todas las mezclas van del color del tema
// hacia el color de texto, que es el extremo oscuro en un tema claro y el claro en uno
// oscuro: por eso el mismo numero sirve en los dos.
const MIX = {
  sidewalk: 0.14,
  backdrop: 0.04,
  frame: 0.42,
  base: 0.3,
  post: 0.35,
  shadow: 0.75,
  // Los tres materiales del MVP son claros, asi que la letra va oscura en los tres.
  signText: 0.88,
  duskLight: 0.35,
  // La vidriera es vidrio, no marca: el tono de la pared, apenas aclarado y con una
  // pizca de accent. Lo que la hace legible como escala es su marco, no el vidrio.
  // Los dos numeros estan elegidos para que el vidrio quede a menos de 0,02 de
  // luminancia de la pared en los dos clientes: con el accent puro, y despues con el
  // vidrio claro sobre el fondo, la vidriera le ganaba en contraste al cartel, que es
  // justo lo que SPEC 12 prohibe (defecto 5 de TAREA_009).
  glassToBg: 0.15,
  glass: 0.1,
}

// Los colores de la escena se derivan del tema del cliente con mezclas entre los colores
// del tema. El color del cartel no sale de aca: sale del visual del material.
export function scenePalette(theme: Record<string, string>): ScenePalette {
  const primary = readColor(theme, '--q-primary')
  const bg = readColor(theme, '--q-bg')
  const accent = readColor(theme, '--q-accent')
  const muted = readColor(theme, '--q-muted')
  const text = readColor(theme, '--q-text')
  return {
    facade: `#${primary.getHexString()}`,
    sidewalk: blend(primary, text, MIX.sidewalk),
    backdrop: blend(bg, text, MIX.backdrop),
    doorFrame: blend(primary, text, MIX.frame),
    windowFrame: blend(primary, text, MIX.frame),
    glass: blend(new Color(blend(primary, bg, MIX.glassToBg)), accent, MIX.glass),
    post: blend(muted, text, MIX.post),
    base: blend(primary, text, MIX.base),
    glassEmissiveIntensity: GLASS_EMISSIVE_INTENSITY,
    shadow: blend(primary, text, MIX.shadow),
    duskLight: blend(accent, text, MIX.duskLight),
    signText: blend(primary, text, MIX.signText),
    dayLight: `#${bg.getHexString()}`,
  }
}

// Hora de la escena (SPEC 12). Un solo escalar con damp: 0 en `none` y 1 en `front` y
// `back`. Mueve ambiente, direccional, fondo y vereda. Sin geometria ni luces nuevas.
// En dia pleno la luz del cartel no se lee, y una escena nocturna fija no deja entender
// que el objeto es un cartel.
export const DUSK = {
  ambient: { day: 0.95, dusk: 0.72 },
  directional: { day: 1.5, dusk: 1.05 },
  // Cuanto se oscurecen fondo y vereda al caer la tarde, hacia el color de texto.
  backdropMix: 0.5,
  sidewalkMix: 0.4,
  lambda: 2.2,
}

export function duskTarget(mode: string): number {
  return mode === NONE_MODE ? 0 : 1
}

// Sombra de apoyo: un quad detras del cartel, apenas mas grande y apenas desplazado.
// El quad es apenas mas grande que el cartel y va abajo y atras, como una sombra
// proyectada. Con padding grande y centrado se leia como una elipse pegada al cartel.
// Ancha y baja, justo debajo del cartel: se lee como sombra proyectada sobre la pared.
// Centrada y con padding parejo daba una elipse que asomaba por arriba del cartel.
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
  const [x, y, z] = placement.position
  return {
    position: [
      x,
      y + placement.box.height * SUPPORT_SHADOW.offsetRatio,
      z - SET.sign.thickness / 2 - SUPPORT_SHADOW.gap,
    ],
    size: [
      placement.box.width * SUPPORT_SHADOW.widthRatio,
      placement.box.height * SUPPORT_SHADOW.heightRatio,
    ],
  }
}

// Los glifos del texto van sobre la cara del cartel, con margen a los cuatro lados.
export const SIGN_TEXT = { marginRatio: 0.12, maxHeightRatio: 0.62, gap: 0.002 } as const
