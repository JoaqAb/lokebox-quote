# STATE

15/09/2026

## Bloque actual

Bloque 4, codigo cerrado. TAREA_013 cerrada: landing en `/` con JSON propio validado, rutas de cliente con React.lazy y chunk react-vendor separado del vendor 3D. 215 pruebas en verde. Bundle por grupos: app 252,03 kB, react-vendor 189,60 kB, three-vendor 952,28 kB. `npm run capturas` rehace 21 capturas en `validacion/`.
SPEC 1.18: SPEC y DECISIONES quedan alineados con la arquitectura de cinco modos de visibilidad de precio (`pricing.display`: exact, range, gated, hidden, internal), capacidades del core y no segmentacion por mercado. La demo publica usa range. Tarea de documentacion, sin codigo: no hay TAREA_NNN ni cambio en `_ULTIMO.md`.

## Ultimo cerrado

TAREA_013: 2241051 (apertura), cd37310 (codigo). Numeros y frenada en docs/tareas/TAREA_013_landing.md.

## Proximo

El proximo chat decide en que bloque de implementacion entra `pricing.display` y con que criterios de aceptacion. No hay scaffolding hecho. Sigue pendiente Canal C, pasos 3 y 4, y el jueves con el video: el corte de controles al borde del scroll del panel.

## Bloqueos

En norte de dia el anillo de back de facade crece menos de un nivel. El typeface no trae Ñ ni vocales con tilde. Canal C: borrar de `visits` las filas HeadlessChrome del 14/09.
Abierto, no bloquea implementacion: el naming comercial (nombre y categoria del listado) se decide el jueves 17/09 con dato de busqueda del Project Catalog. El nombre interno del repo queda congelado en lokebox-quote.

## Comando para retomar

`cd ~/proyectos/lokebox-quote && cat docs/STATE.md SPEC.md`
