# EXECUTION · Lokebox Quote

Orden de bloques y criterios de aceptación de lo que está abierto. El alcance está en SPEC.md. El estado vivo está en docs/STATE.md.

Qué tareas están cerradas y con qué commit está en docs/tareas/INDICE.md, que es la única fuente de eso. Acá no quedan criterios de tareas cerradas.

Reglas:

- Un bloque se cierra solo cuando todos sus criterios están verificados, no cuando el código "parece andar".
- El chat orquestador (Desktop) trabaja con un tope de 3 turnos por chat, y los pasos manuales de Canal C van agrupados al final de cada bloque, nunca intercalados entre tareas de código.
- Al cerrar cada tarea: commit, docs/STATE.md, docs/tareas/INDICE.md y docs/tareas/_ULTIMO.md actualizados.
- Todo paso de Canal C se entrega con el cómo: navegación exacta, nombre y valor de cada campo, comandos listos para copiar, verificación posterior, y para grabaciones el guion con tiempos.
- Criterios técnicos que se repiten en todas las tareas de código (G):
  - G1 `npm run build` en verde, sin errores ni warnings.
  - G2 `npx tsc -b --force` con 0 errores.
  - G3 `npm run lint` sin hallazgos.
  - G4 `npm test` en verde cuando hay tests.
  - G5 Sin guiones largos en ningún archivo nuevo o editado.
  - G6 Nada de parches. Si algo pide un workaround, se frena y se reporta.

## Bloque 7 · jueves 17 · visibilidad de precio y Canal C

- TAREA_021 · etapa 1 de la visibilidad de precio de SPEC 6.2 por D30: `exact`, `range` y `hidden`, la columna `lines` de `leads`, la plantilla de brief sin precio de la hoja, y el nombre público del producto en la landing. Detalle en docs/tareas/TAREA_021_visibilidad_de_precio.md.
  - Aceptación: G1 a G6. Topes de bundle por grupo de SPEC 3: three-vendor por debajo de 1000 kB, react-vendor por debajo de 250 kB, suma de chunks de app por debajo de 500 kB. `/` sigue sin pedir el vendor 3D.
  - Sin editar los JSON de la demo, las dos demos sirven `range` y su bloque de precio se ve igual que hoy, comparado contra el set anterior de `validacion/`.
  - `exact`: estimado y disclaimer, sin línea de rango, con el desglose intacto.
  - `hidden`: cero precio en el cotizador, ni bloque, ni barra de mobile, ni desglose. Ningún control tapado y CTA a la vista a 1440 y a 390.
  - `gated`, `internal` y un valor desconocido fallan la validación al cargar, con el valor en el mensaje.
  - El lead escribe `lines` con el desglose del motor en los tres modos y en los dos canales.
  - En `hidden` el mensaje de WhatsApp sale de la plantilla sin precio, sin ningún placeholder sin resolver y sin cifras de precio; si falta la clave, la validación falla nombrándola.
  - En `hidden` la pantalla de gracias lleva a `/d/<slug>/quote` y la hoja renderiza el brief sin precio en una página. La hoja no escribe nada en Supabase en ninguno de los tres modos.
  - `calculatePrice` no cambia: un test verifica que la salida es idéntica con los tres valores de `display`.
  - Los 223 tests previos no se editan, salvo lo que el contrato nuevo obligue, y cada edición queda justificada en DECISIONES con su motivo.
  - Capturas de `exact` y `hidden` en `validacion/`, con la edición temporal del JSON revertida y `git status` limpio.
  - Landing con el nombre y el pie nuevos, `landing-1440.png` rehecha, sin la palabra gratis y sin promesa de prueba (D25).
  - Al cerrar, push y verificación del deploy repitiendo el curl hasta tres respuestas nuevas seguidas.
- Canal C pendiente, con el cómo de cada paso:
  - Rehacer `desktop-1.png` y `mobile-1.png` del material de venta.
  - Imprimir la hoja de cotización a PDF desde el navegador y revisar que entre en una página.
  - Ver las dos demos en un teléfono real y confirmar fps con GPU de verdad. Todas las mediciones de fps previas están hechas sobre SwiftShader por software.
  - Al final de todo, borrar las filas de prueba de `leads` y de `visits`.

## Bloque 8 · viernes 18 · publicación

Sin tareas de código salvo arreglos bloqueantes.

- Canal C: publicar el listado en el Project Catalog con el precio de D17, el video y las capturas.
- Canal C: armar la planilla plantilla de precios para el cliente.
- Canal C: lista de 40 cartelerías de Tucumán con WhatsApp, y plantilla del mensaje de salida en frío.
- Cierre: docs/STATE.md con el resultado del DONE de SPEC 17, punto por punto.
