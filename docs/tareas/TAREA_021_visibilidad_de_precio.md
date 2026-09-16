# TAREA_021 · Etapa 1 de la visibilidad de precio

Bloque 7, jueves 17. Va despues de TAREA_020.

Prerrequisito: docs/STATE.md, docs/tareas/INDICE.md, CLAUDE.md, y SPEC 6.1, 6.2, 8, 9, 10 y 13 (version 1.20).

Prerrequisito de Canal C, ya hecho: la tabla `public.leads` tiene la columna `lines` jsonb. No se crea ni se migra desde el codigo.

## Contexto

D30 parte la seccion 6.2 en dos etapas. Esta es la primera: presentacion y persistencia.
Entran `exact`, `range` y `hidden`, la columna `lines` del lead y la plantilla de brief sin
precio de la hoja. `gated`, `internal` y `?view=owner` quedan para despues del viernes.

El viernes 18 la demo sale a 40 carteleros. El video de 30 segundos y las 21 capturas ya
estan grabados contra el bloque de precio actual, asi que `range` no puede cambiar de forma.

## Alcance

### 1. Tipos y validacion

- `src/core/types.ts`: suma `PriceDisplay` (`exact | range | gated | hidden | internal`) y
  `pricing?: { display: PriceDisplay }` en `ClientConfig`.
- `src/core/clientConfig.ts`: valida el objeto. Sin `pricing`, o con `pricing` y sin
  `display`, vale `range`. `exact`, `range` y `hidden` pasan. `gated` e `internal` fallan con
  un mensaje que nombra el valor y dice que no esta implementado todavia. Cualquier otro
  valor falla nombrandolo.
- Un solo lugar resuelve el default: `priceDisplayOf(config)`, exportado de
  `src/core/clientConfig.ts`.
- Los dos JSON de `src/clients` no se editan.

### 2. Lead

- `src/core/lead/leadRow.ts`: la fila suma `lines: input.result.lines`, con las columnas de
  SPEC 9. Nada mas del flujo cambia: el insert sigue siendo el fetch contra PostgREST de
  `src/core/data/insertRow.ts` y sigue sin bloquear al visitante.
- El lead guarda el desglose en los tres modos y en los dos canales: ningun modo cambia lo
  que se persiste.

### 3. Presentacion por modo

- El modo se lee del config una sola vez, en `src/pages/QuotePage.tsx`, y baja como prop.
  Sin contexto y sin estado global.
- `src/core/ui/PriceBar.tsx` recibe el modo: `range` es el bloque actual (estimado animado,
  linea de rango con `priceRangeNote`, disclaimer) y `exact` es el mismo bloque sin la linea
  de rango. El disclaimer va en los dos, por 5.6.
- `hidden` saca del cotizador el bloque de precio entero, incluida la barra fija de mobile, y
  el desglose de `src/core/ui/PriceBreakdown.tsx`.
- `src/core/ui/QuoteLayout.tsx` deja de reservar el alto de la barra cuando no hay barra: el
  relleno inferior de mobile sale de la altura medida en `--q-price-h`, asi que sin barra no
  puede quedar ni aire muerto ni corte. Verificado en captura a 1440 y a 390, con el CTA a la
  vista.

### 4. Mensaje de WhatsApp en hidden

- Dos claves de texto nuevas y opcionales en `ClientTexts`: `whatsappMessageHidden` y
  `whatsappMessageHiddenLetters`, con los mismos placeholders que sus pares menos `{min}` y
  `{max}`.
- Condicionales como `anchorGround` del totem: si `pricing.display` es `hidden` y el `cta`
  del cliente es `whatsapp` o `both`, la validacion las exige y falla nombrando la clave que
  falta.
- Las 46 claves requeridas de SPEC 10 no cambian, y los dos JSON de la demo no traen las
  nuevas.
- En `hidden` el mensaje no lleva ninguna cifra de precio: los tokens `{min}` y `{max}` no se
  arman.

### 5. Hoja

- `src/core/ui/QuoteSheet.tsx` renderiza la plantilla de brief sin precio de SPEC 8 cuando el
  modo es `hidden`: marca, seleccion, fecha, validez y disclaimer, sin desglose, sin total y
  sin rango, en una pagina.
