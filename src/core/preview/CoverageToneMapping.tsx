import { BlendFunction, Effect, type SelectiveBloomEffect } from 'postprocessing'
import { Uniform } from 'three'
import { useEffect, useMemo } from 'react'
import { RENDER } from './render'

// Tone mapping AgX sobre un buffer transparente (SPEC 12, version 2.4, TAREA_025). El canvas va
// transparente y el composer mezcla en luz lineal: un pixel que cubre la foto a medias llega
// premultiplicado, color por alpha. Aplicar AgX y la codificacion sRGB a ese producto no baja en
// proporcion al alpha, porque las dos curvas levantan los valores chicos: el halo con alpha 0,06
// salia en 69 niveles en lugar de 12, con rgb mayor que alpha, y cortaba a 0 en el borde de la
// malla.
// Un pixel parcial puede ser dos cosas. Cobertura: una superficie que tapa una parte, como el
// halo o la sombra de apoyo. Luz: el resplandor del bloom, que suma color y ademas escribe su
// alpha. Con el color y el alpha solos no se distinguen: el resplandor de la cara del acrilico
// tiene color derecho menor que 1, igual que una superficie. Lo que las separa es el mapa del
// bloom, que este efecto lee: donde hay resplandor se mapea el color como hasta ahora, y donde no
// hay, la cobertura se mapea con su color derecho (color sobre alpha) y se vuelve a multiplicar
// por alpha, lineal en alpha, que es lo que el navegador espera de un canvas premultiplicado.
// Entre los dos, una rampa suave sobre el alpha del resplandor. Un pixel opaco da lo mismo por
// los dos caminos. En modo vista no hay bloom (D64) y todo pixel parcial es cobertura.
// La salida vuelve a luz lineal: la codificacion sRGB la sigue haciendo el ultimo pase.

const FRAGMENT = /* glsl */ `
#include <tonemapping_pars_fragment>

vec3 displayOf(const in vec3 color) {
  return sRGBTransferOETF(vec4(AgXToneMapping(color), 1.0)).rgb;
}

#ifdef GLOW
uniform sampler2D glowMap;
uniform float glowIntensity;
#endif

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float alpha = clamp(inputColor.a, 0.0, 1.0);
  vec3 straight = alpha > 0.0 ? inputColor.rgb / alpha : vec3(0.0);
#ifdef GLOW
  float light = smoothstep(0.0, GLOW_ALPHA, texture2D(glowMap, uv).a * glowIntensity);
#else
  float light = 0.0;
#endif
  vec3 display = mix(alpha * displayOf(straight), displayOf(inputColor.rgb), light);
  outputColor = vec4(sRGBTransferEOTF(vec4(display, 1.0)).rgb, inputColor.a);
}
`

type CoverageToneMappingProps = {
  // El bloom montado antes en el mismo composer, o null si esta apagado.
  glow: SelectiveBloomEffect | null
}

export function CoverageToneMapping({ glow }: CoverageToneMappingProps) {
  const effect = useMemo(() => {
    const defines = new Map([['GLOW_ALPHA', RENDER.coverage.glowAlpha.toFixed(4)]])
    const uniforms = new Map<string, Uniform>()
    if (glow !== null) {
      defines.set('GLOW', '1')
      uniforms.set('glowMap', new Uniform(glow.texture))
      uniforms.set('glowIntensity', new Uniform(glow.intensity))
    }
    return new Effect('CoverageToneMapping', FRAGMENT, { blendFunction: BlendFunction.SRC, defines, uniforms })
  }, [glow])

  useEffect(
    () => () => {
      effect.dispose()
    },
    [effect],
  )

  return <primitive object={effect} dispose={null} />
}
