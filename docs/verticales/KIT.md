# KIT de verticales

Como se arma una vertical nueva desde cero sobre el contrato de SPEC 4.4. Escrito desde el codigo de TAREA_035 (D161). Si este kit y SPEC 4.4 difieren, manda SPEC y el kit se corrige. La vertical de referencia es cajas, `src/verticals/boxes/`: cuando algo no esta aca, se copia la forma de cajas.

## 1. Que se toca y que no

Se crea:

- `src/verticals/<id>/`: toda la vertical, logica, vista, escena y tests.
- `src/clients/<slug>.json` por cliente y su logo en `public/clients/<slug>/logo.svg`. El registro de clientes (`src/clients/index.ts`) los descubre solo: no se edita.
- La seccion de SPEC de la vertical, solo si el brief lo pide.

Se edita, solo en estos puntos:

- `src/app/verticals.ts`: la constante del id y una entrada del registro (seccion 3).
- `src/app/clients.test.ts`: las listas de slugs por vertical y la de todos los clientes (seccion 9).
- `scripts/vitrina.mjs`: la lista de clientes de la vertical y sus tomas (seccion 10).

No se toca, nunca (D116, D143, D161):

- `src/core/`, tests incluidos. Si la vertical necesita algo del core que no existe, se frena y se reporta como hallazgo del core. No se copia codigo del core adentro de la vertical para esquivarlo.
- Otra vertical (`src/verticals/signs/`, `src/verticals/boxes/`). Una vertical no importa de otra: lo que dos comparten vive en el core.
- Los JSON de otros clientes, la landing, `src/pages/`, `SPEC.md` fuera de lo que pida el brief, `docs/STATE.md`, `docs/EXECUTION.md`, `docs/DECISIONES.md`, `docs/tareas/INDICE.md`.
- `src/verticals/signs/pricing/priceSnapshot.json`: el fixture de carteles no cambia (seccion 9).

## 2. El contrato: `src/core/vertical.ts`

La vertical exporta un `VerticalModule<C, S, R>` en dos partes:

- `logic: VerticalLogic<C, S, R>`, pura, sin React ni three, importada estatica. Va en `src/verticals/<id>/logic.ts`, como `boxesLogic`.
- `View: ComponentType<VerticalViewProps<C, S>>`, cargada con `React.lazy`. Va en `src/verticals/<id>/view.tsx`, como `BoxesView`.

Los tres tipos:

- `C`, la config de la vertical: lo que devuelve `validate`. Copia de `ctx` slug, locale, currency, cta y display, y suma units, options y texts propios (ver `BoxesConfig` en `src/verticals/boxes/types.ts`).
- `S`, la seleccion: plana, con ids de opciones y numeros en la unidad del cliente.
- `R`, el resultado: `PriceResult & { claves propias }`. Todo lo que `breakdownCaption` o `whatsappMessage` necesiten de la seleccion viaja en R, y no se cambia la firma del contrato (D146, D157). Patron: cajas suma `quantity` a su R porque su leyenda dice la cantidad (`BoxPriceResult`).

Los metodos de `VerticalLogic`, con el archivo donde los pone cajas:

| Metodo | Que hace | En cajas |
|---|---|---|
| `validate(raw, ctx)` | Lee del JSON lo que no es del core; lanza con `fail(slug, ...)` | `config.ts` |
| `defaultSelection(config)` | Seleccion inicial desde `options.defaults` | `config.ts` |
| `valuesFromSelection`, `selectionFromValues`, `applyFieldChange` | Ida y vuelta con los valores del panel | `fields.ts` |
| `panelFields(config, selection)` | Descriptores `PanelField` de `src/core/ui/panelTypes.ts` | `fields.ts` |
| `price(config, selection)` | Componentes y `composePrice`; devuelve R | `pricing/calculate<Id>Price.ts` |
| `quantityOf(selection)` | La cantidad que usa el core | `logic.ts` |
| `lineDetail(config, line)` | Detalle visible de una linea propia; null sin detalle | `pricing/lineDetail.ts` |
| `breakdownCaption(config, result)` | Linea encima del desglose, en el cotizador y en la hoja con precio (D158); null sin linea | `pricing/lineDetail.ts` |
| `encodeQuery`, `decodeQuery` | Claves de la hoja; decode devuelve null si el link no se cotiza | `query.ts` |
| `sheetRows(config, selection)` | Filas `QuoteSheetRow` de la hoja | `leadTokens.ts` |
| `leadSelection(config, selection)` | Objeto de la columna `selection` de `leads` | `leadTokens.ts` |
| `whatsappMessage(config, selection, result, display)` | Plantilla y tokens con `buildWhatsappMessage` de `src/core/lead/whatsapp.ts` | `logic.ts` y `leadTokens.ts` |

