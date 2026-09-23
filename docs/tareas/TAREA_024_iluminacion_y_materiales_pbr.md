# TAREA_024 · Iluminacion y materiales PBR

Bloque 10, Quote premium. Segunda de cinco.

Prerrequisito: docs/STATE.md, CLAUDE.md, SPEC 3, 10, 12, 16, 17 y 18 (version 2.1).

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
- SPEC 3: peso medido de la primera carga con el HDRI que quede. Se escribe al cierre.
- DECISIONES: D49 a D54.

### 2. HDRI

Reemplaza a `studio-small-08-256.hdr`. Se prueban el 1k y el 2k oficiales de Poly Haven
(Studio Small 08, CC0) y queda el menor que no se distinga del mayor en captura sobre
aluminio y acrilico. El HDRI nunca se ve de fondo: su resolucion solo importa para el
reflejo. Se anotan los dos pesos y cual quedo. Pesos de archivo medidos al bajarlos:
1k 1.508.872 bytes, 2k 5.930.381 bytes.

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
  por reflejo del HDRI, no por transparencia.

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
comparaciones de luminancia de SPEC 12 tienen que seguir cumpliendo.

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
3. Separacion de materiales en la region del cartel, modo cartel de frente y modo vista,
   para los tres pares: diferencia media mayor a 12 niveles y mas del 50 por ciento de los
   pixeles con diferencia mayor a 8. Medido tambien el antes.
4. Bloom: con el efecto montado, none y front no cambian ni un pixel contra el mismo cuadro
   sin bloom, en los dos clientes, los tres tipos y los tres materiales. En back cambian los
   pixeles del emisor y su entorno inmediato.
5. Las tres comparaciones de luminancia de SPEC 12 siguen cumpliendo.
6. Modo vista: la foto fuera del cartel sigue identica a la foto sola, diferencia 0.
7. Peso de la primera carga y primer frame con slow 4G medidos de nuevo, dentro de 8 MB. Si
   el primer frame pasa de 6 s en slow 4G, se frena antes de seguir sumando assets.
8. `src/core` sin imports de `src/verticals` ni de `src/clients`.
9. Tests: solo cambian por el contrato nuevo de `materials[].visual`, mas los nuevos de los
   generadores de mapas.

Frenar y reportar, sin parchear, si acrilico contra PVC no llega al umbral del criterio 3 con
opal (sin subir el clearcoat a ojo), si un acabado parece necesitar un mapa fotografico, o si
el primer frame en slow 4G pasa de 6 s.

## Commits

1. docs: cierre de TAREA_023, apertura de TAREA_024, SPEC 2.1.
2. feat: HDRI, materiales PBR y bloom selectivo.
3. docs: cierre de TAREA_024.

Despues de los tres, push.
