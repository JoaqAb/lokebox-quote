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

## Bloque 3 · miércoles 16 · lead, datos, quote, dominio (cerrado)

Prerrequisito Canal C, antes de TAREA_005: crear el proyecto de Supabase, las dos tablas, el RLS y las policies de insert, y cargar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` y en Vercel. Sin esto la tarea no arranca.

- TAREA_005 · capa de datos, insert de lead, CTA WhatsApp con mensaje armado, formulario, pantalla de confirmación, insert de visita. Detalle en docs/tareas/TAREA_005_lead_supabase_cta.md. Sin SDK de Supabase: dos inserts por fetch contra PostgREST.
  - Aceptación: G1 a G6, y los 18 criterios de la tarea, uno por uno. Un lead por formulario aparece en la tabla con selection, total, min, max y contacto. El CTA de WhatsApp abre `wa.me` con el mensaje completo y legible. Si Supabase está caído, el flujo sigue y el usuario no ve un error. Una carga de `/d/northline` inserta una visita y un refresco en la misma sesión no duplica.
- TAREA_006 · hoja de cotización imprimible en `/d/<slug>/quote` con la selección en la query, y demo ES completa. Detalle en docs/tareas/TAREA_006_quote_imprimible_demo_es.md. Incluye las cinco claves de texto nuevas de SPEC 1.4, el formateo de medidas con Intl por locale y la limpieza de los nueve guiones largos de docs/comercial/.
  - Aceptación: G1 a G6, y los 19 criterios de la tarea, uno por uno. Imprimir a PDF desde el navegador da una sola página con logo, desglose, total, rango, fecha, validez y disclaimer, sin los controles de la hoja. Un link con parámetros faltantes o inválidos muestra la pantalla de error, no un precio inventado. La hoja no escribe nada: 0 POST a leads y a visits. `/d/norte` está en español, en metros con coma decimal y en pesos, con `prices_placeholder` visible solo en el código, no en pantalla.
- Canal C al cierre del bloque: apuntar `quote.lokebox.com` a Vercel (registro CNAME) y verificar el certificado. Hecho: certificado emitido, las dos demos abren con candado.
  - Aceptación: `https://quote.lokebox.com/d/northline` abre con candado. Verificada.
- Canal C, sin bloquear TAREA_006: ver las dos demos en un teléfono real y confirmar fps y nivel de rendimiento con GPU de verdad. Todas las mediciones de fps de los bloques 2 y 3 están hechas sobre SwiftShader por software.
- Canal C, sin bloquear TAREA_006: en el Table Editor, borrar las dos filas con `client_slug` `__smoke` que dejó el gate, y decidir qué hacer con las filas reales de prueba (7 en `leads` y 6 en `visits`, slugs northline, norte y prueba, contacto ana.*@test.example). Conviene que la tabla esté limpia antes de grabar el video.

Bloque 3 cerrado: TAREA_006 aceptada con 17 criterios verificados y 2 con desvío resuelto, y el CNAME de Canal C hecho. Producción: https://quote.lokebox.com

## Bloque 4 · jueves 17 · pulido, landing y material de venta

- TAREA_007 · pulido visual y mobile: tipografía, espaciados, estados de foco, transiciones, orden de tabulación, textos finales de las dos demos en nivel B2. Incluye tres pendientes que venían anotados en STATE: el encabezado muestra el logo y al lado repite `brand.name`, queda bastante aire abajo en la columna del preview en 1440 px, y el preview vuelve a abrirse acá por primera vez desde que cerró el bloque 2.
  - Aceptación: G1 a G6. Revisión en 390 px, 768 px y 1440 px sin defectos visibles. Los tres criterios subjetivos de DONE (10 segundos, apariencia de producto, sin errores visibles) se validan con Joaquín antes de cerrar.
- TAREA_008 · órbita y degradación de rendimiento. Reabre TAREA_007: el criterio 3 de DONE falla en producción. Detalle en docs/tareas/TAREA_008_orbita_degradacion.md.
  - Aceptación: G1 a G6, y los 13 criterios de la tarea. Causa raíz medida, no supuesta. Arrastrar 60 segundos seguidos sigue respondiendo. Los tres modos de luz siguen distinguiéndose con luminancia medida.
  - Cerrada: commits e750499 (apertura), cb03856 (código), f0e997e (cierre). 13 de 13.
