# TAREA_006 · Hoja de cotización imprimible y demo ES completa

Bloque 3. Cierra el bloque 3 del lado del código. SPEC pasa a 1.4 con esta tarea: cinco claves de texto nuevas y la sección 8 detallada. Nada más cambia de alcance.

## 1. Objetivo

Dos cosas, en este orden:

1. La hoja de cotización imprimible de SPEC 8: ruta propia, con la selección en la URL, sin depender del servidor, que impresa desde el navegador da una sola página limpia.
2. La demo ES completa: que `/d/norte` no tenga un solo detalle que delate que se escribió en inglés primero, incluida la hoja nueva y el formato de números.

Al cerrar esta tarea el flujo completo de las dos demos queda listo para grabar video, y lo que queda es pulido (TAREA_007) y landing (TAREA_008).

## 2. Qué existe ya y no se toca

- El motor de precios (`calculatePrice`) y `format.ts` con el formateo de moneda. El motor no se modifica.
- `signLeadTokens` y `signLeadSelection` en `src/verticals/signs/leadTokens.ts`: el único lugar que traduce ids a etiquetas. Esa invariante se mantiene: la hoja nueva no vuelve a buscar por id.
- El preview 3D. No se toca en esta tarea. La hoja imprimible no monta el canvas.
- `insertRow`, `useVisitOnce`, `LeadForm`, `validateLeadForm`. Solo cambia la interfaz del botón de la pantalla de gracias, en la sección 7.
- Las 93 pruebas actuales siguen en verde. Se autoriza editar exactamente una, la 11.15 de TAREA_005, por la decisión del formateo de longitud (sección 9). Ninguna otra se edita.

## 3. Ruta y parámetros

Ruta: `/d/<slug>/quote`. Query con siete claves, en este orden fijo:

```
?t=facade&w=8&h=3&m=pvc&l=none&i=0&q=1
```

- `t` id de tipo, `m` id de material, `l` id de iluminación, `i` instalación (`0` o `1`), `q` cantidad, `w` ancho, `h` alto.
- Los números se serializan con `String(n)`, con punto decimal, siempre igual sin importar el locale del cliente. La URL es canónica, el idioma vive en el JSON.
- En la URL no va ningún dato personal. Ni nombre, ni contacto, ni nota. La hoja muestra el contacto del negocio, no el del visitante.
- El registro del cliente y el tema se resuelven igual que en `QuotePage`, con los mismos helpers. Nada nuevo.

Validación de los parámetros, sin defaults y sin clamp:

- Si falta cualquiera de las siete claves, es inválido.
- Si `t`, `m` o `l` no existen en las opciones del cliente, es inválido.
- Si `w` o `h` no son números finitos o caen fuera de `[min, max]` de su rango, es inválido. El `step` no se valida: un valor intermedio se acepta y se cotiza tal cual, porque redondearlo en silencio cambiaría el precio que el visitante vio.
- Si `q` no es un entero dentro de `[min, max]`, es inválido.
- Si `i` no es exactamente `0` o `1`, es inválido.
- Inválido significa `ErrorScreen`, la pantalla que ya existe, con su texto fijo. No se recalcula con los defaults del cliente: una hoja con un precio que el visitante nunca configuró es peor que un error.

## 4. Capa core

`src/core/quote/quoteParams.ts`, puro, sin React:

```ts
export function encodeQuoteParams(selection: SignSelection): string          // "t=...&w=...", sin el "?"
export function decodeQuoteParams(options: SignOptions, params: URLSearchParams): SignSelection | null
```

`src/core/quote/quoteDate.ts`, puro:

```ts
export function formatQuoteDate(date: Date, locale: string): string          // Intl, { day: '2-digit', month: '2-digit', year: 'numeric' }
```

`src/core/pricing/format.ts`, agregar al archivo que ya existe:

```ts
export function formatLength(value: number, locale: string): string          // Intl, { maximumFractionDigits: 2 }
```

`src/core/ui/QuoteSheet.tsx`, presentacional, sin estado, sin fetch, sin `three`:

