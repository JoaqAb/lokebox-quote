# STATE

15/09/2026

## Bloque actual

Bloque 4, codigo cerrado. TAREA_013 cerrada: landing en `/` con JSON propio validado, rutas de cliente con React.lazy y chunk react-vendor separado del vendor 3D (React estaba dentro de three-vendor desde TAREA_004). SPEC 1.17. 215 pruebas en verde.
Bundle por grupos: app 252,03 kB, react-vendor 189,60 kB, three-vendor 952,28 kB. `/` carga en 38 ms de peor caso y no pide el vendor 3D. `/d/northline` muestra panel y canvas juntos a unos 380 ms, 225 a 260 ms mas tarde que antes del lazy loading.
`npm run capturas` rehace 21 capturas en `validacion/`, tres de la landing.

## Ultimo cerrado

TAREA_013: 2241051 (apertura), cd37310 (codigo). Numeros y frenada en docs/tareas/TAREA_013_landing.md.

## Proximo

Canal C, pasos 3 y 4. El jueves, con el video: el corte de controles al borde del scroll del panel.

## Bloqueos

En norte de dia el anillo de back de facade crece menos de un nivel. El typeface no trae Ñ ni vocales con tilde. Canal C: borrar de `visits` las filas HeadlessChrome del 14/09.

## Comando para retomar

`cd ~/proyectos/lokebox-quote && cat docs/STATE.md docs/tareas/TAREA_013_landing.md`
