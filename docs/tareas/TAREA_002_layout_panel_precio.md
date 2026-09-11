# TAREA_002 · Layout core, panel de opciones genérico, precio animado, tema y rutas

Bloque 1 · lunes 14. Depende de TAREA_001 (cerrada).
Referencias: SPEC secciones 4, 5.2, 5.6, 6, 10, 11. docs/EXECUTION.md bloque 1.
Al cerrar esta tarea, Canal C crea el proyecto en Vercel y hace el primer deploy. Por eso el push y el `vercel.json` son parte de la tarea.

## 1. Objetivo

Que `/d/northline` y `/d/norte` sean un cotizador usable, con el panel completo renderizado desde el esquema de la vertical, precio animado con rango y disclaimer, y todo el color y todo el texto saliendo del JSON del cliente. Sin 3D: el preview queda como un componente con la interfaz final y el cuerpo provisorio, para que TAREA_003 le cambie solo el cuerpo.

Nada de Supabase, nada de lead, nada de quote imprimible en esta tarea.

## 2. Lo que ya existe y no se reescribe

- `src/core/types.ts`: todos los tipos del dominio, incluido `ClientTexts` con sus 35 claves y `ColorsConfig` con cinco colores (`bg`, `primary`, `accent`, `text`, `muted`).
- `src/core/pricing/calculatePrice.ts`: `calculatePrice(rules, selection)`. Función pura, no se toca.
- `src/core/pricing/format.ts`: `formatCurrency(value, currency, locale)`. Único lugar donde se formatea plata. Sigue siendo el único.
- `src/core/clientConfig.ts`: `validateClientConfig`, `priceRulesFromClient`, `defaultSelection`.
- `src/clients/index.ts`: `getClient(slug)` y `listClientSlugs()`. Se modifica solo como dice la sección 9.
- `react-router-dom` 7 ya está en `package.json`. No hay dependencias nuevas en esta tarea.

Se reemplazan por completo: `src/App.tsx` y lo que quede del scaffold de Vite dentro de él. `src/index.css` solo se amplía.

## 3. Archivos

Crear:

```
src/core/theme.ts
src/core/theme.test.ts
src/core/ui/panelTypes.ts
src/core/ui/OptionsPanel.tsx
src/core/ui/controls/ChoiceGroup.tsx
src/core/ui/controls/RangeSlider.tsx
src/core/ui/controls/BooleanChoice.tsx
src/core/ui/controls/Stepper.tsx
src/core/ui/AnimatedAmount.tsx
src/core/ui/PriceBar.tsx
src/core/ui/PriceBreakdown.tsx
src/core/ui/QuoteLayout.tsx
src/core/pricing/lineLabels.ts
src/core/pricing/lineLabels.test.ts
src/verticals/signs/fields.ts
src/verticals/signs/fields.test.ts
src/verticals/signs/SignPreview.tsx
src/pages/QuotePage.tsx
src/pages/IndexPage.tsx
src/pages/ErrorScreen.tsx
vercel.json
```

Modificar: `src/App.tsx`, `src/main.tsx` si hace falta, `src/index.css`, `src/clients/index.ts`, `index.html`, `docs/STATE.md`, `docs/DECISIONES.md`, `docs/tareas/_ULTIMO.md`.

Borrar: `AGENTS.md` (está sin commitear y duplica CLAUDE.md; la fuente única es CLAUDE.md).

## 4. Tema desde el JSON

`src/core/theme.ts`:

```ts
export function themeFromClient(config: ClientConfig): Record<string, string>
```

Devuelve exactamente cinco variables CSS: `--q-bg`, `--q-primary`, `--q-accent`, `--q-text`, `--q-muted`, con los valores de `config.brand.colors`. Función pura, sin React.

Reglas:

- El objeto se aplica una sola vez, en el `style` del contenedor raíz de la página del cliente.
- Todo color de la UI se escribe como valor arbitrario de Tailwind sobre esas variables, por ejemplo `bg-[var(--q-bg)]`, `text-[var(--q-text)]`, `border-[var(--q-accent)]`.
- Prohibido armar nombres de clase por concatenación o con template strings. Tailwind v4 no ve esas clases y el color se pierde en producción.
- Prohibido un color hexadecimal escrito en un componente. Las opacidades y sombras neutras (negro o blanco con alpha) son la única excepción y van en `src/index.css` como utilidades o en clases de Tailwind estándar.

## 5. Layout (SPEC 4.1)

