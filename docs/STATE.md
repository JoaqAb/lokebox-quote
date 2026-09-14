# STATE

14/09/2026

## Bloque actual

Bloque 4. TAREA_011 cerrada con un criterio abierto (HDRI, ver Bloqueos): ocho fotos reales en `public/assets/quote/backgrounds/<slug>-<angulo>.webp`, placeholders borrados, `?calibrate=1` solo en desarrollo, camara ortografica `manual` (bug de TAREA_010: el cartel desaparecia en cada resize), 127 pruebas en verde. Correspondencia por tema de color: client-a (Urban Premium, carbon y madera calida) = northline, por "estetica oscura, acento calido" de SPEC 11 y acento #D4550A. client-b (Showroom Light, piedra clara y cielo azul) = norte, acento frio #1D6FD0.
Anchors finales (x, y, metersToWidth, yawDeg, pitchDeg), una sola pasada contra el SignBoard real. northline: front-day y front-night 0.501, 0.2, 0.1, 0, 0 · angle-left-day 0.552, 0.23, 0.097, 50, -12 · angle-right-day 0.456, 0.207, 0.094, -44, -10. norte: front-day 0.501, 0.311, 0.07, 0, 0 · front-night 0.501, 0.304, 0.07, 0, 0 · angle-left-day 0.6, 0.332, 0.062, 46, -11 · angle-right-day 0.438, 0.304, 0.06, -25, -17.5

## Ultimo cerrado

TAREA_011, commits 7a54cee (apertura), 6646025 (codigo). Sin push ni deploy nuevo.

## Proximo

TAREA_012 (letras corporeas, docs/tareas/TAREA_012_letras_corporeas.md) y TAREA_013 (landing).

## Bloqueos

HDRI: baja bien de dl.polyhaven.org pero pesa 1.508.872 bytes, contra 100 a 200 kB de SPEC 3. No se commiteo; `HDRI_SRC` ya apunta a `/assets/quote/hdri/studio-small-08-1k.hdr` y sin el archivo el preview anda sin reflejo. Decidir: editar SPEC 3 o reducir el archivo. SPEC 10 dice 2 o 3 fotos por cliente y hay 4: falta editar SPEC. Canal C: borrar de `visits` las filas con user_agent HeadlessChrome del 14/09 (capturas de calibracion).

## Comando para retomar

`cd ~/proyectos/lokebox-quote && cat docs/STATE.md docs/tareas/TAREA_012_letras_corporeas.md`