- TAREA_009 · escena clara y legibilidad del cartel. Resuelve los seis defectos del preview que hicieron rechazar el criterio 2 de DONE. Alcance: tema claro en la interfaz y en la escena con `--q-surface` y `--q-border` derivadas, marco del preview con superficie propia, composición de cámara nueva (SPEC 12 desbloqueado), fachada extendida con fondo y con puerta y vidriera legibles como referencia de escala, sombra de apoyo, glifos en la cara del cartel con `CanvasTexture`, campo de texto en el panel, `dusk` por modo de luz, y remedición de los tres límites de órbita contra la fachada nueva.
  - Aceptación: G1 a G6.
  - Los seis defectos, uno por uno, verificados en captura en `/d/northline` y `/d/norte`: el cartel tiene letras en la cara, la fachada tiene material y no es un plano negro, puerta y vidriera se leen como escala, el cartel apoya con sombra y no flota, el cartel es el elemento de mayor contraste del cuadro, y la fachada entra completa sin canto ni vacío en ningún punto del clamp.
  - Las tres mediciones de luminancia de SPEC 12: contraste local del cartel creciente de `none` a `front`, luminancia del anillo creciente en los tres modos, y contraste del cartel mayor que el de la vidriera en los tres.
  - Tema claro sin regresiones: las cuatro URLs de producción legibles, `.q-control`, `.q-on` y `.q-off` sin duplicar por tema, cero variantes `dark:`, cero hexadecimales nuevos en componentes de escena.
  - Campo de texto: 1 a 18 caracteres, se refleja en la cara del cartel sin salto perceptible, viaja como clave `x` en la URL de la hoja y la hoja lo valida.
  - Límites de órbita remedidos en captura y SPEC 12 reescrito con los valores finales, sean los de TAREA_008 o más amplios.
  - Presupuesto de bundle intacto y cero assets nuevos en la red: ningún request de fuente ni de archivo de textura en la pestaña Network.
  - El criterio 2 de DONE lo valida Joaquín en captura antes de cerrar.
- TAREA_010 · pivote del preview: de escena 3D completa a foto fija con el cartel 3D compuesto encima. Decisión de producto de Joaquín, aprobada. Detalle en docs/tareas/TAREA_010_preview_foto_cartel.md.
  - Aceptación: G1 a G6.
  - Sale entero, con su código y sus pruebas: fachada, puerta, vidriera, vereda, fondo, poste del tótem, órbita, barrido de cámara, degradación por rendimiento, escalar `dusk` y el criterio de luminancia contra la vidriera. El tipo `totem` sigue siendo cotizable: sale su geometría, no su precio.
  - Queda intacto y verificado por sus pruebas previas: el motor de precios, `SignBoard`, los glifos, el panel genérico, la capa de datos, el CTA de WhatsApp, el formulario y la hoja imprimible.
  - Las tres capas se componen sin desalineado en 390 px, 768 px y 1440 px, y el zoom por CSS mueve foto y cartel juntos en los tres anchos.
  - `photos` validado en runtime: lista no vacía, ids únicos, `x` e `y` entre 0 y 1, `metersToWidth` mayor que 0 y ángulos finitos. Un JSON al que le falte `photos` o que traiga un anclaje fuera de rango falla con el mensaje que dice qué falta y en qué cliente.
  - Cambiar de ángulo cambia foto y anclaje sin remontar el canvas ni reiniciar la selección.
  - Los tres modos de luz se distinguen con luminancia medida sobre la región del cartel, con la misma foto en los tres: la cara crece de `none` a `front` y el anillo inmediato crece de `front` a `back`. Los tres cuadros son además distintos pixel a pixel.
  - Assets: exactamente dos permitidos, las fotos del cliente y el HDRI único. Ningún otro pedido de red en la pestaña Network al cargar el preview.
  - Si las fotos de Canal C no están, se avanza con placeholders de color sólido del mismo aspect ratio, en la misma ruta, y el punto de reemplazo queda anotado en STATE.
  - Agregar un cliente sigue siendo un JSON más sus assets, sin tocar código.
- TAREA_011 · integración de assets reales y calibración. Alcance: incorporar el paquete de ocho fotos y el HDRI recibido de Canal C, mapear cada id de asset al cliente real por tema de color (no por orden), escribir `photos[]` de cada cliente con los anchors de arranque, borrar los placeholders de TAREA_010, y construir un modo de calibración en `?calibrate=1` sobre `/d/<slug>` con crosshair y lectura de x/y/escala para ajustar esos anchors contra el SignBoard real. Herramienta de desarrollo, no entra en SPEC 16 ni en textos. Una sola pasada de calibración, después de integrar las fotos reales, no antes.
  - Aceptación: G1 a G6. Cero placeholders de color sólido restantes. `photos[]` de los dos clientes reales validado en runtime contra el esquema de TAREA_010. La herramienta de calibración no aparece en ninguna ruta de producto ni consume ninguna clave de `texts`.