- Las claves de la query no cambian y la hoja sigue sin escribir nada.
- La entrada sigue siendo la pantalla de gracias, con un solo camino (D29).

### 6. Landing

- `src/landing/landing.json`: `brand.name` pasa a "Lokebox Quote Builder" y `texts.footer` a
  "Interactive quote builders for custom products. Built by Lokebox.".
- Nada mas de la landing cambia: la paleta espera la identidad visual (D18) y no se toca.

### 7. Capturas

- `npm run capturas` rehace el set de 21.
- Mas capturas de verificacion de `exact` y de `hidden`, a 1440 y a 390. Para esas dos se
  edita temporalmente un JSON de cliente en local, se saca la captura y se revierte antes del
  commit: `git status` queda limpio de ese cambio y el JSON commiteado no trae la clave.

## Archivos

- `src/core/types.ts`, `src/core/clientConfig.ts` y su test
- `src/core/lead/leadRow.ts` y su test
- `src/core/ui/PriceBar.tsx`, `src/core/ui/PriceBreakdown.tsx`, `src/core/ui/QuoteLayout.tsx`,
  `src/core/ui/QuoteSheet.tsx`
- `src/pages/QuotePage.tsx`, `src/pages/QuoteSheetPage.tsx`
- `src/verticals/signs/leadTokens.ts` y su test
- `src/landing/landing.json`, `src/landing/landingConfig.test.ts`
- `SPEC.md` (1.20), `docs/EXECUTION.md`, `docs/DECISIONES.md`, `docs/tareas/INDICE.md`,
  `docs/comercial/UPWORK.md`, `docs/comercial/PRICING.md`,
  `docs/comercial/CATALOG_LISTING.md`

## Criterios de aceptacion

1. G1 a G6.
2. Topes de bundle por grupo de SPEC 3, con los tres numeros anotados. `/` sigue sin pedir el vendor 3D.
3. Sin editar los JSON de la demo, las dos demos sirven `range` y su bloque de precio se ve igual que hoy, comparado contra el set anterior de `validacion/`.
4. `exact`: estimado y disclaimer, sin linea de rango, con el desglose intacto.
5. `hidden`: cero precio en el cotizador, ni bloque, ni barra de mobile, ni desglose. Ningun control tapado y CTA a la vista a 1440 y a 390.
6. `gated`, `internal` y un valor desconocido fallan la validacion al cargar con el valor en el mensaje.
7. El lead escribe `lines` con el desglose del motor en los tres modos y en los dos canales.
8. En `hidden` el mensaje de WhatsApp sale de la plantilla sin precio, sin ningun placeholder sin resolver y sin cifras de precio; si falta la clave, la validacion falla nombrandola.
9. En `hidden` la pantalla de gracias lleva a `/d/<slug>/quote` y la hoja renderiza el brief sin precio en una pagina.
10. La hoja no escribe nada en Supabase en ninguno de los tres modos.
11. `calculatePrice` no cambia: un test verifica que la salida es identica con los tres valores de `display`.
12. Los 223 tests previos no se editan, salvo lo que el contrato nuevo obligue, y cada edicion queda justificada en DECISIONES con su motivo.
13. Capturas de `exact` y `hidden` en `validacion/`, con la edicion temporal revertida.
14. Landing con el nombre y el pie nuevos, `landing-1440.png` rehecha, sin la palabra gratis y sin promesa de prueba (D25).
15. Cero guiones largos en todo archivo nuevo o editado. Cero strings de UI en el codigo.
16. Al cerrar: push y verificacion del deploy repitiendo el curl hasta tres respuestas nuevas seguidas, y STATE.md, DECISIONES.md, INDICE.md y `_ULTIMO.md` (022) actualizados.

## Commits y deploy

1. Docs de apertura: SPEC 1.20, UPWORK, EXECUTION, CATALOG_LISTING y este archivo.
2. Codigo, en el orden de los siete puntos de arriba.
3. Docs de cierre: STATE reescrito, D31 a D36 mas lo que aparezca, INDICE y `_ULTIMO` en 022.

Despues: `git push` a origin/main y verificacion del deploy repitiendo el curl hasta tres
respuestas nuevas seguidas.
