import { Color, MathUtils } from 'three'
import type { Mount, PhotoLight, SignSelection } from '../../../core/types'

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

// Damp que cierra exacto: sin esto el valor final nunca es el objetivo.
export function approach(current: number, target: number, delta: number): number {
  const next = MathUtils.damp(current, target, DAMP_LAMBDA, delta)
  return Math.abs(target - next) < SETTLE_EPSILON ? target : next
}

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

// Cantos del panel (SPEC 12, version 2.4): redondeados, porque un canto vivo no toma el brillo
// del estudio y se lee como render. Radio en metros, con tope en fraccion del espesor para que
// un panel fino no quede como una almohada. segments es el de RoundedBoxGeometry: con 2, cada
// canto lleva cuatro tramos por cuarto de vuelta.
export const EDGE_RADIUS_M = 0.004
export const EDGE_RADIUS_MAX_RATIO = 0.3
export const EDGE_SEGMENTS = 2

export function panelEdgeRadius(thickness: number): number {
  return Math.min(EDGE_RADIUS_M, thickness * EDGE_RADIUS_MAX_RATIO)
}

// Separadores del montaje standoff (SPEC 10, version 2.4, D68): cuatro cilindros de metal
// cepillado entre la cara trasera del panel y la pared, metidos hacia adentro desde cada
// esquina. Con standoff la pared queda wallGap detras del panel: halo, sombra de apoyo y la luz
// de back se corren con ella. Son del producto, no del cliente: el JSON solo dice el montaje.
export const STANDOFF = {
  wallGap: 0.03,
  diameter: 0.02,
  inset: 0.06,
  // En un panel chico el inset no pasa de esta fraccion del lado.
  insetMaxRatio: 0.25,
  radialSegments: 16,
  color: '#C9CCD1',
  metalness: 1,
  roughness: 0.35,
  anisotropy: 0.8,
  normalScale: 0.15,
} as const

// Cuanto se aleja la pared de la cara trasera del panel. Sin montaje (letters) o al ras, nada.
export function wallGap(mount: Mount | null): number {
  return mount === 'standoff' ? STANDOFF.wallGap : 0
}

// Centros de los cuatro separadores, en metros, con el cartel centrado en el origen.
export function standoffPositions(box: SignBox): Vec3[] {
  const insetX = Math.min(STANDOFF.inset, box.width * STANDOFF.insetMaxRatio)
  const insetY = Math.min(STANDOFF.inset, box.height * STANDOFF.insetMaxRatio)
  const x = box.width / 2 - insetX
  const y = box.height / 2 - insetY
  const z = -SET.sign.thickness / 2 - STANDOFF.wallGap / 2
  return [
    [-x, y, z],
    [x, y, z],
    [-x, -y, z],
    [x, -y, z],
  ]
}

// El halo de back, solo en modo vista (SPEC 12, version 2.4, D65): la luz que los cantos tiran
// sobre la pared. Una banda de 0,3 del alto del cartel por lado; en letters el alto del cartel
// es el alto de letra. El perfil baja de 1 en el contorno a 0 en el borde con derivada 0 en el
// borde, asi no hay escalon. Se arma en nueve celdas: el centro queda tapado por el cartel, los
// bordes llevan el perfil a lo largo de la normal y las esquinas un cuarto de circulo.
// Brillo: el color del material por radiance, la luz de los LED rebotada en la pared, que es
// mas fuerte que el color del cartel a la luz del dia. Opacidad pico: maxOpacity con poca luz
// ambiente, desde darkAmbient para abajo, y lineal hasta 0 con ambiente 1. Sale del light de la
// foto elegida y no de un campo del JSON: de noche se lee y de dia apenas acompana.
export const HALO = {
  bandRatio: 0.3,
  radiance: 8,
  maxOpacity: 0.85,
  darkAmbient: 0.35,
  // Anillos del perfil y tramos de cada cuarto de circulo.
  rings: 16,
  arcSegments: 12,
  gap: 0.008,
} as const

