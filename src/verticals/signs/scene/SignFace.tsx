import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { LETTERS, SET, SIGN_TEXT, type LetterBox, type SignPlacement } from './sceneGeometry'
import { FONT_RATIO, glyphTexture, layoutGlyphs } from './glyphTexture'

// El texto en la cara del cartel (SPEC 12). Un plano por caracter, con la textura de
// glifo memoizada. Sin Text ni Text3D de drei y sin ningun archivo de fuente.
// El color sale del visual del material, como el resto de la escena.
// No entra en el useFrame de SignBoard: el texto cambia con la tecla, no con el damp, y
// mezclarlo con la transicion de medidas haria que la palabra se estire mientras cambia.

type SignFaceProps = {
  placement: SignPlacement
  color: string
  text: string
}

export function SignFace({ placement, color, text }: SignFaceProps) {
  const layout = useMemo(() => layoutGlyphs(text), [text])

  const { box } = placement
  if (layout.glyphs.length === 0 || box.width <= 0 || box.height <= 0) {
    return null
  }

  // La palabra se escala al espacio disponible por ancho y por alto, y manda el menor:
  // asi un texto largo achica en vez de desbordar la cara.
  const usableWidth = box.width * (1 - 2 * SIGN_TEXT.marginRatio)
  const usableHeight = box.height * SIGN_TEXT.maxHeightRatio
  const glyphHeight = Math.min(usableHeight, usableWidth / layout.totalWidth)
  const z = SET.sign.thickness / 2 + SIGN_TEXT.gap

  return (
    <group position={[0, 0, z]}>
      {layout.glyphs.map((glyph, index) => (
        <mesh
          key={`${glyph.char}-${String(index)}`}
          position={[glyph.offset * glyphHeight, 0, 0]}
          scale={[glyphHeight, glyphHeight, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={glyphTexture(glyph.char)}
            color={color}
            transparent
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

type LetterFacesProps = {
  letters: LetterBox[]
  letterHeight: number
  letterDepth: number
  color: string
}

// Modo letters: el glifo de cada letra sobre la cara frontal de su caja. La textura es la
// misma del modo area; el tile mide el alto de letra dividido FONT_RATIO, asi la fuente
// del glifo queda del alto de la caja y centrada en ella.
export function LetterFaces({ letters, letterHeight, letterDepth, color }: LetterFacesProps) {
  if (letters.length === 0 || letterHeight <= 0) {
    return null
  }
  const tile = letterHeight / FONT_RATIO
  const z = letterDepth / 2 + LETTERS.glyphGap
  return (
    <group position={[0, 0, z]}>
      {letters.map((letter, index) => (
        <mesh
          key={`${letter.char}-${String(index)}`}
          position={[letter.x, 0, 0]}
          scale={[tile, tile, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={glyphTexture(letter.char)}
            color={color}
            transparent
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}
