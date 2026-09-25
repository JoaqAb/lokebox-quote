import { CanvasTexture, NoColorSpace, type Texture } from 'three'

// El degradado radial de la escena (SPEC 12, version 1.12), generado en canvas. Lo usan
// como mapa de opacidad la sombra de apoyo y, en carteles, el halo de back. No es una segunda
// pasada de sombras: es un quad con esta textura debajo o detras de la pieza. Vive en el core
// desde TAREA_033 (D143): lo comparten las verticales.
// alphaMap lee el canal verde, no el alfa: el degradado va de blanco a negro sobre un
// fondo opaco. Con blanco y alfa variable el verde quedaba en 1 en todo el disco y el
// borde salia duro. Es un dato y no un color, asi que no lleva espacio de color sRGB.

const SIZE = 128
// Donde arranca a desvanecerse. Mas abajo el borde se nota como un disco.
const CORE_STOP = 0.15

let cached: CanvasTexture | null = null

export function supportShadowTexture(): Texture {
  if (cached !== null) {
    return cached
  }
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('supportShadowTexture: el navegador no dio contexto 2d')
  }
  const half = SIZE / 2
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
  // Blanco al centro y negro al borde: el color lo pone el material que lo usa, asi no
  // queda ningun color de la escena escrito aca.
  gradient.addColorStop(0, 'rgb(255,255,255)')
  gradient.addColorStop(CORE_STOP, 'rgb(217,217,217)')
  gradient.addColorStop(1, 'rgb(0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, SIZE, SIZE)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = NoColorSpace
  cached = texture
  return texture
}

export function disposeSupportShadow(): void {
  cached?.dispose()
  cached = null
}