// Perfil del halo, de t 0 en el contorno a t 1 en el borde de la banda: 1 menos smoothstep.
// Decrece, llega a 0 con derivada 0 y su pendiente maxima es 1,5 veces la media.
export function haloProfile(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return 1 - x * x * (3 - 2 * x)
}

// Banda del halo en letters (version 2.5, D75), en fraccion del alto de letra. Con 0,3 subia 52
// niveles en 5 px contra la foto y se leia como una placa blanca con borde. Elegida por medicion
// entre 0,5 y 1,0 para una pendiente media de 5 niveles por px como maximo.
export const HALO_LETTERS_BAND = 0.8

export function haloPeak(ambient: number): number {
  const light = (1 - ambient) / (1 - HALO.darkAmbient)
  return HALO.maxOpacity * Math.min(1, Math.max(0, light))
}

export type HaloCell = {
  kind: HaloCellKind
  position: [number, number]
  size: [number, number]
}

export type HaloCellKind = 'center' | 'left' | 'right' | 'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

export function haloMargin(placement: SignPlacement): number {
  return placement.box.height * HALO.bandRatio
}

export function haloBox(placement: SignPlacement, mount: Mount | null): { z: number; size: [number, number] } {
  const margin = haloMargin(placement)
  return {
    z: -SET.sign.thickness / 2 - wallGap(mount) - HALO.gap,
    size: [placement.box.width + 2 * margin, placement.box.height + 2 * margin],
  }
}

