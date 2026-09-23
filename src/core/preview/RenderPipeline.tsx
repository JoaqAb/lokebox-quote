import { EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import type { QualityProfile } from './quality'
import { EmitterBloom } from './EmitterBloom'
import { RENDER } from './render'

// Pipeline de render del preview (SPEC 12, version 2.0, D45): un solo EffectComposer para
// toda vertical. El orden importa: el AO trabaja sobre la luz lineal, el tone
// mapping la lleva a pantalla una sola vez, y el SMAA suaviza bordes sobre la imagen final.
// El canvas va sin antialias y sin tone mapping propio (PreviewCanvas): los hace este pipeline.
// El composer arranca sin MSAA por lo mismo: el AA es el SMAA del final.
// El Bloom es selectivo por emisores (version 2.1, D50): brilla lo que la vertical marco con
// BLOOM_LAYER, sin umbral de luminancia. Va antes del tone mapping, sobre la luz lineal.

// Solo para validar: el dev server con VITE_QUOTE_BLOOM=off da el mismo cuadro sin bloom,
// la referencia contra la que se mide que none y front no cambian (scripts/capturas.mjs). En
// el build de produccion la variable no existe y el bloom va siempre.
const BLOOM_ON = import.meta.env.VITE_QUOTE_BLOOM !== 'off'

type RenderPipelineProps = {
  quality: QualityProfile
}

export function RenderPipeline({ quality }: RenderPipelineProps) {
  return (
    <EffectComposer multisampling={0}>
      <N8AO
        aoRadius={RENDER.ao.radius}
        distanceFalloff={RENDER.ao.distanceFalloff}
        intensity={RENDER.ao.intensity}
        aoSamples={quality.ao.samples}
        denoiseSamples={quality.ao.denoiseSamples}
      />
      {BLOOM_ON ? <EmitterBloom /> : null}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <SMAA />
    </EffectComposer>
  )
}
