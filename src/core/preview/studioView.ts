import { MathUtils, type Color } from 'three'

// Modo de estudio del preview (SPEC 12 y 21.5): la pieza sola sobre el escenario del core, con
// camara en perspectiva que orbita alrededor de ella, la luz de estudio del producto y la sombra
// de apoyo. Puro, sin React y sin JSX. Vive en el core desde TAREA_033 (D143): lo comparten las
// verticales, y cada una dice cual es su caja de encuadre.
// La escena trabaja siempre en metros.

export type Vec3 = [number, number, number]

// La caja que encuadra el modo de estudio: ancho, alto y profundidad en metros, centrada en el
// target de la camara.
export type FrameVolume = { width: number; height: number; depth: number }

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

// El mismo damp para un color, que cierra exacto cuando la distancia entre canales es menor que
// SETTLE_EPSILON.
export function approachColor(current: Color, target: Color, delta: number): void {
  const distance =
    Math.abs(current.r - target.r) + Math.abs(current.g - target.g) + Math.abs(current.b - target.b)
  if (distance < SETTLE_EPSILON) {
    current.copy(target)
    return
  }
  current.lerp(target, 1 - Math.exp(-DAMP_LAMBDA * delta))
}

// Camara del modo de estudio (SPEC 12, version 1.12). En perspectiva; se orbita la camara
// alrededor de la pieza, que no rota.
export const STUDIO_VIEW = {
  fovDeg: 30,
  // Margen por lado alrededor de la huella proyectada de la caja de encuadre.
  marginRatio: 0.12,
  minPolar: 0.6,
  maxPolar: 1.5,
  // Polar al entrar al modo de estudio: apenas por encima del frente, dentro del rango.
  startPolar: 1.45,
  // Distancia minima del zoom, en fraccion de la derivada. El maximo es 1: solo acercar.
  nearFactor: 0.55,
  near: 0.05,
  far: 200,
} as const

function tanHalf(fovDeg: number): number {
  return Math.tan((fovDeg * Math.PI) / 360)
}

