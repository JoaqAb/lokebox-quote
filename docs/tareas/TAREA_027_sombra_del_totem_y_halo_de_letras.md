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

## Resultado (23/09/2026)

Estado: entregada. Codigo en 443b042. Mediciones en `validacion/premium/027/` (`medir027.py`,
`medir_letras.py`, `medir_c5.py`, `comp/medir_comp.py`, `c3.txt`, `c5.txt`, `c6-*.txt`,
`calibracion.txt`, `carga.txt`), capturas en `despues/` (220), recortes en `recortes/` y sondas en
`letras-0.8/`, `c5-solo/`, `comp/` y `calibracion/`.

wallY calibrado por foto: northline 0,863 de dia y 0,862 de noche; norte 0,857 de dia y 0,846 de
noche. HALO_LETTERS_BAND: 0,8.

- C1. Si. `anchorGround.wallY` en el tipo, la validacion (obligatorio, entre 0 y 1, por encima del
  apoyo) y los dos JSON, con tests. `?calibrate=1` dibuja la linea y la ajusta: en las cuatro fotos
  cae donde la fachada toca la vereda.
- C2. Si. El receptor de piso termina en la profundidad del rayo de la camara por (x del apoyo,
  wallY) sobre el piso; geometria pura con tests (la linea proyecta de vuelta en su (x, wallY)).
- C3. Si. 0 px distintos de la foto por encima de wallY y fuera del totem en 24 de 24 cuadros (none
  y back). De dia la vereda bajo la sombra se oscurece 55,9 niveles en northline y 51,3 en norte, 6
  de 6.
- C4. Si, 12 de 12 con banda 0,8: pico compuesto de 36 a 38 niveles debajo del techo de noche;
  meseta de noche de 0 a 0,8 por ciento; pico de noche contra la foto de 38,6 a 70,6; pendiente de
  3,0 a 3,7. De dia el halo suma menos de 10 niveles y la meseta no aplica. Con los picos medidos, la
  banda cumple la pendiente de 0,6 a 0,8 (inferido para 0,6 y 0,7).
- C5. Artefacto de la mascara, verificado. Con las letras ocultas, el halo solo pasa la forma de D71
  en los 3 casos (saltos 4,4, 4,0 y 4,4 contra 4,8, 4,7 y 5,4); con las letras, la misma medicion da
  saltos de 70 porque la muestra entra en la tinta.
- C6. Sin regresion en 6a (36 de 36), anclaje (0,5 px o menos), sombra bajo el halo (40 a 55 niveles
  mas oscura con receptor), halo de facade y letters contra la foto (24 de 24) y modo cartel (108
  de 108 a 1 nivel o menos de 026). Composicion D79: fachada 1,4 y 1,3 niveles; letras 2,5 en 4 px
  de 303.215, en el borde suavizado de la tinta, donde alpha y sombra se estiman de cuadros de 8
  bits (inferido); p99 0,5.
- C7. Si. Recortes x4 de la base del totem (4 casos de PVC none) y del halo de letras (4 casos de
  back de noche: pvc y acrilico por cliente), con los perfiles de fila y columna en
  `recortes/perfiles.txt`.
- C8. Si. Build sin avisos, tsc sin errores, lint limpio, 297 tests en verde, sin rayas largas.
  Primer frame en slow 4G 4,0 s, 570 kB.

Decisiones de ejecucion en DECISIONES (23/09/2026, TAREA_027).
