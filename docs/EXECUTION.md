# EXECUTION · Lokebox Quote

Orden de bloques y criterios de aceptación. El alcance está en SPEC.md. El estado vivo está en docs/STATE.md.

Reglas:

- Un bloque se cierra solo cuando todos sus criterios están verificados, no cuando el código "parece andar".
- El chat orquestador (Desktop) trabaja con un tope de 3 turnos por chat, y los pasos manuales de Canal C van agrupados al final de cada bloque, nunca intercalados entre tareas de código.
- Al cerrar cada tarea: commit, docs/STATE.md y docs/tareas/_ULTIMO.md actualizados.
- Criterios técnicos que se repiten en todas las tareas de código (G):
  - G1 `npm run build` en verde, sin errores ni warnings.
  - G2 `npx tsc -b --force` con 0 errores.
  - G3 `npm run lint` sin hallazgos.
  - G4 `npm test` en verde cuando hay tests.
  - G5 Sin guiones largos en ningún archivo nuevo o editado.
  - G6 Nada de parches. Si algo pide un workaround, se frena y se reporta.

## Bloque 0 · viernes 11 (cerrado)

TAREA_000: scaffold, docs base, repo público. Cerrado, commit 0f789a0.
Canal B: SPEC.md y docs/EXECUTION.md escritos. Cerrado.

## Bloque 1 · lunes 14 · fundamentos y primer deploy

Objetivo: precio correcto y panel usable, sin 3D. Al final del día ya hay una URL pública.

- TAREA_001 · tipos, JSON de clientes, motor de precios con tests.
  - Aceptación: G1 a G6. Los siete casos de la tarea dan los números exactos esperados. `src/core/pricing` no importa React, three ni Supabase (verificado con grep). Los dos JSON validan.
- TAREA_002 · layout core, panel de opciones genérico, precio animado, tema desde el JSON, rutas `/d/:slug`. Detalle en docs/tareas/TAREA_002_layout_panel_precio.md.
  - Aceptación: G1 a G6. `/d/northline` y `/d/norte` renderizan el panel completo desde su JSON. Cambiar cualquier opción actualiza el precio en menos de 100 ms. El contador anima. El rango y el disclaimer están visibles. Mobile 390 px sin scroll horizontal ni solapamientos. Cero strings de UI hardcodeados, con la única excepción de la pantalla de error. `src/core` no importa nada de `src/verticals` ni de `src/clients`. Agregar un JSON nuevo alcanza para tener su ruta funcionando, sin editar código. `vercel.json` con el rewrite de SPA presente.
- Canal C al cierre del bloque: crear el proyecto en Vercel e importar el repo. Primer deploy sin dominio propio. Sin variables de entorno todavía. Cerrado: proyecto `lokebox-quote`, producción en https://lokebox-quote.vercel.app, las cuatro URLs verificadas.
  - Prerrequisito: los commits de TAREA_002 pusheados a origin/main.
  - Aceptación: la URL `*.vercel.app` abre `/d/northline` y `/d/norte`.

Bloque 1 cerrado.

## Bloque 2 · martes 15 · preview 3D

- TAREA_003 · escena base: fachada, vereda, puerta, vidriera, cartel tipo facade con dimensiones reactivas, materiales, ambiente nocturno, cámara con órbita limitada. Incluye dos arreglos acotados que no esperan al bloque 4: el padding inferior del panel en mobile derivado de la altura real de la barra de precio, y `"strict": true` explícito en tsconfig.app.json. Detalle en docs/tareas/TAREA_003_escena_3d_base.md.
  - Aceptación: G1 a G6. Mover los sliders cambia la caja del cartel con transición suave. Cambiar material cambia color, metalness y roughness. La cámara no se pierde. 60 fps en desktop. En 390 px la barra de precio no tapa el stepper de cantidad.
- TAREA_004 · iluminación (none, front-lit, back-lit), tótem con poste, autorotación, presupuesto de rendimiento en mobile, más el presupuesto de bundle y el reequilibrio de la composición. Detalle en docs/tareas/TAREA_004_iluminacion_totem_rendimiento.md.
  - Aceptación: G1 a G6, con G1 ya sin la advertencia de tamaño de chunk. Los tres modos de luz se distinguen con luminancia medida, no a ojo. El tótem aparece de pie delante del local, con transición continua desde facade y sin crecer en geometrías. El barrido de cámara se detiene al arrastrar y se reanuda sin salto. El descenso de nivel de rendimiento respeta el orden de SPEC 12, no vuelve a subir y no cae a 2D. Con el modo por defecto el cartel ya no pesa menos que la vidriera. Los 18 criterios de la tarea, uno por uno.
- Punto de control del día: si el 3D no está fluido en mobile, se aplica la degradación de SPEC 12 en este orden: sombras de contacto y techo de dpr, después órbita y barrido de cámara. Sin bloom, que quedó fuera del MVP. No se vuelve a 2D.

