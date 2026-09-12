# TAREA_007 · Pulido visual y mobile

Bloque 4. SPEC pasa a 1.5 con esta tarea: `PriceLine` suma `detailValues` y la nota de formateo de la seccion 10 alcanza al desglose y a la linea de area. Nada mas cambia de alcance.

## 1. Objetivo

Que las dos demos se vean como un producto terminado y no como un prototipo. Tres frentes:

1. Cerrar los dos hallazgos del barrido ES de TAREA_006: el desglose y la linea de area muestran punto decimal y numeros crudos, tambien en `/d/norte`.
2. Los tres pendientes visuales que venian anotados: el nombre de la marca repetido al lado del logo, el aire muerto al pie del preview en 1440 px, y el preview, que vuelve a abrirse aca por primera vez desde que cerro el bloque 2.
3. Pulido: tipografia, espaciados, foco, tabulacion, transiciones y los textos finales de las dos demos.

Al cerrar esta tarea queda solo la landing (TAREA_008) y el material de venta.

## 2. Que existe ya y no se toca

- El contrato de calculo de `calculatePrice`: areas, importes, descuentos, total y rango. Solo se agrega informacion a cada linea, no se cambia ningun numero.
- `detail` sigue siendo el string tecnico y determinista que ya era. No se borra y no se traduce: deja de mostrarse en pantalla, nada mas.
- La escena 3D, salvo el alto del marco del preview de la seccion 5. Camara, luces, geometria y niveles de rendimiento no se tocan.
- Las 112 pruebas actuales. Si alguna tiene que cambiar, se frena y se reporta antes de tocarla.
- La interfaz de `SignPreview`: recibe `selection`, `visual` y `theme`, y nada mas (SPEC 12).

## 3. Desglose y linea de area

El motor devuelve numeros crudos y la UI los formatea. Ese es el corte: el motor sigue puro y sin locale, y ningun numero visible se arma en el motor.

`src/core/types.ts`, aditivo sobre `PriceLine`:

```ts
export type PriceDetailValues =
  | { id: 'material' | 'lighting'; area: number; unitPrice: number }
  | { id: 'type'; fixed: number }
  | { id: 'installation'; fixed: number; perArea: number; area: number }
  | { id: 'discount'; pct: number }
```

`PriceLine` suma `detailValues?: PriceDetailValues`. Es opcional en el tipo porque la edicion de SPEC 6 es aditiva; `calculatePrice` la emite siempre.

`src/core/pricing/calculatePrice.ts`: cada linea suma sus valores crudos, sin redondear el area y con los precios tal como vienen de las reglas. `detail` no cambia.

`src/core/pricing/format.ts`, dos formateadores nuevos:

```ts
export function formatArea(area: number, locale: string, areaUnit: string): string
export function formatLineDetail(
  values: PriceDetailValues,
  currency: CurrencyConfig,
  locale: string,
  areaUnit: string,
): string
```

`formatLineDetail` despacha por `values.id`, con `switch` exhaustivo. Sin `default` que tape un caso nuevo.

- `material` y `lighting`: area con unidad, `x`, y el precio unitario como moneda.
- `type`: el fijo como moneda.
- `installation`: el fijo como moneda, `+`, area con unidad, `x`, y el precio por area como moneda.
- `discount`: el porcentaje con `Intl` y `style: 'percent'`.

`src/core/ui/PriceBreakdown.tsx` y `src/core/ui/QuoteSheet.tsx` dejan de renderizar `line.detail`. Si una linea llegara sin `detailValues`, no se muestra detalle: nunca se cae al string tecnico.

Resultado esperado en `/d/norte`: `2,5 m² x $ 109.000`, y la linea de area en `2,5 m²`.

## 4. Simbolo de la unidad de area

El simbolo sale de un mapa en la vertical, derivado de `units.area`: `m2` a `m²`, `sqft` a `sq ft`. No va en `texts` y no va hardcodeado en core, asi que un cliente nuevo con otra unidad se resuelve en la vertical y no en el JSON.

`src/verticals/signs/visuals.ts`, al lado de `lengthToMeters`, que ya hace lo mismo con la unidad de longitud:

```ts
export function areaUnitSymbol(unit: string): string
```

Lanza con la unidad en el mensaje si no la conoce, igual que `lengthToMeters`.

`src/core` no puede importar de `src/verticals`, asi que el simbolo baja como prop desde las dos paginas que componen: `QuotePage` a `PriceBreakdown`, y `QuoteSheetPage` a `QuoteSheet`.

## 5. Los tres pendientes visuales

- Encabezado, `src/core/ui/QuoteLayout.tsx`: el logo ya lleva `brand.name` como `alt`. Se retira el `span` que lo repite al lado.
- Aire muerto en 1440 px: la columna del preview pasa a columna flex en `lg` y el marco del preview deja de tener alto fijo por `aspect-video` ahi, para ocupar el alto disponible. Debajo de `lg` sigue siendo `aspect-video`, que es lo que funciona en mobile. La interfaz de `SignPreview` no cambia: el marco se resuelve con clases, no con un prop nuevo.
- El fallback sin WebGL acompana el mismo marco.