`VerticalViewProps<C, S>`: `config`, `selection`, `theme` (variables CSS del tema del cliente), `loading` (marca de la pantalla de carga) y `logo` (ruta del logo, D144; si la vertical no lo dibuja, lo ignora).

## 3. El registro: `src/app/verticals.ts`

- Una constante exportada con el id, como `BOXES_VERTICAL = 'boxes'`. El id es el campo `vertical` del JSON.
- Una entrada en `VERTICALS`: `[ID]: register({ logic, View: lazy(async () => ({ default: (await import('../verticals/<id>/view')).<Id>View })) })`.
- `register` es el unico cast que borra C, S y R. No se agrega otro cast en ningun lado.

## 4. El JSON del cliente

El core valida sus claves (SPEC 10): slug, locale, vertical, currency, brand, cta, poweredBy, prices_placeholder, pricing opcional y las 27 claves de texts del core (`CORE_TEXT_KEYS` en `src/core/clientConfig.ts`). El resto lo valida la vertical desde `raw`, que es el JSON tal cual.

- Lectura con las primitivas de `src/core/clientConfig.ts`: `readObject`, `readArray`, `readEntry`, `readString`, `readNumber`, `readBoolean`, `readRange`, `readMaterialVisual`, `readText`, `readOptionalText`, `requireNotEmpty`, `requireUniqueIds` y `fail`. Asi el error es uno solo: el slug y la clave.
- Todos los numeros del precio van en el JSON (D123, D142): nada de constantes de precio en el codigo. Las constantes fisicas fijas (por ejemplo pulgadas cuadradas por sqft) si van en el codigo, nombradas.
- `options.defaults` coherente con las opciones: la validacion lo exige y nombra la clave.
- Si la vertical no usa fotos, `validate` rechaza `photos` (como `validateBoxes`).
- Reglas condicionales con `ctx`: por ejemplo la plantilla sin precio, que se exige solo con `display` hidden y un CTA con WhatsApp.

Texts (D135): el objeto `texts` del JSON es uno solo y plano. Las 27 del core las valida el core. Las propias las valida la vertical, con una lista exportada (`BOX_TEXT_KEYS` en `src/verticals/boxes/config.ts`) y `readText`. Una clave propia puede llamarse igual que una de otra vertical; nunca igual que una del core. Las etiquetas de linea (`labelKey`) y de panel son claves de texts; `resolveTextKey` las resuelve y lanza si no existen. `lineDiscount` es del core.

Units (D136): que se mide y en que unidad es de la vertical. Cajas acepta dos pares cerrados (`BoxUnits`); otra combinacion falla al cargar.

## 5. Precio: `composePrice` de `src/core/pricing/composePrice.ts`

La vertical calcula sus componentes en precision completa y los pasa a `composePrice` (D134):

- `unit`: componentes por unidad, en el orden del desglose. Cada uno es `{ line: { id, labelKey, detail, detailValues? }, cost }`.
- `order`: componentes por pedido. No se multiplican por la cantidad ni se descuentan.
- `discounts`: tramos `{ minQty, pct }`. El core agrega la linea `discount` (id `DISCOUNT_LINE_ID`, clave `lineDiscount`) y la formatea el. En cajas los escalones de cantidad son estos tramos, con el primero en 0 (D141).
- `decimals` de `config.currency.decimals`, `quantity` y `rangePct` del JSON.
- `detail` es un string tecnico sin locale ni moneda; `detailValues` son los numeros crudos, tipados por la vertical, que formatea `lineDetail`.
- La vertical decide que lineas entran (por ejemplo, una linea en 0 que no se muestra). El total se redondea solo al final, en el core.
- La funcion de precio es pura: sin React, sin fecha, sin azar, sin formateo. Lanza con el valor en el mensaje ante un id inexistente o un valor fuera de rango.

## 6. Formateadores: `src/core/pricing/format.ts`

- `formatCurrency(value, currency, locale)`: toda plata.
- `formatLength(value, locale)`: medidas con unidad, hasta dos decimales. La unidad la pone quien llama.
- `formatInteger(value, locale)`: cantidades y conteos, sin decimales. Lanza con un no entero o un no finito (D159). Una cantidad nunca va con `formatLength`.
- `areaUnitSymbol(unit)` y `formatArea(area, locale, symbol)`: areas con su simbolo, para `m2` y `sqft`. Otra unidad de area se pide al core con un freno.
- `formatPercent` es del core, para la linea de descuento.

