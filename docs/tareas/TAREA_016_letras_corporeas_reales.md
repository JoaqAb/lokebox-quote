# TAREA_016 · Letras corporeas reales y texto en relieve

Bloque 4. Va despues de TAREA_015 y antes de TAREA_013 (landing).

Prerrequisito: docs/STATE.md, docs/EXECUTION.md bloque 4, SPEC 3, 10, 12 y 16 (version 1.14).

## Contexto

El criterio 2 de DONE quedo rechazado. El modo letters dibuja una caja por letra con el glifo pintado en la cara, y se lee como un azulejo y no como una letra corporea. Es lo que el producto vende: es bloqueante.

## Alcance

### 1. Typeface, el unico asset nuevo

- Archivo Black (SIL Open Font License 1.1, sin nombre reservado), subsetado a mayusculas A a Z, numeros 0 a 9 y espacio: 37 glifos.
- Archivo: `public/assets/quote/fonts/archivo-black-subset.typeface.json`, techo 60 kB. Peso final: 12.951 bytes.
- Licencia al lado: `public/assets/quote/fonts/OFL.txt`. No se pide en runtime.
- Origen: el TTF oficial de Google Fonts, `https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf`, sha256 `dd9a89a019b4849f66ab75455fe7bdf931311042cbb0f0f97acc061539703180`.
- Conversion con `scripts/typeface.cjs`, equivalente a facetype.js sobre opentype.js: mismo formato, escala a resolucion 1000, `c` pasa a `b`, coordenadas redondeadas, sin los `z` que three no lee, con copyright y licencia de la fuente dentro del JSON. Lanza si falta un caracter.
- Comando exacto, desde la raiz del repo:

```
curl -sSL -o /tmp/typeface/ArchivoBlack-Regular.ttf --create-dirs https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf
npm install --prefix /tmp/typeface opentype.js@1.3.4
NODE_PATH=/tmp/typeface/node_modules node scripts/typeface.cjs /tmp/typeface/ArchivoBlack-Regular.ttf public/assets/quote/fonts/archivo-black-subset.typeface.json "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 "
```

- opentype.js no entra a package.json: es de la herramienta, no de la app.
- SPEC 12 y 16 se reabren: el archivo de fuente pasa a estar permitido con este techo y este unico uso. Los modelos importados siguen prohibidos, y `Text` y `Text3D` de drei tambien. SPEC 3 suma el typeface a su lista de assets.

### 2. SignText3D, componente unico de texto 3D

- Reemplaza a las CanvasTexture por glifo. Se borran `scene/glyphTexture.ts` y `scene/SignFace.tsx`. No tienen tests propios. La sombra de apoyo y el halo conservan su CanvasTexture de degradado.
- Carga: un `fetch` del typeface al montar el preview, una sola vez por pagina, parseado con `Font` de three. Sin el typeface el preview funciona igual y el texto no se dibuja.
- Geometria: `TextGeometry` de three (no `Text3D` de drei), `curveSegments` 4, bisel chico. Una sola geometria por caracter, memoizada en un mapa por caracter y liberada con `dispose` al desmontar el preview.
- La geometria se arma una vez en unidades: alto de mayuscula 1 (el alto de la H) y profundidad total 1, bisel incluido, centrada en su avance en x y en su profundidad en z, con la base de la mayuscula en y 0. El tamano real va con `scale`, asi mover un slider no regenera nada.
- Bisel: `bevelSize` 0,025 del alto de mayuscula y `bevelThickness` 0,08 de la profundidad, `bevelSegments` 2.
- Caras: la geometria del texto trae dos grupos, tapas y cantos. Las tapas se parten en cara frontal y cara trasera por la normal, asi quedan tres materiales: frente, cantos y trasera. En back la cara trasera emite con los cantos.
- Cara y cantos con el material elegido: color, metalness y roughness del `visual`, con el mismo damp del panel.
- Espaciado: avance de cada glifo del typeface (`ha`), no un ancho fijo ni `measureText`. Un caracter que el typeface no tiene (por ejemplo una letra con tilde) no dibuja letra y ocupa el avance del espacio.

Modo letters:

