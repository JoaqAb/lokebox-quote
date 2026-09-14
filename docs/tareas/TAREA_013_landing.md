# TAREA_013 · Landing en /

Bloque 4. Ultima tarea de codigo del bloque: despues va el Canal C de video y capturas.

Prerrequisito: docs/STATE.md, docs/EXECUTION.md bloque 4, SPEC 13 y SPEC 15.

## Brief

Reemplazar el indice temporal de `/`, que hoy muestra los slugs crudos (`src/pages/IndexPage.tsx`). Pagina en `/` con identidad Lokebox:

- que es el producto;
- para quien;
- boton a la demo EN (`/d/northline`) y boton a la demo ES (`/d/norte`);
- los dos tiers con precio, Starter y Standard (SPEC 15);
- contacto.

Corta, segun SPEC 13.

Restricciones vigentes: sin guiones largos; sin strings de UI hardcodeados salvo la pantalla de error; colores del tema Lokebox y no los de northline ni norte (esta pagina no tiene JSON de cliente); nada de codigo compartido con Lokebox.

## Expansion

- Textos, precios, contacto y colores de la landing salen de un JSON propio, `src/landing/landing.json`, validado en runtime como el de cliente. La landing no es un cliente: no entra al registro de `src/clients` ni tiene ruta `/d/`.
- Los botones a las demos son enlaces nativos a `/d/northline` y `/d/norte`, no rutas armadas desde el registro.
- La pagina no importa nada de three ni del preview: tiene que cargar en menos de 2 segundos.
- No inserta visitas: el tracking de SPEC 14 es por slug de cliente.

## Datos que SPEC no fija

Se confirman con Joaquin antes de escribir codigo: precio de cada tier, colores de la identidad Lokebox, datos de contacto publicos e idioma de la pagina. Ver docs/DECISIONES.md al cerrar.

## Criterios de aceptacion

- G1 a G6.
- La landing carga en menos de 2 segundos (medido).
- El boton EN lleva a `/d/northline` y el boton ES a `/d/norte`, verificado en navegador.
- Cero strings de UI en el codigo de la landing: todo sale de `landing.json`.
- Mobile 390 px sin scroll horizontal.
