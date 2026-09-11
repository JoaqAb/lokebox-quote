# TAREA_005 · Datos, lead, CTA de WhatsApp, formulario y visitas

Bloque 3 · miércoles 16. Depende de TAREA_004 (cerrada y aceptada, commits 5e0f971 y 43c4d1e) y del prerrequisito de Canal C.
Referencias: SPEC secciones 4.1, 7, 9, 10 y 14 (versión 1.3). docs/EXECUTION.md bloque 3.
Abre el bloque 3. El preview 3D no se toca en esta tarea.

## 0. Prerrequisito de Canal C

La tarea no arranca sin esto, hecho por Joaquín:

- Proyecto de Supabase propio, separado del de Lokebox.
- Tablas `leads` y `visits` con la forma de SPEC 9.
- RLS activo en las dos, con policy de insert para `anon` y sin select, update ni delete.
- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` del repo y en Vercel (production y preview).

Primer paso de la tarea: leer `.env.local` y confirmar que las dos variables existen y que la URL responde. Si no están, frenar y reportar sin escribir código.

## 1. Objetivo

Cerrar el flujo del lead de SPEC 7: el visitante configura, ve el precio, y se va por WhatsApp o por formulario. En los dos casos el negocio se queda con un lead estructurado en Supabase. Además, una visita registrada por carga de `/d/<slug>`.

Cierra cuando en las dos demos se puede completar el flujo entero sin errores visibles, el mensaje de WhatsApp llega armado y legible, el formulario termina en la pantalla de gracias, y con Supabase apagado el visitante no nota nada.

## 2. Lo que no entra

- Hoja de cotización imprimible. Es TAREA_006. Acá solo queda el enganche.
- Cualquier select, update o delete contra Supabase. El frontend solo inserta.
- Auth, sesiones, usuarios, CRM, email transaccional, webhooks.
- Dependencias nuevas. Ni el SDK de Supabase (decisión del 11/09) ni librerías de formularios ni de validación.
- Claves de texto nuevas. Las 35 de SPEC 10 alcanzan.
- Cambios en el preview 3D, en el motor de precios, en el panel de opciones o en la barra de precio.
- Pulido visual del bloque de CTA. Es TAREA_007.

## 3. Decisiones de Canal B que esta tarea aplica

Las siete están en docs/DECISIONES.md con su motivo. Acá va el qué hacer.

1. Sin SDK de Supabase: `fetch` contra `/rest/v1/<tabla>` con los headers `apikey`, `Authorization: Bearer`, `Content-Type: application/json` y `Prefer: return=minimal`.
2. Sin variables de entorno, el cliente de datos es `null` y los inserts son no-op con un `console.warn` una sola vez, no por llamada.
3. El CTA de WhatsApp abre `wa.me` de forma sincrónica dentro del click. El insert del lead se dispara y no se espera.
4. `selection` guarda ids, etiquetas legibles y unidad.
5. Una visita por sesión y por slug, con clave en `sessionStorage`.
6. El bloque de CTA va al final de la columna del panel, después de `PriceBreakdown`.
7. Los errores de validación no muestran texto: `aria-invalid` y borde de acento.

## 4. Archivos

Crear:

```
src/core/data/config.ts
src/core/data/config.test.ts
src/core/data/insertRow.ts
src/core/data/useVisitOnce.ts
src/core/lead/leadRow.ts
src/core/lead/leadRow.test.ts
src/core/lead/visit.ts
src/core/lead/visit.test.ts
src/core/lead/whatsapp.ts
src/core/lead/whatsapp.test.ts
src/core/lead/validateLeadForm.ts
src/core/lead/validateLeadForm.test.ts
src/core/ui/LeadSection.tsx
src/core/ui/LeadForm.tsx
src/core/ui/ThanksScreen.tsx
src/verticals/signs/leadTokens.ts
src/verticals/signs/leadTokens.test.ts
.env.example
```

Modificar:

```
src/core/types.ts
src/pages/QuotePage.tsx
docs/STATE.md
docs/DECISIONES.md
docs/tareas/_ULTIMO.md
```

`SPEC.md`, `docs/EXECUTION.md` y este archivo ya están escritos por Canal B. No se editan.

`.env.local` no se commitea nunca. Verificar que `.gitignore` ya lo cubre antes del primer commit; si no lo cubre, agregarlo y reportarlo.

## 5. Capa de datos

`src/core/data/config.ts`, puro y testeable:

```ts
export type DataConfig = { url: string; key: string }