// Las nueve celdas del halo, en metros, centradas en el centro del contorno. La banda es la del
// alto del cartel; en letters el contorno es el de la tinta y no el de los avances, que es mas
// ancho y dejaba halo fuera de la banda, pero la banda sigue siendo la del alto de letra.
export function haloCells(placement: SignPlacement, band: number = haloMargin(placement)): HaloCell[] {
  const { width, height } = placement.box
  const m = band
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

// Hacia donde crece la banda en cada celda: el signo en x y en y del lado de afuera. El centro
// no tiene banda.
export function haloCellOutward(kind: HaloCellKind): [number, number] {
  const x = kind === 'left' || kind === 'topLeft' || kind === 'bottomLeft' ? -1 : kind === 'right' || kind === 'topRight' || kind === 'bottomRight' ? 1 : 0
  const y = kind === 'top' || kind === 'topLeft' || kind === 'topRight' ? 1 : kind === 'bottom' || kind === 'bottomLeft' || kind === 'bottomRight' ? -1 : 0
  return [x, y]
}

// Sombra proyectada del modo vista (SPEC 12, version 2.5, D76): la key de la foto proyecta sobre
// un receptor de solo sombra, un plano en la pared detras del cartel, o en el totem un plano de
// piso en el apoyo de la base. El receptor es la caja del cartel mas un margen; en el piso el
// margen es mayor porque la sombra de un totem de 2 m con el sol a 35 grados mide casi 3 m.
// La opacidad sale de la luz de la foto: la sombra es lo que la key tapa, asi que pesa la key
// contra el ambiente, y a mas ambiente, menos sombra. gap lo deja apenas detras del halo.
export const SHADOW_RECEIVER = {
  margin: 0.5,
  floorMargin: 3,
  gap: 0.002,
  maxOpacity: 0.6,
} as const

export function photoShadowOpacity(light: PhotoLight): number {
  const total = light.keyIntensity + light.ambient
  return total <= 0 ? 0 : (SHADOW_RECEIVER.maxOpacity * light.keyIntensity) / total
}

// El receptor de pared: detras del halo, del tamano del contorno mas el margen por lado.
export function wallReceiver(box: SignBox, mount: Mount | null): { z: number; size: [number, number] } {
  return {
    z: -SET.sign.thickness / 2 - wallGap(mount) - HALO.gap - SHADOW_RECEIVER.gap,
    size: [box.width + 2 * SHADOW_RECEIVER.margin, box.height + 2 * SHADOW_RECEIVER.margin],
  }
}

// El receptor de piso del totem: horizontal en el origen, que es el apoyo de la base, con el
// ancho del totem mas el margen de piso por lado. Hacia adelante llega al margen de piso; hacia
// atras termina en la linea de fachada (version 2.7, D85), la profundidad wallZ donde la vereda
// toca la fachada, que es negativa porque queda detras del apoyo. Sin linea de fachada, el margen.
export function floorReceiver(volume: SignVolume, wallZ: number | null): { size: [number, number]; centerZ: number } {
  const front = volume.depth / 2 + SHADOW_RECEIVER.floorMargin
  const back = wallZ === null ? -front : Math.min(0, Math.max(-front, wallZ))
  return { size: [volume.width + 2 * SHADOW_RECEIVER.floorMargin, front - back], centerZ: (front + back) / 2 }
}

// La caja que tiene que cubrir la camara de sombra en modo vista: la del cartel mas lo que el
// receptor se extiende. Pared: el margen en ancho y alto, y la separacion hasta la pared en
// profundidad. Piso: el margen de piso en ancho y profundidad.
export function photoShadowVolume(volume: SignVolume, totem: boolean): SignVolume {
  if (totem) {
    return { ...volume, width: volume.width + 2 * SHADOW_RECEIVER.floorMargin, depth: volume.depth + 2 * SHADOW_RECEIVER.floorMargin }
  }
  return {
    width: volume.width + 2 * SHADOW_RECEIVER.margin,
    height: volume.height + 2 * SHADOW_RECEIVER.margin,
    depth: volume.depth + 2 * (STANDOFF.wallGap + HALO.gap + SHADOW_RECEIVER.gap),
  }
}

// Casado de tono (SPEC 12, version 2.5, D77): la luz del modo vista se tine con la crominancia de
// la foto alrededor del anclaje. El rectangulo esta centrado en el (x, y) del anchor, en fraccion
// de la foto, y no depende del cartel: mover un slider no cambia el tono. strength es cuanto del
// tinte entra; el resto queda blanco.
export const TINT = { rectWidth: 0.3, rectHeight: 0.3, strength: 1 } as const

export function tintRect(x: number, y: number): { left: number; top: number; width: number; height: number } {
  return { left: x - TINT.rectWidth / 2, top: y - TINT.rectHeight / 2, width: TINT.rectWidth, height: TINT.rectHeight }
}

// Color de la luz: blanco mezclado con el tinte. Como el tinte tiene luminancia 1, la mezcla
// tambien, y la intensidad la sigue poniendo el light de la foto.
export function tintedLightColor(tint: [number, number, number] | null): [number, number, number] {
  if (tint === null) {
    return [1, 1, 1]
  }
  const k = TINT.strength
  return [1 - k + k * tint[0], 1 - k + k * tint[1], 1 - k + k * tint[2]]
}

// Sombra de apoyo: ancha y baja, justo debajo del cartel, para que no flote sobre la foto.
export const SUPPORT_SHADOW = {
  widthRatio: 1.04,
  heightRatio: 0.55,
  gap: 0.02,
  opacity: 0.24,
  offsetRatio: -0.62,
} as const

// Con standoff la sombra se corre con la pared.
export function supportShadowBox(
  placement: SignPlacement,
  mount: Mount | null,
): { position: Vec3; size: [number, number] } {
  return {
    position: [
      0,
      placement.box.height * SUPPORT_SHADOW.offsetRatio,
      -SET.sign.thickness / 2 - wallGap(mount) - SUPPORT_SHADOW.gap,
    ],
    size: [
      placement.box.width * SUPPORT_SHADOW.widthRatio,
      placement.box.height * SUPPORT_SHADOW.heightRatio,
    ],
  }
}

// Composicion del texto del cartel (SPEC 12, version 1.14): una entrada por caracter con su
// avance. x es el centro del avance, donde se monta la letra 3D, que viene centrada en el.
// fill queda para el ancho nominal de cada entrada, un poco menor que su avance.
export const LETTERS = { fill: 0.9 } as const

export type LetterBox = {
  char: string
  // Centro de la caja en x, en metros, con 0 en el centro de la palabra.
  x: number
  width: number
}

// Reparte el texto en cajas. Los espacios ocupan su avance pero no llevan caja: en letras
// corporeas un espacio es pared. measure devuelve el avance del caracter en unidades de
// alto de letra (el del typeface); se inyecta para que la funcion siga siendo pura.
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

// El texto en relieve va sobre la cara del cartel, con margen a los cuatro lados y 3 mm de
// relieve (SPEC 12, version 1.14).
export const SIGN_TEXT = { marginRatio: 0.12, maxHeightRatio: 0.62, reliefDepth: 0.003 } as const

// Contorno real de un texto en alto de mayuscula, con el bisel, alrededor del centro de la
// palabra. Lo calcula el typeface.
export type TextBounds = { minX: number; maxX: number; minY: number; maxY: number }

// Relieve del modo area: la palabra se escala al espacio disponible por ancho y por alto con
// su contorno real, manda el menor, y se centra ese contorno en la cara. Asi un texto largo
// achica en vez de desbordar, y ninguna punta ni bisel sale del panel.
export function fitTextOnPanel(bounds: TextBounds, box: SignBox): { scale: number; x: number; y: number } {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const usableWidth = box.width * (1 - 2 * SIGN_TEXT.marginRatio)
  const usableHeight = box.height * SIGN_TEXT.maxHeightRatio
  const scale = Math.max(0, Math.min(usableHeight / height, usableWidth / width))
  return {
    scale,
    x: (-(bounds.minX + bounds.maxX) / 2) * scale,
    y: (-(bounds.minY + bounds.maxY) / 2) * scale,
  }
}

// La unica luz dinamica de la escena. Nunca hay mas de una, en ningun modo.
export const LAMP = { frontOffsetY: 0.5, frontOffsetZ: 1.6 } as const

export type LightingParams = {
  // Emision de la cara frontal. En back es baja: el texto del cartel tiene que leerse.
  faceEmissiveIntensity: number
  // Emision de los cantos y la cara trasera. En back es la que da la luz del cartel.
  edgeEmissiveIntensity: number
  // Cuanto del halo se dibuja, de 0 a 1, en fraccion del pico de la foto (haloPeak). Solo en
  // modo vista.
  haloOpacity: number
  lampIntensity: number
  // Cada modo tiene su caida: front es un foco sobre la cara y back un lavado hacia atras.
  lampDecay: number
  lampDistance: number
  // Cuanto se oscurece el color de la cara frontal: 0 la deja en el color del material.
  faceShade: number
  // Si los emisores entran al bloom (SPEC 12, version 2.1, D50). Solo en back: en front los
  // cantos emiten poco y no son la fuente de luz del cartel.
  emitters: boolean
}

export const LIGHTING: Record<'none' | 'front' | 'back', LightingParams> = {
  none: {
    faceEmissiveIntensity: 0,
    edgeEmissiveIntensity: 0,
    haloOpacity: 0,
    lampIntensity: 0,
    lampDecay: 2,
    lampDistance: 8,
    faceShade: 0,
    emitters: false,
  },
  front: {
    faceEmissiveIntensity: 0.7,
    edgeEmissiveIntensity: 0.7,
    haloOpacity: 0,
    lampIntensity: 9,
    lampDecay: 2,
    lampDistance: 8,
    faceShade: 0,
    emitters: false,
  },
  back: {
    faceEmissiveIntensity: 0.3,
    edgeEmissiveIntensity: 2.4,
    haloOpacity: 1,
    lampIntensity: 16,
    lampDecay: 1,
    lampDistance: 16,
    faceShade: 0,
    emitters: true,
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

// Modo cartel (SPEC 12, version 1.13): nunca hay halo, y en back la cara no emite y queda
// en el color del material apenas oscurecido. Un back-lit real tiene la cara apagada y el
// resplandor detras; con la cara emisiva, back y front no se distinguen de frente.
// Los cantos y la cara trasera emiten igual que en modo vista.
export const SIGN_MODE_BACK_FACE = { faceEmissiveIntensity: 0, faceShade: 0.12 } as const

// Cara con translucency (SPEC 12, version 2.1): el acrilico opal deja pasar la luz de back y
// su cara enciende pareja, con la emision de los cantos por su translucency, en los dos
// modos, y sin oscurecerse. Una cara opaca, translucency 0, queda como diga el modo.
export function translucentFace(
  params: LightingParams,
  translucency: number,
): { faceEmissiveIntensity: number; faceShade: number } {
  if (!params.emitters || translucency <= 0) {
    return { faceEmissiveIntensity: params.faceEmissiveIntensity, faceShade: params.faceShade }
  }
  return {
    faceEmissiveIntensity: Math.max(params.faceEmissiveIntensity, params.edgeEmissiveIntensity * translucency),
    faceShade: 0,
  }
}

export function signModeLightingParams(mode: string): LightingParams {
  const params = { ...lightingParams(mode), haloOpacity: 0 }
  return mode === BACK_MODE ? { ...params, ...SIGN_MODE_BACK_FACE } : params
}

export function lampPosition(mode: string, placement: SignPlacement, mount: Mount | null): Vec3 | null {
  if (mode === NONE_MODE) {
    return null
  }
  if (mode === FRONT_MODE) {
    // La lampara de brazo que lleva un cartel frontal: por delante y por arriba.
    return [0, placement.box.height / 2 + LAMP.frontOffsetY, LAMP.frontOffsetZ]
  }
  if (mode === BACK_MODE) {
    // En el mismo z del halo y centrada: lava la superficie de atras.
    return [0, 0, haloBox(placement, mount).z]
  }
  throw new Error(`lampPosition: modo de iluminacion desconocido: "${mode}"`)
}

// Contorno del halo en letters (version 2.4): la caja de la tinta del texto, con el bisel, en
// metros y con su centro, porque el contorno no es simetrico alrededor del origen.
export function lettersContour(bounds: TextBounds, letterHeight: number): { box: SignBox; center: [number, number] } {
  return {
    box: { width: (bounds.maxX - bounds.minX) * letterHeight, height: (bounds.maxY - bounds.minY) * letterHeight },
    center: [((bounds.minX + bounds.maxX) / 2) * letterHeight, ((bounds.minY + bounds.maxY) / 2) * letterHeight],
  }
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
  // Los tres materiales del MVP son claros, asi que la letra va oscura en los tres.
  signText: 0.88,
}

// Lo poco que queda de paleta: el color del texto se deriva del tema del cliente y la sombra
// es la constante de escena. El color del cartel no sale de aca: sale del visual del material.
export function scenePalette(theme: Record<string, string>): ScenePalette {
  const primary = readColor(theme, '--q-primary')
  const text = readColor(theme, '--q-text')
  return {
    shadow: SUPPORT_SHADOW_COLOR,
    signText: blend(primary, text, MIX.signText),
  }
}

// Totem (SPEC 12, version 1.15): el panel del modo area, un poste centrado debajo y una base
// en el piso. Son del producto, como la luz de estudio: nunca van al JSON. Poste y base son
// proporcionales al ancho del panel con limites, para que no se rompan en los extremos del
// slider de ancho. El origen del totem es la cara inferior de la base.
export const TOTEM_POST_HEIGHT = 1.1
export const TOTEM_BASE_HEIGHT = 0.08
export const TOTEM_BASE_DEPTH = 0.5
export const TOTEM_POST_WIDTH_RATIO = 0.12
export const TOTEM_POST_WIDTH_MIN = 0.12
export const TOTEM_POST_WIDTH_MAX = 0.35
export const TOTEM_POST_DEPTH_FACTOR = 1.6
export const TOTEM_BASE_WIDTH_RATIO = 0.45
export const TOTEM_BASE_WIDTH_MIN = 0.5
export const TOTEM_STRUCTURE_METALNESS = 0.2
export const TOTEM_STRUCTURE_ROUGHNESS = 0.6
// La sombra del totem va en el piso, 1,6 veces la base, apenas arriba para no pelear con y 0.
export const TOTEM_SHADOW = { scale: 1.6, lift: 0.002 } as const

export type TotemPart = { size: Vec3; position: Vec3 }

export type TotemLayout = {
  base: TotemPart
  post: TotemPart
  // Altura del centro del panel sobre la cara inferior de la base.
  panelY: number
  // La caja del totem completo, panel mas poste mas base, y su centro.
  volume: SignVolume
  center: Vec3
  shadow: TotemPart
}

export function totemLayout(panel: SignBox): TotemLayout {
  const postWidth = Math.min(TOTEM_POST_WIDTH_MAX, Math.max(TOTEM_POST_WIDTH_MIN, panel.width * TOTEM_POST_WIDTH_RATIO))
  const postDepth = SET.sign.thickness * TOTEM_POST_DEPTH_FACTOR
  const postHeight = TOTEM_POST_HEIGHT - TOTEM_BASE_HEIGHT
  const baseWidth = Math.max(TOTEM_BASE_WIDTH_MIN, panel.width * TOTEM_BASE_WIDTH_RATIO)
  const totalHeight = TOTEM_POST_HEIGHT + panel.height
  const volume: SignVolume = {
    width: Math.max(panel.width, baseWidth, postWidth),
    height: totalHeight,
    depth: Math.max(SET.sign.thickness, postDepth, TOTEM_BASE_DEPTH),
  }
  return {
    base: { size: [baseWidth, TOTEM_BASE_HEIGHT, TOTEM_BASE_DEPTH], position: [0, TOTEM_BASE_HEIGHT / 2, 0] },
    post: { size: [postWidth, postHeight, postDepth], position: [0, TOTEM_BASE_HEIGHT + postHeight / 2, 0] },
    panelY: TOTEM_POST_HEIGHT + panel.height / 2,
    volume,
    center: [0, totalHeight / 2, 0],
    shadow: {
      size: [baseWidth * TOTEM_SHADOW.scale, 0, TOTEM_BASE_DEPTH * TOTEM_SHADOW.scale],
      position: [0, TOTEM_SHADOW.lift, 0],
    },
  }
}

// Color de poste y base: el muted del tema. Aparte de scenePalette, que es la paleta del
// cartel, para que el cartel y la estructura no se mezclen.
export function totemStructureColor(theme: Record<string, string>): string {
  return `#${readColor(theme, '--q-muted').getHexString()}`
}

// Camara del viewer (SPEC 12, version 1.12). En perspectiva en los dos modos; se orbita la
// camara alrededor del cartel, que queda siempre en el origen y sin rotar.
export const SIGN_VIEW = {
  fovDeg: 30,
  // Margen por lado alrededor de la huella proyectada de la caja del cartel.
  marginRatio: 0.12,
  minPolar: 0.6,
  maxPolar: 1.5,
  // Polar al entrar al modo cartel: apenas por encima del frente, dentro del rango.
  startPolar: 1.45,
  // Distancia minima del zoom, en fraccion de la derivada. El maximo es 1: solo acercar.
  nearFactor: 0.55,
  near: 0.05,
  far: 200,
} as const

function tanHalf(fovDeg: number): number {
  return Math.tan((fovDeg * Math.PI) / 360)
}

// La caja que encuadra el modo cartel: el panel con su espesor, o en modo letters el
// conjunto de letras con su profundidad. Nunca una letra sola.
export type SignVolume = SignBox & { depth: number }

// Luz de estudio del modo cartel (SPEC 12, version 1.13): el entorno de estudio mas una key.
// Es del producto y no de un cliente, por eso no va al JSON. Sin ambiente: el relleno lo da
// el entorno de estudio del core. Mismo formato que el light de una foto, asi la escena tiene
// un solo camino.
export const SIGN_STUDIO_LIGHT: PhotoLight = {
  ambient: 0,
  keyIntensity: 0.3,
  keyAzimuthDeg: -30,
  keyElevationDeg: 40,
}

// Sombra de mapa de la key del modo cartel (SPEC 12, version 2.0). La key esta a 10 m del
// origen, asi near y far cubren cualquier cartel del rango. normalBias evita el acne en el
// relieve de 3 mm, que proyecta sobre la misma cara que lo recibe. radius es el ancho del
// filtro suave de PCFShadowMap, en texels.
export const STUDIO_SHADOW = {
  mapSize: 2048,
  bias: -0.0002,
  normalBias: 0.004,
  radius: 4,
  near: 0.5,
  far: 30,
  margin: 0.25,
} as const

// Medio lado de la camara ortografica de la sombra: la media diagonal de la caja de encuadre
// mas lo que su centro se aparta del origen, que es adonde apunta la key, y un margen.
// Con eso la caja entra entera desde cualquier direccion de la luz.
export function studioShadowReach(volume: SignVolume, center: Vec3): number {
  const halfDiagonal = Math.hypot(volume.width, volume.height, volume.depth) / 2
  return halfDiagonal + Math.hypot(...center) + STUDIO_SHADOW.margin
}

// Color de la sombra de apoyo (SPEC 12, version 1.16), en los dos modos. Es del producto y no
// del cliente: una sombra oscurece siempre y no tiene color de marca. Derivada de una paleta
// clara no tenia garantia de quedar por debajo del fondo que tuviera detras, y sobre el
// escenario oscuro del modo cartel aclaraba en vez de oscurecer.
export const SUPPORT_SHADOW_COLOR = '#0a0a0a'

// Caja del encuadre en modo letters: el contorno real de las letras, simetrico alrededor del
// origen porque el encuadre centra el cuadro en el target, y la profundidad de las letras.
export function lettersFrameVolume(bounds: TextBounds | null, letterHeight: number, depth: number): SignVolume {
  if (bounds === null) {
    return { width: 0, height: 0, depth }
  }
  return {
    width: 2 * Math.max(Math.abs(bounds.minX), Math.abs(bounds.maxX)) * letterHeight,
    height: 2 * Math.max(Math.abs(bounds.minY), Math.abs(bounds.maxY)) * letterHeight,
    depth,
  }
}

// Distancia del modo cartel (SPEC 12, version 1.13): la menor a la que las ocho esquinas
// de la caja, vistas desde direction (unitario, del cartel hacia la camara), caen dentro
// del cuadro con el margen por lado. El cuadro se centra en el target, como la camara.
// Se recalcula en cada frame con la orientacion actual: la huella de frente es mas chica
// que la de la esfera contenedora, y encuadrar la esfera achicaria la vista al cargar.
// Para cada esquina p y cada eje e de la camara, |p.e| <= k (d - p.z), con k la tangente
// del semicampo en ese eje dividida por 1 + 2 margen. Despejando d, manda la mayor.
export function signFrameDistance(volume: SignVolume, direction: Vec3, aspect: number): number {
  const [zx, zy, zz] = direction
  // Ejes de la camara con el up del mundo, igual que lookAt. El polar del modo cartel
  // nunca llega a la vertical, pero la funcion no se rompe si llega.
  const flat = Math.hypot(zx, zz)
  const xAxis: Vec3 = flat === 0 ? [1, 0, 0] : [zz / flat, 0, -zx / flat]
  const yAxis: Vec3 = [zy * xAxis[2], zz * xAxis[0] - zx * xAxis[2], -zy * xAxis[0]]
  const ky = tanHalf(SIGN_VIEW.fovDeg) / (1 + 2 * SIGN_VIEW.marginRatio)
  const kx = ky * aspect
  const half: Vec3 = [volume.width / 2, volume.height / 2, volume.depth / 2]
  let distance = 0
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const p: Vec3 = [sx * half[0], sy * half[1], sz * half[2]]
        const along = p[0] * zx + p[1] * zy + p[2] * zz
        const right = p[0] * xAxis[0] + p[2] * xAxis[2]
        const up = p[0] * yAxis[0] + p[1] * yAxis[1] + p[2] * yAxis[2]
        distance = Math.max(distance, Math.abs(right) / kx + along, Math.abs(up) / ky + along)
      }
    }
  }
  return distance
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

// Camara del modo vista (SPEC 12, version 2.6, D81). Toma la orientacion y el fov del anchor, con
// cameraPitchDeg 0 como mirada horizontal, y se ubica de modo que el anclaje, el origen de la
// escena, caiga en (x, y) de la foto fuera del eje, sin corrimiento de la vista: a la profundidad
// en la que un metro ocupa metersToWidth del ancho. La altura de la camara sale de esos datos. El
// yaw y el pitch conservan su sentido de siempre: la mirada es la de una camara ubicada en
// (yaw, pitch) alrededor del cartel mirando hacia el. Corrige la del 14/09, que miraba al origen y
// lo corria con un lens shift: con pitch 0 la camara del totem quedaba a la altura del piso.
export type PhotoPoint = { x: number; y: number; metersToWidth: number }

// El punto del piso (y 0) que la camara de vista ve en (x, y) de la foto: el rayo por ese punto del
// cuadro cortado con el plano del piso. null si el rayo no baja hasta el piso. Con el anclaje de
// piso del totem, el origen es el apoyo de la base y el piso es y 0 (version 2.7, D85).
export function groundPointAt(pose: { position: Vec3; target: Vec3 }, fovDeg: number, aspect: number, x: number, y: number): Vec3 | null {
  const [px, py, pz] = pose.position
  const forward: Vec3 = [pose.target[0] - px, pose.target[1] - py, pose.target[2] - pz]
  const flat = Math.hypot(forward[0], forward[2])
  const right: Vec3 = flat === 0 ? [1, 0, 0] : [-forward[2] / flat, 0, forward[0] / flat]
  const up: Vec3 = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ]
  const t = tanHalf(fovDeg)
  const across = (2 * x - 1) * t * aspect
  const along = (1 - 2 * y) * t
  const ray: Vec3 = [0, 1, 2].map((i) => forward[i] + right[i] * across + up[i] * along) as Vec3
  if (ray[1] >= 0) {
    return null
  }
  const k = -py / ray[1]
  return [px + ray[0] * k, 0, pz + ray[2] * k]
}

