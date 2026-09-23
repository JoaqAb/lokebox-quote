import { EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import type { QualityProfile } from './quality'
import { RENDER } from './render'

// Pipeline de render del preview (SPEC 12, version 2.0, D45): un solo EffectComposer para
// toda vertical. El orden importa: el AO trabaja sobre la luz lineal, el tone
// mapping la lleva a pantalla una sola vez, y el SMAA suaviza bordes sobre la imagen final.
// El canvas va sin antialias y sin tone mapping propio (PreviewCanvas): los hace este pipeline.
// El composer arranca sin MSAA por lo mismo: el AA es el SMAA del final.
// Sin Bloom por ahora (TAREA_023, frenado): medido, ningun umbral separa el emisivo de back de
// los brillos de none y front. Los brillos especulares del acrilico en front pasan 12 de
// luminancia lineal y los cantos de back quedan por debajo de 4. Se decide aparte.

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
      <ToneMapping mode={ToneMappingMode.AGX} />
      <SMAA />
    </EffectComposer>
  )
}