## 7. Hoja y lead

- La hoja es `/d/<slug>/quote?<query>`, la misma pagina para toda vertical (`src/pages/QuoteSheetPage.tsx`). La query tiene claves cortas propias, todas siempre, con punto decimal (cajas: `s l w h m p q`, `src/verticals/boxes/query.ts`). `decodeQuery` devuelve null ante cualquier valor que no se cotice; la pagina muestra el error.
- `sheetRows`: las filas de la seleccion, con etiquetas legibles y numeros con Intl y el locale.
- La hoja con precio muestra `breakdownCaption` encima del desglose; la sin precio no lleva desglose ni leyenda (D158).
- `leadSelection`: ids y numeros crudos, mas la unidad. El core escribe el resto de la fila del lead; la tabla no cambia.
- `whatsappMessage`: plantilla del JSON con placeholders `{token}`. Con `display` hidden, la plantilla sin precio y sin tokens de precio.

## 8. Preview: lo que ofrece `src/core/preview`

La vista arma una zona con estas piezas del core (ver `src/verticals/boxes/BoxPreview.tsx`):

- Un `div` con `data-preview-zone`, `ref` para `usePreviewZoom(zoneRef)` (`previewZoom.ts`), los `pointerHandlers` del zoom y `--q-strip: CONTROL_STRIP` en el estilo. El alto de la zona lo pone la vertical en su clase: por debajo de lg, el que diga el brief con tope `42svh` (D98); en lg, `h-full`.
- `StageBackdrop` de `src/core/ui/StageBackdrop.tsx`, con `loading.stage` como tono.
- `PreviewCanvas` (`PreviewCanvas.tsx`) con la escena como children, solo si `hasWebGL()` (`webgl.ts`). Monta el renderer, la calidad, el pipeline y la pantalla de carga.
- `PreviewStrip` (`PreviewControls.tsx`) dentro de la zona, con las opciones del control segmentado de la vertical, el zoom y `previewZoomLabel`. El encuadre mide cuanto tapa la franja al canvas y la descuenta solo (D160): la vertical no hace nada para eso, salvo poner la franja dentro de la zona.
- Al desmontar: `disposeSupportShadow()` y `disposeFinishTextures()`.

La escena (ver `src/verticals/boxes/scene/BoxScene.tsx`):

- Camara: `StudioCamera` de `StudioCamera.tsx` con un `StudioFrame` (`studioFraming.ts`): `volume` (ancho, alto y profundidad en metros de la caja de encuadre), `center` (el target), `zoom` (`studioZoomFactor(zoom, PREVIEW_ZOOM)`), `reducedMotion` y `start` opcional (D151). `start` es `{ azimuthDeg, polar }`, con el polar entre `STUDIO_VIEW.minPolar` y `maxPolar`; fuera de rango lanza. Se declara en la vertical con nombre propio, como `BOX_START` en `scene/boxGeometry.ts`. Una vertical con otros modos de camara usa `useStudioFraming` sobre su propia camara, como carteles.
- Luz: `StudioKeyLight` con `STUDIO_BRIGHT.light` y `reach` de `studioShadowReach(volume, center)`; `StudioEnvironment` con `STUDIO_BRIGHT.environment`. Constantes en `studioView.ts`.
- Sombra de apoyo: un plano en el piso con `supportShadowTexture()` (`supportShadow.ts`) y `SUPPORT_SHADOW_COLOR`.
- Superficies fisicas: `MeshPhysicalMaterial` con `physicalParamsOf(visual)` y `setPhysical` de `physicalSurface.ts`. Acabados: `surfaceTextures(finish)`, `setSurfaceRepeat` y `disposeSurfaceTextures` de `finishTextures.ts`, con los tres `FINISHES` de `finishMaps.ts` (foam, brushed, polished). Un acabado nuevo solo con freno y capturas (D124).
- Damp: `approach` y `approachColor` de `studioView.ts` para toda transicion.
- Color del tema: `themeColor(theme, '--q-accent')` de `themeColor.ts`. Ningun hexadecimal en la escena: colores del `visual` del JSON y del tema.
- Logo (D144): la vista recibe la ruta; si la vertical lo dibuja, lo rasteriza una vez a `CanvasTexture` y lo libera al desmontar (`scene/logoTexture.ts` en cajas).
- Geometria parametrica, en metros, sin modelos importados. Las medidas de escena que no son del cliente van nombradas en la vertical.

