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
- Vitest para los tests del motor de precios.
- Supabase propio (proyecto separado del de Lokebox).
- Deploy en Vercel, dominio quote.lokebox.com, una ruta /d/<slug> por cliente.

## Arquitectura en tres capas

Regla no negociable: core / vertical / cliente (JSON).

- **core**: layout, panel de opciones, motor de precios, captura de lead, quote imprimible y tracking. No sabe nada de una vertical concreta ni de un cliente concreto.
- **vertical**: por ejemplo cartelería. Aporta el esquema de opciones y el componente de preview 3D.
- **cliente**: un archivo JSON con nombre, logo, colores, precios y opciones habilitadas.

Personalizar un cliente nuevo es editar un JSON y reemplazar un logo, sin tocar código.

Otras reglas de arquitectura:

- El motor de precios es una función pura, con la firma de SPEC 6. Sin React, sin Supabase, sin efectos, sin formateo de moneda adentro.
- El preview es un componente enchufable que recibe el estado como props.
- La escena 3D es simple: fachada, cartel como caja emisiva, una luz, órbita limitada.
- Sin shaders custom, sin física, sin modelos pesados.
- Cero strings de UI hardcodeados. Todo texto visible sale de `texts` en el JSON del cliente.

## Alcance

SPEC.md es la fuente de verdad. Resumen:

IN: UI visual fuerte y responsive, panel de opciones desde el esquema de la vertical, precio dinámico mostrado como rango con disclaimer, preview 3D, lead a Supabase, CTA de WhatsApp con mensaje armado y formulario, quote imprimible en HTML, demo en inglés y en español desde el mismo esquema de JSON, tracking de visitas por slug, landing y deploy.

OUT: CRM, auth, usuarios, backoffice, multi-tenant, permisos, integraciones, email transaccional, generación de PDF en servidor, 3D avanzado, modelos importados, editor visual del JSON, más de dos tipos de cartel, más de una vertical.

DONE: se entiende en menos de 10 segundos, parece un producto de más valor que su precio, flujo completo sin errores visibles, fluido en mobile, se puede grabar video y sacar capturas, desplegado en quote.lokebox.com, listado del Catalog publicable.

Si una feature pone en riesgo el viernes 18, se simplifica o se elimina.

## Restricción

No usar retaining walls, concrete blocks, takeoff ni flujos de productos de construcción para contractors.

## Reglas de trabajo

- Soluciones sólidas, nada de parches.
- Nada se declara terminado sin verificar los criterios de aceptación.
- Commit al cerrar cada tarea, con mensaje claro.
- Los textos en inglés de la demo van en nivel B2, frases simples.
- Nunca guiones largos.
- Al cerrar cada tarea, actualizar docs/STATE.md y docs/tareas/_ULTIMO.md.
- Si una tarea contradice SPEC.md, frenar y reportar. No resolverlo por cuenta propia.

## Documentos

- SPEC.md
- docs/EXECUTION.md
- docs/STATE.md
- docs/DECISIONES.md
- docs/tareas/TAREA_NNN_titulo.md