export function dataConfigFrom(env: Record<string, string | undefined>): DataConfig | null
export function restUrl(config: DataConfig, table: string): string
export function restHeaders(config: DataConfig): Record<string, string>
```

- `dataConfigFrom` devuelve `null` si falta cualquiera de las dos variables o si alguna viene vacía o con espacios solamente. La URL se normaliza sin barra final.
- `restUrl` da `<url>/rest/v1/<tabla>`.
- `restHeaders` da los cuatro headers de la sección 3.1.
- No lee `import.meta.env` adentro: recibe el objeto. Así el test no necesita entorno de navegador.

`src/core/data/insertRow.ts`:

```ts
export type InsertOutcome = 'ok' | 'skipped' | 'failed'

export function insertRow(table: string, row: Record<string, unknown>): Promise<InsertOutcome>
```

- Toma la config una sola vez, desde `import.meta.env`, en un módulo de nivel superior.
- `skipped` si no hay config, con un `console.warn` la primera vez y nada después.
- `failed` si el fetch rechaza o el status no es 2xx, con `console.error` que incluya tabla y status. Nunca lanza, nunca devuelve el body, nunca toca la pantalla.
- Sin reintentos y sin cola. Un lead perdido es aceptable; un usuario bloqueado no.

## 6. Lead

`src/core/lead/leadRow.ts`, puro:

```ts
export type LeadChannel = 'whatsapp' | 'form'

export type LeadContact = { name: string; value: string; note: string }

export type LeadRowInput = {
  clientSlug: string
  channel: LeadChannel
  selection: Record<string, unknown>   // lo que arma la vertical
  result: PriceResult
  contact?: LeadContact
}

export function buildLeadRow(input: LeadRowInput): Record<string, unknown>
```

- Columnas exactas de SPEC 9: `client_slug`, `channel`, `selection`, `price_total`, `price_min`, `price_max`, `contact_name`, `contact_value`, `note`. `id`, `created_at` y `status` los pone la base.
- Sin contacto (canal `whatsapp`), los tres campos de contacto van en `null`, no en string vacío.
- Los tres campos de texto se recortan con `trim` y se cortan a 500 caracteres.

`src/verticals/signs/leadTokens.ts`, puro, es el único lugar que traduce ids a etiquetas:

```ts
export type SignLeadTokens = Record<
  'type' | 'width' | 'height' | 'unit' | 'material' | 'lighting' | 'installation' | 'quantity' | 'min' | 'max',
  string
>

export function signLeadTokens(config: ClientConfig, selection: SignSelection, result: PriceResult): SignLeadTokens
export function signLeadSelection(config: ClientConfig, selection: SignSelection): Record<string, unknown>
```

- Las etiquetas salen de `options.types`, `options.materials` y `options.lighting`. `installation` sale de `texts.installationYes` y `texts.installationNo`. `unit` sale de `units.length`.
- `min` y `max` se formatean con `src/core/pricing/format.ts`, con el locale y la moneda del cliente.
- Ancho y alto sin decimales cuando son enteros, y con un decimal cuando no.
- Si un id no existe en las opciones, lanza con el id en el mensaje, igual que el motor de precios.
- `signLeadSelection` devuelve los ids, las etiquetas y la unidad: es lo que va a la columna `selection`.

`src/core/lead/whatsapp.ts`, puro:

```ts
export function buildWhatsappMessage(template: string, tokens: Record<string, string>): string
export function whatsappLink(number: string, message: string): string
```

- Reemplaza cada `{clave}` por su valor. Un placeholder sin token en el mapa lanza con la clave en el mensaje: es un error de la config del cliente, no algo que se manda a medias.
- El mismo placeholder puede aparecer más de una vez.
- `whatsappLink` da `https://wa.me/<numero>?text=<encodeURIComponent(mensaje)>`, con el número sin espacios, signos ni guiones.

