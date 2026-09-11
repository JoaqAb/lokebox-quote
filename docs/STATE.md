# STATE

11/09/2026

Bloque 0 cerrado. Bloque 1 cerrado del lado del codigo: TAREA_001 y TAREA_002 cerradas.
Queda pendiente Canal C: crear el proyecto en Vercel e importar el repo para el primer deploy.

- TAREA_000: repo creado, scaffold funcionando, docs base. Commit 0f789a0.
- Canal B: SPEC.md version 1.0, docs/EXECUTION.md, docs/DECISIONES.md, CLAUDE.md y TAREA_001 commiteados. Commit bd69e10.
- TAREA_001: tipos del dominio, los dos JSON de cliente, validacion en runtime, motor de precios y formateo de moneda, con tests. Commit 6d83a02.
- Canal B: SPEC.md version 1.1, EXECUTION del bloque 1 y TAREA_002 commiteados. Commit 1b5c4a0.
- TAREA_002: layout core, panel de opciones generico, precio animado, tema por variables CSS, rutas por cliente, registro por descubrimiento de archivos y vercel.json.

Estado de TAREA_002:

- `src/core/theme.ts`: `themeFromClient` devuelve las cinco variables CSS del cliente. Se aplican una sola vez, en el contenedor raiz. Ningun componente tiene un hexadecimal.
- `src/core/ui/QuoteLayout.tsx`: layout de SPEC 4.1. Desktop dos columnas, preview al 58% a la izquierda, panel con scroll propio a la derecha y precio al pie de esa columna. Mobile una columna, preview 16/9 arriba y barra de precio fija al pie con safe area.
- `src/core/ui/panelTypes.ts` y `OptionsPanel.tsx`: panel generico por descriptores, con los cuatro controles en `src/core/ui/controls`. El core no sabe que existen materiales ni carteles.
- `src/core/ui/AnimatedAmount.tsx`: contador con Framer Motion, 350 ms, salida suave, y cambio de golpe con prefers-reduced-motion. Siempre formatea con `formatCurrency`.
- `src/core/ui/PriceBar.tsx` y `PriceBreakdown.tsx`: total, rango, disclaimer siempre visible y desglose por concepto con el area arriba.
- `src/core/pricing/lineLabels.ts`: `resolveLineLabel` traduce el labelKey del motor a texto del cliente, o lanza.
- `src/verticals/signs/fields.ts`: la vertical arma los siete descriptores desde el JSON y adapta en las dos direcciones contra `SignSelection`.
- `src/verticals/signs/SignPreview.tsx`: interfaz final `{ selection, theme }` con cuerpo provisorio. TAREA_003 reemplaza solo el cuerpo.
- `src/pages`: `QuotePage` (composicion y unico lugar que decide vertical), `IndexPage` (indice temporal) y `ErrorScreen` (unica pantalla con texto fijo).
- `src/clients/index.ts`: registro por `import.meta.glob` eager. Agregar un cliente es agregar el JSON y el logo. Verificado copiando northline a demo.json: `/d/demo` anduvo sin tocar ningun `.ts`.
- `vercel.json` con el rewrite de SPA. `npm run build && npm run preview` sirve `/d/northline` por URL directa.
- 52 tests en verde: los 42 de TAREA_001 sin tocar, mas los 10 nuevos de la seccion 12 de la tarea.
- Verificacion de UI con un navegador headless en 390, 768 y 1440 px: los siete campos, precio, rango, disclaimer y desglose en los dos idiomas, sin scroll horizontal, sin solapamientos, sin errores de consola y con la barra de precio sin tapar el ultimo control.
- Criterios de aceptacion de la seccion 14 de la tarea: los 16 verificados, con la salvedad del criterio 14 anotada en docs/DECISIONES.md (el grep da cero en codigo de produccion y da los imports de los tests, que cargan los JSON reales a proposito).

Decisiones nuevas en docs/DECISIONES.md: precio al pie de la columna con flex en vez de sticky, escala del preview provisorio por proporcion, colores neutros en ErrorScreen e IndexPage, alcance de la regla de aislamiento de src/core, reinicio de estado por key de slug y borrado del directorio vacio src/verticals/signage.

Siguiente: TAREA_003 (escena 3D base de la vertical carteleria). Antes, Canal C hace el primer deploy en Vercel.

Pendiente de Canal C, en orden: proyecto en Vercel (lunes, ya con los commits pusheados), proyecto y tablas en Supabase con RLS y variables de entorno (miercoles, antes de TAREA_005), CNAME de quote.lokebox.com (miercoles), video y capturas (jueves), listado del Catalog (viernes).

Nada tocado todavia de: Supabase, lead, quote imprimible, tracking de visitas, escena 3D y landing real.
