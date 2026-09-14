# STATE

14/09/2026

## Bloque actual

Bloque 4. TAREA_018 cerrada: `npm run capturas` rehace 18 PNG en `validacion/` (ignorado por git) para que Canal B vea el preview por Filesystem. Levanta el dev server, aborta supabase.co y lo baja al terminar. Unos 50 s por corrida, mismo set en tres corridas.
TAREA_017: totem con panel, poste y base, anchorGround, solo vistas frontales. SPEC 1.15. 202 pruebas en verde.
Bundle: app 420,02 kB, vendor 3D 963,55 kB, igual a TAREA_017. Sale `@supabase/supabase-js`, que no importaba nadie; entra `playwright` como devDependency.

## Ultimo cerrado

TAREA_018: 5044602 (apertura), e51ee7e (codigo). Numeros y tamanos en docs/tareas/TAREA_018_capturas_validacion.md.

## Proximo

Canal B valida TAREA_014 a 017 y el criterio 2 de DONE sobre `validacion/`. Despues TAREA_013 (landing) y Canal C de video y capturas.

## Bloqueos

Cinco capturas del modo cartel pesan menos de 20 kB por el fondo liso; tienen el cartel dibujado. El typeface no trae Ñ ni vocales con tilde. Letras claras sobre fondo claro con poco contraste de frente. En norte de dia el anillo de back de facade crece menos de un nivel. Canal C: borrar de `visits` las filas HeadlessChrome del 14/09.

## Comando para retomar

`cd ~/proyectos/lokebox-quote && cat docs/STATE.md docs/tareas/TAREA_018_capturas_validacion.md`