`src/core/lead/validateLeadForm.ts`, puro:

```ts
export type LeadFormErrors = { name: boolean; contact: boolean }

export function validateLeadForm(values: { name: string; contact: string }): LeadFormErrors
```

- `name` inválido si `trim` queda vacío.
- `contact` inválido si `trim` queda vacío, o si no tiene un `@` con algo a los dos lados, o al menos seis dígitos. Cubre mail y teléfono sin pedir formato.
- `note` nunca es obligatorio.

## 7. UI del lead

`LeadSection.tsx` es el único componente con estado del flujo:

```ts
type LeadSectionProps = {
  cta: 'whatsapp' | 'form' | 'both'
  texts: ClientTexts
  whatsappNumber: string
  whatsappMessage: string           // ya armado por QuotePage
  onSubmitForm: (contact: LeadContact) => Promise<void>
  onWhatsappClick: () => void
  onViewQuote?: () => void
}
```

- Estados: `idle`, `form`, `sending`, `thanks`. No hay estado de error: un insert fallido termina igual en `thanks`, por SPEC 7.3.
- `cta` decide qué botones se ven en `idle`. En `both`, WhatsApp es el botón primario con el color de acento y el formulario es el secundario.
- El botón de WhatsApp es un `<a>` con `href` armado, `target="_blank"` y `rel="noopener noreferrer"`. En el `onClick` llama a `onWhatsappClick` y no previene el default: así el navegador abre la pestaña con el gesto del usuario y el insert queda en vuelo.
- `LeadForm`: tres campos (`formName`, `formContact`, `formNote`), botón `formSubmit`. Al enviar valida con `validateLeadForm`; si hay error, marca los campos con `aria-invalid` y borde de acento y no llama al callback. Si valida, pasa a `sending` (botón deshabilitado con `formSending`), espera `onSubmitForm` y pasa a `thanks` gane o pierda.
- `ThanksScreen`: `thanksTitle`, `thanksBody` y, solo si llega `onViewQuote`, un botón con `viewQuote`.
- Doble submit: el botón deshabilitado en `sending` y un guard que ignora el submit si el estado no es `form`.
- Sin `<form>` con submit nativo si complica: alcanza un botón con `onClick`. Si se usa `<form>`, `onSubmit` con `preventDefault`.

`QuotePage.tsx` es el punto de composición, como hasta ahora:

- Arma `tokens` con `signLeadTokens`, el mensaje con `buildWhatsappMessage(config.texts.whatsappMessage, tokens)` y el link con `whatsappLink`.
- `onWhatsappClick` llama a `insertRow('leads', buildLeadRow({ channel: 'whatsapp', ... }))` sin `await` y con el rechazo atrapado.
- `onSubmitForm` hace el `await` del insert con canal `form` y el contacto del formulario.
- Monta `<LeadSection>` después de `<PriceBreakdown>`, adentro del slot `panel`. `QuoteLayout` y `PriceBar` no se tocan.
- `useVisitOnce(config.slug)` se llama una vez por cliente.

## 8. Visitas

`src/core/lead/visit.ts`, puro:

```ts
export function visitKey(slug: string): string                                  // "lq_visit_<slug>"
export function buildVisitRow(slug: string, userAgent: string, referrer: string): Record<string, unknown>
```

- `user_agent` se corta a 400 caracteres. `referrer` vacío va como `null`.

`src/core/data/useVisitOnce.ts`: hook que en un `useEffect` con `[slug]` lee `sessionStorage`, y si la clave no está, la escribe y dispara el insert sin esperarlo. `sessionStorage` va adentro de un `try`: en modo privado de algunos navegadores lanza, y en ese caso se inserta igual y se sigue. El hook no devuelve nada y no renderiza nada.

## 9. Tipos

`src/core/types.ts`: exportar `ClientTexts` si todavía no está exportado como tipo propio, para que `LeadSection` reciba los textos sin recibir la config entera. Nada más cambia. `ClientConfig` ya tiene `cta`, `brand.whatsapp` y `brand.email`.