```ts
export type QuoteSheetRow = { label: string; value: string }

type QuoteSheetProps = {
  brand: BrandConfig
  texts: ClientTexts
  locale: string
  currency: CurrencyConfig
  rows: QuoteSheetRow[]
  price: PriceResult
  date: string
  poweredBy: boolean
  backHref: string
}
```

Estructura de la hoja, de arriba a abajo:

1. Encabezado: logo, `brand.name`, `brand.phone`, `brand.email`, y a la derecha `quoteDateLabel` con `date`.
2. `quoteTitle` como título de la hoja.
3. `quoteSelectionTitle` y las filas de `rows`, etiqueta y valor.
4. `quoteBreakdownTitle` y las líneas de `price.lines`, con el importe formateado con la moneda del cliente. El descuento se muestra en negativo, como viene.
5. `priceLabel` con `price.total`, y `priceRangeNote` con `price.min` y `price.max`.
6. `quoteValidity` y `disclaimer`.
7. `poweredBy` al pie, solo si `poweredBy` es `true`.
8. Dos controles: botón `quotePrint` que llama a `window.print()`, y enlace `quoteBack` a `backHref`. Los dos con `print:hidden`.

La etiqueta de cada línea del desglose sale de `texts[labelKey]`. Si ese mapeo hoy está escrito adentro del componente del desglose, se extrae a una función pura en core y la usan los dos. No se duplica la lógica en dos lugares.

`src/core/ui/useHtmlLang.ts`: hook que en un `useEffect` con `[locale]` escribe `document.documentElement.lang`. Lo llaman `QuotePage` y `QuoteSheetPage`.

## 5. Capa vertical

`src/verticals/signs/quoteRows.ts`:

```ts
export function signQuoteRows(config: ClientConfig, selection: SignSelection): QuoteSheetRow[]
```

Siete filas, en este orden: `typeLabel`, `widthLabel`, `heightLabel`, `materialLabel`, `lightingLabel`, `installationLabel`, `quantityLabel`.

- Las tres etiquetas de id (tipo, material, iluminación) salen de `signLeadTokens`. No se busca por id acá.
- Ancho y alto: `formatLength(valor, config.locale)` más un espacio y `config.units.length`.
- Instalación: `installationYes` o `installationNo`.
- Cantidad: el número tal cual.
- Si un id no existe, lanza con el id en el mensaje, porque lo hace `signLeadTokens`.

## 6. Página

`src/pages/QuoteSheetPage.tsx`. El nombre es distinto de `QuotePage` a propósito: `QuotePage` es el cotizador, `QuoteSheetPage` es la hoja.

- Toma `slug` de la ruta y la query con `useSearchParams`.
- Slug inexistente, `decodeQuoteParams` en `null`, o `calculatePrice` que lanza: `ErrorScreen`. El `calculatePrice` va adentro de un `try`.
- Aplica el tema del cliente con el mismo hook que usa `QuotePage`, para que en pantalla la hoja se vea de la marca.
- La fecha es `new Date()` una sola vez al montar, memoizada, y se formatea con `formatQuoteDate` y el locale del cliente.
- Elige la vertical igual que `QuotePage`, que sigue siendo el único lugar que decide vertical junto con esta página.
- No llama a `useVisitOnce` ni a `insertRow`. La hoja no escribe nada, ni lead ni visita.

Ruta nueva en el router, al lado de `/d/:slug`, sin romperla. El rewrite de SPA de `vercel.json` ya cubre la ruta nueva.

## 7. Wiring desde el flujo del lead

Hoy `LeadSection` recibe `onViewQuote?: () => void` y `ThanksScreen` muestra el botón si llega. Cambia a un enlace:

