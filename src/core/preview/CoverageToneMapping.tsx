import { EffectComposerContext } from '@react-three/postprocessing'
import { BlendFunction, Effect, type SelectiveBloomEffect } from 'postprocessing'
import { use, useEffect, useMemo } from 'react'
import { Color, Uniform, WebGLRenderTarget, type Camera, type Scene, type WebGLRenderer } from 'three'
import { ATTENUATION_LAYER, RENDER } from './render'

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
// Desde la version 2.6 (D79) este pase tambien compone la sombra de vista, que es atenuacion y no
// luz: los receptores estan en ATTENUATION_LAYER, fuera del pase principal, y este efecto los
// dibuja en un target propio antes de cada cuadro. Su alpha s es cuanto tapa la sombra. La salida
// lleva el color de la luz mapeada sola y alpha 1 - (1 - s)(1 - a): sobre la foto queda
// C_luz + (1 - s)(1 - a) foto. Mezclada antes del tone mapping, la sombra desaparecia bajo el halo.
// La salida vuelve a luz lineal: la codificacion sRGB la sigue haciendo el ultimo pase.

const FRAGMENT = /* glsl */ `
#include <tonemapping_pars_fragment>

uniform sampler2D attenuationMap;

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
  float shade = clamp(texture2D(attenuationMap, uv).a, 0.0, 1.0);
  outputColor = vec4(sRGBTransferEOTF(vec4(display, 1.0)).rgb, 1.0 - (1.0 - shade) * (1.0 - alpha));
}
`

// El efecto con su target de atenuacion. update corre antes de cada cuadro del composer.
class CoverageToneMappingEffect extends Effect {
  private readonly attenuation = new WebGLRenderTarget(1, 1)
  private readonly clearColor = new Color()
  private readonly scene: Scene
  private readonly camera: Camera

  constructor(scene: Scene, camera: Camera, glow: SelectiveBloomEffect | null) {
    const defines = new Map([['GLOW_ALPHA', RENDER.coverage.glowAlpha.toFixed(4)]])
    const uniforms = new Map<string, Uniform>([['attenuationMap', new Uniform(null)]])
    if (glow !== null) {
      defines.set('GLOW', '1')
      uniforms.set('glowMap', new Uniform(glow.texture))
      uniforms.set('glowIntensity', new Uniform(glow.intensity))
    }
    super('CoverageToneMapping', FRAGMENT, { blendFunction: BlendFunction.SRC, defines, uniforms })
    this.scene = scene
    this.camera = camera
    const map = this.uniforms.get('attenuationMap')
    if (map !== undefined) {
      map.value = this.attenuation.texture
    }
  }

  // Dibuja solo la capa de atenuacion, sobre transparente. La camara vuelve a sus capas. Los mapas
  // de sombra no se tocan: los dibuja una vez por cuadro el pase principal (ShadowMaps, version 2.8,
  // D88) y este render los reusa.
  override update(renderer: WebGLRenderer): void {
    const mask = this.camera.layers.mask
    const background = this.scene.background
    const clearAlpha = renderer.getClearAlpha()
    renderer.getClearColor(this.clearColor)
    this.camera.layers.set(ATTENUATION_LAYER)
    this.scene.background = null
    renderer.setRenderTarget(this.attenuation)
    renderer.setClearColor(0x000000, 0)
    renderer.clear()
    renderer.render(this.scene, this.camera)
    renderer.setClearColor(this.clearColor, clearAlpha)
    this.scene.background = background
    this.camera.layers.mask = mask
  }

  override setSize(width: number, height: number): void {
    this.attenuation.setSize(width, height)
  }

  override dispose(): void {
    super.dispose()
    this.attenuation.dispose()
  }
}

type CoverageToneMappingProps = {
  // El bloom montado antes en el mismo composer, o null si esta apagado.
  glow: SelectiveBloomEffect | null
}

export function CoverageToneMapping({ glow }: CoverageToneMappingProps) {
  const { scene, camera } = use(EffectComposerContext)
  const effect = useMemo(() => new CoverageToneMappingEffect(scene, camera, glow), [scene, camera, glow])

  useEffect(
    () => () => {
      effect.dispose()
    },
    [effect],
  )

  return <primitive object={effect} dispose={null} />
}