## 10. Reglas

- Nada de parches. Si algo pide un workaround, frenar y reportar sin commitear.
- Si algo contradice SPEC 1.3, frenar y reportar.
- Sin guiones largos en ningún archivo.
- Sin `any`, sin `as` para tapar un tipo, sin `@ts-expect-error`.
- Sin dependencias nuevas.
- Cero claves de texto nuevas. Ni un string de UI hardcodeado, con la única excepción que ya existe (`ErrorScreen`).
- `src/core` no importa nada de `src/verticals` ni de `src/clients`, y no importa `three` ni `@react-three/*`.
- `src/core/pricing` sigue sin importar nada de datos ni de React.
- La anon key no se escribe en ningún archivo commiteado. `.env.example` lleva las dos claves con valor vacío.

## 11. Tests

Entorno node, solo `src/**/*.test.ts`. Sin tests de componentes. Los 76 previos siguen en verde y no se editan. Cada test nuevo va comentado con su número de esta sección.

`config.test.ts`:

1. `dataConfigFrom` devuelve `null` si falta la URL, si falta la key, si alguna viene vacía o si viene con espacios solamente.
2. `dataConfigFrom` normaliza la URL quitando la barra final.
3. `restUrl` da `<url>/rest/v1/leads` con y sin barra final en el origen.
4. `restHeaders` incluye `apikey`, `Authorization` con `Bearer`, `Content-Type` y `Prefer: return=minimal`.

`leadRow.test.ts`:

5. Canal `form`: las nueve columnas de SPEC 9 con los valores esperados, tomando `price_total`, `price_min` y `price_max` del `PriceResult`.
6. Canal `whatsapp` sin contacto: los tres campos de contacto en `null` y ninguna columna de más.
7. `trim` y corte a 500 en nombre, contacto y nota.

`whatsapp.test.ts`:

8. Los diez placeholders de SPEC 10 reemplazados en la plantilla real de `northline.json`, y el mismo placeholder repetido se reemplaza dos veces.
9. Un placeholder sin token lanza con la clave en el mensaje.
10. `whatsappLink` codifica el mensaje y limpia el número: `+54 9 381 555 1234` queda en dígitos.

`validateLeadForm.test.ts`:

11. Nombre vacío o con espacios es inválido.
12. Contacto: mail válido pasa, teléfono con seis dígitos o más pasa, texto sin arroba ni dígitos no pasa, vacío no pasa.

`visit.test.ts`:

13. `visitKey` es `lq_visit_<slug>` y `buildVisitRow` corta el user agent a 400 y manda `referrer` en `null` cuando viene vacío.

`leadTokens.test.ts`:

14. `signLeadTokens` con los dos clientes: etiquetas de tipo, material e iluminación en el idioma del cliente, `unit` correcta, `installation` con la clave que corresponde a cada valor, y `min` y `max` con la moneda del cliente.
15. Ancho y alto: `8` sale `8`, `8.5` sale `8.5`.
16. `signLeadTokens` lanza con un id de material inexistente, con el id en el mensaje.
17. `signLeadSelection` incluye los siete campos de la selección, las tres etiquetas y la unidad.

Total esperado: entre 90 y 96 según cómo se agrupen los casos. Reportar el número exacto.

## 12. Criterios de aceptación

