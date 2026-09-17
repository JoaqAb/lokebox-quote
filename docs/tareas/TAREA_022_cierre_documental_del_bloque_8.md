# TAREA_022 · Cierre documental del bloque 8

Bloque 8, jueves 17. Va despues de TAREA_021.

Tarea de docs. No se toca `src/`, ni `package.json`, ni tests. El codigo queda como lo dejo
TAREA_021 en el commit 3def20d.

Prerrequisito: docs/STATE.md, docs/tareas/INDICE.md, docs/tareas/_ULTIMO.md,
docs/DECISIONES.md y docs/comercial/CATALOG_LISTING.md.

## Contexto

El listado del Project Catalog se envio el 17/09/2026 y quedo en Under Review. La revision
de Upwork tarda hasta 5 dias habiles. Con eso el bloque 8 cierra en lo que dependia de este
repo y lo que queda es el bloque 9 del viernes 18, que es salida comercial.

Esta tarea escribe en docs lo que ya paso: las decisiones que se tomaron al armar el
listado, el estado real de CATALOG_LISTING.md como registro de lo enviado, el bloque 9 en
EXECUTION, y el STATE nuevo.

## Alcance

### 1. docs/DECISIONES.md

Siete lineas nuevas, fecha 17/09/2026, numeradas D37 a D43 siguiendo a D36. Una linea por
decision, con su motivo cuando lo tiene:

- D37: forma del listado enviado y motivo del nivel unico de entrega.
- D38: quote-northline.pdf y el enlace a la demo fuera del primer envio.
- D39: los siete puntos del abono y "lo que se construye por mas" publicados como FAQ.
- D40: titulo corto de respaldo anotado por el tope de 75 caracteres.
- D41: filas de prueba de `public.leads` y `public.visits` borradas.
- D42: el paso de medir fps en un telefono real sale del alcance.
- D43: `desktop-1.png` y `mobile-1.png` no existen mas.

Mas la linea de AGENTS.md que resuelve el punto 4.

### 2. docs/comercial/CATALOG_LISTING.md

Cuatro ediciones. El ingles ya aprobado no se reescribe, se mueve tal cual:

- La linea de Estado pasa a enviado el 17/09/2026 y Under Review, y aclara que el documento
  es el registro de lo que se envio mas lo que falta agregar despues de la aprobacion.
- "Abono, los siete puntos" y "Lo que se construye por mas" pasan a una seccion unica "FAQ",
  con el rotulo de que pregunta responde cada una.
- "Enlace a la demo" sale del cuerpo del listado. Su texto en ingles se conserva integro
  bajo una seccion nueva "Para agregar despues de la aprobacion", junto con
  quote-northline.pdf y el motivo de D38 en una linea. El texto no se borra: se pega cuando
  el proyecto se apruebe.
- En "Nombre, categoria y titulo", debajo del titulo actual, queda anotado el titulo corto
  de respaldo con el motivo de D40.

### 3. docs/EXECUTION.md

Por D20 el archivo solo contiene lo abierto. Se borran el bloque 7 y el bloque 8 completos y
entra el bloque 9 · viernes 18 · salida comercial, sin tareas de codigo salvo arreglos
bloqueantes, con cuatro pasos de Canal C y el cierre con el DONE de SPEC 17.

### 4. AGENTS.md

El 11/09 se decidio borrarlo para que CLAUDE.md sea la unica fuente de contexto de agentes.
Volvio a aparecer, sin seguimiento de git. Se compara contra CLAUDE.md: si no aporta ninguna
regla nueva, se borra y queda una linea en DECISIONES. Si aporta algo, no se borra nada, se
frena ese punto y se reporta.

### 5. docs/STATE.md

Reescrito completo, cinco secciones del formato fijo y tope de 25 lineas. Sale el
"carteleries" que tiene hoy el archivo.

### 6. INDICE y _ULTIMO

Fila de TAREA_022 con estado cerrada y su commit de cierre. `_ULTIMO.md` pasa a 023.

## Aceptacion

- G5: cero guiones largos en todo lo editado.
- Ningun archivo de `src/` modificado, verificado con `git status`.
- docs/EXECUTION.md sin ningun criterio de tarea cerrada.
- docs/STATE.md dentro de las 25 lineas, con las cinco secciones.
- Tres commits: apertura con este .md, cambios de docs, y cierre con STATE, INDICE y
  _ULTIMO.
