import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  UnsignedByteType,
  type Texture,
} from 'three'
import { buildFinishMaps, FINISH_RECIPES, type Finish } from './finishMaps'

// Texturas de los acabados (SPEC 12, version 2.1, D53), una por acabado y por mapa,
// memoizadas y liberadas al desmontar, igual que las geometrias de glifo. Se generan la
// primera vez que se pide el acabado, no al cargar la pagina.
// Cada cara usa un clon: el clon comparte la imagen, que se sube una sola vez a la GPU, y
// lleva su propia repeticion, porque cada cara mide distinto. El mapa se repite por metro de
// superficie y no se estira con el slider de medida.

export type FinishTextures = { roughness: Texture; normal: Texture }

// Filtrado anisotropico de las texturas: las vetas del cepillado se leen de costado.
const TEXTURE_ANISOTROPY = 4

const cache = new Map<Finish, FinishTextures>()

function dataTexture(data: Uint8Array, size: number, name: string): DataTexture {
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType)
  texture.name = name
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = TEXTURE_ANISOTROPY
  // Son datos, no colores: sin espacio de color sRGB.
  texture.colorSpace = NoColorSpace
  texture.needsUpdate = true
  return texture
}

export function finishTextures(finish: Finish): FinishTextures {
  const cached = cache.get(finish)
  if (cached !== undefined) {
    return cached
  }
  const maps = buildFinishMaps(finish)
  const textures = {
    roughness: dataTexture(maps.roughness, maps.size, `finish-${finish}-roughness`),
    normal: dataTexture(maps.normal, maps.size, `finish-${finish}-normal`),
  }
  cache.set(finish, textures)
  return textures
}

// Clones para una cara. Quien los pide los libera con disposeSurfaceTextures: liberar un clon
// no borra la imagen compartida mientras otra textura la use.
export function surfaceTextures(finish: Finish): FinishTextures {
  const base = finishTextures(finish)
  return { roughness: base.roughness.clone(), normal: base.normal.clone() }
}

// Repeticion de una cara que mide width por height metros en las unidades de su UV.
export function setSurfaceRepeat(textures: FinishTextures, finish: Finish, width: number, height: number): void {
  const tile = FINISH_RECIPES[finish].tileMeters
  textures.roughness.repeat.set(width / tile, height / tile)
  textures.normal.repeat.set(width / tile, height / tile)
}

export function disposeSurfaceTextures(textures: FinishTextures): void {
  textures.roughness.dispose()
  textures.normal.dispose()
}

export function disposeFinishTextures(): void {
  for (const textures of cache.values()) {
    disposeSurfaceTextures(textures)
  }
  cache.clear()
}