export function photoCameraPose(
  point: PhotoPoint,
  angles: { yawDeg: number; pitchDeg: number },
  fovDeg: number,
  aspect: number,
): { position: Vec3; target: Vec3 } {
  const depth = photoCameraDistance(point.metersToWidth, fovDeg, aspect)
  const [ox, oy, oz] = orbitPosition(angles.yawDeg, angles.pitchDeg, 1)
  const forward: Vec3 = [-ox, -oy, -oz]
  // Ejes de la camara con el up del mundo, igual que lookAt.
  const flat = Math.hypot(forward[0], forward[2])
  const right: Vec3 = flat === 0 ? [1, 0, 0] : [-forward[2] / flat, 0, forward[0] / flat]
  const up: Vec3 = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ]
  const t = tanHalf(fovDeg)
  const across = (2 * point.x - 1) * t * aspect * depth
  const along = (1 - 2 * point.y) * t * depth
  // De la camara al anclaje: la profundidad sobre el eje mas el corrimiento en el cuadro.
  const offset: Vec3 = [0, 1, 2].map((i) => right[i] * across + up[i] * along + forward[i] * depth) as Vec3
  const position: Vec3 = [-offset[0], -offset[1], -offset[2]]
  return { position, target: [position[0] + forward[0], position[1] + forward[1], position[2] + forward[2]] }
}

// El control de zoom va de min a max. En modo cartel lo traduce a un multiplicador de la
// distancia derivada de la huella: min es 1 y max es nearFactor.
export function signZoomFactor(zoom: number, range: { min: number; max: number }): number {
  const t = (zoom - range.min) / (range.max - range.min)
  return 1 - Math.min(1, Math.max(0, t)) * (1 - SIGN_VIEW.nearFactor)
}