- `LeadSection` y `ThanksScreen` reciben `quoteHref?: string` en lugar de `onViewQuote`.
- `ThanksScreen` lo renderiza como `<a href={quoteHref} target="_blank" rel="noopener noreferrer">` con el texto `viewQuote`, con el mismo estilo de botón que ya tiene.
- `QuotePage` arma el href con `` `/d/${config.slug}/quote?${encodeQuoteParams(selection)}` `` y lo pasa siempre.
- Nada de `window.open`: el enlace nativo no lo bloquea el navegador y se puede abrir en pestaña nueva con el gesto del usuario.
- La hoja se llega desde la pantalla de gracias, como dice SPEC 7.4. No se agregan otras entradas.

## 8. Estilos de impresión

- En `src/index.css`, un bloque `@media print` con `@page { size: A4; margin: 14mm; }`, fondo blanco, texto negro, sin sombras.
- En el componente, las variantes `print:` de Tailwind para ocultar los dos controles y para pasar a tipografía y bordes de papel.
- Sin librerías de PDF. La exportación la hace el navegador.
- Una sola página en el peor caso: tótem, acrílico, retroiluminado, con instalación, cantidad 10. Ahí el desglose tiene cinco líneas, que es el máximo.
- El logo se imprime. Si el fondo oscuro de la marca arruina la impresión, se imprime el logo sobre blanco, no se cambia el logo.

## 9. Demo ES completa

- `formatLength` con el locale del cliente: `/d/norte` muestra `2,5 m` con coma, no `2.5 m`. Esto también cambia el mensaje de WhatsApp, que pasa a decir `2,5 x 1 m`. Es correcto y es el motivo por el que se autoriza editar la prueba 11.15 de TAREA_005.
- `document.documentElement.lang` queda en `es-AR` en `/d/norte` y en `en` en `/d/northline`.
- Barrido de textos: recorrer `/d/norte` en los cinco estados (inicial, formulario, enviando, gracias, hoja de cotización) y listar cada string visible con la clave del JSON de donde sale. El único texto en inglés esperado es `poweredBy`, que es el nombre del producto. Si aparece otro, es un hallazgo y se reporta.
- `prices_placeholder` sigue siendo un dato del JSON y no se muestra en pantalla en ningún estado, tampoco en la hoja.

## 10. Claves de texto nuevas

Cinco claves, de 35 a 40. Van en `ClientTexts` de `src/core/types.ts`, en la lista de claves del validador de runtime de TAREA_001 y en los dos JSON.

| Clave | northline | norte |
|---|---|---|
| `quoteDateLabel` | Date | Fecha |
| `quoteSelectionTitle` | Your sign | Tu cartel |
| `quoteBreakdownTitle` | Price breakdown | Detalle del precio |
| `quotePrint` | Print or save as PDF | Imprimir o guardar en PDF |
| `quoteBack` | Back to the configurator | Volver al cotizador |

SPEC 10 ya se actualizó a 1.4 con estas cinco claves y con el detalle de la sección 8. Si algo del código contradice SPEC 1.4, se frena y se reporta.

## 11. Limpieza de guiones largos en docs/comercial/

El grep de G5 de TAREA_005 encontró nueve guiones largos en `docs/comercial/UPWORK.md` (ocho) y `docs/comercial/README.md` (uno), de prosa escrita a mano. `docs/` sigue entero en el alcance de G5, así que se limpian acá, una sola vez.

- Cada guión largo se reemplaza por coma, dos puntos, paréntesis o punto, el que mejor quede.
- No se reescribe la frase ni se cambia una palabra. Solo el signo.
- Reportar las nueve líneas, antes y después.

## 12. Reglas

- Nada de parches. Si algo pide un workaround, frenar y reportar sin commitear.
- Si algo contradice SPEC 1.4, frenar y reportar.
- Sin guiones largos en ningún archivo.
- Sin `any`, sin `as` para tapar un tipo, sin `@ts-expect-error`.
- Sin dependencias nuevas. Sin librerías de PDF.
- Ni un string de UI hardcodeado, con la única excepción que ya existe (`ErrorScreen`).
- `src/core` no importa nada de `src/verticals` ni de `src/clients`, y no importa `three` ni `@react-three/*`.
- `src/core/pricing` sigue sin importar nada de datos ni de React. `Intl` está permitido: ya está ahí para la moneda.
- `src/core/data` sigue siendo el único lugar de core que lee `import.meta.env`.
- La hoja no escribe en Supabase. Ni lead, ni visita, ni nada.
- Tres capas: agregar un cliente sigue siendo agregar un JSON y un logo.

