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

## Bloque 9 · viernes 18 · salida comercial

Sin tareas de código salvo arreglos bloqueantes.

- Canal C: portfolio item en el perfil de Upwork, que sí admite enlace a sitio, con el video, las capturas y el enlace a https://quote.lokebox.com.
- Canal C: planilla plantilla de precios para el cliente, la que el listado promete en "Your prices, in the spreadsheet I send you".
- Canal C: lista de cartelerías de Tucumán con WhatsApp, y plantilla del mensaje de salida en frío.
- Canal C, cuando el listado salga de Under Review: agregar el enlace a la demo y quote-northline.pdf editando el proyecto aprobado (D38).
- Cierre: docs/STATE.md con el resultado del DONE de SPEC 17, punto por punto.

## Bloque 10 · Quote premium

Objetivo: que el configurador resista una comparacion lado a lado con un configurador comercial de referencia (D48), con ese nivel en core (SPEC 18).

- TAREA_028, panel, composicion y control de sombras: criterios en docs/tareas/TAREA_028_panel_composicion_y_control_de_sombras.md.
- Proxima tarea del bloque 10: pendiente de brief de Canal B.
