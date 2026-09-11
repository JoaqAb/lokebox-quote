# STATE

11/09/2026

Bloque 0 cerrado. Bloque 1 cerrado, incluido Canal C: hay URL publica.
Produccion: https://lokebox-quote.vercel.app. Proyecto de Vercel lokebox-quote, con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY como Config en production y preview.
Bloque 2 cerrado: TAREA_003 y TAREA_004 cerradas. El preview 3D esta completo y no se vuelve a tocar hasta TAREA_007.
Bloque 3 en curso: TAREA_005 cerrada. El flujo del lead esta completo de punta a punta contra Supabase real.
Siguiente: TAREA_006, hoja de cotizacion imprimible y demo ES completa.

## Hecho

- TAREA_000: repo creado, scaffold funcionando, docs base. Commit 0f789a0.
- Canal B: SPEC.md 1.0, docs/EXECUTION.md, docs/DECISIONES.md, CLAUDE.md y TAREA_001. Commit bd69e10.
- TAREA_001: tipos del dominio, los dos JSON de cliente, validacion en runtime, motor de precios y formateo de moneda, con 42 tests. Commit 6d83a02.
- Canal B: SPEC.md 1.1, EXECUTION del bloque 1 y TAREA_002. Commit 1b5c4a0.
- TAREA_002: layout core, panel de opciones generico, precio animado, tema por variables CSS, rutas por cliente, registro por descubrimiento de archivos y vercel.json. 52 tests. Commit d435c80. Revisada y aceptada por Canal B contra los 16 criterios, con los seis desvios aceptados y anotados.
- Canal C: proyecto en Vercel e import del repo. Las cuatro URLs verificadas a mano: /, /d/northline, /d/norte y /d/inexistente. Numeros correctos en pantalla en los dos clientes, cada uno con su idioma, su unidad y su moneda.
- Canal B: SPEC.md 1.2 (interfaz del preview con visual, escala en metros, colores derivados del theme, caida sin WebGL, prohibiciones de assets en la vertical 3D), EXECUTION del bloque 2 y TAREA_003. Commit 4b54fa1.
- TAREA_003: escena 3D base de la vertical, mas el fix del padding de la barra en mobile y "strict": true explicito. 63 tests. Commits 4b54fa1 (docs) y 07928b2 (codigo). Revisada y aceptada por Canal B contra los 17 criterios: 14 al pie de la letra y 3 con desvio aceptado (advertencia de tamano de chunk, fps medidos sobre SwiftShader y la barra de precio a mitad de scroll).
- Canal B: SPEC.md 1.3 (presupuesto de bundle, tres modos de luz, bloom fuera del MVP, totem y poste, barrido de camara, degradacion por niveles), EXECUTION del bloque 2 y TAREA_004, mas diez decisiones nuevas. Commit 5e0f971 (era d9568ec antes del rebase).
- Canal C: estrategia comercial y estrategia de Upwork escritas a mano por Joaquin en docs/comercial/. Commits 5f49c7d y f45a871.
- TAREA_004: los tres modos de iluminacion con halo y una sola luz dinamica, totem con poste, barrido de camara, presupuesto de rendimiento en tres niveles, presupuesto de bundle y reequilibrio de la composicion. 76 tests. Commits 5e0f971 (docs) y 43c4d1e (codigo), rebasados sobre los dos commits comerciales. Revisada y aceptada por Canal B contra los 18 criterios: 17 al pie de la letra, el 10 con reporte parcial aceptado (bounding box en pantalla solo en el extremo maximo de cada cliente, que es el unico que puede salirse de cuadro; los cuatro extremos quedan cubiertos por el test 12.5) y el 13 pendiente de medicion con GPU real. Los once desvios aceptados y anotados en DECISIONES.
- Canal B: TAREA_005 escrita, EXECUTION del bloque 3 apuntada al archivo y siete decisiones nuevas. SPEC queda en 1.3: la tarea no cambia alcance. Commit 5bff501.
- Canal C, cerrado: las dos variables quedaron como Config en production y preview, con los valores verificados por hash contra .env.local en los dos entornos. El gate de Supabase dio 200, 200, 201 y 201: las tablas existen y la policy de insert para anon anda.
- TAREA_005: capa de datos sin SDK, lead por WhatsApp y por formulario, validacion, pantalla de gracias y visitas por sesion. 93 tests.

## Estado del codigo