## 13. Tests

Entorno node, solo `src/**/*.test.ts`. Sin tests de componentes. Cada test nuevo comentado con su número de esta sección.

`quoteParams.test.ts`:

1. `encodeQuoteParams` devuelve las siete claves en el orden `t,w,h,m,l,i,q`, con `i` en `0` o `1` según el booleano.
2. Ida y vuelta: `decodeQuoteParams(options, new URLSearchParams(encodeQuoteParams(sel)))` devuelve `sel` para la selección por defecto de los dos clientes y para una con decimales.
3. Devuelve `null` si falta cualquiera de las siete claves, una por una.
4. Devuelve `null` con un id de tipo, de material o de iluminación que no existe.
5. Devuelve `null` con `w` o `h` fuera de rango, no numérico, vacío o `NaN`.
6. Acepta `w` y `h` exactamente en `min` y en `max`.
7. Devuelve `null` con `q` en 0, en `max + 1`, con decimales, y con `i` en `2` o en `true`.
8. Acepta un ancho entre dos pasos del slider (por ejemplo 8.3 en northline) y lo devuelve tal cual.

`quoteDate.test.ts`:

9. `formatQuoteDate` con `new Date(Date.UTC(2026, 8, 11))` da `09/11/2026` en `en` y `11/09/2026` en `es-AR`.

`format.test.ts` (el archivo ya existe, se le agregan casos):

10. `formatLength`: `8` da `8` y `8.5` da `8.5` en `en`; `2.5` da `2,5` y `1` da `1` en `es-AR`.

`quoteRows.test.ts`:

11. `signQuoteRows` con northline: siete filas, en el orden de la sección 5, con las etiquetas del JSON y los valores esperados, incluido `8 ft` y `Yes, install it for me`.
12. El mismo con norte: `2,5 m`, `1 m`, `PVC espumado`, `Sin luz`, `No, lo instalo yo`.
13. Lanza con un id de material inexistente, con el id en el mensaje.

Desglose e i18n:

14. La función de etiqueta de línea devuelve el texto correcto para los cinco `labelKey` y lanza o devuelve la clave cruda (elegir una y documentarla) con una clave desconocida.
15. Con cantidad 1 no hay línea de descuento; con cantidad 5 hay cinco líneas y el importe del descuento es negativo.
16. Los dos JSON tienen exactamente el mismo conjunto de claves de `texts`, son 40, y ninguna está vacía ni tiene espacios solamente.
17. El validador de runtime rechaza una config a la que le falta cada una de las cinco claves nuevas.

Total esperado: entre 110 y 120 según cómo se agrupen los casos. Reportar el número exacto y confirmar que las 93 previas siguen en verde, con la única excepción de la 11.15 editada.

## 14. Criterios de aceptación

