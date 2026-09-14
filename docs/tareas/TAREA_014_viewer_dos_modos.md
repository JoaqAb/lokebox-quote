# TAREA_014 · Viewer en dos modos, camara en perspectiva y arreglo de back-lit

Bloque 4. Va antes que TAREA_013 (landing), que queda abierta y se ejecuta despues.

Prerrequisito: docs/STATE.md, docs/EXECUTION.md bloque 4, SPEC 10, 12, 13 y 15 (version 1.12).

## Contexto

El preview falla en produccion por dos defectos verificados en captura:

1. El cartel se dibuja de frente sobre fotos tomadas en tres cuartos y no se apoya en la pared. La camara ortografica de 1.9 no reproduce la fuga de una foto, y rotar el cartel con yaw y pitch tampoco.
2. El halo de back-lit es un rectangulo blanco plano de casi el doble del cartel, que se lee como un segundo cartel.

Ademas falta el modo por defecto del viewer, que nunca se escribio en SPEC.

## Alcance

### 1. Modo cartel, default del viewer

- Sin foto. Fondo `--q-surface` del marco del preview.
- Camara en perspectiva, fov 30, target en el centro del cartel.
- Distancia base: la que encuadra ancho y alto del cartel con 15 por ciento de margen por lado. En modo letters el cartel es el contorno de la palabra.
- `OrbitControls` de drei: azimut libre de 360 grados, polar entre 0,6 y 1,5 rad, sin paneo, sin zoom de rueda, sin autorotacion.
- La sombra de apoyo se mantiene.
- La luz de la escena sale del `light` de la primera foto de `photos` (SPEC 12: la luz nunca sale de constantes del codigo).

### 2. Modo vista

Una foto del cliente con el cartel fijo compuesto, sin orbita. Es el preview de 1.9 con la camara nueva.

### 3. Camara en perspectiva en los dos modos

- En modo vista la orientacion sale del anchor: `cameraYawDeg`, `cameraPitchDeg` y `fovDeg` reemplazan a `yawDeg` y `pitchDeg` en `photos[].anchor`.
- Se orbita la camara alrededor del cartel; el cartel no se rota.
- La camara se ubica a la distancia en la que un metro de cartel ocupa `metersToWidth` del ancho de la foto, con `fovDeg` como campo vertical y el aspecto 16:9 del cuadro.
- El centro del cartel cae en (`x`, `y`) de la foto con `setViewOffset` de la camara (lens shift), no moviendo el cartel.
- El canvas pasa a cubrir el cuadro entero.
- Se actualizan `src/core/types.ts` (`PhotoAnchor`), la validacion en runtime de `src/core/clientConfig.ts` (numeros finitos, `fovDeg` mayor que 0 y menor que 180) y SPEC 10 y 12.

### 4. Selector de vistas

- Boton nuevo al principio para el modo cartel, seleccionado al cargar.
- Etiqueta desde la clave nueva `viewSignOnly` de `texts`, en los dos JSON y en `ClientTexts`: EN "The sign", ES "Solo el cartel".
- `texts` pasa de 45 a 46 claves y SPEC 10 lista las 46.

### 5. Zoom por modo

- Modo cartel: el control mueve la distancia de camara entre 1,0 y 0,55 de la distancia base, solo acercar.
- Modo vista: sigue siendo la transformacion CSS sobre foto y canvas juntos.

### 6. Back-lit

- Los cantos y la cara trasera del cartel emiten en los dos modos. La cara emite poco: se baja hasta que el texto del cartel siga legible.
- Modo cartel: sin halo.
- Modo vista: halo con la `CanvasTexture` de degradado radial que ya usa la sombra de apoyo, margen 0,12 del alto del cartel por lado, opacidad maxima 0,55, color del emisivo del material, sin borde duro. Se arma como un quad de nueve celdas: el centro, tapado por el cartel, a opacidad maxima; los bordes con el perfil del degradado a lo largo del eje; las esquinas con el cuarto de circulo.

### 7. Recalibracion de las ocho fotos

- `?calibrate=1` se extiende con `cameraYawDeg`, `cameraPitchDeg` y `fovDeg`.
- Criterio: en cada vista el cartel compuesto tapa el cartel impreso de la foto y sus bordes acompanan la perspectiva de la fachada.
- Si una foto no lo permite con las medidas default del cartel, sale del JSON y se anota cual y por que en docs/DECISIONES.md.

### 8. Continuidad

Cambiar de modo o de vista no remonta el canvas ni reinicia la seleccion.

## Archivos

- `src/core/types.ts`, `src/core/clientConfig.ts`, `src/core/clientConfig.test.ts`
- `src/clients/northline.json`, `src/clients/norte.json`
- `src/verticals/signs/SignPreview.tsx`, `src/verticals/signs/PhotoStage.tsx`
- `src/verticals/signs/scene/SignScene.tsx`, `SignBoard.tsx`, `sceneGeometry.ts`, `sceneGeometry.test.ts`
- `src/verticals/signs/calibration/CalibrationPreview.tsx`
- `src/pages/QuotePage.tsx`

## Criterios de aceptacion

- G1 a G6.
- Al cargar `/d/northline` y `/d/norte` el viewer abre en modo cartel y el cartel gira 360 grados con el mouse sin perderse ni verse desde abajo.
- En cada vista de foto, verificado en captura, los bordes del cartel acompanan la perspectiva de la fachada y el cartel impreso de la foto queda cubierto.
- Los tres modos de luz se siguen distinguiendo con luminancia medida en modo vista, con la misma foto: la cara crece de none a front y el anillo crece de front a back.
- El halo de back no supera el margen de 0,12 del alto del cartel en ningun punto y no tiene borde duro, verificado en captura en los dos clientes.
- En modo cartel, back-lit se distingue de front-lit con luminancia medida, sin halo.
- 390 px, 768 px y 1440 px sin desalineado entre foto y cartel y sin scroll horizontal.
- Presupuesto de bundle de SPEC 3 intacto. Ningun asset nuevo en la red.
- El criterio 2 de DONE lo valida Joaquin en captura antes de cerrar.

## Commits

1. Docs de apertura: SPEC 1.12, docs/DECISIONES.md, este archivo, TAREA_013 con sus valores decididos y la entrada en EXECUTION.
2. Codigo.
3. Docs de cierre: docs/STATE.md reescrito, docs/DECISIONES.md con lo que salga de la ejecucion, docs/tareas/_ULTIMO.md en 015.
