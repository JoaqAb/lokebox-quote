# TAREA_032 · Contrato de vertical y motor generico

Bloque 12 · Segunda vertical. Decisiones: D119 a D122, D129 a D137. SPEC 2.13: secciones 4.4, 6.1, 6.3, 7, 8, 10 y 12.

## Objetivo

Sacar del core todo lo que es de carteles y dejarlo detras del contrato de vertical de SPEC 4.4, sin que cambie nada que vea un visitante ni ningun dato. Es la condicion para que TAREA_033 sume cajas sin tocar el core. Antes, una fase 0 corta con los hallazgos de la vitrina que si cambian algo visible, para que la linea base del refactor ya los incluya (D130).

## Reglas

- Tres fases en orden, cada una con su commit o sus commits. La vara de D122 cuenta desde el commit de la fase 1.
- Si un numero del snapshot, una URL o una captura sale distinta despues del refactor, se frena y se reporta. No se regenera el snapshot, no se ajusta el umbral, no se edita un JSON.
- Si el contrato de SPEC 4.4 no alcanza para algo que hoy hace el codigo, se frena y se reporta con el archivo y la linea. No se agrega una salida por fuera del contrato.
- Si un archivo del core consume una clave de texts de la lista de carteles de SPEC 10, se frena y se reporta (D135).
- No se lee `.env.local` con cat ni se imprime su contenido. Para saber que variables hay: `grep -o '^[A-Z_]*' .env.local`. En TAREA_031 se imprimio el token OIDC de desarrollo en la salida.
- AGENTS.md, docs/planillas/ y docs/comercial/plantillas/ no se tocan ni entran a ningun commit.

## Fase 0 · Hallazgos de la vitrina (cambio visible, antes de la linea base)

### 0a. WhatsApp llega a gracias (D131, SPEC 7.4)

`src/core/ui/LeadSection.tsx`: el clic en el boton de WhatsApp sigue abriendo wa.me con el enlace nativo en otra pestana y sigue disparando el insert sin esperarlo (DECISIONES 11/09). Ademas pasa el bloque a `thanks`, con el boton a la hoja, igual que el formulario. Vale con cta `whatsapp` y con `both`. Sin estado de error nuevo y sin claves de texto nuevas.

### 0b. Escenario oscuro para tema oscuro (D132, SPEC 12)

El core deriva el tono del escenario del tema: si la luminancia relativa de `brand.colors.bg` es menor a 0,2, el escenario es grafito en los dos modos desde la carga, sin transicion al cambiar la iluminacion. Si no, todo sigue como hoy. Sin campo nuevo en el JSON. La pantalla de carga usa la tinta del escenario que toca (D128). La funcion que calcula la luminancia es pura y va con tests, incluidos los cinco clientes: solo afterglow da oscuro.

### 0c. JSON de alba y halcyon (solo `src/clients/`)

- alba: `anchorGround` de `front-day` y `front-night` recalibrado con `?calibrate=1` para que el totem entero, panel incluido, quede dentro de la foto con la configuracion de portada y con la default, con al menos 2 por ciento de margen al borde, la base sobre la vereda y la puerta libre. Hoy el panel arranca justo en el borde izquierdo de la foto en 02.
- alba: `texts.ctaWhatsapp` mas corto, que entre en una linea en el bloque de CTA con cta `both` a 1440 y a 390 (hoy "Enviar por WhatsApp" parte en dos lineas).
- halcyon: `light` de `front-day` ajustado para que la sombra proyectada de las letras se lea como de cielo nublado, suave y clara. Solo con los campos de `light` que ya existen.

### 0d. Referencia de la landing (D137)

`src/landing/landingConfig.ts`: el comentario de `DEMO_COUNT` cita D129 y pasa a citar D137. Nada mas cambia en la landing.

### Cierre de la fase 0

Commit de codigo de la fase 0. Pares antes y despues en `validacion/vitrina/032-fase0/`, para que los mire Joaquin: afterglow 01 a 04, alba 02 y 03, halcyon 02. Despues, `scripts/vitrina.mjs` sobre ese commit: esas capturas son la linea base.

## Fase 1 · Linea base (sin cambio de codigo de produccion)

Sobre el commit de la fase 0, en un commit propio:

