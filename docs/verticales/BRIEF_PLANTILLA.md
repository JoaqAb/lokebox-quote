# Plantilla de brief de vertical

Lo que Canal B completa para que el subagente vertical-builder arme una vertical nueva con docs/verticales/KIT.md. Cada seccion es obligatoria: si una no aplica, se escribe "no aplica" y por que. Todos los numeros del precio van aca y van al JSON: el agente no inventa ninguno. Si algo del brief falta o se contradice con el kit, el agente frena y lo reporta; no lo resuelve solo.

Primero la plantilla en blanco. Despues un ejemplo completo, cajas, rellenado desde SPEC 21.

## Plantilla

### 1. Identidad

- Id de la vertical (campo `vertical` del JSON, en ingles, minusculas):
- Nombre del rubro:
- Carpeta: `src/verticals/<id>/`
- Que cotiza, en una frase:
- Seccion de SPEC: si el agente la escribe o ya esta escrita (y cual).

### 2. Seleccion y opciones

- La seleccion S, campo por campo: nombre, tipo, que significa y en que unidad.
- Cada opcion con su id y su etiqueta en los dos idiomas. Reglas entre opciones (por ejemplo, un material que vale solo para un estilo) y que pasa al cambiar una opcion que invalida otra.
- Medidas: min, max, paso y default por cliente.
- Cantidad: libre con min y max, o escalones fijos.
- Defaults por cliente.
- Pasos del panel, en orden, con el tipo de control de cada campo (choice, range, boolean, stepper, text) y la clave de texto del titulo.

### 3. Precio

- Formula completa, con cada numero en el JSON.
- Componentes por unidad, en el orden del desglose, cada uno con su id, su clave de texto y cuando entra.
- Componentes por pedido, que no se multiplican ni se descuentan.
- Descuento: tramos por cantidad, o ninguno.
- rangePct.
- R: que claves suma la vertical al PriceResult y para que (por ejemplo, lo que necesita la leyenda del desglose).
- detail y detailValues de cada linea, y como se ve el detalle formateado.
- breakdownCaption: el texto de la leyenda, o null.
- Casos que lanzan.
- Unidades: las combinaciones que acepta y la conversion fija, si hay.

### 4. Hoja, lead y WhatsApp

- Claves de la query de la hoja, en orden, y que link es invalido.
- Filas de la hoja.
- leadSelection.
- Placeholders de whatsappMessage y de whatsappMessageHidden.

### 5. Preview

- Geometria: que se dibuja, con que medidas y en metros. Constantes de escena nombradas.
- Acabados: que superficie lleva que acabado del core (foam, brushed, polished) y los valores de partida del visual.
- Arranque de camara: azimut en grados y polar en radianes, o sin arranque.
- Caja de encuadre: que entra en el encuadre, y si cambia con alguna animacion.
- Control de vista en la franja: las opciones y su efecto, o "no aplica". Si no es seleccion, no va al precio, a la URL ni al lead.
- Logo del cliente: donde va, o "no lo dibuja".
- Alto del preview por debajo de lg.

### 6. Clientes

Dos clientes, uno en ingles y uno en espanol, cada uno con:

- slug, nombre de marca, locale, moneda (code, symbol, decimals), unidades, pricing.display, cta, prices_placeholder, poweredBy y colores de brand.
- Todas las opciones con sus precios.
- Logo: archivo en `public/clients/<slug>/logo.svg` (de donde sale).

### 7. Claves de texts propias

Tabla con cada clave de la vertical y su texto en los dos clientes. Ninguna igual a una del core (CORE_TEXT_KEYS). Las 27 del core se escriben en los dos idiomas como en los clientes existentes.

### 8. Capturas

Las tomas de scripts/vitrina.mjs por cliente: nombre del archivo, viewport y clics.

### 9. Criterios de aceptacion

Numerados, verificables con un comando, un test o una captura. Mas G1 a G6 y la lista de la seccion 11 del kit.

## Ejemplo completo: cajas

Rellenado desde SPEC 21 (2.16) y los JSON de foldline y cajasur. Es la vertical que ya existe: sirve de modelo de nivel de detalle.

### 1. Identidad

- Id: `boxes`.
- Nombre: cajas y packaging a medida.
- Carpeta: `src/verticals/boxes/`.
- Cotiza cajas de carton a medida por pedido: estilo, medidas interiores, material, impresion y cantidad.
- SPEC: seccion 21, ya escrita.

### 2. Seleccion y opciones

