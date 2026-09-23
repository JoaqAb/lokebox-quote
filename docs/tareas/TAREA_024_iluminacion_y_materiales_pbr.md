# TAREA_024 · Iluminacion y materiales PBR

Bloque 10, Quote premium. Segunda de cinco.

Prerrequisito: docs/STATE.md, CLAUDE.md, SPEC 3, 10, 12, 16, 17 y 18 (version 2.2).

Revision del 23/09 (SPEC 2.2, D55 a D59): la ejecucion freno por el primer frame del HDRI 1k en
slow 4G y porque acrilico y PVC seguian dando el mismo pixel (`validacion/premium/024/mediciones.md`).
Canal B resolvio: el HDRI descargado sale y entra un entorno de estudio generado (D55), el
criterio 3 pasa a mediana (D56), la luminancia depende del material (D57), el criterio 6 se
parte (D58) y el reemplazo del halo queda para Canal B (D59). La apertura 16a5826 no se reescribe.

Segunda revision del 23/09 (SPEC 2.3, D60 a D62): con el rig generado, modo cartel dio 18 de 18
de frente pero de 0 a 1,7 a 60 grados, y modo vista 6 de 18 (`validacion/premium/024/mediciones-rig.md`).
Canal B resolvio: el rig reparte las fuentes alrededor del eje vertical y el criterio 3 se mide
en modo cartel de frente y a 60 grados (D60); modo vista sale del criterio 3 y se mide por
contraste interno de la cara, con la fuente especular derivada de la key de la foto (D61); el
HDRI descargado no vuelve (D62). El codigo del entorno generado se conserva.

## Contexto

Objetivo: que elegir material cambie el pixel de forma evidente. Hoy casi no lo hace: esta
medido desde el 14/09 que PVC y acrilico se ven iguales entre si incluso con el HDRI 1k, y en
las capturas de TAREA_023 los tres se leen como el mismo plastico claro.

TAREA_023 se cierra sin bloom (D49). El bloom vuelve aca, selectivo por emisores (D50, D51),
porque su entrada es el emisivo de back que esta tarea reescribe.

La transmision del acrilico se midio antes de la apertura y se descarto (D54): el canvas es
transparente en los dos modos y el pase de transmision de three limpia su buffer con blanco a
medio alpha. Con transmission 1 el acrilico sube hasta 32 niveles hacia el blanco en modo vista
y baja 25 en modo cartel. Medicion en `validacion/premium/024/transmision/medicion.md`.

## Alcance

### 0. Cierre de TAREA_023 (va en el commit de apertura)

- TAREA_023: estado cerrada, criterio 4 verificado en luminancia y su parte de bloom
  trasladada a esta tarea por D51.
- INDICE: linea de TAREA_023 con 10d469e.
- STATE: sin el bloqueo del bloom.

### 1. SPEC 2.1 y decisiones (commit de apertura)

- SPEC 12, Bloom: selectivo por emisores, con el motivo medido.
- SPEC 12, Material: parametros fisicos por acabado, mapas generados en runtime y la
  transmision descartada con el motivo y los dos numeros.
- SPEC 10: `materials[].visual` con los parametros fisicos y `finish` (D52).
- SPEC 18: generadores de mapas y capa de bloom en `src/core/preview/`.
- SPEC 3: peso medido de la primera carga sin HDRI descargado (D55). Se escribe al cierre.
- DECISIONES: D49 a D54.

### 2. Entorno de estudio (D55, reemplaza al HDRI)

- Salen `studio-small-08-1k.hdr` y `studio-small-08-2k.hdr` de `public/assets/quote/hdri/` y la
  referencia al archivo. Sale tambien el 256, que queda sin uso.
- El entorno se genera en runtime con `Environment` y `Lightformer` de drei, en
  `src/core/preview/StudioEnvironment.tsx`, con constantes nombradas en `src/core/preview/render.ts`.
  Se renderiza una vez al montar, nunca de fondo, solo para reflejo.
- Rig de contraste: fuentes brillantes y acotadas contra un entorno oscuro. Las fuentes van
  donde su reflejo cae en la cara en la vista frontal del modo cartel, detras de la camara.
- En modo vista la intensidad del rig escala con `light.ambient` de la foto elegida.
- La pantalla de carga no cambia. Si el progreso queda en un parpadeo, se reporta; no se le
  pone un minimo (D47).
- El rig reparte las fuentes alrededor del eje vertical, como un estudio con varios softboxes,
  para que la separacion siga al girar el cartel (D60).
- En modo vista la fuente especular sale de la foto: su direccion deriva de `keyAzimuthDeg` y
  `keyElevationDeg` del `light` de la foto elegida, y la intensidad escala con `light.ambient` (D61).
