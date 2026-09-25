# TAREA_034 · Camara de arranque y acabados de cajas

Bloque 12 · Segunda vertical. Correccion de la revision R1 de TAREA_033. Decisiones: D150 a D152. SPEC 2.15: 21.4 (materials[].visual) y 21.5 (Camara).

## Objetivo

Que cajas se vea bien al cargar, sin tocar nada de carteles. Dos cambios:

1. La camara de cajas arranca en tres cuartos y desde arriba (D151). Hoy arranca como carteles, casi de frente, con la tapa rasante, y las capturas solo se ven bien porque el script arrastra la orbita.
2. Los materiales de cajas se leen como carton y como rigido (D152). Hoy el foam con normalScale 0,35 se lee como revoque en la tapa del mailer (foldline 01) y el rigido sale con poros (foldline 05).

## Reglas

- Las de TAREA_033 siguen: vara de carteles (snapshot y URLs con toStrictEqual, las 31 capturas identicas con la vara de D147, ningun JSON de carteles editado), una vertical no importa de otra, sin parches, .env.local sin cat.
- AGENTS.md, docs/planillas/, docs/comercial/plantillas/ e incoming/ no se tocan ni entran a ningun commit.
- La landing no cambia.

## Fase 1 · Arranque de camara por vista (core)

- `StudioFrame` (src/core/preview/studioFraming.ts) suma un campo opcional `start` con el azimut en grados y el polar en radianes. Sin `start`, el arranque es el de hoy: azimut 0 y `STUDIO_VIEW.startPolar`. El polar de `start` tiene que caer dentro de `minPolar` y `maxPolar`; si no, lanza con el valor en el mensaje.
- El primer frame usa `start` en lugar del valor fijo. El resto del hook no cambia: cambiar la pieza no devuelve la camara al arranque.
- `StudioOrbitControls` sigue igual. Verificar que OrbitControls toma la posicion inicial de la camara y no la pisa en el primer frame; si la pisa, se frena y se reporta.
- Tests del core: sin `start` la direccion es la de hoy (mismo vector exacto); con `start` la direccion es la de `orbitPosition`; polar fuera de rango lanza.
- Carteles no pasa `start`. Vara de carteles completa.

## Fase 2 · Cajas usa el arranque

- La vista de cajas pasa un `start` nombrado en su propio modulo (por ejemplo `BOX_START`), sin vocabulario de cajas en el core.
- Valores de partida: azimut 35 y polar 1,0. Se ajustan mirando las capturas hasta cumplir el criterio 4. Se reporta el valor final.
- `scripts/vitrina.mjs` deja de arrastrar en cajas: se borra `BOX_ORBIT` y todo lo que lo usa. Las doce capturas salen con la camara de carga.

## Fase 3 · Acabados de cajas (solo JSON)

- En `src/clients/foldline.json` y `src/clients/cajasur.json` se ajustan solo `finish` y `normalScale` de `materials[].visual`, con los tres acabados del core (foam, brushed, polished). Nada de codigo.
- Objetivo visual (SPEC 21.4 desde 2.15): kraft y blanco con un relieve apenas visible, que se lea como carton y no como revoque, en la tapa y en los laterales; rigido liso con brillo suave (partida: polished).
- Si con los tres acabados no se logra, se frena con las capturas. No se crea un acabado nuevo (D124).
- Los colores mas claros con STUDIO_BRIGHT quedan aceptados (D152): no se tocan `color` ni la luz.
- El precio no depende del visual: el snapshot no cambia. Si cambia, se frena.

## Fase 4 · Verificacion y cierre

Build, tests, capturas, deploy y prueba en produccion, como TAREA_033. Filas de prueba de formulario con el nombre `Camara Test`; las de WhatsApp se reportan por cliente, canal y horario UTC.

## Criterios de aceptacion

1. `StudioFrame.start` opcional, con los tres tests del core en verde.
2. Carteles: snapshot y URLs iguales, las 31 capturas identicas a la linea base de TAREA_033 (D147), ningun JSON de carteles en el diff.
3. `git diff 691f087..HEAD -- src/clients/` toca solo foldline.json y cajasur.json, y solo `finish` y `normalScale`.
4. En las doce capturas de cajas, tomadas sin arrastre: en 01, 04 y 06 se ven la cara del logo y dos caras laterales; en 02, 03 y 05 se ve el interior abierto; ningun canto cortado; la caja ocupa el preview sin quedar chica en mobile (04).
5. En 01 y 02 la tapa y el fondo del kraft no muestran poros de revoque; en 05 el rigido se ve liso.
6. `grep -rnE "totem|letters|facade|signText|Sign[A-Z]|mailer|kraft|corrugated|BoxSelection|BoxesConfig|BoxPrice|BOX_START" src/core` da cero, tests incluidos. Cero imports cruzados entre verticales.
7. `grep -n BOX_ORBIT scripts/vitrina.mjs` da cero.
8. Produccion: foldline y cajasur cargan con el arranque nuevo, flujo completo con lead por su CTA, gracias y hoja en 200, 0 errores de consola. Los cinco de carteles igual que el criterio 14 de TAREA_033.
9. Vercel en Ready, las siete rutas, las hojas y la landing en 200.
10. Tests: total mayor o igual a 382 mas los nuevos. G1 a G6.

## Cierre

Commits: apertura de docs (esta tarea, SPEC 2.15, DECISIONES D150 a D152, STATE e INDICE, ya escritos en disco sin commitear), fase 1, fase 2, fase 3, cierre de docs. STATE, INDICE con la fila de TAREA_034, _ULTIMO en 035 y DECISIONES con lo decidido durante la tarea, una linea cada una. En la entrada del bloque 13 de DECISIONES, sumar: el arranque de camara por vista (D151) y que la hoja no muestra breakdownCaption en ninguna vertical (hallazgo 5 de TAREA_033).

Reporte a Canal B con tope de 15 lineas mas las tablas: hashes, criterios uno por uno, valores finales de `start` y de cada `visual` cambiado, y hallazgos. El reporte completo va tambien a una seccion "Resultado" al final de este archivo, dentro del commit de cierre. Si se frena, el reporte del freno va a esa seccion en un commit de docs y no se sigue.

## Resultado
