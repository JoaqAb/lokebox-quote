# STATE

11/09/2026

Bloque 0 cerrado. Bloque 1 cerrado, incluido Canal C: hay URL publica.
Produccion: https://lokebox-quote.vercel.app. Proyecto de Vercel lokebox-quote, sin variables de entorno.
Bloque 2 en curso: TAREA_003 cerrada.
Siguiente: TAREA_004, iluminacion, totem, autorotacion y presupuesto de rendimiento en mobile.

## Hecho

- TAREA_000: repo creado, scaffold funcionando, docs base. Commit 0f789a0.
- Canal B: SPEC.md 1.0, docs/EXECUTION.md, docs/DECISIONES.md, CLAUDE.md y TAREA_001. Commit bd69e10.
- TAREA_001: tipos del dominio, los dos JSON de cliente, validacion en runtime, motor de precios y formateo de moneda, con 42 tests. Commit 6d83a02.
- Canal B: SPEC.md 1.1, EXECUTION del bloque 1 y TAREA_002. Commit 1b5c4a0.
- TAREA_002: layout core, panel de opciones generico, precio animado, tema por variables CSS, rutas por cliente, registro por descubrimiento de archivos y vercel.json. 52 tests. Commit d435c80. Revisada y aceptada por Canal B contra los 16 criterios, con los seis desvios aceptados y anotados.
- Canal C: proyecto en Vercel e import del repo. Las cuatro URLs verificadas a mano: /, /d/northline, /d/norte y /d/inexistente. Numeros correctos en pantalla en los dos clientes, cada uno con su idioma, su unidad y su moneda.
- Canal B: SPEC.md 1.2 (interfaz del preview con visual, escala en metros, colores derivados del theme, caida sin WebGL, prohibiciones de assets en la vertical 3D), EXECUTION del bloque 2 y TAREA_003. Commit 4b54fa1.
- TAREA_003: escena 3D base de la vertical, mas el fix del padding de la barra en mobile y "strict": true explicito. 63 tests.

## Estado del codigo

- `src/core`: tipos, motor de precios puro, formateo de moneda, validacion de config, tema por cinco variables CSS, layout, panel generico por descriptores con cuatro controles, precio animado, rango, disclaimer y desglose. No importa nada de verticals ni de clients en codigo de produccion.
- `src/verticals/signs`: `fields.ts` arma los siete descriptores desde el JSON y adapta en las dos direcciones contra `SignSelection`. `visuals.ts` arma el `SignVisual` (visual del material, visual de la luz y factor a metros). `SignPreview.tsx` es el host del canvas con la interfaz `{ selection, visual, theme }`, y cae a `SignPreviewFallback` si no hay WebGL. `scene/` tiene `sceneGeometry.ts` (todas las medidas, posiciones y colores, puro y testeado), `Storefront.tsx`, `SignBoard.tsx`, `SignScene.tsx` y `webgl.ts`.
- `src/clients`: registro por `import.meta.glob` eager. Agregar un cliente es agregar el JSON y el logo, sin tocar un solo `.ts`. Verificado.
- `src/pages`: `QuotePage` es el unico lugar que decide vertical, `IndexPage` es un indice temporal y `ErrorScreen` es la unica pantalla con texto fijo.
- 63 tests en verde: los 52 previos sin tocar, los 10 de la seccion 12 de TAREA_003 mapeados uno a uno, y uno extra por el error de tema faltante en `scenePalette`.
- El cartel usa una sola boxGeometry unitaria: el tamano va por scale y la transicion por damp en useFrame. Verificado con `renderer.info.memory.geometries`, que se mantiene en 6 despues de barrer los dos sliders de punta a punta.
- Sin tocar todavia: Supabase, lead, CTA, quote imprimible, tracking de visitas, totem, modos de iluminacion y landing real.

## Pendientes menores con destino asignado

- Resuelto en TAREA_003: el padding inferior del panel en mobile se deriva de la altura real de la barra, medida con ResizeObserver sobre el border box y publicada en --q-price-h. Con los dos clientes la barra mide 160 px en 390 px y el padding queda en 192 px.
- El bundle pasa de 386 kB a 1294 kB al entrar three, y Vite avisa que el chunk supera los 500 kB. Decision de Canal B: partir el bundle, subir el limite o dejarlo. El lugar natural es TAREA_004.
- R3F 9.7.0 deja un warning de consola por canvas, `THREE.Clock` deprecado en three r183. No es codigo del proyecto. Candidato a subir R3F en TAREA_004.
- La vidriera pesa mas que el cartel en la composicion: es el unico elemento con color de acento y el cartel todavia no emite. TAREA_004 le da emision al cartel y deberia reequilibrar. Si no alcanza, va a TAREA_007.
- El encabezado muestra el logo y al lado repite `brand.name`. Va a TAREA_007.
- El indice de `/` muestra los slugs crudos. Va a TAREA_008, con la landing real.
- Bastante aire abajo en la columna del preview en 1440 px. Va a TAREA_007.

## Canal C, en orden

1. Hecho: proyecto en Vercel y primer deploy.
2. Antes de TAREA_005: proyecto de Supabase separado del de Lokebox, tablas `leads` y `visits`, RLS con policy de insert para anon, y `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` y en Vercel.
3. CNAME de quote.lokebox.com a Vercel y verificacion del certificado.
4. Video de 30 segundos y capturas, desktop y mobile, demo EN.
5. Listado del Project Catalog, planilla de precios, lista de 40 carteleria de Tucuman y plantilla del mensaje de salida en frio.

## Convenciones que no se olvidan

- `docs/tareas/_ULTIMO.md` guarda el proximo numero libre. Hoy dice 003, que es el numero de la tarea en curso. Al cerrarla pasa a 004.
- Commit de docs separado del commit de codigo.
- Nada de parches: si algo pide un workaround, se frena y se decide en Canal B.