## 9. Tests

Tests de la vertical, en `src/verticals/<id>/`, con `*.test.ts` (vitest no toma `.tsx`):

- `config.test.ts`: los dos clientes validan; la seleccion default; cada clave obligatoria y cada regla de validacion falla nombrando la clave.
- `pricing/calculate<Id>Price.test.ts`: precios completos a mano contra la SPEC de la vertical, redondeo por decimals de cada cliente, lineas que entran y no entran, y los casos que lanzan.
- `fields.test.ts`: los pasos del panel, la ida y vuelta de valores y cada `applyFieldChange` con regla.
- `query.test.ts`: ida y vuelta exacta sobre una matriz de selecciones por cliente, y links invalidos que dan null.
- `leadTokens.test.ts`: tokens de WhatsApp formateados con el locale, la plantilla sin precio sin cifras, filas de la hoja, `leadSelection`, `breakdownCaption` y `lineDetail`.
- Tests puros de la escena (geometria, encuadre, arranque), sin montar three.
- `clients.test.ts` y un `testing.ts` que arma la parte de la vertical con los valores de la SPEC: los JSON de `src/clients/` tienen que traer exactamente esos valores.

Tests que recorren clientes (D148), en `src/app/clients.test.ts`: filtran por vertical con `slugsOf`, que exige al menos un cliente. Se suma:

- La lista de slugs de la vertical en "cada cliente resuelve a la vertical de su JSON", y la vertical en el recorrido.
- Los slugs nuevos en la lista completa de "stageToneOf sobre los clientes".
- Un describe como "las 44 claves de texts de cajas": core y claves propias disjuntas y exactas en cada JSON de la vertical.
- En "una vertical que no esta en el registro es null", el id de ejemplo no puede ser el de la vertical nueva: se cambia por otro que no exista.

Fixture de precios (D140, D149): `src/verticals/signs/pricing/priceSnapshot.json` es solo de carteles y su test tiene que seguir sin diff. La vertical nueva no entra ahi; su precio se prueba con sus tests contra la SPEC.

## 10. Capturas: `scripts/vitrina.mjs`

- Una lista `<ID>_CLIENTS` con los slugs, junto a `BOX_CLIENTS`, y un bloque como el de cajas: cada toma abre la pagina, fija la configuracion con clics en el panel y en el control segmentado, y captura. Desktop 1440 x 900 y 04 mobile 390 x 844 con escala 3. Sin arrastrar la orbita: la camara de carga es la que se ve.
- Los clientes nuevos no entran a la grilla, que es de los cinco de carteles.
- Corre contra el build: `npm run build` y `node scripts/vitrina.mjs`. Las capturas quedan en `validacion/vitrina/<slug>/`, fuera de git.
- Vara de D147: una captura de carteles o de cajas cuenta como cambiada solo si difiere en dos corridas seguidas. Con la vertical nueva, las de las otras verticales tienen que salir iguales.

## 11. Verificacion antes de reportar

Se corre todo y se reporta la salida, no la intencion:

1. G1 `npm run build` sin errores ni warnings.
2. G2 `npx tsc -b --force` con 0 errores.
3. G3 `npm run lint` sin hallazgos.
4. G4 `npm test` en verde, con el total de antes mas los nuevos; el snapshot de carteles sin diff.
5. G5 sin guiones largos en archivos nuevos o editados: `rg -n "\x{2014}|\x{2013}" <archivos>` da 0.
6. G6 sin parches: nada esquivado en el JSON ni copiado del core.
7. `git diff --stat` solo muestra `src/verticals/<id>/`, `src/clients/<slug>.json`, `public/clients/<slug>/`, `src/app/verticals.ts`, `src/app/clients.test.ts`, `scripts/vitrina.mjs` y lo que el brief pida de SPEC.
8. `rg -n "verticals/(signs|boxes)|\.\./(signs|boxes)/" src/verticals/<id>` no muestra imports de otra vertical, y el grep de vocabulario de SPEC 4.4 en `src/core` da 0.
9. `/d/<slug>` y `/d/<slug>/quote?<query>` cargan en `npm run preview` sin errores de consola, para cada cliente.
10. Los criterios propios del brief, uno por uno, con si o no y la evidencia.

Reporte de 15 lineas como maximo: archivos tocados, criterios cumplidos si o no, bloqueos en una linea. Sin push ni deploy.
