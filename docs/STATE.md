# STATE

12/09/2026

## Bloque actual

Bloque 4, TAREA_010 cerrada: el preview pasa de escena 3D completa a foto fija del cliente con el cartel 3D compuesto encima, en canvas transparente y zoom por CSS. Salieron fachada, vidriera, vereda, poste, orbita, barrido, degradacion y dusk; el motor, el panel, el cartel y la hoja quedaron intactos. 120 pruebas en verde, SPEC 1.9.

## Ultimo cerrado

TAREA_010, commits 5f84ef0 (apertura), eadde33 (codigo). Produccion: https://quote.lokebox.com

## Proximo

TAREA_011 (assets reales + calibracion), TAREA_012 (letras corporeas, el alcance de la vieja 010 sin cambios) y TAREA_013 (landing).

## Bloqueos

Las fotos de fondo son placeholders de color solido en `public/clients/<slug>/photos/front.png` y `angle.png`, 1600x900. Joaquin las reemplaza por las reales (Canal C) pisando el archivo, sin tocar codigo ni el JSON si conserva el nombre; si cambia de nombre o de extension, se actualiza `photos[].src`. Al reemplazarlas hay que reajustar `anchor` de cada foto contra la pared real. El HDRI va en `public/hdri/studio.hdr` y su carga es opcional: sin el, el preview anda sin reflejo.

## Comando para retomar

```
cd ~/proyectos/lokebox-quote && cat docs/STATE.md docs/EXECUTION.md
```
