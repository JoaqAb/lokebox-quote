# TAREA_033 · Vertical cajas

Bloque 12 · Segunda vertical. Decisiones: D119, D123 a D125, D138 a D145. SPEC 2.14: secciones 4.4, 6.1, 6.3, 8, 10, 11, 12 y 21.

## Objetivo

Sumar la vertical cajas (`boxes`) con dos clientes, foldline y cajasur, sin tocar nada que vea un visitante de carteles ni ningun dato de carteles. Es la prueba del contrato de TAREA_032: si cajas obliga a cambiar el contrato, el cambio se escribe y es la entrada del bloque 13. Antes, una fase 0 corta con el totem de alba (D139, D140), para que la linea base ya lo incluya.

## Reglas

- Cuatro fases en orden, cada una con su commit o sus commits.
- Vara de carteles desde el commit de la fase 0: el snapshot de precios y las URLs del fixture iguales con toStrictEqual, las capturas de vitrina de los cinco clientes de carteles identicas pixel a pixel (el ruido medido en TAREA_032 es 0), y ningun JSON de carteles editado. Si algo de eso cambia, se frena y se reporta. No se regenera el snapshot, no se ajusta el umbral.
- Una vertical no importa de otra (D143). Si cajas necesita algo de `src/verticals/signs`, se mueve al core en la fase 1, o se frena y se reporta. Nunca un import cruzado ni una copia.
- Si el contrato de SPEC 4.4 no alcanza para cajas, se frena y se reporta con archivo y linea, salvo el `logo` de la vista (D144), que ya esta decidido. No se agrega una salida por fuera del contrato.
- Si algo de SPEC 21 no se puede cumplir tal como esta escrito (una formula, un valor, una regla de validacion), se frena y se reporta. No se interpreta.
- No se lee `.env.local` con cat ni se imprime. Para ver que variables hay: `grep -o '^[A-Z_]*' .env.local`.
- AGENTS.md, docs/planillas/, docs/comercial/plantillas/ e incoming/ no se tocan ni entran a ningun commit.
- La landing no cambia (D125).

## Fase 0 · Totem de alba (cambio visible, antes de la linea base)

Solo `src/clients/alba.json`:

- `options.width.default` 1,4 y `options.height.default` 0,8.
- `anchorGround.metersToWidth` de `front-day` y `front-night` con la formula de D140: anchor.metersToWidth por (y - 0,5) / (wallY - 0,5), redondeado a tres decimales. Con los valores de hoy da 0,151. `x`, `y` y `wallY` no cambian salvo que la verificacion lo pida, y en ese caso se reporta el motivo medido.
- Verificacion con `?calibrate=1` y en los pares, con la default y con la configuracion de portada: totem entero dentro de la foto con al menos 2 por ciento de margen, base sobre la vereda, puerta libre, y el borde superior del panel por debajo del dintel de la puerta.

Despues del commit de codigo:

1. Pares antes y despues en `validacion/vitrina/033-fase0/`: alba 01 a 06.
2. Fixture de precios regenerado con `scripts/snapshot-precios.mjs`. El diff del fixture queda limitado a entradas de alba (D140): se reporta cuantas entradas cambiaron y que ninguna es de otro cliente.
3. `scripts/vitrina.mjs` sobre ese commit: son las capturas de la linea base de carteles. Contra las de TAREA_032, solo cambian las de alba.

Commit propio para el fixture y la linea base.

## Fase 1 · Lo compartido pasa al core (sin cambio visible)

Antes de escribir cajas, leer la escena de carteles y listar lo que cajas necesita segun SPEC 21.5. Lo que sea generico pasa a `src/core/preview/`, con nombres sin vocabulario de ningun rubro. Candidatos, a confirmar leyendo el codigo: armado de `MeshPhysicalMaterial` desde el `visual` con los mapas de acabado, sombra de apoyo en el piso, camara de estudio con distancia por la huella de la caja de encuadre y la orbita limitada, luz de estudio del cartel sin iluminacion, y la franja de controles con el control segmentado y el zoom.

- Carteles pasa a usar lo movido. Sus tests se mueven con el codigo, sin debilitar ninguna asercion.
- Contrato: `VerticalViewProps` suma `logo` (D144). `QuotePage` se lo pasa a la vista. Carteles lo ignora.
- Vara de carteles de las reglas: snapshot y URLs iguales, capturas identicas pixel a pixel.
- Si una pieza no se puede separar sin cambiar un pixel de carteles, se frena y se reporta con cual y por que.

Se reporta la lista de lo que se movio (origen, destino) y lo que se evaluo y quedo en carteles, con el motivo.

## Fase 2 · Logica de cajas (pura)