`src/core/ui/QuoteLayout.tsx` recibe props y no conoce ninguna vertical: `{ config, preview, panel, price }` donde `preview`, `panel` y `price` son `ReactNode`.

- Encabezado: logo (`img` con `src=brand.logo` y `alt=brand.name`), `brand.name`, `texts.headline` y `texts.subheadline`.
- Desktop, 1024 px o más: dos columnas. Izquierda el preview, mínimo 55% del ancho. Derecha el panel con scroll propio y el bloque de precio pegado al pie de esa columna (`sticky`).
- Menos de 1024 px: una columna. Preview arriba con relación de aspecto fija 16/9, panel debajo, bloque de precio fijo al pie de la ventana con `position: fixed`.
- En mobile el contenedor del panel lleva padding inferior suficiente para que la barra de precio nunca tape el último control. Sumar `env(safe-area-inset-bottom)`.
- Pie: `texts.poweredBy` solo si `config.poweredBy` es `true`.
- Fondo `--q-bg`, texto `--q-text`, acento `--q-accent` en los estados activos.

Pulido fino de tipografía y espaciado es TAREA_007. Acá alcanza con que se vea ordenado y sin defectos.

## 6. Panel de opciones genérico

Esta es la parte que define si la arquitectura queda bien. El core no puede saber que existen materiales, iluminación ni carteles.

`src/core/ui/panelTypes.ts`:

```ts
import type { ClientTexts } from '../types'

export type SelectionValue = string | number | boolean

export type FieldControl =
  | { kind: 'choice'; choices: { id: string; label: string }[] }
  | { kind: 'range'; min: number; max: number; step: number; unit: string }
  | { kind: 'boolean'; trueLabel: string; falseLabel: string }
  | { kind: 'stepper'; min: number; max: number; step: number }

export type PanelField = {
  id: string
  labelKey: keyof ClientTexts
  control: FieldControl
}
```

`src/core/ui/OptionsPanel.tsx`:

```ts
type OptionsPanelProps = {
  title: string
  fields: PanelField[]
  values: Record<string, SelectionValue>
  texts: ClientTexts
  onChange: (fieldId: string, value: SelectionValue) => void
}
```

- Renderiza los campos en el orden recibido. Para cada uno muestra `texts[field.labelKey]` como título y despacha por `control.kind` a uno de los cuatro controles.
- `choice`: botones, uno por opción, con el `label` que viene en el descriptor. El activo se marca con el acento.
- `range`: `input type="range"` con `min`, `max`, `step`, y el valor actual mostrado al lado con su unidad (`control.unit`, que viene del JSON: `ft` o `m`).
- `boolean`: dos botones con `trueLabel` y `falseLabel`.
- `stepper`: botón menos, valor, botón más, con los límites respetados. Los botones se deshabilitan en los extremos.
- `OptionsPanel` no importa nada de `src/verticals` ni de `src/clients`. Si necesita un texto, lo busca en `texts` por la clave del descriptor.

`src/verticals/signs/fields.ts`:

```ts
export function signFields(config: ClientConfig): PanelField[]
export function valuesFromSelection(selection: SignSelection): Record<string, SelectionValue>
export function selectionFromValues(values: Record<string, SelectionValue>): SignSelection
```

- Los `id` de los campos son los mismos nombres que las claves de `SignSelection`: `type`, `width`, `height`, `materialId`, `lightingId`, `installation`, `quantity`. Así los dos adaptadores son directos.
- Orden de los campos, igual a la tabla de SPEC 5.2: tipo, ancho, alto, material, iluminación, instalación, cantidad.
- `labelKey` de cada uno: `typeLabel`, `widthLabel`, `heightLabel`, `materialLabel`, `lightingLabel`, `installationLabel`, `quantityLabel`.
- Los `label` de las opciones de `choice` salen de `config.options` (ahí viven los nombres de materiales y de tipos). Los textos de `installation` salen de `texts.installationYes` y `texts.installationNo`. El `unit` de los sliders sale de `config.units.length`.
- `stepper` de cantidad: `min` y `max` de `config.options.quantity`, `step` 1.
- `selectionFromValues` lanza un error claro si falta un campo o si el tipo no es el esperado. No devuelve una selección a medias.
- Las tres funciones son puras, sin React.

## 7. Precio

`src/core/ui/AnimatedAmount.tsx`: recibe `{ value, currency, locale }` y anima el número entre el valor anterior y el nuevo con Framer Motion, alrededor de 350 ms, con salida suave. Formatea siempre con `formatCurrency`. Nunca muestra `NaN` ni un número sin formatear. Si el usuario tiene `prefers-reduced-motion`, el valor cambia de golpe.