## 6. Pulido

- `src/index.css`: tokens compartidos para los botones que hoy repiten la misma cadena larga de clases en `ChoiceGroup`, `BooleanChoice`, `LeadSection`, `ThanksScreen` y `QuoteSheet`. Con `@apply`, sin librerias nuevas.
- Foco: `focus-visible` visible en los cuatro controles, en los botones y en los enlaces. El anillo usa `--q-accent` sobre `--q-bg`, con `outline-offset`.
- Tabulacion: orden coherente del panel al bloque de CTA, sin `tabindex` positivos. Cada control se activa con Enter o Space.
- Tipografia y espaciados: escala pareja entre el panel, el desglose y el bloque de precio.
- Los botones del `Stepper` reciben nombre accesible: hoy son un `-` y un `+` sueltos.

## 7. Textos finales

`src/clients/northline.json` y `src/clients/norte.json`. Ingles nivel B2, frases cortas, sin modismos. Espanol de Argentina, sin jerga. Las 40 claves siguen completas en los dos y ninguna queda vacia.

## 8. Reglas

- Sin librerias nuevas. Sin dependencias nuevas.
- Nada de parches. Si algo pide un workaround, frenar y reportar sin commitear.
- Sin `any`, sin `as` para tapar un tipo, sin `@ts-expect-error`.
- Ni un string de UI hardcodeado, con la unica excepcion que ya existe (`ErrorScreen`).
- `src/core` no importa nada de `src/verticals` ni de `src/clients` en codigo de produccion, y no importa `three`.
- `src/core/pricing` sigue sin React, sin datos y sin locale adentro del motor. `Intl` vive en `format.ts`.
- Tres capas: agregar un cliente sigue siendo agregar un JSON y un logo.

## 9. Tests

Entorno node, solo `src/**/*.test.ts`. Las 112 previas no se editan.

`calculatePrice.test.ts`, casos nuevos:

1. Cada linea emitida trae `detailValues` con el `id` que le corresponde y con los numeros crudos esperados, para los dos clientes.
2. El area de `detailValues` es la misma que `result.area`, sin redondear.
3. Los numeros de `detailValues` no dependen del locale: son los mismos para `northline` y para una regla con otra moneda.

`format.test.ts`, casos nuevos:

4. `formatArea` da `24 sq ft` en `en` y `2,5 m²` en `es-AR`.
5. `formatLineDetail` de una linea de material da `24 sq ft x $15` en `en` y `2,5 m² x $ 109.000` en `es-AR`.
6. `formatLineDetail` de instalacion, de tipo y de descuento, en los dos locales.

`visuals.test.ts`, casos nuevos:

7. `areaUnitSymbol` mapea `m2` y `sqft`, y lanza con una unidad desconocida, con la unidad en el mensaje.

## 10. Criterios de aceptacion

1. G1 `npm run build` en verde, app por debajo de 500 kB y `three-vendor` por debajo de 1000 kB.
2. G2 `npx tsc -b --force` con 0 errores.
3. G3 `npm run lint` y `npx oxlint --deny-warnings`, los dos sin hallazgos.
4. G4 `npm test` en verde, con las 112 previas intactas.
5. G5 sin guiones largos en nada nuevo ni editado.
6. G6 sin parches. Cada decision queda en docs/DECISIONES.md.
7. `/d/norte`: desglose y linea de area con coma decimal y unidad correcta.
8. `/d/northline`: el desglose EN muestra unidad y moneda con formato en-US, se lee natural y no tiene numeros crudos. Pasa de `24 x 15` a `24 sq ft x $15`, que es una mejora y no una regresion: el numero crudo era el defecto en los dos idiomas.
9. `/d/norte/quote` y `/d/northline/quote`: los mismos numeros que el cotizador, una pagina al imprimir, controles fuera de la impresion.
10. El encabezado no repite el nombre de la marca al lado del logo, en los dos clientes.
11. Revision en 390 px, 768 px y 1440 px: sin scroll horizontal, sin solapamientos, sin aire muerto al pie del preview en 1440.
12. Tabulacion completa del panel al CTA con foco siempre visible, y Enter o Space activando cada control.
13. Cero errores y cero warnings propios de consola en las cuatro rutas.
14. Greps de capas en 0 sobre codigo de produccion, y un JSON nuevo sigue alcanzando para tener su ruta funcionando.

Los tres criterios subjetivos de DONE (10 segundos, apariencia de producto, sin errores visibles) los valida Joaquin. Al cerrar se dejan listas las URLs a mirar.

## 11. Reporte de cierre

Los 14 criterios uno por uno, los archivos tocados, la cantidad de pruebas nuevas y el total, el tamano de los dos chunks, cualquier desvio con el motivo, y el hash de los tres commits.