1. Snapshot del motor. Un script que recorre, por cliente, una matriz de selecciones y guarda la seleccion, el resultado completo de `calculatePrice` y la URL de `encodeQuoteParams` en un fixture JSON versionado. Matriz minima por cliente: cada tipo, cada material que ofrece su modo, cada iluminacion, instalacion si y no, cantidad en min, 2, 5 y max, medidas en min, default y max (ancho y alto juntos en area, alto de letra en letters), cada profundidad en letters, y dos textos: el default y uno de 18 caracteres con dos espacios. Se reporta el total de casos.
2. URLs publicadas. Lista de los links de hoja que ya estan afuera: `grep -rn "/quote?" docs/ scripts/` mas el link de quote-northline.pdf y los de los videos (docs/comercial). Van al mismo fixture con su seleccion y su precio decodificados.
3. Ruido de capturas. `scripts/vitrina.mjs` dos veces sobre el mismo commit. Por archivo: diferencia maxima por canal y porcentaje de pixeles con diferencia mayor a 2 niveles. El ruido de cada archivo es el de esa comparacion. Tabla en `validacion/vitrina/032-ruido.txt`.

## Fase 2 · Refactor

Lo que dice SPEC 4.4, 6.1, 6.3, 8 y 10, con estas precisiones:

- `src/core/pricing/composePrice.ts` nuevo, con la forma y las reglas de SPEC 6.3, y tests propios: sin descuentos, con tramos, componentes por pedido que no se multiplican ni se descuentan, linea de costo 0 que entra, cantidad invalida que lanza, clave opcional ausente.
- `calculatePrice` pasa a `src/verticals/signs/pricing/calculateSignPrice.ts` y compone con `composePrice`. Los componentes se suman en el orden de hoy (material, iluminacion, tipo, instalacion), asi la aritmetica de punto flotante es la misma. Las lineas de tipo e instalacion entran solo cuando hoy entran.
- Tipos: `src/core/types.ts` queda con lo generico (moneda, marca, colores, cta, display, textos del core, tipos del contrato). Lo de carteles va a `src/verticals/signs/types.ts`.
- Validacion: `src/core/clientConfig.ts` valida la parte del core y exporta las primitivas de lectura (`readString`, `readNumber`, `readRange` y compania, `readMaterialVisual`) para que las usen las verticales con el mismo formato de error. Lo de carteles (`units`, `photos`, `options`, `TOTEM_TYPE_ID`, `anchorGround`, plantillas de hidden, las 20 claves) va a la vertical.
- Contrato: los tipos de SPEC 4.4 en `src/core/vertical.ts`. La vertical de carteles lo implementa en `src/verticals/signs/logic.ts` (sin React ni three) y en una entrada de vista que envuelve a `SignPreview` y calcula el `visual`. El modo `?calibrate=1` se decide adentro de esa entrada, detras de `import.meta.env.DEV`, como hoy.
- Registro: `src/app/verticals.ts` mapea `signs` a su logica, importada estatica, y a su vista con `React.lazy`. `resolveClient` busca ahi y sale `SIGNS_VERTICAL`.
- Paginas: `QuotePage` y `QuoteSheetPage` quedan genericas, sin ningun import de `src/verticals`.
- UI del core: `PriceBreakdown` y `QuoteSheet` dejan de formatear lineas de carteles: piden `lineDetail` y `breakdownCaption` a la vertical y formatean solo el descuento. Las etiquetas de linea se resuelven contra el texts del cliente, como hoy.
- Tests: se mueven con su codigo. Ninguna asercion se debilita. El test de las 47 claves pasa a dos, 27 del core y 20 de carteles, con la lista de SPEC 10. Se listan los tests movidos (origen y destino) y cualquier asercion editada con su motivo.

## Fase 3 · Verificacion y cierre

Mismo flujo que TAREA_031: build local, tests, capturas, deploy y prueba en produccion. Filas de prueba con el nombre `Refactor Test`.

## Criterios de aceptacion

Fase 0:

1. Con cta whatsapp (afterglow) y con el boton de WhatsApp en both (alba y northline): abre wa.me en otra pestana, la fila entra en `leads` (por `client_slug` y `channel`), y el bloque muestra gracias con el boton a la hoja, que abre la hoja de esa seleccion. El flujo del formulario no cambia. En local y en produccion.
2. afterglow: escenario grafito desde la carga en modo cartel y en las dos vistas, sin destello claro en ningun momento de la carga. La pantalla de carga con 4,5:1 o mas sobre el grafito, medido sobre pixeles. En los otros cuatro clientes las capturas de vitrina no cambian.
3. alba y halcyon segun 0c, verificado en los pares. Solo cambian archivos de `src/clients/`.
4. Pares de la fase 0 en `validacion/vitrina/032-fase0/`.

Fase 1:

5. Fixture del snapshot versionado, con el total de casos por cliente, y script que lo genera.
6. Lista de URLs publicadas en el fixture, con su origen.
7. Tabla de ruido en `validacion/vitrina/032-ruido.txt`.

Fase 2 y 3:

