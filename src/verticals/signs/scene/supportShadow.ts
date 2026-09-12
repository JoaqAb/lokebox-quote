import { CanvasTexture, SRGBColorSpace, type Texture } from 'three'

// Sombra de apoyo del cartel (SPEC 12): un degradado radial generado en canvas, que se
// usa como mapa de opacidad de un quad detras del cartel. No es una segunda pasada de
// sombras y no se apaga con la degradacion, asi que el cartel no flota en ningun nivel.
// ContactShadows sigue aparte, en el piso, para el totem.

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
  // Blanco opaco al centro y transparente al borde: se lee como alphaMap, asi el color
  // de la sombra lo pone el material y no queda ningun hexadecimal en la escena.
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(CORE_STOP, 'rgba(255,255,255,0.85)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, SIZE, SIZE)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  cached = texture
  return texture
}

export function disposeSupportShadow(): void {
  cached?.dispose()
  cached = null
}
