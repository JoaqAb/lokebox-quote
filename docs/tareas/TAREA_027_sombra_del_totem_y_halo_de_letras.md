# TAREA_027 · Sombra del totem en vereda y halo de letras sin meseta

Bloque 10, Quote premium. Quinta. Panel y composicion quedan para TAREA_028 (D83).

Prerrequisito: docs/STATE.md, CLAUDE.md, SPEC 10 y 12 (version 2.7) y
docs/tareas/TAREA_026_integracion_fotografica.md.

## Contexto

Canal B acepta TAREA_026 en composicion, camara, totem sin halo, tono, anclaje y carga (D83), y la
luminancia de chapa y acrilico movida por la camara de D81 (D84). Rechaza dos cosas, medidas en
`validacion/premium/026/despues/`:

- La sombra del totem: el receptor de piso sigue detras de la fachada y la sombra del panel cae
  como cuna sobre el zocalo y la puerta de northline de dia. El receptor tiene que terminar en la
  linea de fachada, que pasa a ser un dato de la foto, `anchorGround.wallY` (D85).
- El halo de letras: en norte de noche la meseta queda en 234 sobre toda la caja de la palabra, con
  las letras en 185, y se lee como placa. El halo tiene que decrecer desde la tinta, sin saturar y
  sin meseta (D86).

## Alcance

### 0. Apertura (commit de docs)

- DECISIONES D83 a D86. SPEC 2.7: seccion 10 (`wallY`) y seccion 12 (receptor del totem y halo de
  letras).
- TAREA_026 cerrada con D83. INDICE y EXECUTION con TAREA_027 y TAREA_028 pendiente de brief.

### 1. wallY (D85)

Archivos: `src/core/types.ts`, `src/core/clientConfig.ts`, `src/clients/northline.json`,
`src/clients/norte.json`, `src/verticals/signs/calibration/CalibrationPreview.tsx`.

- `anchorGround.wallY`: fraccion del alto de la foto donde la fachada toca la vereda en la columna
  del apoyo. Obligatorio cuando existe `anchorGround`, validado igual: numero entre 0 y 1, por
  encima de `anchorGround.y`.
- `?calibrate=1` dibuja la linea de `wallY` y la deja ajustar. Los valores de los dos JSON salen de
  esa calibracion.

### 2. Receptor de piso del totem (D85)

Archivos: `src/verticals/signs/scene/sceneGeometry.ts`, `src/verticals/signs/scene/SignScene.tsx`,
`src/verticals/signs/scene/SignBoard.tsx`.

- El receptor de piso se recorta en la profundidad que da el rayo de la camara por (x del apoyo,
  `wallY`) sobre el piso. Geometria pura con tests.
- Sin receptor vertical para el totem.

### 3. Halo de letras (D86)

Archivos: `src/verticals/signs/scene/sceneGeometry.ts`, `src/verticals/signs/scene/haloGeometry.ts`,
`src/verticals/signs/scene/SignBoard.tsx`.

- El perfil decrece desde la tinta, con derivada 0 en el borde, y no desde la caja de la palabra.
- Sin saturacion: el pico compuesto queda al menos 8 niveles debajo del techo del tone mapping.
- Anti-meseta: en la banda, los pixeles a 3 niveles o menos del maximo son 15 por ciento o menos.
- Pico de noche sobre la pared de 30 o mas; pendiente media de 5 niveles por px o menos (D75).
- `HALO_LETTERS_BAND` se recalcula entre 0,4 y 0,8 y se reporta el valor.

## Criterios de aceptacion

- C1. `anchorGround.wallY` en el tipo, en la validacion y en los dos JSON. Se calibra con
  `?calibrate=1`, que dibuja la linea. Tests de validacion.
- C2. El receptor de piso del totem se recorta en la profundidad que da el rayo de la camara por
  (x del apoyo, `wallY`) sobre el piso.
- C3. En los 12 casos de totem en vista: por encima de `wallY` y fuera de la silueta del totem, la
  diferencia con la foto sola es 0. De dia, la vereda bajo la sombra se oscurece 15 niveles o mas
  en los 6 casos.
- C4. Halo de letras en los 12 casos de letters back en vista: sin saturacion, anti-meseta, pico de
  noche de 30 o mas y pendiente media de 5 o menos, segun D86. `HALO_LETTERS_BAND` entre 0,4 y 0,8,
  con el valor reportado.
- C5. Norte letras de dia: las 3 fallas de forma de TAREA_026 se resuelven o se prueban como
  artefacto de la mascara, renderizando el halo solo, con las letras ocultas. La prueba queda
  VERIFICADO.
- C6. Sin regresion en fachada y en modo cartel contra 026: composicion D79, 6a de D78, anclaje y
  sombra bajo el halo.
- C7. Capturas en `validacion/premium/027/`. Recortes ampliados de la base del totem en los 4 casos
  de PVC none, y del halo de letras en los 4 casos de back de noche, con el perfil de fila y de
  columna en txt.
- C8. G1 a G6 y tests en verde.

## Commits

1. docs: D83 a D86, SPEC 2.7 y apertura de TAREA_027.
2. feat: codigo de TAREA_027.
3. docs: cierre de TAREA_027.

Despues, push.