`src/verticals/boxes/` con la misma division que carteles: config y validacion, campos del panel, precio, detalle de lineas, query, filas de la hoja, tokens del lead y WhatsApp, y `logic.ts` con el contrato. Sin React ni three. Todo segun SPEC 21.1 a 21.4. Registro en `src/app/verticals.ts` con la vista lazy.

Tests propios, como minimo:

- Area de plancha de cada estilo contra un calculo a mano, en pulgadas y en centimetros, incluida la tapa de two-piece.
- Un precio completo por estilo en cada cliente, calculado a mano en el test: material, impresion, armado, descuento por escalon y preparacion por pedido que no se multiplica ni se descuenta.
- Escalon minimo sin linea de descuento; escalones con la linea de descuento del core.
- Lineas: impresion en 0 entra; armado y preparacion en 0 no entran.
- Redondeo a 2 decimales en foldline y a 0 en cajasur, con el total calculado en precision completa.
- Lanza con: id inexistente, material que no vale para el estilo, medida fuera de rango, cantidad fuera de los escalones.
- Validacion que falla nombrando slug y clave: par de unidades invalido, escalones no crecientes o con el primer pct distinto de 0, estilo sin material, default incoherente, `lidDepth` ausente en two-piece, `thicknessMm` ausente o no positivo, clave de texts faltante de las 17, `whatsappMessageHidden` faltante con hidden y WhatsApp.
- `applyFieldChange`: al pasar de two-piece con rigido a mailer, el material pasa al primero que vale.
- Query: ida y vuelta exacta en toda una matriz por cliente (cada estilo, cada material que vale, cada impresion, cada escalon, medidas en min, default y max); link con material invalido para el estilo, con `q` fuera de escalones, con clave faltante y con clave de mas: error.
- WhatsApp: los 10 placeholders llenos y formateados con el locale; en hidden sin cifras.

## Fase 3 · Vista y clientes

- Vista de cajas segun SPEC 21.5, con lo que la fase 1 dejo en el core.
- `src/clients/foldline.json` y `src/clients/cajasur.json` con los valores de SPEC 21.4, textos completos en su idioma, paleta clara de cada marca (foldline sobria; cajasur calida) y logo propio trazado a mano como en TAREA_031, en `public/clients/<slug>/logo.svg`. Sin marcas reales.
- `scripts/vitrina.mjs` suma los clientes sin fotos, con seis capturas cada uno: 01 escritorio default cerrada, 02 escritorio default abierta, 03 escritorio full color exterior e interior abierta, 04 mobile default, 05 escritorio two-piece con rigido abierta, 06 escritorio shipping cerrada. Las capturas de carteles no cambian.
- Si con los acabados del core el kraft o el rigido no se leen como tales en las capturas, se reporta con las capturas y no se crea un acabado nuevo sin decision (D124).

## Fase 4 · Verificacion y cierre

Mismo flujo que TAREA_032: build, tests, capturas, deploy y prueba en produccion. Filas de prueba de formulario con el nombre `Cajas Test`; las de WhatsApp se reportan por cliente, canal y horario UTC.

## Criterios de aceptacion

Fase 0:

1. alba segun la fase 0, verificado en los pares de `validacion/vitrina/033-fase0/`. Solo cambio `src/clients/alba.json`.
2. Fixture regenerado con el diff limitado a alba, con el conteo de entradas que cambiaron.

Fase 1:

3. Lista de lo movido al core y de lo que quedo en carteles, con motivo.
4. Snapshot y URLs del fixture iguales con toStrictEqual, y las 31 capturas de carteles identicas pixel a pixel contra la linea base de la fase 0.
5. `VerticalViewProps` con `logo`.

Fase 2 y 3:

6. `git diff <commit de linea base>..HEAD -- src/clients/` solo agrega foldline.json y cajasur.json.
7. Tests de la fase 2, todos en verde, con el total de casos de la matriz de query por cliente.
8. `grep -rnE "totem|letters|facade|signText|Sign[A-Z]|mailer|kraft|corrugated|BoxSelection|BoxesConfig|BoxPrice" src/core` da cero, tests incluidos.
9. `grep -rnE "from '[^']*(verticals|clients|app)/" src/core` da cero; `grep -rn "verticals/signs" src/verticals/boxes` y `grep -rn "verticals/boxes" src/verticals/signs` dan cero; `src/pages` sin imports de `verticals`.
10. La logica de cajas no importa react, three ni @react-three.
11. Capturas de cajas en `validacion/vitrina/`, doce, y la vitrina de carteles identica a la linea base.
12. En las capturas: logo en la tapa con el acento en 1 color y con sus colores en full color; interior en el acento en exterior e interior; tapa y solapas abiertas en los tres estilos; ningun canto cortado por el encuadre.