// Distancia del modo de estudio (SPEC 12, version 1.13): la menor a la que las ocho esquinas
// de la caja, vistas desde direction (unitario, de la pieza hacia la camara), caen dentro
// del cuadro con el margen por lado. El cuadro se centra en el target, como la camara.
// Se recalcula en cada frame con la orientacion actual: la huella de frente es mas chica
// que la de la esfera contenedora, y encuadrar la esfera achicaria la vista al cargar.
// Para cada esquina p y cada eje e de la camara, |p.e| <= k (d - p.z), con k la tangente
// del semicampo en ese eje dividida por 1 + 2 margen. Despejando d, manda la mayor.
export function frameDistance(volume: FrameVolume, direction: Vec3, aspect: number): number {
  const [zx, zy, zz] = direction
  // Ejes de la camara con el up del mundo, igual que lookAt. El polar del modo de estudio
  // nunca llega a la vertical, pero la funcion no se rompe si llega.
  const flat = Math.hypot(zx, zz)
  const xAxis: Vec3 = flat === 0 ? [1, 0, 0] : [zz / flat, 0, -zx / flat]
  const yAxis: Vec3 = [zy * xAxis[2], zz * xAxis[0] - zx * xAxis[2], -zy * xAxis[0]]
  const ky = tanHalf(STUDIO_VIEW.fovDeg) / (1 + 2 * STUDIO_VIEW.marginRatio)
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

// Posicion de la camara en una orbita alrededor del origen. yaw positivo va a la derecha
// del frente y pitch negativo por debajo del centro.
export function orbitPosition(yawDeg: number, pitchDeg: number, distance: number): Vec3 {
  const yaw = (yawDeg * Math.PI) / 180
  const pitch = (pitchDeg * Math.PI) / 180
  return [
    distance * Math.cos(pitch) * Math.sin(yaw),
    distance * Math.sin(pitch),
    distance * Math.cos(pitch) * Math.cos(yaw),
  ]
}

// Arranque de la camara de estudio por vista (D151): azimut en grados desde el frente, positivo a
// la derecha, y polar en radianes desde la vertical. Sin arranque, el de siempre: de frente y
// apenas por encima, con STUDIO_VIEW.startPolar.
export type StudioStart = { azimuthDeg: number; polar: number }

// Direccion unitaria de la pieza hacia la camara en el primer frame. El polar tiene que caer
// dentro de la orbita: fuera de minPolar y maxPolar, OrbitControls lo corregiria en el primer
// arrastre con un salto.
export function startDirection(start?: StudioStart): Vec3 {
  if (start === undefined) {
    return orbitPosition(0, 90 - MathUtils.radToDeg(STUDIO_VIEW.startPolar), 1)
  }
  if (!(start.polar >= STUDIO_VIEW.minPolar && start.polar <= STUDIO_VIEW.maxPolar)) {
    throw new Error(`startDirection: polar fuera de la orbita: ${String(start.polar)}`)
  }
  return orbitPosition(start.azimuthDeg, 90 - MathUtils.radToDeg(start.polar), 1)
}

// Zoom del preview (SPEC 12): el control va de min a max en pasos de step.
export const PREVIEW_ZOOM = { min: 1, max: 2.5, step: 0.25 } as const

export type ZoomRange = { min: number; max: number }

// Zoom con la rueda: un paso de rueda (100 px de deltaY) cambia el zoom por el factor de
// WHEEL_ZOOM, hacia adentro con deltaY negativo, siempre dentro del rango.
export const WHEEL_ZOOM = 0.15

export function zoomBy(current: number, deltaY: number, range: ZoomRange): number {
  const next = current * Math.exp((-deltaY / 100) * WHEEL_ZOOM)
  return Math.min(range.max, Math.max(range.min, next))
}

// Zoom con dos dedos: el del comienzo del gesto por la razon entre las distancias, dentro del rango.
export function zoomFromPinch(startZoom: number, startDistance: number, distance: number, range: ZoomRange): number {
  if (startDistance <= 0) {
    return startZoom
  }
  return Math.min(range.max, Math.max(range.min, (startZoom * distance) / startDistance))
}

// El control de zoom va de min a max. En el modo de estudio lo traduce a un multiplicador de la
// distancia derivada de la huella: min es 1 y max es nearFactor.
export function studioZoomFactor(zoom: number, range: ZoomRange): number {
  const t = (zoom - range.min) / (range.max - range.min)
  return 1 - Math.min(1, Math.max(0, t)) * (1 - STUDIO_VIEW.nearFactor)
}

// Una luz de escena: ambiente y key, con la direccion de la key en grados. Es la forma del light
// de una foto de carteles y la de la luz de estudio.
export type KeyLight = {
  ambient: number
  keyIntensity: number
  keyAzimuthDeg: number
  keyElevationDeg: number
}

// Distancia de la key al origen, en metros.
export const KEY_DISTANCE = 10

// Posicion de la key: azimut desde el frente, elevacion sobre el horizonte.
export function keyLightPosition(light: KeyLight): Vec3 {
  const az = MathUtils.degToRad(light.keyAzimuthDeg)
  const el = MathUtils.degToRad(light.keyElevationDeg)
  const r = KEY_DISTANCE
  return [r * Math.sin(az) * Math.cos(el), r * Math.sin(el), r * Math.cos(az) * Math.cos(el)]
}

// Luz de estudio (SPEC 12, version 1.13): el entorno de estudio mas una key. Es del producto y
// no de un cliente, por eso no va al JSON. Sin ambiente: el relleno lo da el entorno de estudio.
export const STUDIO_LIGHT: KeyLight = {
  ambient: 0,
  keyIntensity: 0.3,
  keyAzimuthDeg: -30,
  keyElevationDeg: 40,
}

// Estudio con las luces prendidas (SPEC 12, D104): la pieza sin luz propia sobre el escenario
// claro. Mas key y mas entorno, para que la pieza se lea del color del JSON: un blanco salia gris
// medio. Se sube la luz y no el material.
export const STUDIO_BRIGHT = {
  light: { ...STUDIO_LIGHT, ambient: 3.5, keyIntensity: 5 } satisfies KeyLight,
  environment: 1,
}

// Sombra de mapa de la key del modo de estudio (SPEC 12, version 2.0). La key esta a 10 m del
// origen, asi near y far cubren cualquier pieza del rango. normalBias evita el acne en un
// relieve de pocos milimetros, que proyecta sobre la misma cara que lo recibe. radius es el ancho
// del filtro suave de PCFShadowMap, en texels.
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
export function studioShadowReach(volume: FrameVolume, center: Vec3): number {
  const halfDiagonal = Math.hypot(volume.width, volume.height, volume.depth) / 2
  return halfDiagonal + Math.hypot(...center) + STUDIO_SHADOW.margin
}

// Color de la sombra de apoyo (SPEC 12, version 1.16). Es del producto y no del cliente: una
// sombra oscurece siempre y no tiene color de marca. Derivada de una paleta clara no tenia
// garantia de quedar por debajo del fondo que tuviera detras, y sobre el escenario oscuro
// aclaraba en vez de oscurecer.
export const SUPPORT_SHADOW_COLOR = '#0a0a0a'
