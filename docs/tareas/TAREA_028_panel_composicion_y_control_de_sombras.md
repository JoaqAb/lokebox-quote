# TAREA_028 · Panel, composicion y control de sombras

Bloque 10, Quote premium. Sexta.

Prerrequisito: docs/STATE.md, CLAUDE.md, SPEC 4.1, 7, 12 y 18 (version 2.8) y
docs/tareas/TAREA_027_sombra_del_totem_y_halo_de_letras.md.

## Contexto

Canal B acepta TAREA_027 (D87) y marca el render de 1x1 que refresca los mapas de sombra como
workaround que viola G6 (D88): se reemplaza por control explicito de los mapas en el pipeline del
core. Ademas cambia la composicion de la pantalla: header compacto, preview que ocupa todo lo que
deja el panel, panel de 400 px en pasos numerados con el precio y el CTA fijos al pie, marco del
preview sin 16:9 fijo, selector de vistas y zoom sobre el preview, y mobile con el preview sticky
(D90 a D95). No entran claves nuevas en texts (D96).

## Alcance

### 0. Apertura (commit de docs)

- DECISIONES D87 a D96. SPEC 2.8: 4.1, 7, 12 y 18.
- TAREA_027 cerrada con D87. INDICE, EXECUTION y STATE.

### 1. Control de sombras (D88)

Archivos: `src/core/preview/PreviewCanvas.tsx` o `src/core/preview/RenderPipeline.tsx`,
`src/core/preview/CoverageToneMapping.tsx`.

- Sale el render de 1x1. `shadowMap.autoUpdate = false` y `needsUpdate = true` una vez por cuadro,
  antes del pase principal, con la camara en las capas que proyectan. Bloom y atenuacion reusan esos
  mapas.

### 2. Layout (D90, D93, D95)

Archivos: `src/core/ui/QuoteLayout.tsx`, `src/core/ui/PriceBar.tsx`, `src/core/ui/LeadSection.tsx`,
`src/pages/QuotePage.tsx`.

- Header en una linea: logo, titulo y subtitulo mas chico.
- Escritorio: preview en todo el ancho menos el panel y todo el alto util; panel de 400 px con
  scroll propio; precio, rango y CTA fijos al pie del panel.
- Mobile: preview sticky arriba con 42svh; panel debajo; barra fija con precio y CTA. Se mantiene D24.
- `hidden`: sin precio, con la barra y el CTA.

### 3. Preview (D91, D92)

Archivos: `src/verticals/signs/SignPreview.tsx`, `src/verticals/signs/PhotoStage.tsx`.

- Modo cartel: el canvas llena la zona. Modo vista: foto y canvas en una caja con la proporcion de la
  foto, contain y centrada sobre `--q-stage`.
- Selector de vistas segmentado sobre el preview, abajo al centro. Sin barra de zoom: rueda, pinch y
  botones + y -, con `aria-label` derivado de `previewZoomLabel`. Rangos de SPEC 12 sin cambios. El
  canvas no se remonta al cambiar de modo o de vista.

### 4. Panel en pasos y swatch (D94)

Archivos: `src/core/ui/panelTypes.ts`, `src/core/ui/OptionsPanel.tsx`,
`src/core/ui/controls/ChoiceGroup.tsx`, `src/verticals/signs/fields.ts`.

- Pasos numerados: tipo, texto, medidas, material, iluminacion, cantidad. Titulos con las etiquetas
  que ya existen; el numero no es texto. Los pasos los declara la vertical en los descriptores.
- Swatch opcional en el descriptor de choice; la vertical lo completa con `materials[].visual.color`.

## Criterios de aceptacion

- C0. Sale el render de 1x1. Un conteo con `renderer.info` o sobre el mapa de sombras verifica una
  sola actualizacion de sombra por cuadro. El poste del totem proyecta. Sin regresion contra 027 en
  composicion, 6a y sombra del totem.
- C1. A 1440x900 y 1280x720, en los dos clientes: el preview ocupa al menos 60 por ciento del ancho,
  y precio, rango y CTA se ven sin scroll.
- C2. A 390x844: preview sticky, barra con precio y CTA, ningun control tapado al final del scroll.
  Se mantiene D24.
- C3. Modo vista: anclaje a 0,5 px o menos contra 027 en las cuatro fotos y los tres tipos, con la
  caja contain en los tres tamanos de ventana.
- C4. Swatches de material visibles, con el color del JSON. `src/core` sin imports de verticals ni de
  clients.
- C5. Zoom con rueda, pinch simulado y botones, en los dos modos, dentro de los rangos de SPEC 12.
  Cambiar de modo o de vista no remonta el canvas.
- C6. Flujo completo en las dos demos, EN y ES: lead, WhatsApp y hoja imprimible. En `hidden`, sin
  precio, con la barra y el CTA correctos.
- C7. Capturas en `validacion/premium/028/`: 1440, 1280 y 390 por cliente, en modo cartel y en modo
  vista, mas una del paso de material.
- C8. G1 a G6, tests en verde y primer frame en slow 4G de 4,5 s o menos.

Cualquier workaround se frena y se reporta antes de commitear (G6, D88). Sin claves nuevas en texts
(D96).

## Commits

1. docs: D87 a D96, SPEC 2.8 y apertura de TAREA_028.
2. feat: codigo de TAREA_028.
3. docs: cierre de TAREA_028.

Despues, push.
