import { useEffect, useState } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

// El logo del cliente como textura (SPEC 21.5, D144): el archivo se rasteriza una vez a un canvas,
// y de ese raster salen las dos CanvasTexture: con sus colores, y la silueta en el acento del tema.
// Se liberan al desmontar o si cambia el archivo o el acento. Mientras carga, o si no carga, no hay
// logo: la caja se dibuja igual.

// Ancho del raster en pixeles.
const LOGO_PX = 1024
const TEXTURE_ANISOTROPY = 4

export type LogoTextures = { original: CanvasTexture; accent: CanvasTexture; aspect: number }

function textureOf(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = TEXTURE_ANISOTROPY
  return texture
}

export function useLogoTextures(src: string, accent: string): LogoTextures | null {
  const [textures, setTextures] = useState<LogoTextures | null>(null)
  useEffect(() => {
    let active = true
    let made: LogoTextures | null = null
    const image = new Image()
    image.onload = () => {
      if (!active || image.naturalWidth === 0 || image.naturalHeight === 0) {
        return
      }
      const aspect = image.naturalWidth / image.naturalHeight
      const raster = document.createElement('canvas')
      raster.width = LOGO_PX
      raster.height = Math.round(LOGO_PX / aspect)
      const context = raster.getContext('2d')
      if (context === null) {
        return
      }
      context.drawImage(image, 0, 0, raster.width, raster.height)
      const silhouette = document.createElement('canvas')
      silhouette.width = raster.width
      silhouette.height = raster.height
      const ink = silhouette.getContext('2d')
      if (ink === null) {
        return
      }
      ink.drawImage(raster, 0, 0)
      ink.globalCompositeOperation = 'source-in'
      ink.fillStyle = accent
      ink.fillRect(0, 0, silhouette.width, silhouette.height)
      made = { original: textureOf(raster), accent: textureOf(silhouette), aspect }
      setTextures(made)
    }
    image.src = src
    return () => {
      active = false
      made?.original.dispose()
      made?.accent.dispose()
      setTextures(null)
    }
  }, [src, accent])
  return textures
}