- Una letra por caracter del texto sin espacios, hasta 18. El espacio ocupa su avance y no dibuja nada.
- Alto de mayuscula igual al alto de letra de la seleccion.
- Profundidad `visual.depthMeters` de la opcion elegida.
- La caja del encuadre por huella de TAREA_015 sale del contorno real del texto: el ancho y el alto de los glifos usados con su bisel, simetrico alrededor del origen, y la profundidad de las letras.

Modo area:

- El mismo texto en relieve de 3 mm sobre la cara del panel, centrado y escalado al ancho disponible como hoy: margen 0,12 por lado y alto maximo 0,62 del panel, manda el menor.
- El escalado usa el contorno real de los glifos con su bisel, asi el texto no se sale del panel en ninguna medida del rango.
- Color del relieve: `signText` de la paleta, como el glifo de hoy, con metalness y roughness del material. Un relieve de 3 mm del mismo color que el panel no se lee de frente.
- El relieve no emite en ningun modo: es parte de la cara.

### 3. Mayusculas en el campo de texto

- El descriptor del control de texto suma `uppercase: true` desde `src/verticals/signs/fields.ts`, y `TextInput` pasa el valor a mayusculas al escribir. Core no sabe de carteles: solo aplica la opcion.
- El default de los dos JSON ya esta en mayusculas.
- La validacion de 1 a 18 caracteres y el filtro de texto sin letras no cambian.

### 4. Back de modo cartel en la letra

Cara frontal sin emision y apenas oscurecida, emision en cantos y cara trasera, como el panel en TAREA_015.

## Archivos

- `public/assets/quote/fonts/archivo-black-subset.typeface.json`, `public/assets/quote/fonts/OFL.txt`, `scripts/typeface.cjs`
- `src/verticals/signs/scene/SignText3D.tsx` (nuevo), `src/verticals/signs/scene/typeface.ts` (nuevo) y su test
- `src/verticals/signs/scene/SignBoard.tsx`, `SignScene.tsx`, `sceneGeometry.ts`, `sceneGeometry.test.ts`
- `src/verticals/signs/PhotoStage.tsx`
- Se borran `src/verticals/signs/scene/glyphTexture.ts` y `src/verticals/signs/scene/SignFace.tsx`
- `src/core/ui/panelTypes.ts`, `src/core/ui/controls/TextInput.tsx`, `src/core/ui/OptionsPanel.tsx`, `src/verticals/signs/fields.ts`
- `SPEC.md` (1.14), `docs/DECISIONES.md`, `docs/EXECUTION.md`

## Criterios de aceptacion

- G1 a G6. Los 185 tests previos quedan intactos salvo los que cambian por el borrado de las CanvasTexture de glifo, y esos se editan sin tocar un numero que no cambio.
- Capturas de /d/northline y /d/norte en modo cartel, modo letters, girado a 0, 45 y 90 grados: se ve el contorno real de cada letra con canto y bisel, no una caja con un glifo.
- Las 18 letras con la medida maxima siguen dentro del cuadro en todo el giro, con el encuadre por huella proyectada de TAREA_015.
- Modo area: el texto queda en relieve sobre el panel, con la misma tipografia, sin salirse del panel en ninguna medida del rango.
- Presupuesto: vendor 3D por debajo de 1000 kB, app por debajo de 500 kB, typeface por debajo de 60 kB. Un solo pedido de red nuevo, el del typeface.
- Las tres comparaciones de luminancia de SPEC 12 siguen dando, con numeros, en los dos clientes.
- 390, 768 y 1440 px sin defectos.
- El criterio 2 de DONE lo valida Joaquin en captura antes de cerrar.

## Commits y deploy

1. Docs de apertura: SPEC 1.14, docs/DECISIONES.md, este archivo y la entrada en EXECUTION.
2. Codigo, con el typeface, su licencia y el script.
3. Docs de cierre: docs/STATE.md reescrito, docs/DECISIONES.md, docs/tareas/_ULTIMO.md en 017.

Despues: `git push` a origin/main y verificar que https://quote.lokebox.com/d/northline y /d/norte abran con el build nuevo.
