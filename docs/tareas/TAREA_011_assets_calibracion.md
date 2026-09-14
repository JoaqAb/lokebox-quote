# TAREA_011 · Integración de assets reales y calibración

Bloque 4. Alcance exclusivo de esta tarea. Letras corpóreas NO entra acá: es TAREA_012, en un chat aparte.

Prerrequisito: leer docs/STATE.md, docs/EXECUTION.md bloque 4 y SPEC.md secciones 5, 6 y 10 antes de tocar código.

## Nota de ruta

El paquete está en `incoming/lokebox-quote-preview-assets-2026-09-12.zip` (la carpeta se llama `incoming`, no `_incoming`). Verificar contra `SHA256SUMS.txt` dentro del paquete o al lado, según venga.

## Pasos

1. Descomprimir el paquete en un directorio de trabajo temporal (no directo a `public/`) y verificar cada archivo contra `SHA256SUMS.txt`. Si algún hash no coincide o falta un archivo esperado, frenar y reportar, no seguir con assets sin verificar.

2. Identificar cuál id de asset (`client-a` / `client-b`, o el naming que traiga el paquete) corresponde a cuál cliente real (`northline` o `norte`), por color de tema del paquete (Urban Premium = fachada oscura, Showroom Light = fachada clara), no por orden de archivo ni por convención de nombre. Dejar la correspondencia encontrada por escrito en el commit y en STATE.md, con el criterio usado (qué color o qué rasgo visual de cada foto llevó a la asignación).

3. Copiar los ocho `.webp` a `public/assets/quote/backgrounds/`, ya renombrados o organizados según corresponda a cada slug real (`northline`, `norte`), manteniendo trazabilidad de cuál id de origen es cada uno.

4. Correr `hdri/fetch-studio-small-08.sh` apuntando a `public/assets/quote/hdri/studio-small-08-1k.hdr`. Confirmar que el archivo baja y que su tamaño es coherente con SPEC 3 (HDRI único, 100 a 200 kB).

5. Cargar `manifest.json` del paquete y escribir el array `photos` de `northline.json` y `norte.json` con los anchors de arranque que traiga el manifest. Son valores de partida, no definitivos: no hace falta que estén ajustados a la perfección todavía. Respetar la forma de `photos[]` de SPEC 10 y el esquema de validación en runtime de TAREA_010 (`x`/`y` entre 0 y 1, `metersToWidth` mayor que 0, ángulos finitos, ids únicos).

6. Borrar los placeholders de color sólido de TAREA_010 en `public/clients/northline/photos/` y `public/clients/norte/photos/` (`front.png`, `angle.png` de color sólido), y actualizar `src` en los dos JSON si la extensión o la ruta cambia al pasar a `.webp` en `public/assets/quote/backgrounds/`. Si el reemplazo es foto por foto, mismo nombre, misma carpeta, no hace falta tocar `src`; documentar cuál de las dos formas se usó.

7. Modo de calibración: nueva ruta con query param `?calibrate=1` sobre `/d/<slug>`. Herramienta de desarrollo, no entra en SPEC 16 ni consume ninguna clave de `texts`, no aparece en ninguna ruta de producto.
   - Muestra la foto de fondo del ángulo activo a tamaño real dentro del marco del preview.
   - Un crosshair sigue el puntero sobre la foto.
   - En pantalla se lee, en vivo, `x` e `y` en las mismas unidades que el campo `anchor` (fracción 0 a 1 del ancho y alto de la foto), no en píxeles crudos.
   - Un control adicional de escala que permite ajustar `metersToWidth` y ver el efecto en vivo sobre el tamaño del cartel compuesto.
   - No persiste nada solo: los valores ajustados se leen en pantalla para copiarlos a mano al JSON (no hace falta que escriba el JSON por su cuenta, salvo que sea trivial hacerlo con un botón de "copiar como JSON").

8. Con la herramienta del punto 7, ajustar los anchors escritos en el punto 5 contra el `SignBoard` real (el cartel 3D compuesto) en las fotos reales de cada cliente. Una sola pasada de calibración: no dejar el ajuste a mitad para una segunda vuelta.

## Cierre

- Commit.
- `docs/STATE.md` actualizado: qué se cerró, la correspondencia de assets encontrada en el punto 2, y los anchors finales.
- `docs/tareas/_ULTIMO.md` a `012`.
- Crear `docs/tareas/TAREA_012_letras_corporeas.md` copiando tal cual el contenido de la entrada TAREA_012 de `docs/EXECUTION.md` bloque 4 (no existe ningún archivo previo de letras corpóreas en el repo para mover: se confirmó por búsqueda que nunca se creó como archivo aparte, así que el contenido de referencia es el que ya está en EXECUTION.md). No agregar ni quitar nada de ese texto al pasarlo al archivo nuevo.

## Criterios de aceptación

G1 a G6 (ver docs/EXECUTION.md). Además:

- Cero placeholders de color sólido restantes en `public/clients/northline/photos/` y `public/clients/norte/photos/`.
- `photos[]` de los dos clientes reales validado en runtime contra el esquema de TAREA_010 (falla con mensaje claro si falta una clave o un valor está fuera de rango).
- La herramienta de calibración no aparece en ninguna ruta de producto ni consume ninguna clave de `texts`.
- Los ocho `.webp` verificados contra `SHA256SUMS.txt` antes de copiarlos a `public/`.
- El HDRI descargado y de un tamaño coherente con SPEC 3.
- `docs/tareas/_ULTIMO.md` en `012` y `docs/tareas/TAREA_012_letras_corporeas.md` creado con el contenido de EXECUTION.md sin alterar.
