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

## Bloque 9 · salida comercial

Sin tareas de código salvo arreglos bloqueantes. Los pasos, con el cómo completo, están en docs/comercial/CANAL_C_BLOQUE9.md.

- C1 Video de 30 s en inglés (escritorio, northline) y clip de 15 s en español (mobile vertical, norte), grabados sobre el layout de TAREA_030 (D112).
- C2 Video de 30 s subido a YouTube como no listado.
- C3 Listado del Catalog editado: video y galería nuevos, enlace a la demo y quote-northline.pdf (D38, D110).
- C4 Portfolio item publicado en el perfil de Upwork con video, capturas y enlace a https://quote.lokebox.com.
- C5 Planillas de precios en docs/comercial/plantillas/, en inglés y en español (D111).
- C6 Tres mensajes en frío enviados por WhatsApp (Lumilet, Multigráfica, GB) y registrados en el CRM.
- Cierre: docs/STATE.md con el resultado del DONE de SPEC 17, punto por punto.

## Bloque 11 · Vitrina

Corre en paralelo con el bloque 9: Code trabaja mientras Joaquín hace el Canal C comercial. Decisiones D114 a D118.

Cerrado el 24/09 (D129). Las tres demos de la vitrina entraron a la landing (D137, reemplaza a D118 en ese punto). Tres observaciones visibles pasan a la fase 0 de TAREA_032 (D130). Material elegido para portfolio y web nueva: la grilla 00 y las 01 a 06 de halcyon y alba, y de afterglow las que salgan de la fase 0 de TAREA_032.

## Bloque 12 · Segunda vertical: cajas

Arranca con TAREA_031 aceptada. Decisiones D119 a D125. Corre en paralelo con el bloque 9. La tarea se escribe en el chat que acepta la anterior, con el código leído, y ese chat edita SPEC 4, 6, 8, 10 y 16 con el contrato real.

- T1 TAREA_032, contrato de vertical y motor genérico (SPEC 2.13: 4.4, 6.3). Fase 0 con los hallazgos visibles de la vitrina (D130 a D132): WhatsApp llega a gracias, escenario grafito con tema oscuro, alba y halcyon por JSON, pares mirados por Joaquín. Después, refactor sin cambio visible ni de datos con la vara de D122 contra la línea base de la fase 1: JSON sin editar, motor idéntico contra snapshot, URLs de hoja publicadas válidas, capturas de vitrina iguales dentro del ruido medido, cero vocabulario de carteles en src/core.
- T2 TAREA_033, vertical boxes con foldline y cajasur (D123 a D125). Flujo completo en los dos, precio por escalones con tests, logo en la tapa, tapa que abre y cierra, capturas de vitrina de los dos clientes con scripts/vitrina.mjs.
- R1 Canal B revisa las capturas de cajas contra las de carteles: tienen que parecer del mismo producto.
- Cierre: docs/STATE.md, y en docs/DECISIONES.md la lista de lo que la segunda vertical obligó a cambiar en el contrato, que es la entrada del bloque 13.

## Bloque 13 · Kit y agente

Arranca con TAREA_033 cerrada (D126). docs/verticales/KIT.md desde el contrato real, subagente en .claude/agents/vertical-builder.md y prueba con muebles a medida. Vara: la tercera vertical cierra con una sola ronda de correcciones. Las tareas se escriben al cerrar el bloque 12.

