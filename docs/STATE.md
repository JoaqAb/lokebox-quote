# STATE

11/09/2026

Bloque 0 cerrado. Bloque 1 en curso: TAREA_001 cerrada.

- TAREA_000: repo creado, scaffold funcionando, docs base. Commit 0f789a0.
- Canal B: SPEC.md version 1.0, docs/EXECUTION.md, docs/DECISIONES.md, CLAUDE.md y TAREA_001 commiteados. Commit bd69e10.
- TAREA_001: tipos del dominio, los dos JSON de cliente, validacion en runtime, motor de precios y formateo de moneda, con tests. Commit `feat: tipos, JSON de clientes y motor de precios con tests`.

Estado de TAREA_001:

- `src/core/types.ts` con los tipos del dominio y el contrato de SPEC 6.
- `src/core/pricing/calculatePrice.ts`: funcion pura, sin React, sin three, sin Supabase, sin Intl, sin window (verificado con grep).
- `src/core/pricing/format.ts`: unico lugar donde se formatea plata.
- `src/core/clientConfig.ts`: `validateClientConfig`, `priceRulesFromClient`, `defaultSelection`. Validacion manual, sin librerias.
- `src/clients/index.ts` con `getClient` y `listClientSlugs`, y los JSON de northline (EN, USD, pies) y norte (ES, ARS, metros, precios placeholder).
- Logos placeholder en `public/clients/<slug>/logo.svg`.
- 42 tests en verde, incluidos los siete casos de la tabla de la tarea con los numeros exactos.
- vitest 5.0.0 instalado, configurado dentro de vite.config.ts con entorno node.
- Criterios de aceptacion de la seccion 11 de la tarea: los nueve verificados.

Decisiones nuevas en docs/DECISIONES.md: la linea de iluminacion con importe 0 se incluye siempre, los importes de las lineas son por unidad, el formato del campo `detail`, la version de vitest y la correccion del conteo de claves de `texts` (son 35, no 34).

Siguiente: TAREA_002 (layout core, panel de opciones generico desde el esquema de la vertical, precio animado, tema desde el JSON). Al cierre del bloque, Canal C hace el primer deploy en Vercel sin dominio propio.

Pendiente de Canal C, en orden: proyecto en Vercel (lunes), proyecto y tablas en Supabase con RLS y variables de entorno (miercoles, antes de TAREA_005), CNAME de quote.lokebox.com (miercoles), video y capturas (jueves), listado del Catalog (viernes).

Nada tocado todavia de: Supabase, deploy, dominio, rutas /d/:slug, panel de opciones, escena 3D, App.tsx, main.tsx, index.css.