- El HDRI descargado no vuelve como segunda opcion (D62).

### 3. Materiales

Contrato de `materials[].visual` (SPEC 10): `color`, `finish`, `metalness`, `roughness`,
`specularIntensity`, `clearcoat`, `clearcoatRoughness`, `anisotropy`, `normalScale` y
`translucency`, todas obligatorias. `finish` es `foam`, `brushed` o `polished`. Tipo en
`src/core/types.ts`, validacion en `src/core/clientConfig.ts`, valores en los dos JSON.

- PVC espumado, `foam`: mate, microrelieve fino, sin reflejo especular marcado.
- Chapa, `brushed`: metalico, anisotropia horizontal en la cara y a lo largo de cada canto.
  En la caja, los cantos laterales rotan la direccion un cuarto de vuelta; en las letras la
  direccion sigue el contorno.
- Acrilico opal, `polished`: roughness de base baja, clearcoat alto y clearcoatRoughness
  baja. Sin transmission, sin thickness y sin ior (D54). En none y front se separa del PVC
  por reflejo del entorno de estudio, no por transparencia.

Mapas (D53): roughness y normal por acabado, con ruido determinista, generados como datos
puros con tests (`src/core/preview/finishMaps.ts`) y convertidos a textura en
`src/core/preview/finishTextures.ts`, memoizados por acabado y con dispose al desmontar,
igual que las geometrias de glifo. Cada cara usa un clon de la textura, que comparte la
imagen, con su propia repeticion por metro. Si un acabado parece necesitar un mapa
fotografico, se frena y se reporta antes de descargar nada.

Las caras del cartel pasan a `MeshPhysicalMaterial`. Todos los parametros numericos se
amortiguan con el damp del cartel, como hoy color, metalness y roughness.

### 4. Acrilico opal en back

La cara enciende por emision pareja en toda la superficie, con la intensidad de los cantos
por `translucency`, en los dos modos. Esa cara entra a la seleccion del bloom. Las tres
comparaciones de luminancia de SPEC 12, por material desde 2.2 (D57), tienen que cumplir.

### 5. Bloom selectivo

Vuelve al mismo EffectComposer, en el orden que ya esta: N8AO, Bloom, ToneMapping AgX, SMAA.
`SelectiveBloom` con la capa de bloom que exporta el core (`src/core/preview/render.ts`). La
vertical habilita esa capa en sus emisores, como hace con las sombras (SPEC 18). Seleccion:
en back, la cascara del panel y de las letras (cantos y cara trasera) y la cara con
`translucency` mayor que 0. Para que la cara apagada no entre, panel y letras se dibujan como
dos mallas sobre la misma geometria: la cara y la cascara, con los atributos compartidos.
El umbral deja de ser el mecanismo.

### 6. Capturas

`npm run capturas -- premium <carpeta>` suma el material al nombre y al recorrido: tipo,
material, luz y vista, 81 cuadros por cliente. Antes en `validacion/premium/024/antes/`,
sacado con el codigo de 10d469e; despues en `validacion/premium/024/despues/`.

## Criterios de aceptacion

1. G1 a G6 de EXECUTION.
2. Capturas antes y despues en `validacion/premium/024/`, con el material en el nombre.
3. Separacion de materiales en modo cartel (D56, D60): mediana de la diferencia absoluta sobre
   la mascara de la cara erosionada, sin la sombra de apoyo. Mascara: los pixeles que cambian
   de none a front. Los tres pares, los dos clientes. De frente, mayor a 10 niveles; a 60
   grados, con el cuadro cartel60, mayor a 6. Medido tambien el antes con la misma metrica.
3b. Modo vista (D61): p95 menos p50 de la luminancia dentro de la mascara de la cara, por
   material. En vista de dia, los dos clientes, el acrilico supera al PVC en mas de 8 niveles.
   La chapa queda como dato. Si el brillo no sale sin mover la luminancia media de la cara mas
   de 10 niveles respecto de la de hoy, vista queda como dato medido y la tarea sigue.
4. Bloom: con el efecto montado, none y front no cambian ni un pixel contra el mismo cuadro
   sin bloom, en los dos clientes, los tres tipos y los tres materiales. En back cambian los
   pixeles del emisor y su entorno inmediato.
5. Luminancia de SPEC 12 por material (D57). Los tres materiales: la cara crece de none a
   front, y el anillo crece de front a back en modo vista. PVC y chapa: la cara baja de front
   a back. Acrilico: la cara sube de front a back y su desviacion estandar baja. En modo
   cartel la mascara excluye la sombra de apoyo.
