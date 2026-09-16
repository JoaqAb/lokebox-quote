# STATE

17/09/2026

## Bloque actual

Bloque 7, codigo cerrado. TAREA_021: etapa 1 de la visibilidad de precio de SPEC 6.2 por D30. `exact`, `range` y `hidden` con validacion que rechaza `gated` e `internal`; la columna `lines` del lead; la plantilla de brief sin precio de la hoja; las dos plantillas de WhatsApp sin precio, opcionales y condicionales; y el nombre publico Lokebox Quote Builder en la landing. 237 pruebas en verde. Bundle por grupos: app 255,65 kB, react-vendor 189,60 kB, three-vendor 952,28 kB, CSS 23,89 kB.
Las cuatro capturas de demo del set de 21 salieron byte a byte iguales a las de TAREA_020, o sea que `range` no cambio de forma, y hay cinco capturas mas de verificacion de `exact` y `hidden` en `validacion/`. SPEC 1.20, naming comercial cerrado en D31.

## Ultimo cerrado

TAREA_021: b586608 (apertura), 3def20d (codigo). Numeros y verificaciones en docs/tareas/TAREA_021_visibilidad_de_precio.md.

## Proximo

Canal C del bloque 7: rehacer `desktop-1.png` y `mobile-1.png`, imprimir la hoja a PDF y revisar que entre en una pagina, ver las dos demos en un telefono real con GPU de verdad, y al final borrar las filas de prueba. Despues, bloque 8 del viernes 18: publicar el listado con el texto de `docs/comercial/CATALOG_LISTING.md`, la planilla de precios, la lista de 40 carteleries y la plantilla del mensaje.

## Bloqueos

En norte de dia el anillo de back de facade crece menos de un nivel.
Despues del viernes, salvo que sobre tiempo: `gated`, `internal` y `?view=owner`, la etapa 2 de SPEC 6.2 por D30.

## Comando para retomar

`cd ~/proyectos/lokebox-quote && cat docs/STATE.md SPEC.md`