8. `git diff <commit fase 1>..HEAD -- src/clients/` vacio.
9. Test que compara, con `toStrictEqual`, el resultado de la vertical contra el fixture en toda la matriz de los cinco clientes: cero diferencias.
10. Cada URL del fixture decodifica a la misma seleccion y al mismo precio, y `encodeQuery` de cada seleccion reproduce la URL exacta.
11. Capturas de vitrina despues del refactor contra la linea base, dentro del ruido de 7 archivo por archivo. Tabla en el reporte.
12. `grep -rnE "totem|letters|facade|signText|Sign[A-Z]" src/core` da cero, tests incluidos.
13. `grep -rnE "from '[^']*(verticals|clients|app)/" src/core` da cero. El mismo grep sobre `src/pages` con solo `verticals` da cero.
14. La logica de carteles no importa react, three ni @react-three (grep sobre sus archivos y sus imports).
15. `composePrice` con los tests de la fase 2.
16. Tests: total mayor o igual a 302 mas los nuevos; lista de movidos y de aserciones editadas con motivo.
17. Flujo completo en produccion en los cinco clientes: configurar, precio segun su modo, lead por su CTA, gracias, hoja. Cero errores de consola.
18. Deploy: push a main, Vercel en Ready, las cinco rutas y sus hojas en 200.
19. G1 a G6.

## Cierre

Commits: apertura de docs (esta tarea, SPEC 2.13, DECISIONES D129 a D137, EXECUTION y STATE, que ya estan escritos en disco sin commitear), codigo de fase 0, linea base de fase 1, refactor (uno o varios), cierre de docs. STATE, INDICE con la fila de TAREA_032, _ULTIMO en 033 y DECISIONES con lo decidido durante la tarea, una linea cada una. En DECISIONES, ademas, la lista de lo que el contrato tuvo que cubrir que SPEC 4.4 no preveia, si hubo algo: es entrada de TAREA_033.

Reporte a Canal B con tope de 15 lineas mas las tablas de medicion (ruido, capturas, total de casos): hashes, criterios, y hallazgos si los hubo. El reporte completo, con las tablas, se escribe tambien en una seccion "Resultado" al final de este archivo, dentro del commit de cierre: Canal B lo lee de disco y no depende de que se pegue en el chat. Si la tarea se frena antes del cierre, el reporte del freno va igual a esa seccion, en un commit de docs.

## Resultado

Code, 25/09/2026. Hashes: apertura c789bc1, fase 0 61ade97, linea base 6d59ecd, refactor 00e9813 (en main y en produccion, Vercel Ready, alias quote.lokebox.com). Tests: 341 en verde (302 de TAREA_031, 6 de la fase 0 y 33 nuevos del refactor).

### Criterios

1. Si. WhatsApp en afterglow (whatsapp), alba y northline (both): abre wa.me en otra pestana, insert 201, fila en leads por client_slug y channel, gracias con el boton a la hoja, hoja 200 de esa seleccion. Formulario de halcyon y norte sin cambio. Local y produccion (validacion/vitrina/032-fase0/validar-local.txt y validar-prod.txt).
2. Si. afterglow grafito desde la carga en modo cartel y en las dos vistas; muestreo durante la carga con el typeface demorado: luminancia maxima 0,0452, la del grafito claro. Pantalla de carga 9,10:1 y 14,03:1 sobre pixeles. northline, norte, halcyon y alba: capturas de vitrina sin cambio de escenario.
3. Si. alba y halcyon segun 0c; solo cambiaron src/clients/alba.json y src/clients/halcyon.json.
4. Si. validacion/vitrina/032-fase0/antes/ y despues/.
5. Si. src/verticals/signs/pricing/priceSnapshot.json y scripts/snapshot-precios.mjs. Totales en la tabla.
6. Si. Dos entradas con su origen (ver hallazgo 2).
7. Si. validacion/vitrina/032-ruido.txt.
8. Si. git diff 6d59ecd..HEAD -- src/clients/ vacio.
9. Si. priceSnapshot.test.ts con toStrictEqual en los 9360 casos: cero diferencias. Prueba de que muerde: con la linea de tipo en priceFixed >= 0 fallan 4 de 6 tests.
10. Si. Cada URL del fixture, las 9360 y las 2 publicadas, decodifica a la misma seleccion y al mismo precio, y encodeQuery la reproduce exacta. El script corrido despues del refactor da una salida igual al fixture.
11. Si. Capturas despues del refactor contra la linea base: diferencia 0 en los 31 archivos, dentro del ruido 0.
12. Si. grep de totem, letters, facade, signText y Sign[A-Z] en src/core: 0, tests incluidos.
13. Si. El grep sobre src/core da 0; sobre src/pages con verticals da 0.
14. Si. La logica (logic, config, fields, leadTokens, query, quoteRows, visuals, types, pricing) no importa react, three ni @react-three; de react solo hay tipos en core/vertical.ts, que se borran al compilar.
15. Si. composePrice.test.ts: sin descuentos, tramos, componentes por pedido, linea de costo 0, cantidad invalida, clave opcional ausente y redondeo.
16. Si. 341 >= 302 mas los nuevos. Movidos y aserciones editadas abajo.
17. Si. Produccion, cinco clientes: precio segun su modo (range en northline, norte y afterglow; exact en halcyon, con libras y sin rango; hidden en alba, sin cifras), lead por su CTA, gracias, hoja 200. Cero errores de consola.
18. Si. Push a main, Vercel Ready, las cinco rutas, la landing y cinco hojas en 200.
19. Si. G1 build sin warnings, G2 tsc -b --force 0 errores, G3 lint sin hallazgos, G4 tests en verde, G5 sin rayas, G6 sin parches.

