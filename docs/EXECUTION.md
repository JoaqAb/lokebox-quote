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

## Bloque 6 · miércoles 16 · oferta, identidad y defectos de la demo

- TAREA_020 · subset del typeface con Ñ y vocales con tilde, los dos defectos visuales de D24, el logo de Lokebox en la landing, la sección de oferta en lugar de los tiers, capturas de landing rehechas, PRICING.md con el esquema de D17 y el borrador del texto del Catalog. Open Graph al final, recortable. Detalle en docs/tareas/TAREA_020_oferta_identidad_defectos.md.
  - Aceptación: G1 a G6. Topes de bundle por grupo de SPEC 3: three-vendor por debajo de 1000 kB, react-vendor por debajo de 250 kB, suma de chunks de app por debajo de 500 kB.
  - `/` sigue sin pedir el vendor 3D ni los assets del preview.
  - El typeface por debajo de 60 kB con el número medido, y con Ñ, Á, É, Í, Ó, Ú y Ü dibujando letra.
  - Cero strings de UI en `src/landing`. El woff2 de títulos no existe y no se agrega.
  - Al cerrar, push y verificación del deploy repitiendo el curl hasta tres respuestas nuevas seguidas.

## Bloque 7 · jueves 17 · visibilidad de precio, naming y Canal C

- Etapa 1 de la sección 6.2 de SPEC, por D30: `exact`, `range` y `hidden`, la columna `lines` de `leads` y la plantilla de brief sin precio de la hoja. `gated`, `internal` y `?view=owner` quedan para después del viernes salvo que sobre tiempo.
  - Aceptación: G1 a G6. `pricing.display` opcional con default `range` y los JSON de la demo sin editar. El lead guarda el desglose en `lines` en los tres modos. En `hidden` el CTA de confirmación lleva a la misma hoja, que renderiza el brief sin precio, y la hoja sigue sin escribir nada.
- Naming comercial: nombre y categoría del listado, con dato de búsqueda del Project Catalog. Ninguna línea de código depende de esto. El nombre interno del repo queda congelado en `lokebox-quote`.
- Canal C pendiente, con el cómo de cada paso:
  - Grabar el video de 30 segundos y sacar las capturas, desktop y mobile, demo EN.
  - Ver las dos demos en un teléfono real y confirmar fps y nivel de rendimiento con GPU de verdad. Todas las mediciones de fps previas están hechas sobre SwiftShader por software.

## Bloque 8 · viernes 18 · publicación

Sin tareas de código salvo arreglos bloqueantes.

- Canal C: publicar el listado en el Project Catalog con el precio de D17, el video y las capturas.
- Canal C: armar la planilla plantilla de precios para el cliente.
- Canal C: lista de 40 cartelerías de Tucumán con WhatsApp, y plantilla del mensaje de salida en frío.
- Cierre: docs/STATE.md con el resultado del DONE de SPEC 17, punto por punto.