`src/core/ui/PriceBar.tsx`: recibe `{ result, config }` y muestra

- `texts.priceLabel` y el total con `AnimatedAmount`.
- El rango `min` a `max` formateado, con `texts.priceRangeNote`.
- `texts.disclaimer`, siempre visible, sin acordeón (SPEC 5.6).

`src/core/ui/PriceBreakdown.tsx`: lista las `lines` de `PriceResult`. Cada línea muestra su etiqueta resuelta, el `detail` tal como viene y el importe formateado. El descuento se muestra en negativo. Arriba de la lista, el `area` con la unidad de área del cliente.

`src/core/pricing/lineLabels.ts`:

```ts
export function resolveLineLabel(labelKey: string, texts: ClientTexts): string
```

Devuelve el texto o lanza si la clave no existe en `texts`. Pura, sin React. Es el puente entre el `labelKey` que emite el motor y las claves de `texts`.

## 8. Rutas

`src/App.tsx` con `BrowserRouter`:

- `/` → `IndexPage`: página mínima y temporal con un link por cada slug de `listClientSlugs()`. La landing real es TAREA_008. Sirve para verificar el deploy.
- `/d/:slug` → `QuotePage`.
- `*` → `ErrorScreen`.

`QuotePage`:

1. Lee `slug` de la URL y llama `getClient(slug)`. Si devuelve `null`, muestra `ErrorScreen` con el slug pedido.
2. Si `config.vertical !== 'signs'`, muestra `ErrorScreen`. Es el único lugar del proyecto que decide vertical.
3. Envuelve `validateClientConfig` y el armado en un `try`. Si algo lanza, muestra `ErrorScreen` con el mensaje del error. Nunca se renderiza el cotizador a medias (SPEC 10).
4. Estado: un `Record<string, SelectionValue>` inicializado con `valuesFromSelection(defaultSelection(config))`.
5. En cada render calcula `selectionFromValues(values)` y `calculatePrice(priceRulesFromClient(config), selection)`. Sin `useEffect`, sin debounce, sin estado derivado duplicado.
6. Pone `document.title` con `brand.name` en un efecto.
7. Compone `QuoteLayout` con `SignPreview`, `OptionsPanel` y `PriceBar` más `PriceBreakdown`.

`ErrorScreen` es la única pantalla con texto fijo en el código, porque justamente aparece cuando no hay JSON de cliente válido del que sacar texto. Texto en inglés, corto, sin marca. Queda registrado en docs/DECISIONES.md como la única excepción a la regla de cero strings hardcodeados.

`src/verticals/signs/SignPreview.tsx`: interfaz final `{ selection, theme }`, donde `theme` es lo que devuelve `themeFromClient`. Cuerpo provisorio: un bloque con la relación de aspecto del layout, fondo `--q-primary`, y una caja centrada cuyo ancho y alto relativos siguen `selection.width` y `selection.height` normalizados contra el máximo del rango. Sin `three`, sin `@react-three/fiber` en esta tarea. TAREA_003 reemplaza el cuerpo sin tocar la interfaz.

## 9. Registro de clientes sin tocar código

Hoy agregar un cliente pide agregar una línea en `src/clients/index.ts`. Eso contradice el principio 2 de SPEC. Se corrige acá.

- `src/clients/index.ts` descubre los JSON con `import.meta.glob('./*.json', { eager: true })` y arma el registro con el nombre de archivo sin extensión como slug.
- Si el `slug` de adentro del JSON no coincide con el nombre del archivo, se lanza un error con los dos valores en el mensaje.
- `getClient` y `listClientSlugs` conservan su firma y su comportamiento actual, incluida la caché de configs ya validadas.
- `listClientSlugs()` devuelve los slugs ordenados alfabéticamente, para que el índice sea estable.

## 10. Deploy estático

`vercel.json` en la raíz:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Sin esto, `/d/northline` por URL directa devuelve 404 en Vercel. Verificar con `npm run build && npm run preview` que la URL directa funciona.

`index.html`: `lang="en"`, `title` "Lokebox Quote", `meta viewport` con `width=device-width, initial-scale=1`, `meta name="color-scheme" content="dark"`. Sin fuentes externas ni analytics.

## 11. Accesibilidad y mobile

