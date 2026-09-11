# CLAUDE.md

## Qué es

Lokebox Quote es un cotizador interactivo comercial, paralelo al producto Lokebox. Demo inicial: cartelería. Deadline: viernes 18/09/2026. Existe para conseguir clientes.

## Stack

Vite + React + TypeScript · Tailwind v4 como plugin de Vite · Framer Motion · React Three Fiber + drei · Vitest · Supabase propio, proyecto separado del de Lokebox · Vercel, dominio quote.lokebox.com, una ruta `/d/<slug>` por cliente.

## Arquitectura en tres capas

Regla no negociable: core / vertical / cliente (JSON).

- **core**: layout, panel de opciones, motor de precios, captura de lead, quote imprimible y tracking. No sabe nada de una vertical concreta ni de un cliente concreto.
- **vertical**: aporta el esquema de opciones y el componente de preview 3D. Hoy, cartelería.
- **cliente**: un JSON con nombre, logo, colores, precios y opciones habilitadas. Personalizar un cliente nuevo es editar un JSON y reemplazar un logo, sin tocar código.

Además:

- El motor de precios es una función pura, con la firma de SPEC 6. Sin React, sin Supabase, sin efectos, sin formateo de moneda adentro.
- El preview es un componente enchufable que recibe el estado como props. La escena es simple: fachada, cartel como caja emisiva, una luz, órbita limitada. Sin shaders custom, sin física, sin modelos pesados.
- Cero strings de UI hardcodeados. Todo texto visible sale de `texts` en el JSON del cliente.

## Protocolo de contexto

- Code corre en Sonnet por defecto. Opus solo para una decisión de arquitectura atascada, y se vuelve a Sonnet apenas se resuelve.
- Code expande los briefs del chat orquestador (Desktop) a `docs/tareas/TAREA_NNN_titulo.md`. El orquestador no redacta esos documentos.
- Reporte de Code al orquestador: máximo 15 líneas. Archivos tocados, criterios cumplidos sí o no, bloqueos en una línea. Sin código, sin diffs, sin capturas.
- Entre tareas se usa `/clear`, nunca `/compact`.
- Las tareas dan rutas de archivo exactas. Code no explora el repo para encontrarlas.

## Reglas de trabajo

- Soluciones sólidas, nada de parches. Si algo pide un workaround, se frena y se reporta.
- Nada se declara terminado sin verificar los criterios de aceptación.
- Si una tarea contradice SPEC.md, frenar y reportar. No resolverlo por cuenta propia.
- Si una feature pone en riesgo el viernes 18, se simplifica o se elimina.
- Tres commits por tarea, en orden: docs de apertura, código, docs de cierre (STATE, DECISIONES y `_ULTIMO.md`).
- No se reescribe historia ya pusheada.
- Los textos en inglés de la demo van en nivel B2, frases simples.
- Nunca guiones largos.
- No usar retaining walls, concrete blocks, takeoff ni flujos de productos de construcción para contractors.

## Documentos

- `SPEC.md`: alcance y fuente de verdad. Se edita, no se contradice.
- `docs/EXECUTION.md`: bloques, criterios de aceptación y pasos de Canal C.
- `docs/STATE.md`: estado vivo, formato fijo, tope 30 líneas.
- `docs/DECISIONES.md`: una línea por decisión, con fecha.
- `docs/tareas/TAREA_NNN_titulo.md`: la tarea en curso.