1. G1: `npm run build` en verde y sin warnings. Reportar los dos chunks: la app por debajo de 500 kB sin comprimir y el vendor 3D sin moverse.
2. G2: `npx tsc -b --force` con 0 errores.
3. G3: `npm run lint` y `npx oxlint --deny-warnings`, los dos sin hallazgos.
4. G4: `npm test` en verde, con las 93 previas intactas salvo la 11.15, y las nuevas mapeadas una a una.
5. G5: sin guiones largos, con el grep unicode de TAREA_002, sobre `src`, `docs` entero, `SPEC.md`, `CLAUDE.md` y `.env.example`. Tiene que dar cero, incluido `docs/comercial/`.
6. G6: sin parches. Cada decisión que hubo que tomar queda en docs/DECISIONES.md.
7. Flujo completo en `/d/northline`: configurar, enviar el formulario, llegar a gracias, tocar el botón de ver cotización. Reportar la URL completa que se abre y confirmar que el total, el rango y las siete filas coinciden con lo que mostraba el cotizador.
8. El mismo flujo en `/d/norte`, con `2,5 x 1 m` con coma, pesos con punto de miles, y todos los textos en español.
9. Imprimir a PDF en los dos clientes, en el peor caso (tótem, acrílico, retroiluminado, con instalación, cantidad 10): reportar la cantidad de páginas, que tiene que ser 1, y confirmar que el botón de imprimir y el enlace de volver no salen impresos.
10. Parámetros inválidos: cuatro casos, sin query, con un id de material inexistente, con `w` fuera de rango y con `q` en 0. Los cuatro dan `ErrorScreen`, sin pantalla en blanco y sin error de JavaScript en consola.
11. La hoja no escribe: en el panel de red, 0 POST a `leads` y 0 POST a `visits` al cargar `/d/<slug>/quote`, al imprimir y al volver. Reportar los cuatro conteos.
12. Ir del cotizador a la hoja no pierde el estado: la pestaña del cotizador sigue en gracias y la hoja abre en pestaña nueva, con `target="_blank"` y `rel="noopener noreferrer"`.
13. Mobile 390 x 844 en la hoja: sin scroll horizontal, el botón de imprimir con al menos 44 px de alto, y el desglose legible sin zoom.
14. Barrido ES de la sección 9: la lista de strings visibles de `/d/norte` en los cinco estados con su clave de origen. Único texto en inglés aceptado: `poweredBy`. Más `document.documentElement.lang` en `es-AR` en `/d/norte` y en `en` en `/d/northline`.
15. Consola limpia en las dos demos, cotizador y hoja: cero errores propios. En la hoja no tiene que aparecer el warning de `THREE.Clock`, porque no se monta el canvas. Reportar aparte, sin exigir nada, si el chunk del vendor 3D se descarga igual en la ruta de la hoja.
16. Los greps: `grep -rn "verticals\|clients" src/core` devuelve cero, `grep -rn "three\|@react-three" src/core` devuelve cero, `grep -rn "supabase\|fetch" src/core/pricing` devuelve cero, `grep -rn "insertRow\|useVisitOnce" src/pages/QuoteSheetPage.tsx` devuelve cero, y `git check-ignore -v .env.local .vercel` confirma que los dos están ignorados. El grep de claves, ahora exigiendo payload, tiene que devolver cero líneas:

```
git ls-files -z | grep -zv -e '^package-lock.json$' -e '^docs/tareas/' | xargs -0 grep -nE "eyJ[A-Za-z0-9_-]{20,}|sb_publishable_[A-Za-z0-9]{10,}|[a-z0-9]{20}\.supabase\.co"
```

17. Tres capas: copiar `northline.json` a `prueba.json` y verificar que `/d/prueba/quote` con la query de su selección por defecto funciona completo sin tocar un `.ts`. Borrar el archivo después y volver a buildear.
18. Commits: tres, en este orden. El de docs de apertura ya existe (lo escribió Canal B). El de código va solo. El de docs de cierre (STATE, DECISIONES, `_ULTIMO.md` a 007) va aparte, después del de código. Más `git push` con el árbol limpio. Si el remoto tiene commits nuevos, rebasar y volver a correr tests y build antes de pushear.
19. Verificación del desvío de TAREA_005: reportar la salida de `git show --stat --oneline 1a8f394 -- docs/ SPEC.md` y de `git status --porcelain`, para dejar escrito dónde quedaron los docs de cierre de TAREA_005. No se reescribe historia ya pusheada.

## 15. Reporte de cierre

Los 19 criterios uno por uno con el comando y el resultado, la lista de archivos creados y modificados, la cantidad de tests nuevos y el total, el tamaño de los dos chunks, la URL completa de la hoja en los dos clientes, la cantidad de páginas de la impresión, la lista del barrido ES, las nueve líneas de `docs/comercial/` antes y después, cualquier desvío con el motivo, y el hash de los commits.
