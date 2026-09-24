# TAREA_029 · Pulido de composicion y material de venta

Bloque 10, Quote premium. Septima y ultima (D102).

Prerrequisito: docs/STATE.md, CLAUDE.md, SPEC 4.1 y 12 (version 2.9) y
docs/tareas/TAREA_028_panel_composicion_y_control_de_sombras.md.

## Contexto

Canal B acepta TAREA_028 (D97). Las capturas de 028 muestran tres defectos de composicion: en
mobile el preview de 42svh deja bandas arriba y abajo de la foto y el selector y el zoom quedan
encima de la foto; el titulo del header se corta con puntos suspensivos; en escritorio la foto
toca el panel. D98 a D100 los corrigen. Con el layout nuevo, el material de venta y la imagen de
Open Graph quedan viejos y se regeneran (D101). No entran claves nuevas en texts (D96).

## Alcance

### 0. Apertura (commit de docs)

- DECISIONES D97 a D102. SPEC 2.9: 4.1 y 12.
- TAREA_028 cerrada con D97. INDICE y EXECUTION.

### 1. Header mobile (D99)

Archivo: `src/core/ui/QuoteLayout.tsx`.

- Por debajo de lg: sin subtitulo, titulo en un tamano menor y hasta dos lineas, sin truncado.
- En lg el header queda como en 028.

### 2. Preview mobile (D98)

Archivos: `src/core/ui/QuoteLayout.tsx`, `src/verticals/signs/SignPreview.tsx`.

- El core deja de fijar 42svh: el area del preview es un contenedor de consulta con tope 42svh y
  el alto lo da el preview.
- SignPreview mide por debajo de lg el ancho dividido por la proporcion de la foto mas la franja
  de controles, con tope 42svh. En modo cartel usa la proporcion de la ultima foto elegida, o la
  de la primera, asi el alto no cambia al cambiar de modo.

### 3. Franja de controles y caja contain (D98, D100)

Archivos: `src/verticals/signs/SignPreview.tsx`, `src/verticals/signs/PhotoStage.tsx`.

- Selector y zoom en una franja al pie de la zona: selector al centro, zoom a la derecha, y si no
  entra el selector se corre a la izquierda antes de tocar el zoom.
- Caja contain de vista sobre un area de ajuste: la zona menos la franja, y en lg menos 24 px por
  lado. El margen lo pone CSS y se mide con ResizeObserver: la vertical no repite el breakpoint.
- Modo cartel sin cambios: el canvas llena la zona.

### 4. Material de venta (D101)

Archivos: `scripts/venta.mjs` (nuevo), `scripts/og.mjs`, `public/og-lokebox-quote.png`.

- validacion/venta no tiene script: se escribe `scripts/venta.mjs` con las mismas ocho escenas y
  tamanos de las capturas actuales. Despues `validacion/venta/subir.py` rearma las seis de
  `subir/` con los mismos nombres, y `node scripts/og.mjs` la imagen de Open Graph.

## Criterios de aceptacion

- C1. A 390x844, en los dos clientes y en los dos modos: controles fuera de la foto, sin bandas
  mayores a la franja de controles y el mismo alto de preview al cambiar de modo. Sin scroll
  horizontal. D24 se mantiene.
- C2. A 390 y a 360: titulo del header completo, en dos lineas como maximo.
- C3. A 1440x900, 1280x720 y 1280x600: la foto a 24 px o mas del panel y de los bordes, y los
  controles fuera de la foto.
- C4. Anclaje re-medido contra 027 con la caja nueva, en las cuatro fotos, los tres tipos y los
  tamanos de C1 y C3: 0,5 px o menos en fachada y totem, y 1 px o menos en letras (D97).
- C5. El canvas no se remonta al cambiar de modo, de vista o de tipo. Zoom sin cambios.
- C6. Capturas en `validacion/premium/029/`: 390, 360, 1440, 1280x720 y 1280x600 por cliente, en
  cartel y en vista. Material de D101 regenerado, con la lista de archivos en el reporte.
- C7. G1 a G6, tests en verde y primer frame en slow 4G de 4,5 s o menos.

Cualquier workaround se frena y se reporta antes de commitear. Sin claves nuevas en texts (D96).

## Commits

1. docs: D97 a D102, SPEC 2.9 y apertura de TAREA_029.
2. feat: codigo de TAREA_029.
3. docs: cierre de TAREA_029.

Despues, push.

## Resultado (23/09/2026)

Estado: entregada. Codigo en 8b3e409. Mediciones en `validacion/premium/029/` (`pantallas.mjs` y
`pantallas.txt`, `validar.mjs`, `validar-anclaje/medicion.txt` y `medicion-subpixel.txt`,
`sonda-fachada/medicion.txt`, `zoom.log`, `carga.txt`, `build.txt`) y capturas en `capturas/`.

- C1. Si. A 390x844 y 360x800, los dos clientes: foto a todo el ancho, bandas de 0 arriba y a los
  lados, 56 px abajo, que es la franja; controles 5 px debajo de la foto; el preview mide 275,4 en
  cartel y en vista a 390, y 258,5 a 360. Sin scroll horizontal. D24 sin cambios en el codigo.
- C2. Si. Titulo en dos lineas, sin recorte ni puntos suspensivos, y sin subtitulo, a 390 y a 360.
- C3. Si. 1440x900, 1280x720 y 1280x600: la foto a 24 px del panel y del borde izquierdo, 24 o
  mas arriba y 57 o mas del borde inferior. Selector entero y sin pisar el zoom en los diez casos.
- C4. En parte. 46 de 48 casos cumplen. Letras hasta 0,67 y totem hasta 0,50. Fachada: 2 de 16
  en 0,60, northline a 1440x900, dia y noche. Una sonda con la caja de 988 a 996 px de ancho da
  de -0,76 a +0,06 en diente de sierra, con las filas de la cara en pasos enteros: error del
  metodo (inferido), el de D97, ahora en fachada.
- C5. Si. Canvas sin remontar al cambiar de modo, de vista y de tipo. Zoom igual que en 028: 1,35
  con una vuelta de rueda, 2,025 con pinch, 2,275 con el boton +, tope 2,5 y vuelta a 1.
- C6. Si. Capturas de 390, 360, 1440, 1280x720 y 1280x600 por cliente, en cartel y en vista.
  Material regenerado con `scripts/venta.mjs`, `subir.py` y `scripts/og.mjs`.
- C7. Si. Build sin avisos, tsc sin errores, lint limpio, 302 tests en verde, sin rayas largas.
  Primer frame en slow 4G 4,0 s, 697 kB.

Decisiones de ejecucion en DECISIONES (23/09/2026, TAREA_029).
