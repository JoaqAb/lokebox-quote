# CLAUDE.md

## Qué es

Lokebox Quote es un cotizador interactivo comercial, paralelo al producto Lokebox.

- Demo inicial: cartelería.
- Deadline: viernes 18/09/2026.
- Existe para conseguir clientes.

## Stack

- Vite + React + TypeScript.
- Tailwind v4, configurado como plugin de Vite.
- Framer Motion para animaciones.
- React Three Fiber + drei para el preview 3D.
- Supabase propio (proyecto separado del de Lokebox).
- Deploy en Vercel, dominio quote.lokebox.com, una ruta /d/<slug> por cliente.

## Arquitectura en tres capas

Regla no negociable: core / vertical / cliente (JSON).

- **core**: layout, panel de opciones, motor de precios, captura de lead, quote imprimible y tracking. No sabe nada de una vertical concreta ni de un cliente concreto.
- **vertical**: por ejemplo cartelería. Aporta el esquema de opciones y el componente de preview 3D.
- **cliente**: un archivo JSON con nombre, logo, colores, precios y opciones habilitadas.

Personalizar un cliente nuevo es editar un JSON y reemplazar un logo, sin tocar código.

Otras reglas de arquitectura:

- El motor de precios es una función pura. Sin React, sin Supabase, sin efectos.
- El preview es un componente enchufable que recibe el estado como props.
- La escena 3D es simple: fachada, cartel como caja emisiva, una luz, órbita limitada.
- Sin shaders custom, sin física, sin modelos pesados.

## Alcance

IN y OUT se copian de SPEC.md cuando exista. Por ahora SPEC.md es la fuente de verdad del alcance.

## Restricción

No usar retaining walls, concrete blocks, takeoff ni flujos de productos de construcción para contractors.

## Reglas de trabajo

- Soluciones sólidas, nada de parches.
- Nada se declara terminado sin verificar los criterios de aceptación.
- Commit al cerrar cada tarea, con mensaje claro.
- Los textos en inglés de la demo van en nivel B2, frases simples.
- Nunca guiones largos.
- Al cerrar cada tarea, actualizar docs/STATE.md y docs/tareas/_ULTIMO.md.

## Documentos

- SPEC.md
- docs/EXECUTION.md
- docs/STATE.md
- docs/DECISIONES.md
- docs/tareas/TAREA_NNN_titulo.md
