# STATE

12/09/2026

## Bloque actual

Bloque 4. TAREA_008 cerrada: la orbita dejaba de responder porque el umbral de 45 fps era inalcanzable con vsync a 30 Hz y la escena caia al nivel 2 a los 5 segundos de cargar. Umbral a 24 fps, la orbita deja de apagarse por rendimiento y los limites se amplian. 13 criterios verificados, 130 pruebas en verde.

## Ultimo cerrado

TAREA_008, commits e750499 (apertura), cb03856 (codigo). TAREA_007 queda cerrada con esto. Bloque 3 cerrado completo. Produccion: https://quote.lokebox.com

## Proximo

TAREA_009 (tema claro) y TAREA_010 (landing en `/`). Despues, Canal C del bloque 4: video de 30 segundos y capturas.

## Bloqueos

Los tres criterios subjetivos de DONE los valida Joaquin sobre las cuatro URLs de produccion, ahora con la orbita viva. Pendientes que no bloquean: ver las dos demos en un telefono real y limpiar las filas de prueba de `leads` y `visits`.

## Comando para retomar

```
cd ~/proyectos/lokebox-quote && cat docs/STATE.md docs/EXECUTION.md
```
