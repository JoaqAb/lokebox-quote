# STATE

12/09/2026

## Bloque actual

Bloque 4, TAREA_010: pivote del preview. Se descarta la escena 3D completa (fachada, vidriera, vereda, poste, orbita, barrido, degradacion, dusk) y el cartel pasa a componerse sobre una foto fija del cliente, en canvas transparente, con zoom por CSS. Motivo: la escena costo tres bloques y seguia siendo un local generico de cajas. Detalle en `docs/tareas/TAREA_010_preview_foto_cartel.md`.

## Ultimo cerrado

TAREA_009, commits 0d0a7cb (apertura), 33dd207 (codigo), 02e11c1 (cierre). SPEC 1.9 con el pivote escrito. Produccion: https://quote.lokebox.com

## Proximo

TAREA_011 (letras corporeas, el alcance de la vieja 010 sin cambios) y TAREA_012 (landing).

## Bloqueos

Las fotos de fondo las provee Joaquin por Canal C: 2 o 3 por cliente, 16:9, ~1600x900, WebP, en `public/clients/<slug>/photos/`. Mientras no esten se usa un placeholder de color solido en la misma ruta: reemplazarlas es pisar el archivo, sin tocar codigo. El HDRI unico va en `public/hdri/` y su carga es opcional.

## Comando para retomar

```
cd ~/proyectos/lokebox-quote && cat docs/STATE.md docs/EXECUTION.md
```
