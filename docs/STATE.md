# STATE

11/09/2026

Bloque 0 cerrado. Bloque 1 cerrado, incluido Canal C: hay URL publica.
Produccion: https://lokebox-quote.vercel.app. Proyecto de Vercel lokebox-quote, sin variables de entorno.
Siguiente: TAREA_003, escena 3D base de la vertical carteleria. Detalle en docs/tareas/TAREA_003_escena_3d_base.md.

## Hecho

- TAREA_000: repo creado, scaffold funcionando, docs base. Commit 0f789a0.
- Canal B: SPEC.md 1.0, docs/EXECUTION.md, docs/DECISIONES.md, CLAUDE.md y TAREA_001. Commit bd69e10.
- TAREA_001: tipos del dominio, los dos JSON de cliente, validacion en runtime, motor de precios y formateo de moneda, con 42 tests. Commit 6d83a02.
- Canal B: SPEC.md 1.1, EXECUTION del bloque 1 y TAREA_002. Commit 1b5c4a0.
- TAREA_002: layout core, panel de opciones generico, precio animado, tema por variables CSS, rutas por cliente, registro por descubrimiento de archivos y vercel.json. 52 tests. Commit d435c80. Revisada y aceptada por Canal B contra los 16 criterios, con los seis desvios aceptados y anotados.
- Canal C: proyecto en Vercel e import del repo. Las cuatro URLs verificadas a mano: /, /d/northline, /d/norte y /d/inexistente. Numeros correctos en pantalla en los dos clientes, cada uno con su idioma, su unidad y su moneda.
- Canal B: SPEC.md 1.2 (interfaz del preview con visual, escala en metros, colores derivados del theme, caida sin WebGL, prohibiciones de assets en la vertical 3D), EXECUTION del bloque 2 y TAREA_003.

## Estado del codigo

- `src/core`: tipos, motor de precios puro, formateo de moneda, validacion de config, tema por cinco variables CSS, layout, panel generico por descriptores con cuatro controles, precio animado, rango, disclaimer y desglose. No importa nada de verticals ni de clients en codigo de produccion.
- `src/verticals/signs`: `fields.ts` arma los siete descriptores desde el JSON y adapta en las dos direcciones contra `SignSelection`. `SignPreview.tsx` tiene el cuerpo provisorio de TAREA_002, que TAREA_003 reemplaza. La interfaz pasa a `{ selection, visual, theme }`.
- `src/clients`: registro por `import.meta.glob` eager. Agregar un cliente es agregar el JSON y el logo, sin tocar un solo `.ts`. Verificado.
- `src/pages`: `QuotePage` es el unico lugar que decide vertical, `IndexPage` es un indice temporal y `ErrorScreen` es la unica pantalla con texto fijo.
- 52 tests en verde. TAREA_003 deja 62.
- Sin tocar todavia: Supabase, lead, CTA, quote imprimible, tracking de visitas, escena 3D, totem, iluminacion y landing real.

## Pendientes menores con destino asignado

- La barra de precio tapa el stepper de cantidad en 390 px, porque el padding inferior del panel es un valor fijo de 13rem. Se arregla en TAREA_003, seccion 9.
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