1. G1: `npm run build` en verde y sin warnings. Reportar el tamaño de los dos chunks: la app tiene que seguir por debajo de 500 kB sin comprimir y el vendor 3D no se mueve.
2. G2: `npx tsc -b --force` con 0 errores.
3. G3: `npm run lint` y `npx oxlint --deny-warnings`, los dos sin hallazgos.
4. G4: `npm test` en verde, con los 76 previos intactos y los nuevos mapeados uno a uno.
5. G5: sin guiones largos, con el grep unicode de TAREA_002, sobre `src`, `docs`, `SPEC.md`, `CLAUDE.md` y `.env.example`.
6. G6: sin parches. Cada decisión que hubo que tomar queda en docs/DECISIONES.md.
7. Lead por formulario en `/d/northline`: completar los tres campos, enviar, y reportar el status HTTP del POST a `/rest/v1/leads` tomado del panel de red. Tiene que ser 201. Reportar el body enviado, con la anon key tapada.
8. El mismo lead en `/d/norte`, con los textos en español y el total en pesos.
9. CTA de WhatsApp: reportar el `href` completo del `<a>` en los dos clientes, y el mensaje ya decodificado. Tiene que quedar legible, con tipo, medidas, unidad, material, luz, instalación, cantidad y rango, sin `{}` sueltos y sin `undefined`. Verificar además que el click dispara el POST a `leads` con `channel` en `whatsapp` y que la pestaña de `wa.me` se abre igual (no bloqueada).
10. Visitas: una carga de `/d/northline` inserta una visita con 201. Un refresco en la misma pestaña no inserta nada. Una pestaña nueva inserta otra vez. Ir de `/d/northline` a `/d/norte` en la misma pestaña inserta una visita del segundo slug. Reportar los cuatro casos con la cantidad de POST observados.
11. Supabase caído: renombrar `.env.local`, reiniciar el dev server, y completar el flujo entero en los dos clientes. El visitante llega a la pantalla de gracias, no ve ningún error en pantalla, y en consola queda el warn una sola vez. Repetir con la URL apuntando a un host que no existe: el flujo termina igual y en consola queda un `console.error` con tabla y status. Restaurar `.env.local` al terminar.
12. Validación: enviar el formulario con nombre vacío y con contacto inválido no llama a la base (0 POST) y marca los campos. Reportar los casos probados.
13. Doble submit: dos clicks rápidos en el botón de enviar producen un solo POST.
14. Mobile 390 x 844: el bloque de CTA se alcanza con scroll, no queda tapado por la barra de precio, y los botones tienen al menos 44 px de alto. El formulario no genera scroll horizontal. La pantalla de gracias entra en pantalla sin scroll.
15. Consola limpia en las dos demos durante el flujo entero: cero errores propios. El warning de `THREE.Clock` sigue aceptado como ruido de tercero.
16. Los cinco greps: `grep -rn "verticals\|clients" src/core` devuelve cero, `grep -rn "three\|@react-three" src/core` devuelve cero, `grep -rn "supabase\|fetch" src/core/pricing` devuelve cero, el grep de claves acotado a archivos rastreados no devuelve nada, y `git check-ignore -v .env.local .vercel` confirma que los dos están ignorados en el árbol commiteado. El grep de claves es `git ls-files -z | grep -zv -e '^package-lock.json$' -e '^docs/tareas/' | xargs -0 grep -niE "eyJ|sb_publishable|supabase\.co"`: se excluyen `package-lock.json`, porque los hashes integrity de npm contienen `eyJ` por casualidad, y `docs/tareas/`, porque las tareas escriben el propio patrón del grep (decisión del 11/09). Si el comando devuelve una línea, es un hallazgo real y hay que frenar.
17. La regla de las tres capas sigue en pie: agregar un cliente nuevo con su JSON y su logo alcanza para tener CTA, formulario y visitas funcionando, sin tocar un `.ts`. Verificarlo copiando `northline.json` a un slug de prueba, probando `/d/<slug>` y borrando el archivo después.
18. docs/STATE.md y docs/tareas/_ULTIMO.md actualizados (`_ULTIMO.md` a 006), commit de docs separado del commit de código, y `git push` con el árbol limpio. Si el remoto tiene commits nuevos, rebasar y volver a correr tests y build antes de pushear.

## 13. Reporte de cierre

Los 18 criterios uno por uno con el comando y el resultado, la lista de archivos creados y modificados, la cantidad de tests nuevos y el total, el tamaño de los dos chunks, los dos mensajes de WhatsApp decodificados, el status de cada POST observado, cualquier desvío con el motivo, y el hash de los commits.

Queda para Canal C al cierre: confirmar en el Table Editor de Supabase que las filas de `leads` y `visits` están y se leen bien.
