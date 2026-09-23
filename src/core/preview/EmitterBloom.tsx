import { EffectComposerContext } from '@react-three/postprocessing'
import { SelectiveBloomEffect } from 'postprocessing'
import { use, useEffect, useMemo } from 'react'
import { BLOOM_LAYER, RENDER } from './render'

// Bloom selectivo por emisores (SPEC 12, version 2.1, D50). SelectiveBloomEffect dibuja la
// profundidad de lo que esta en BLOOM_LAYER y toma del cuadro principal solo los pixeles donde
// esa profundidad coincide: los emisores que se ven, con su color real. Sin filtro de
// luminancia, asi el umbral no decide nada. Con la capa vacia, en none y front, la entrada
// es negra y el cuadro no cambia.
// Se usa el efecto directo y no el SelectiveBloom de @react-three/postprocessing: ese pide
// luces en la capa, que este efecto no usa porque solo dibuja profundidad, y avisa por consola
// si no se las dan.
// ignoreBackground: el fondo transparente no entra a la seleccion aunque este vacia.
// Es un hook y no un componente desde la version 2.4: el tone mapping lee el mapa del bloom para
// saber que pixeles son luz (CoverageToneMapping), asi que quien monta los dos necesita la
// instancia. null si el bloom esta apagado.

export function useEmitterBloom(enabled: boolean): SelectiveBloomEffect | null {
  const { scene, camera } = use(EffectComposerContext)
  const effect = useMemo(() => {
    if (!enabled) {
      return null
    }
    const bloom = new SelectiveBloomEffect(scene, camera, {
      mipmapBlur: true,
      intensity: RENDER.bloom.intensity,
      radius: RENDER.bloom.radius,
      levels: RENDER.bloom.levels,
    })
    bloom.luminancePass.enabled = false
    bloom.selection.layer = BLOOM_LAYER
    bloom.ignoreBackground = true
    return bloom
  }, [enabled, scene, camera])

  useEffect(
    () => () => {
      effect?.dispose()
    },
    [effect],
  )

  return effect
}
