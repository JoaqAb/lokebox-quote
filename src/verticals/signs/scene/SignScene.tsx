import { OrthographicCamera } from '@react-three/drei'
import { useMemo } from 'react'
import { MathUtils } from 'three'
import type { ClientPhoto, MaterialVisual } from '../../../core/types'
import { SignBoard } from './SignBoard'
import { LetterFaces, SignFace } from './SignFace'
import { StudioEnvironment } from './StudioEnvironment'
import { type LetterBox, type ScenePalette, type SignPlacement } from './sceneGeometry'

// Contenido del canvas transparente: camara ortografica, la luz que declara la foto, el
// cartel y el texto de su cara. Nada mas: el set salio en el pivote de TAREA_010.
// Camara ortografica y no perspectiva a proposito: el cartel se compone sobre una foto
// ya tomada, asi que la perspectiva la pone la foto. Con una camara en perspectiva
// habria dos puntos de fuga peleando y el cartel no se apoyaria en la pared.
// Sin Suspense y sin loaders: el unico asset es el HDRI, que entra con su propio fallback.

// Media altura que ve la camara ortografica, en metros. El cartel mas grande de los dos
// clientes mide 2,44 m de alto, asi que con 3 entra entero con aire. PhotoStage lo usa
// para traducir metros de escena a fraccion del cuadro.
export const VIEW_HALF_HEIGHT = 3

// Misma ruta que sondea PhotoStage: una sola fuente de verdad. Es la ruta del paquete de
// assets de TAREA_011 (Poly Haven, Studio Small 08, CC0).
export const HDRI_SRC = '/assets/quote/hdri/studio-small-08-256.hdr'

type SignSceneProps = {
  placement: SignPlacement
  material: MaterialVisual
  lightingMode: string
  text: string
  palette: ScenePalette
  photo: ClientPhoto
  hdriReady: boolean
  reducedMotion: boolean
  // Cajas por letra en modo letters, null en modo area.
  letters: LetterBox[] | null
  letterDepth: number
}

export function SignScene({
  placement,
  material,
  lightingMode,
  text,
  palette,
  photo,
  hdriReady,
  reducedMotion,
  letters,
  letterDepth,
}: SignSceneProps) {
  // La key viene de la foto, no de constantes del codigo: cada foto dice de donde le
  // pega el sol, para que el volumen del cartel case con ella.
  const keyPosition = useMemo((): [number, number, number] => {
    const az = MathUtils.degToRad(photo.light.keyAzimuthDeg)
    const el = MathUtils.degToRad(photo.light.keyElevationDeg)
    const r = 10
    return [r * Math.sin(az) * Math.cos(el), r * Math.sin(el), r * Math.cos(az) * Math.cos(el)]
  }, [photo])

  return (
    <>
      {/* manual: sin esto R3F reescribe left/right/top/bottom en pixeles en cada resize
          del canvas, y el cartel de 2 m queda de 2 px y desaparece. */}
      <OrthographicCamera makeDefault manual position={[0, 0, 10]} zoom={1} top={VIEW_HALF_HEIGHT} bottom={-VIEW_HALF_HEIGHT} left={-VIEW_HALF_HEIGHT} right={VIEW_HALF_HEIGHT} near={0.1} far={100} />

      <ambientLight intensity={photo.light.ambient} />
      <directionalLight position={keyPosition} intensity={photo.light.keyIntensity} />
      {hdriReady ? <StudioEnvironment src={HDRI_SRC} /> : null}

      <group
        rotation={[MathUtils.degToRad(photo.anchor.pitchDeg), MathUtils.degToRad(photo.anchor.yawDeg), 0]}
      >
        <SignBoard
          placement={placement}
          material={material}
          lightingMode={lightingMode}
          shadowColor={palette.shadow}
          reducedMotion={reducedMotion}
          letters={letters}
          letterDepth={letterDepth}
        />
        {letters === null ? (
          <SignFace placement={placement} color={palette.signText} text={text} />
        ) : (
          <LetterFaces
            letters={letters}
            letterHeight={placement.box.height}
            letterDepth={letterDepth}
            color={palette.signText}
          />
        )}
      </group>
    </>
  )
}