- S: `style` (id de estilo), `length`, `width`, `height` (medidas interiores en la unidad de largo del cliente), `materialId`, `printingId`, `quantity` (uno de los escalones).
- Estilos: `mailer`, `two-piece`, `shipping`. Material: `kraft`, `white` (`blanco` en cajasur), `rigid` (`rigido`), este solo para two-piece. Impresion: `none`, `one`, `full`, `full-inside` (en cajasur `sin`, `un-color`, `full`, `full-interior`).
- Regla: `materials[].styles` opcional; sin la clave el material vale para todos. Al cambiar a un estilo donde el material no vale, pasa al primero que vale, en el orden del JSON.
- Medidas foldline (pulgadas): largo 4 a 24, ancho 3 a 18, alto 1 a 12, paso 0,5, default 10 x 8 x 4. Cajasur (cm): largo 10 a 60, ancho 8 a 45, alto 3 a 30, paso 1, default 30 x 20 x 15.
- Cantidad: escalones 50, 100, 250, 500 y 1000.
- Defaults: foldline mailer, kraft, one, 250. Cajasur shipping, kraft, un-color, 100.
- Panel en cinco pasos: estilo (choice, `styleLabel`); medidas (tres range con la unidad, titulo `dimensionsLabel`); material (choice con swatch del color del visual, `materialLabel`); impresion (choice, `printingLabel`); cantidad (choice, un boton por escalon con formatInteger, `quantityLabel`).

### 3. Precio

- Unidades: `in` con `sqft` o `cm` con `m2`; otra combinacion falla al cargar. Pulgada cuadrada sobre 144 da sqft; centimetro cuadrado sobre 10000 da m2.
- Plancha desplegada por estilo en `blank`: piezas rectangulares; cada lado `{ l, w, h, add }` vale l por largo mas w por ancho mas h por alto mas add. Area por caja: suma de largo por ancho de cada pieza, en la unidad de area.
- Por caja, en orden: `material` (area por pricePerArea del material, `lineMaterial`, siempre); `printing` (area por pricePerArea de la impresion, `linePrinting`, siempre, en 0 sin impresion); `assembly` (fijo del estilo, `lineAssembly`, solo si es mayor que 0).
- Por pedido: `setup` de la impresion, `lineSetup`, solo si es mayor que 0.
- Descuento: los escalones son los tramos de composePrice, con pct 0, 10, 20, 28 y 35; el primero en 0.
- rangePct 10.
- R: `blankArea` (area por caja sin redondear) y `quantity` (la lee la leyenda, D146).
- detailValues de material e impresion: `{ id, blankArea, unitPrice }`, formateado como area con su unidad por precio con su moneda. Armado y preparacion sin detalle.
- breakdownCaption: `perBoxCaption` con `{quantity}` formateado con formatInteger.
- Lanza con id inexistente, material que no vale para el estilo, medida fuera de rango o cantidad fuera de los escalones, con el valor en el mensaje.

### 4. Hoja, lead y WhatsApp

- Query: `s` estilo, `l` largo, `w` ancho, `h` alto, `m` material, `p` impresion, `q` cantidad, todas siempre, punto decimal. Un material que no vale para el estilo o una q fuera de escalones es link invalido.
- Filas: estilo; medidas largo x ancho x alto con la unidad; material; impresion; cantidad.
- leadSelection: `{ style, length, width, height, unit, materialId, printingId, quantity }`.
- whatsappMessage: `{style}`, `{length}`, `{width}`, `{height}`, `{unit}`, `{material}`, `{printing}`, `{quantity}`, `{min}`, `{max}`. whatsappMessageHidden: la misma sin `{min}` ni `{max}`, exigida solo con hidden y un CTA con WhatsApp.

### 5. Preview

- Geometria parametrica por `styles[].visual.shape`: mailer (tapa con bisagra atras), two-piece (fondo y tapa telescopica, con `lidDepth` entre 0 y 1) y shipping (cuatro solapas). Medidas interiores a metros (0,0254 por pulgada, 0,01 por cm) mas el espesor `thicknessMm` del material. Cantos con radio chico nombrado.
- Acabados: corrugados en foam con normalScale 0,1; rigido en polished con normalScale 0,1. Visual de kraft: color #B8895A, roughness 0,95, specularIntensity 0,25, thicknessMm 3; blanco #ECEAE4, roughness 0,9, specularIntensity 0,3, thicknessMm 3; rigido #23303D, roughness 0,55, specularIntensity 0,5, clearcoat 0,3, clearcoatRoughness 0,4, thicknessMm 2.
- Arranque: azimut 35, polar 1,0 (BOX_START).
- Encuadre: la caja tal como esta en cada momento de la apertura; cerrada, centrada.
- Control de vista: `viewClosed` y `viewOpen`, cerrada al cargar, transicion con damp. No es seleccion.
- Logo: impreso en la tapa (en shipping, en la cara lateral larga del frente); `accent` en el acento del tema, `original` en sus colores; `inside` pinta las caras interiores en el acento.
- Alto por debajo de lg: 3/4 del ancho con tope de 42svh.