6. Modo vista (D58).
   - 6a: en none y front, la foto fuera del cartel queda identica a la foto sola, diferencia 0.
   - 6b: en back el derrame vive dentro de la banda del halo, 0,12 del alto del cartel por
     lado, cae a 0 en su borde y no tiene borde duro. Fuera de esa banda, diferencia 0.
   El halo de CanvasTexture no se toca. Si el bloom lo vuelve redundante, se anota con
   captura para Canal B (D59).
7. Peso de la primera carga y primer frame con slow 4G medidos de nuevo, dentro de 8 MB. Si
   el primer frame pasa de 6 s en slow 4G, se frena antes de seguir sumando assets.
8. `src/core` sin imports de `src/verticals` ni de `src/clients`.
9. Tests: solo cambian por el contrato nuevo de `materials[].visual`, mas los nuevos de los
   generadores de mapas.

Frenar y reportar, sin parchear, solo si un acabado parece necesitar un mapa fotografico
descargado o si el primer frame en slow 4G pasa de 6 s (segunda revision, D60 a D62).

## Commits

1. docs: cierre de TAREA_023, apertura de TAREA_024, SPEC 2.1. Hecho en 16a5826.
2. docs: revision de TAREA_024, SPEC 2.2 y D55 a D59. Hecho en 0f2ee30.
2b. docs: segunda revision de TAREA_024, SPEC 2.3 y D60 a D62.
3. feat: entorno de estudio, materiales PBR y bloom selectivo.
4. docs: cierre de TAREA_024.

Despues de los tres, push.

## Resultado (23/09/2026)

Estado: cerrada. Canal B la acepta el 23/09 (D63): 3b queda como dato, el criterio 5 falla solo
en letras de acrilico con la cara de front en el techo de AgX, y 6b pasa a TAREA_025. Codigo en a0ee0d1.
Mediciones en `validacion/premium/024/` (`medir2.py`, `c3.txt` a `c6-despues.txt`), capturas en
`despues/` y `sinbloom/`, 202 cuadros por corrida.

1. G1 a G6: tsc, lint y build limpios, 259 tests en verde.
2. Capturas: si. `antes/` con 10d469e, `despues/` y `sinbloom/` con el material en el nombre.
3. Separacion en modo cartel: 36 de 36. De frente, minimo 10,3; en cartel60, minimo 7,3 (chapa
   contra acrilico). Antes, de frente: 12 de 18, acrilico contra PVC con mediana 1,0.
3b. Vista, dato (D61): acrilico menos PVC en p95 menos p50, de -0,7 a 2,4 de dia. Con la fuente
   especular de 10 grados la media de la cara se mueve 3 niveles y el brillo no aparece: de
   frente la cara refleja lo que esta detras de la camara y el sol de la foto queda a unos 42
   grados. Con una fuente de 80 grados la media sube 20 niveles y el contraste sigue en 0 a 2.
4. Bloom: none y front, 0 pixeles distintos contra sin bloom en los 108 cuadros. En back cambian
   emisores y entorno; 16 cuadros de back sin cambio, todos de PVC o chapa en fachada o totem,
   sin emisor visible de frente, como dice D50.
5. Luminancia por material: cara front mayor que none 45 de 45, opacos back menor que front 30 de
   30, anillo 27 de 27. Acrilico back mayor que front 12 de 15 y desviacion 13 de 15: fallan las
   letras de acrilico (cartel en los dos clientes y northline de noche), con la cara en 222 en
   front y en back.
6a. Si: diferencia 0 fuera del cartel en none y front, los dos clientes.
6b. No. El derrame del bloom sale de la banda del halo: hasta 124 niveles en el borde de la banda
   con acrilico, y en letras la banda mide 3 o 4 pixeles. Con levels 1 y radius 0,2 fachada y
   totem entran, las letras siguen afuera y el bloom deja de verse. Aparte, el halo de
   CanvasTexture tiene borde duro desde antes de esta tarea: salto de 43 a 92 niveles sin bloom.
   Con el bloom de la apertura ese borde queda tapado (D59). Se deja el bloom de la apertura.
7. Primer frame con build de produccion: sin throttling 2,4 s, fast 4G 1,4 s, slow 4G 3,9 s.
   567 kB transferidos, sin assets 3D salvo el typeface. La pantalla de carga sigue en su lugar;
   con un solo asset en el LoadingManager el progreso salta de 0 a 100 en un paso (inferido).
8. Si: `src/core` sin imports de `src/verticals` ni de `src/clients` fuera de los tests.
9. Tests nuevos: validacion de `materials[].visual`, generadores de mapas y rig de estudio.

Decisiones de ejecucion en DECISIONES (23/09/2026, TAREA_024).