Fase 4:

13. Flujo completo en produccion en foldline y cajasur: configurar, precio en rango, lead por su CTA (los dos canales en foldline, WhatsApp en cajasur), gracias, hoja con sus filas y su desglose por caja con la preparacion por pedido. Cero errores de consola.
14. Flujo completo en produccion en los cinco clientes de carteles, igual que el criterio 17 de TAREA_032.
15. Deploy: push a main, Vercel en Ready, las siete rutas, sus hojas y la landing en 200. La landing sin cambios.
16. Tests: total mayor o igual a 341 mas los nuevos; lista de movidos y de aserciones editadas con motivo.
17. G1 a G6.

## Cierre

Commits: apertura de docs (esta tarea, SPEC 2.14, DECISIONES D138 a D145, EXECUTION, INDICE y STATE, escritos en disco sin commitear), fase 0 (codigo, despues fixture y linea base), fase 1, fase 2, fase 3 (uno o varios), cierre de docs. STATE, INDICE con la fila de TAREA_033, _ULTIMO en 034 y DECISIONES con lo decidido durante la tarea, una linea cada una. En DECISIONES, ademas, la lista de lo que cajas obligo a cambiar en el contrato o en el core, si hubo algo: es la entrada del bloque 13 (KIT.md).

Reporte a Canal B con tope de 15 lineas mas las tablas (capturas de carteles contra la linea base, casos de la matriz de query por cliente, entradas cambiadas del fixture en la fase 0): hashes, criterios uno por uno, y hallazgos. El reporte completo va tambien a una seccion "Resultado" al final de este archivo, dentro del commit de cierre. Si la tarea se frena, el reporte del freno va igual a esa seccion, en un commit de docs, y no se sigue.

## Resultado

FRENADA en la fase 2, antes de escribir codigo de cajas. Fases 0 y 1 cerradas y verificadas. Commits locales, sin push: push a main es deploy a prod y el cambio de alba sale en vivo.

1. Freno (contrato y SPEC 21): SPEC.md:759 pide que `breakdownCaption` sea `perBoxCaption` con `{quantity}` formateado, pero la firma es `breakdownCaption(config, result)` (SPEC.md:85 y 100, src/core/vertical.ts:43, src/pages/QuotePage.tsx:133) y SPEC.md:759 define el resultado como el `PriceResult` de 6.3 mas `blankArea`, sin la cantidad. Sacarla de `subtotal / unitTotal` es un parche (redondeo de punto flotante, y sin salida si unitTotal da 0). SUGERENCIA A, sin tocar el contrato: 21.2 suma `quantity` al resultado de cajas, que 4.4 ya permite (SPEC.md:83, claves propias de la vertical). SUGERENCIA B: la firma pasa a `breakdownCaption(config, selection, result)`, cambio de contrato que toca core y carteles y es entrada del bloque 13. Recomiendo A.
2. Fase 0: totem de alba medido con el canvas solo sobre la foto (validacion/vitrina/033-fase0/medir.mjs), default y portada, dia y noche, 1440 y 390: x de 0,114 a 0,337, y de 0,328 a 0,855. Margen minimo 11 por ciento, base sobre la vereda, puerta libre (arranca en x 0,437) y borde superior del panel por debajo del dintel (y 0,287). x, y y wallY sin cambios. Pares en validacion/vitrina/033-fase0/antes y despues, alba 01 a 06.
3. Fixture: el script regenerado reescribia las 9510 lineas solo por orden de claves (composePrice de TAREA_032 pone detailValues antes de amount; toStrictEqual no mira el orden). scripts/snapshot-precios.mjs ahora conserva el texto de una entrada igual en contenido: el diff queda en 1620 entradas, todas de alba.
4. Ruido de capturas: en la fase 1b una corrida dio norte/04-mobile.png con 2 niveles de diferencia maxima y 0,0 por ciento de pixeles por encima de 2; la corrida siguiente sobre el mismo codigo dio las 31 identicas a la linea base (validacion/vitrina/033-ruido.txt). El ruido de TAREA_032 era 0 en una sola pareja de corridas: no es 0 siempre.
5. Para la fase 3: diez archivos de tests de carteles, clients.test.ts y scripts/snapshot-precios.mjs recorren listClientSlugs() y validan cada cliente como carteles. Con foldline y cajasur en src/clients van a necesitar filtrar por vertical: son aserciones editadas con motivo. El registro de la vista lazy de cajas va en el commit de la fase 3, porque el import necesita el archivo de la vista para compilar.
6. Sin filas de prueba en Supabase: la fase 4 no corrio. STATE, INDICE y _ULTIMO sin tocar: los reescribe el cierre.

