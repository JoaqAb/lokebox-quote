import type { ReactNode } from 'react'
import type { LetterBox, Vec3 } from './sceneGeometry'
import { glyphGeometry, type Typeface } from './typeface'

// El texto 3D del cartel (SPEC 12, version 1.14), unico para los dos modos: una letra por
// caracter con TextGeometry del typeface, con su contorno real, canto y bisel. Sin Text ni
// Text3D de drei. Modo letters: las letras corporeas. Modo area: el relieve de la cara.
// La geometria de cada caracter esta memoizada en unidades (alto de mayuscula 1 y
// profundidad 1); el tamano va con scale, asi mover un slider no regenera nada.
// Los materiales no se deciden aca: los pone quien monta el texto, que es quien los anima
// con el damp del cartel. Cada letra lleva tres, en el orden de TEXT_FACE.

type SignText3DProps = {
  typeface: Typeface
  letters: LetterBox[]
  // Alto de mayuscula y profundidad de cada letra, en metros.
  height: number
  depth: number
  position: Vec3
  materials: (owner: string) => ReactNode
  owner: string
}

export function SignText3D({ typeface, letters, height, depth, position, materials, owner }: SignText3DProps) {
  if (height <= 0 || depth <= 0) {
    return null
  }
  return (
    <group position={position}>
      {letters.map((letter, index) => {
        const geometry = glyphGeometry(typeface, letter.char)
        if (geometry === null) {
          return null
        }
        const key = `${owner}-${letter.char}-${String(index)}`
        return (
          <mesh key={key} geometry={geometry} position={[letter.x * height, 0, 0]} scale={[height, height, depth]}>
            {materials(key)}
          </mesh>
        )
      })}
    </group>
  )
}