- TAREA_012 · letras corpóreas como tercer tipo de cartel. Mismo alcance que la TAREA_011 original del 12/09, sin cambios, solo renumerada porque la integración de assets y calibración pasan a ser su propio bloque de trabajo. Alcance: tipo `letters` con `pricing` en el JSON, reglas nuevas del motor, panel por modo con `buildPanelFields(config, selection)`, JSON de los dos clientes con los valores de SPEC 5.4 y 5.5, preview con una caja por letra, hoja imprimible y plantilla de WhatsApp del modo letters.
  - Aceptación: G1 a G6.
  - Los tests previos quedan intactos y los nuevos del modo letters dan números exactos, incluidos los casos que lanzan: tipo sin `pricing`, material sin `pricePerLetterHeight`, `depthId` inexistente, texto vacío y texto de más de 18 caracteres.
  - Cambiar de tipo en cualquier orden no deja estado inválido ni un precio NaN en ninguna combinación.
  - El preview muestra una caja por letra con el texto tipeado, hasta 18, sin assets descargados y sin `Text3D`.
  - La hoja con `lh` y `d` recalcula el mismo total que el cotizador, y una clave del otro modo da la pantalla de error.
  - El mensaje de WhatsApp del modo letters sale sin huecos en los dos idiomas.
  - Recorte autorizado si el viernes 18 se pone en riesgo: sale el glifo del volumen y quedan las cajas por letra. El motor, el panel, el JSON y la hoja no se recortan.
- TAREA_014 · viewer en dos modos, cámara en perspectiva y arreglo de back-lit. Va antes que la landing: el preview falla en producción por el cartel de frente sobre fotos en tres cuartos y por el halo de back. Detalle en docs/tareas/TAREA_014_viewer_dos_modos.md.
  - Aceptación: G1 a G6 y los criterios de la tarea, uno por uno. El criterio 2 de DONE lo valida Joaquín en captura antes de cerrar.
- TAREA_015 · cierre del modo cartel: encuadre por la huella proyectada de la caja con 12 por ciento de margen, back con la cara apagada en modo cartel, luz de estudio propia del modo y criterio de luminancia de tres comparaciones. El modo vista y la calibración no se tocan. Detalle en docs/tareas/TAREA_015_cierre_modo_cartel.md.
  - Aceptación: G1 a G6 y los criterios de la tarea, uno por uno.
- TAREA_016 · letras corpóreas reales y texto en relieve: typeface subsetado de Archivo Black como único asset nuevo, `SignText3D` con `TextGeometry` en modo letters y en relieve de 3 mm en modo area, campo de texto en mayúsculas, back de modo cartel en la letra. Bloqueante: el criterio 2 de DONE quedó rechazado. Detalle en docs/tareas/TAREA_016_letras_corporeas_reales.md.
  - Aceptación: G1 a G6 y los criterios de la tarea, uno por uno. El criterio 2 de DONE lo valida Joaquín en captura. Al cerrar, push y verificación del deploy.
- TAREA_017 · el totem se dibuja de verdad (panel, poste y base, sombra horizontal, caja de encuadre completa, `anchorGround` en modo vista con validación) y salen las vistas de foto en ángulo. Detalle en docs/tareas/TAREA_017_totem_real_vistas_frontales.md.
  - Aceptación: G1 a G10 de la tarea, medidos y con el número anotado en el .md: presupuesto de bundle sin pedidos nuevos, 194 tests previos más los de la caja del totem, capturas de órbita del totem sin tocar el borde con el margen mínimo en px, proporciones de poste y base en los extremos del rango, cambio de tipo sin remontar y con el recargo intacto, totem apoyado en la vereda en Front y Night, luminancia de SPEC 12 en facade, letters y totem, poste y base sin emisión, 390, 768 y 1440 px, selector de tres botones con el modo cartel al cargar. Al cerrar, push y verificación del deploy.
- TAREA_018 · set de capturas de validación: `scripts/capturas.mjs` levanta el dev server, abre Playwright, bloquea Supabase y rehace 18 PNG en `validacion/` (ignorado por git) para que Canal B vea el preview por Filesystem. No toca escena, motor, panel, JSON ni tests. Detalle en docs/tareas/TAREA_018_capturas_validacion.md.
  - Comando: `npm run capturas`
  - Aceptación: build sin warnings y bundle igual a TAREA_017 salvo la caída de `@supabase/supabase-js`, que no importa ningún archivo de `src/`; 202 tests sin editar ni sumar; lint limpio y sin guiones largos; los 18 PNG con sus nombres exactos, cada uno de más de 20 kB, ninguno uniforme y con el cartel dibujado en los siete del preview; cero requests a supabase.co completadas y cero filas nuevas en `visits`; dos corridas seguidas dan el mismo set sin pasos manuales; `validacion/` ignorado y `git status` limpio después de correr; commit, push y deploy verificado si el bundle cambió.
- TAREA_013 · landing en `/`: qué es, para quién, dos botones a las demos, los dos tiers con precio, contacto, footer. Reemplaza el índice temporal, que hoy muestra los slugs crudos. Va última del bloque a propósito: hacerla con la estética vieja es trabajo que se tira.
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