| Commit | Contenido |
|---|---|
| 737ec26 | docs: apertura, D138 a D145, SPEC 2.14 |
| 64c1719 | fase 0: alba.json (default 1,4 x 0,8, anchorGround.metersToWidth 0,151 en las dos fotos) |
| ff85516 | fase 0: fixture regenerado (1620 entradas de alba) y script que conserva entradas iguales |
| fbe006a | fase 1: estudio compartido al core y logo en VerticalViewProps |
| 299bf69 | fase 1: areaUnitSymbol al core |

| Criterio | Estado |
|---|---|
| 1 | Si. Solo cambio src/clients/alba.json; medidas del punto 2 |
| 2 | Si. 1620 entradas cambiadas (1584 casos y 36 vistas), cero de otro cliente |
| 3 | Si. Tablas de abajo |
| 4 | Si. Snapshot y 2 URLs publicadas con toStrictEqual en verde; 31 capturas de carteles identicas pixel a pixel a 033-base despues de fbe006a y de 299bf69 (ver punto 4) |
| 5 | Si. src/core/vertical.ts, QuotePage pasa brand.logo, carteles lo ignora |
| 6 a 12 | No: frenada en la fase 2 |
| 13 a 17 | No: frenada en la fase 2 |

Linea base de carteles: 033-base (sobre 64c1719) contra la corrida de 19ee613 (033-antes, identica a 032-refactor): cambian solo alba 01 a 06 y 00-grilla, que lleva el cuadrado de alba. Las otras 24 identicas.

| Origen en carteles | Destino en src/core |
|---|---|
| sceneGeometry.ts: Vec3, damp (DAMP_LAMBDA, SETTLE_EPSILON, approach), SIGN_VIEW, signFrameDistance, orbitPosition, zoomBy, zoomFromPinch, signZoomFactor, SIGN_STUDIO_LIGHT, SIGN_STUDIO_BRIGHT, STUDIO_SHADOW, studioShadowReach, SUPPORT_SHADOW_COLOR | preview/studioView.ts, con nombres sin rubro (STUDIO_VIEW, frameDistance, studioZoomFactor, STUDIO_LIGHT, STUDIO_BRIGHT, FrameVolume, KeyLight, keyLightPosition, PREVIEW_ZOOM) |
| SignBoard.tsx: approachColor, lista DAMPED y los siete parametros fisicos | studioView.ts (approachColor), preview/physicalSurface.ts (PHYSICAL_KEYS, setPhysical) |
| surfaceMaterials.ts: createSurface, applyFinish, repeatSurface, disposeSurface, caras del panel; surfaceParts.ts: PANEL_FACES | preview/physicalSurface.ts (BOX_SLOTS, BOX_FACES) |
| scene/supportShadow.ts, scene/webgl.ts | preview/supportShadow.ts, preview/webgl.ts |
| SignScene.tsx: encuadre de estudio de ViewerCamera, orbita, ambiente y key | preview/studioFraming.ts, preview/StudioCamera.tsx, preview/StudioKeyLight.tsx |
| SignPreview.tsx: zoom con rueda, pinch y pasos, franja con control segmentado y zoom | preview/previewZoom.ts, preview/PreviewControls.tsx |
| sceneGeometry.ts: readColor | preview/themeColor.ts |
| visuals.ts: areaUnitSymbol | pricing/format.ts |

| Quedo en carteles | Motivo |
|---|---|
| photoCameraPose, groundPointAt, photoCameraDistance, containBox, tinte de foto | Solo modo vista con foto; cajas no tiene fotos (21.5) |
| Totem, halo, standoff, lampara y parametros de iluminacion, letras, typeface, scenePalette | Vocabulario y escena del rubro |
| lengthToMeters (m y ft) | Cajas convierte in y cm con los factores fijos de 21.5; no se superponen |
| roundedPanelParts y splitSurface | Particion cara y cascara para el bloom; cajas no emite y arma sus cantos con su propio radio nombrado |

Tests: 341, igual que la linea base. Movidos sin cambiar aserciones: de sceneGeometry.test.ts a core/preview/studioView.test.ts (tres de encuadre, luz de estudio, orbitPosition, factor de zoom, polar, rueda y pinch) y a core/preview/webgl.test.ts; de visuals.test.ts a core/pricing/format.test.ts (areaUnitSymbol). Unica edicion: SET.sign.thickness pasa a una constante PANEL_THICKNESS de 0,14 en el test del core, el mismo valor, porque el core no importa de carteles.
