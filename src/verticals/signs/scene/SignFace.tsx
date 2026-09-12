import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { SET, SIGN_TEXT, type SignPlacement } from './sceneGeometry'
import { glyphTexture, layoutGlyphs } from './glyphTexture'

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