### Tablas

Ruido (fase 1, dos corridas sobre 61ade97) y capturas despues del refactor (00e9813 contra la linea base):

| Archivos | Ruido max por canal | Ruido pct > 2 | Refactor max por canal | Refactor pct > 2 |
|---|---|---|---|---|
| 5 clientes x 6 capturas y la grilla, 31 | 0 0 0 | 0 | 0 0 0 | 0 |

Total de casos del snapshot por cliente:

| afterglow | alba | halcyon | norte | northline | total |
|---|---|---|---|---|---|
| 1728 | 2160 | 1152 | 2160 | 2160 | 9360 |

### Tests movidos (origen, destino)

- src/core/pricing/calculatePrice.test.ts a src/verticals/signs/pricing/calculateSignPrice.test.ts
- src/core/quote/quoteParams.test.ts a src/verticals/signs/query.test.ts
- src/core/pricing/lineLabels.test.ts a src/verticals/signs/pricing/lineLabels.test.ts (sobre resolveTextKey)
- src/core/pricing/format.test.ts, bloques de formatLineDetail, a src/verticals/signs/pricing/lineDetail.test.ts
- src/core/clientConfig.test.ts: lo de carteles a src/verticals/signs/config.test.ts; getClient, pricing de la demo y loadingLabel en dos idiomas a src/app/clients.test.ts; lo del core queda, sobre un JSON de rubro inventado.
- src/core/theme.test.ts: los tests sobre clientes a src/app/clients.test.ts.
- src/core/lead/whatsapp.test.ts: el caso con la plantilla real (11.8) a src/verticals/signs/leadTokens.test.ts.
- El test de las 47 claves pasa a tres: 27 del core (core/clientConfig.test.ts), 20 de carteles (signs/config.test.ts) y la union disjunta en cada JSON (app/clients.test.ts). El 13.17 ahora recorre las 27 y las 20, no solo las cinco de la hoja.

### Aserciones editadas, con motivo

- format.test.ts: el descuento de formatLineDetail pasa a formatPercent(5, 'en') y formatPercent(10, 'es-AR'), mismos valores. Motivo: el core formatea solo el descuento.
- calculateSignPrice.test.ts: line.detailValues?.id se lee con un cast a { id: string }. Motivo: detailValues es unknown en el PriceLine de SPEC 6.3.
- core/clientConfig.test.ts: el slug esperado en los mensajes pasa de northline a core-test. Motivo: el core no importa JSON de clientes; mismo caso sobre otro JSON.
- leadRow.test.ts: sale area del PriceResult de ejemplo y la seleccion pasa de facade a panel. Motivo: area es de la vertical y el grep de D122 corre sobre tests del core; ninguna asercion la leia.
- whatsapp.test.ts: el token type pasa de "Facade sign" a "Panel" en el caso generico. Motivo: el mismo.
- app/clients.test.ts: units.area se lee de la config de la vertical. Motivo: D136.
- Ninguna asercion se debilito: los renombres de funcion y de import no cambian lo que se compara.

### Hallazgos

1. Recargo negativo: hasta 2.12 un priceFixed negativo restaba sin linea; el contrato no lo expresa. Ahora se rechaza al cargar. Ningun cliente lo usa. SUGERENCIA en DECISIONES 25/09, la decide Joaquin.
2. Ninguna URL de hoja aparece literal en docs ni scripts (el grep solo da plantillas). El PDF no guarda su URL y el video no muestra la barra: se reconstruyo la seleccion impresa en la hoja (letras, BLUE OWL, 1 ft, 2 in, aluminio, retroiluminado, sin instalacion, 1) y da $1,330, rango $1,224 / $1,436, como la hoja.
3. Las filas de prueba de WhatsApp no llevan nombre (contact_name null por diseno): 12 filas entre 03:13 y 03:59 UTC del 25/09, en afterglow, alba y northline. Canal C las ubica por client_slug, channel y hora, no por "Refactor Test".
4. Lo que el contrato tuvo que cubrir y SPEC 4.4 no preveia esta en DECISIONES 25/09, cinco puntos: entrada de TAREA_033.