- Todo control es alcanzable por teclado y tiene estado de foco visible.
- Los grupos de botones usan `aria-pressed` en el activo. Los sliders y el stepper tienen `aria-label` tomado de `texts`.
- Objetivos táctiles de 44 px o más.
- Objetivo de revisión: 390 px, 768 px y 1440 px.

## 12. Tests

Vitest corre con entorno node y solo toma `src/**/*.test.ts`. Nada de tests de componentes en esta tarea.

`src/verticals/signs/fields.test.ts`:

1. `signFields(northline)` devuelve siete campos, en el orden de SPEC 5.2, con los `id` y `labelKey` de la sección 6.
2. Los `kind` son: choice, range, range, choice, choice, boolean, stepper.
3. El campo de tipo tiene dos opciones, material tres, iluminación tres.
4. Ancho de northline: min 2, max 20, step 0.5, unit `ft`. De norte: unit `m` y los valores de su JSON.
5. Las etiquetas de material de norte están en español y las de northline en inglés.
6. `selectionFromValues(valuesFromSelection(defaultSelection(config)))` es igual a `defaultSelection(config)`, para los dos clientes.
7. `selectionFromValues` lanza si falta `quantity` y lanza si `width` llega como string.

`src/core/theme.test.ts`:

8. `themeFromClient` devuelve las cinco variables con los valores del JSON, para los dos clientes.

`src/core/pricing/lineLabels.test.ts`:

9. Para los dos clientes, con una selección que active todas las líneas (totem, con luz, con instalación, cantidad 5), cada `labelKey` de `calculatePrice` resuelve a un texto no vacío.
10. `resolveLineLabel` lanza con una clave inexistente.

Los 42 tests de TAREA_001 siguen en verde y no se editan.

## 13. Reglas

- Nada de parches. Si algo pide un workaround, frenar y reportar sin commitear.
- Si algo de esta tarea contradice SPEC.md, frenar y reportar. No resolver por cuenta propia.
- Sin guiones largos en ningún archivo.
- Sin `any`. Sin `as` para tapar un tipo.
- Sin dependencias nuevas.
- Cero strings de UI en el código, con la única excepción de `ErrorScreen`.
- `src/core` no importa nada de `src/verticals` ni de `src/clients`.

## 14. Criterios de aceptación

1. G1: `npm run build` en verde, sin warnings.
2. G2: `npx tsc -b --force` con 0 errores.
3. G3: `npm run lint` sin hallazgos, y también `npx oxlint --deny-warnings`.
4. G4: `npm test` en verde, con los 42 tests previos más los nuevos de las secciones 12.1 a 12.10.
5. G5: sin guiones largos en ningún archivo nuevo o editado (verificado con grep unicode).
6. G6: sin parches ni workarounds. Si hubo que decidir algo, está en docs/DECISIONES.md.
7. `/d/northline` y `/d/norte` renderizan encabezado, los siete campos, precio, rango, disclaimer y desglose, cada uno en su idioma, su unidad y su moneda.
8. Cambiar cualquier control actualiza total, rango y desglose en el mismo frame. Sin debounce, sin recarga, sin parpadeo.
9. El contador anima entre dos valores y nunca muestra `NaN` ni un número sin formato.
10. `/` lista los dos clientes y los links abren. `/d/inexistente` muestra `ErrorScreen`, no el cotizador a medias.
11. En 390 px no hay scroll horizontal ni solapamientos, y la barra de precio no tapa el último control del panel.
12. Copiar `src/clients/northline.json` a `src/clients/demo.json` con `"slug": "demo"` y su carpeta de logo alcanza para que `/d/demo` funcione sin editar ningún `.ts`. Verificarlo y después borrar los dos archivos de prueba.
13. `vercel.json` está en la raíz y `npm run build && npm run preview` sirve `/d/northline` por URL directa.
14. `grep -rn "verticals\|clients" src/core` no devuelve ningún import.
15. `AGENTS.md` borrado.
16. docs/STATE.md y docs/tareas/_ULTIMO.md actualizados (`_ULTIMO.md` a 003), commit de docs separado del commit de código, y `git push -u origin main` hecho con el árbol limpio. Si el push falla por credenciales, no insistir: reportarlo para que lo haga Joaquín.

## 15. Reporte de cierre

Al terminar, informar: los 16 criterios uno por uno con el comando y el resultado, la lista de archivos creados y modificados, los tests nuevos con su cantidad, cualquier desvío respecto de esta tarea con el motivo, y el hash de los commits.