### 6. Clientes

| Clave | foldline | cajasur |
|---|---|---|
| Marca | Foldline Packaging | Caja Sur |
| locale | en | es-AR |
| Moneda | USD, $, decimals 2 | ARS, $, decimals 0 |
| Unidades | in y sqft | cm y m2 |
| pricing.display | sin clave (range) | sin clave (range) |
| cta | both | whatsapp |
| prices_placeholder | false | true |
| Estilos y armado | Mailer box 0,25; Lid and base 0,6; Shipping box 0,1 | Mailer autoarmable 170; Tapa y fondo 410; Caja de envio 70 |
| Materiales por area | Kraft corrugated 0,35; White corrugated 0,50; Rigid, paper-wrapped 1,60 | Kraft corrugado 2500; Blanco corrugado 3600; Rigido forrado 11600 |
| Impresion por area y setup | No print 0 y 0; 1 color, outside 0,15 y 60; Full color, outside 0,45 y 120; Full color, inside and out 0,80 y 180 | Sin impresion 0 y 0; 1 color exterior 1100 y 40000; Full color exterior 3300 y 81000; Full color exterior e interior 5800 y 122000 |
| Logo | public/clients/foldline/logo.svg | public/clients/cajasur/logo.svg |

Los `blank` de cada estilo estan en SPEC 21.4; los `add` de cajasur en cm son mailer 2,5 y 4, tapa y fondo 0,6 en el fondo y 1,2 en la tapa, envio 4 y 0,6.

### 7. Claves de texts propias (17 mas la condicional)

| Clave | foldline | cajasur |
|---|---|---|
| `styleLabel` | Box style | Estilo de caja |
| `dimensionsLabel` | Inside size | Medida interior |
| `lengthLabel` | Length | Largo |
| `widthLabel` | Width | Ancho |
| `heightLabel` | Height | Alto |
| `materialLabel` | Board | Cartón |
| `printingLabel` | Printing | Impresión |
| `quantityLabel` | Quantity | Cantidad |
| `previewZoomLabel` | Zoom | Acercar |
| `viewClosed` | Closed | Cerrada |
| `viewOpen` | Open | Abierta |
| `lineMaterial` | Board | Cartón |
| `linePrinting` | Printing | Impresión |
| `lineAssembly` | Folding and gluing | Armado y pegado |
| `lineSetup` | Print setup, per order | Preparación de impresión, por pedido |
| `perBoxCaption` | Prices per box for {quantity} boxes. Print setup is per order. | Precios por caja para {quantity} cajas. La preparación de impresión es por pedido. |
| `whatsappMessage` | Hi, I want a quote for {quantity} boxes: {style}, inside size {length} x {width} x {height} {unit}, {material}, printing: {printing}. Estimated range {min} to {max}. | Hola, quiero un presupuesto de {quantity} cajas: {style}, medida interior {length} x {width} x {height} {unit}, {material}, impresión: {printing}. Rango estimado {min} a {max}. |
| `whatsappMessageHidden` | no aplica: range | no aplica: range |

### 8. Capturas

Por cliente, en validacion/vitrina/<slug>/, sin arrastrar la orbita: 01 desktop cerrada (sin clics); 02 desktop abierta (`viewOpen`); 03 impresion interior abierta (la impresion con inside y `viewOpen`); 04 mobile 390 cerrada; 05 two-piece rigido abierta; 06 shipping cerrada.

### 9. Criterios de aceptacion

1. Los dos clientes validan y traen exactamente los valores de SPEC 21.4 (test de clients con testing.ts).
2. Precio: tests a mano por estilo en los dos clientes, con redondeo a 2 en foldline y a 0 en cajasur; el escalon minimo sin linea de descuento; armado y setup en 0 no entran; los cuatro casos que lanzan.
3. Query: ida y vuelta exacta en una matriz por cliente; material que no vale o q fuera de escalones da null.
4. Panel: cinco pasos; cambio de estilo con material que no vale pasa al primero que vale.
5. WhatsApp y hoja: los diez placeholders formateados con el locale; filas de la hoja; leyenda por caja en el cotizador y en la hoja con precio.
6. Preview: en 01, 04 y 06 se ven la cara del logo y dos laterales al cargar; en 02, 03 y 05 el interior abierto; ningun canto cortado; la pastilla no roza la caja en 04.
7. Carteles sin cambio: snapshot de precios y las capturas de carteles identicas con la vara de D147.
8. `rg` del vocabulario de cajas en src/core da 0; cero imports entre verticales.
9. G1 a G6 y la seccion 11 del kit.