Al cierre de TAREA_004 se cierra el bloque 2 y el preview no se vuelve a tocar hasta TAREA_007.

## Bloque 3 · miércoles 16 · lead, datos, quote, dominio

Prerrequisito Canal C, antes de TAREA_005: crear el proyecto de Supabase, las dos tablas, el RLS y las policies de insert, y cargar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` y en Vercel. Sin esto la tarea no arranca.

- TAREA_005 · capa de datos, insert de lead, CTA WhatsApp con mensaje armado, formulario, pantalla de confirmación, insert de visita. Detalle en docs/tareas/TAREA_005_lead_supabase_cta.md. Sin SDK de Supabase: dos inserts por fetch contra PostgREST.
  - Aceptación: G1 a G6, y los 18 criterios de la tarea, uno por uno. Un lead por formulario aparece en la tabla con selection, total, min, max y contacto. El CTA de WhatsApp abre `wa.me` con el mensaje completo y legible. Si Supabase está caído, el flujo sigue y el usuario no ve un error. Una carga de `/d/northline` inserta una visita y un refresco en la misma sesión no duplica.
- TAREA_006 · hoja de cotización imprimible en `/d/<slug>/quote` con la selección en la query, y demo ES completa. Detalle en docs/tareas/TAREA_006_quote_imprimible_demo_es.md. Incluye las cinco claves de texto nuevas de SPEC 1.4, el formateo de medidas con Intl por locale y la limpieza de los nueve guiones largos de docs/comercial/.
  - Aceptación: G1 a G6, y los 19 criterios de la tarea, uno por uno. Imprimir a PDF desde el navegador da una sola página con logo, desglose, total, rango, fecha, validez y disclaimer, sin los controles de la hoja. Un link con parámetros faltantes o inválidos muestra la pantalla de error, no un precio inventado. La hoja no escribe nada: 0 POST a leads y a visits. `/d/norte` está en español, en metros con coma decimal y en pesos, con `prices_placeholder` visible solo en el código, no en pantalla.
- Canal C al cierre del bloque: apuntar `quote.lokebox.com` a Vercel (registro CNAME) y verificar el certificado.
  - Aceptación: `https://quote.lokebox.com/d/northline` abre con candado.
- Canal C, sin bloquear TAREA_006: ver las dos demos en un teléfono real y confirmar fps y nivel de rendimiento con GPU de verdad. Todas las mediciones de fps de los bloques 2 y 3 están hechas sobre SwiftShader por software.
- Canal C, sin bloquear TAREA_006: en el Table Editor, borrar las dos filas con `client_slug` `__smoke` que dejó el gate, y decidir qué hacer con las filas reales de prueba (7 en `leads` y 6 en `visits`, slugs northline, norte y prueba, contacto ana.*@test.example). Conviene que la tabla esté limpia antes de grabar el video.

Al cierre de TAREA_006 cierra el bloque 3 del lado del código y queda solo el CNAME de Canal C.

## Bloque 4 · jueves 17 · pulido, landing y material de venta

- TAREA_007 · pulido visual y mobile: tipografía, espaciados, estados de foco, transiciones, orden de tabulación, textos finales de las dos demos en nivel B2. Incluye tres pendientes que venían anotados en STATE: el encabezado muestra el logo y al lado repite `brand.name`, queda bastante aire abajo en la columna del preview en 1440 px, y el preview vuelve a abrirse acá por primera vez desde que cerró el bloque 2.
  - Aceptación: G1 a G6. Revisión en 390 px, 768 px y 1440 px sin defectos visibles. Los tres criterios subjetivos de DONE (10 segundos, apariencia de producto, sin errores visibles) se validan con Joaquín antes de cerrar.
- TAREA_008 · landing en `/`: qué es, para quién, dos botones a las demos, los dos tiers con precio, contacto, footer. Reemplaza el índice temporal, que hoy muestra los slugs crudos.
  - Aceptación: G1 a G6. La landing carga en menos de 2 segundos y los botones llevan a las demos.
- Canal C al cierre del bloque: grabar el video de 30 segundos y sacar las capturas (desktop y mobile, demo EN).

## Bloque 5 · viernes 18 · publicación

Sin tareas de código salvo arreglos bloqueantes.

- Canal C: publicar el listado en Upwork Project Catalog con los dos tiers, el video y las capturas.
- Canal C: armar la planilla plantilla de precios para el cliente.
- Canal C: lista de 40 cartelerías de Tucumán con WhatsApp, y plantilla del mensaje de salida en frío.
- Cierre: docs/STATE.md con el resultado del DONE de SPEC 17, punto por punto.

## Colchón

Si el bloque 2 se pasa al miércoles, lo que se recorta es, en este orden: sombras de contacto, tótem, barrido de cámara. Nunca se recortan el lead, el deploy ni el material de venta.