- `src/core`: tipos, motor de precios puro, formateo de moneda, validacion de config, tema por cinco variables CSS, layout, panel generico por descriptores con cuatro controles, precio animado, rango, disclaimer y desglose. No importa nada de verticals ni de clients en codigo de produccion.
- `src/verticals/signs`: `fields.ts` arma los siete descriptores desde el JSON y adapta en las dos direcciones contra `SignSelection`. `visuals.ts` arma el `SignVisual` (visual del material, visual de la luz y factor a metros). `SignPreview.tsx` es el host del canvas con la interfaz `{ selection, visual, theme }`, guarda el nivel de rendimiento y cae a `SignPreviewFallback` si no hay WebGL. `scene/` tiene `sceneGeometry.ts` (todas las medidas, posiciones, colores, tabla de iluminacion y barrido, puro y testeado), `Storefront.tsx`, `SignBoard.tsx` (cartel, poste, halo y luz en un solo useFrame), `SignScene.tsx`, `AutoOrbit.tsx`, `perfTier.ts`, `usePerfTier.ts` y `webgl.ts`.
- `src/clients`: registro por `import.meta.glob` eager. Agregar un cliente es agregar el JSON y el logo, sin tocar un solo `.ts`. Verificado.
- `src/pages`: `QuotePage` es el unico lugar que decide vertical, `IndexPage` es un indice temporal y `ErrorScreen` es la unica pantalla con texto fijo.
- 76 tests en verde: los 63 previos sin tocar y los 13 de la seccion 12 de TAREA_004 mapeados uno a uno.
- Una sola geometria por pieza: caja unitaria para el cartel y para el poste, plano unitario para el halo. Todo se dimensiona con scale y se acomoda con damp en un solo useFrame. Verificado con `renderer.info.memory.geometries`: 6 en frio, 7 cuando el poste se dibuja por primera vez, y estable despues de ir y volver tres veces entre facade y totem.
- Presupuesto de bundle aplicado: chunk de la app 385 kB (123 kB gzip) y chunk del vendor 3D 913 kB (244 kB gzip), los dos adentro de SPEC 3 y sin advertencia en el build.
- `src/core/data`: `config.ts` (puro, recibe el env), `insertRow.ts` (unico punto de escritura, nunca lanza) y `useVisitOnce.ts`. `src/core/lead`: `leadRow.ts`, `whatsapp.ts`, `validateLeadForm.ts` y `visit.ts`, todos puros. `src/core/ui`: `LeadSection.tsx` con los cuatro estados, `LeadForm.tsx` y `ThanksScreen.tsx`. `src/verticals/signs/leadTokens.ts` es el unico lugar que traduce ids a etiquetas.
- 93 tests en verde: los 76 previos sin tocar y los 17 nuevos de la seccion 11 de TAREA_005 mapeados uno a uno.
- Chunk de la app 393 kB (126 kB gzip), vendor 3D sin moverse en 913 kB. Los dos adentro de SPEC 3.
- Sin tocar todavia: quote imprimible y landing real.

## Pendientes menores con destino asignado

- Resuelto en TAREA_003: el padding inferior del panel en mobile se deriva de la altura real de la barra, medida con ResizeObserver sobre el border box y publicada en --q-price-h. Con los dos clientes la barra mide 160 px en 390 px y el padding queda en 192 px.
- Resuelto en TAREA_004: presupuesto de bundle con manualChunks y limite 1000. El build no avisa mas.
- Resuelto en TAREA_004: la vidriera bajo a 0.07 y la direccional subio a 0.8. Medido con luminancia sobre captura: el cartel con el modo none da 0.54 contra 0.28 de la vidriera, en los dos clientes. Antes era al reves.
- Pendiente de Joaquin, sin bloquear el bloque 3: ver las dos demos en un telefono real y confirmar fps con GPU de verdad. Todas las mediciones de fps de los bloques 2 y 3 estan hechas sobre SwiftShader por software.
- El encabezado muestra el logo y al lado repite `brand.name`. Va a TAREA_007.
- El indice de `/` muestra los slugs crudos. Va a TAREA_008, con la landing real.
- Bastante aire abajo en la columna del preview en 1440 px. Va a TAREA_007.

## Canal C, en orden

1. Hecho: proyecto en Vercel y primer deploy.
2. Antes de TAREA_005: organizacion Free nueva (`Lokebox Quote`), proyecto de Supabase separado del de Lokebox, tablas `leads` y `visits`, RLS con policy de insert para anon, y `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` y en Vercel. Parcial: las dos variables estan cargadas en production y preview. La anon key quedo como Config y su valor coincide con `.env.local` por hash en los dos entornos. La URL entro como Secret y se rehace como Config en el arranque de TAREA_005, con su verificacion por hash. El proyecto, las tablas y el RLS los verifica Code con un curl antes de escribir codigo: si ese curl no da 201, este punto no esta cerrado. El proyecto Free se pausa a los 7 dias de inactividad; si eso pasa, se despausa desde el dashboard. Cuando haya cliente real, transfer a la org paga sin cambiar URL ni keys.
3. CNAME de quote.lokebox.com a Vercel y verificacion del certificado.
4. Video de 30 segundos y capturas, desktop y mobile, demo EN.
5. Listado del Project Catalog, planilla de precios, lista de 40 carteleria de Tucuman y plantilla del mensaje de salida en frio.

## Convenciones que no se olvidan

- `docs/tareas/_ULTIMO.md` guarda el proximo numero libre. Hoy dice 005, que es el numero de la tarea en curso. Al cerrarla pasa a 006.
- Commit de docs separado del commit de codigo.
- Nada de parches: si algo pide un workaround, se frena y se decide en Canal B.
