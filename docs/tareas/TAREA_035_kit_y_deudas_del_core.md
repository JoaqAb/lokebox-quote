# TAREA_035 · Kit de verticales y deudas del core

Bloque 13 · Kit y agente (D126, D156). Brief de Canal B expandido por Code. Decisiones: D146, D147, D155 y D157 a D165. SPEC 2.17: 1 y 16, 4.4, 6.1, 8, 12 y 21.

## Objetivo

Dejar el core sin las deudas que dejo cajas y escribir el kit con el que el subagente arma una vertical nueva desde un brief. Tres fases:

1. Deudas del core: formatInteger (D159), leyenda del desglose en la hoja (D158) y encuadre de estudio que descuenta la franja de controles (D155, D160).
2. Kit (D161): docs/verticales/KIT.md y docs/verticales/BRIEF_PLANTILLA.md, escritos desde el codigo que queda despues de la fase 1.
3. Agente y CLAUDE.md: .claude/agents/vertical-builder.md en Sonnet y CLAUDE.md segun D161 y D164.

La prueba real del kit es TAREA_036 (muebles a medida), en una sesion limpia.

## Reglas

- Vara de carteles de D122 y D147 (snapshot y URLs con toStrictEqual, capturas con dos corridas, ningun JSON de carteles editado), salvo lo que cada punto lista como cambio esperado.
- Una vertical no importa de otra (D143). Sin parches (G6). .env.local sin cat.
- AGENTS.md, docs/comercial/plantillas/ e incoming/ no se tocan ni entran a ningun commit.
- La landing no cambia.
- Freno obligatorio al final de la fase 1: los pares de 1.4 los mira Joaquin (regla del 24/09). Sin su ok, por Canal B, no se sigue a la fase 2.

## Fase 1 · Deudas del core

### 1.1 formatInteger (D159)

- `src/core/pricing/format.ts` suma `formatInteger(value, locale)`: cero decimales con el locale del cliente. Lanza con un valor no entero y con uno no finito, con el valor en el mensaje. Nunca redondea.
- Tests con en-US, es-AR, en-GB y es-ES, mas los dos casos que lanzan.
- Cajas lo usa para la cantidad en `src/verticals/boxes/leadTokens.ts` y en todo lugar donde hoy usa `formatLength` para contar.
- Cambio esperado: ninguno visible en foldline ni en cajasur, porque la cantidad es entera.

### 1.2 Leyenda del desglose en la hoja (D158)

- `src/core/ui/QuoteSheet.tsx` muestra `breakdownCaption` encima del desglose en la plantilla con precio, en toda vertical. En la plantilla sin precio no. Si la vertical devuelve null, no hay linea.
- Cambio esperado: en carteles vuelve la linea de area del modo area; en cajas aparece la leyenda por caja y por pedido. El resto de la hoja no cambia.

### 1.3 Encuadre con la franja (D155, D160)

- `src/core/preview/studioFraming.ts` y `src/core/preview/StudioCamera.tsx` encuadran la huella en el canvas menos la franja de controles de `src/core/preview/PreviewControls.tsx`, centrada en ese rectangulo, con `setViewOffset` de la camara. El target y la posicion no se corren.
- El alto de la franja lo mide el core con ResizeObserver, no como constante.
- Vale para toda vertical en modo de estudio. El modo vista de carteles no se toca y tiene que salir identico.
- Tests de studioFraming con franja 0 (resultado igual al de hoy) y con franja mayor que 0.
- Cambio esperado: modo cartel y cajas cambian solo por encuadre.

### 1.4 Capturas y freno

- `scripts/vitrina.mjs` en dos corridas (D147) sobre el commit de antes y sobre el de despues.
- Pares antes y despues en `validacion/premium/035/pares/`:
  - foldline y cajasur: 04 mobile y 01 desktop.
  - northline y alba en modo cartel, en 390 y en 1440.
  - Hoja de northline (area), de northline (letters) y de foldline.
- Se frena ahi con el reporte de la fase 1. No se sigue a la fase 2 sin el ok de Joaquin.

## Fase 2 · Kit (D161)

Se escribe desde el codigo que quedo despues de la fase 1, no desde SPEC. Si difieren, manda SPEC 4.4 y se reporta.

### docs/verticales/KIT.md (tope 250 lineas)

Como se arma una vertical desde cero, con rutas exactas:

- El contrato: `src/core/vertical.ts`, logica y vista, el tercer tipo R y el patron de D157.
- El registro: `src/app/verticals.ts` y el cast unico.
- La parte del JSON que valida la vertical; que claves de texts son del core y cuales de la vertical (D135); units (D136).
- composePrice (D134, D141).
- Que ofrece `src/core/preview` y como se usa: StudioFrame con start (D151), estudio, key, sombra de apoyo, superficies fisicas, acabados, logo (D144).
- Formateadores: formatLength, formatInteger, areaUnitSymbol.
- Claves de la hoja y del lead.
- Prohibiciones (D116, D143): no importar de otra vertical, no tocar src/core.
- Tests que tiene que tener una vertical; tests que recorren clientes por vertical (D148); el fixture de precios (D140, D149); como sumar sus clientes a `scripts/vitrina.mjs`.
- Cierre: la lista de verificacion que el agente corre antes de reportar, G1 a G6 y los criterios propios.

### docs/verticales/BRIEF_PLANTILLA.md

Lo que Canal B completa para una vertical nueva: id, nombre, opciones con sus ids, formula de precio con todos los numeros en el JSON, que es por unidad y que es por pedido, preview (geometria, acabados, arranque de camara, control de vista si hay), dos clientes con locale, moneda, unidad, pricing.display y cta, claves de texts propias en los dos idiomas, y criterios de aceptacion. Un ejemplo completo, cajas, rellenado a partir de SPEC 21.

## Fase 3 · Agente y CLAUDE.md

- `.claude/agents/vertical-builder.md`: frontmatter con name, description y model sonnet. Lee KIT.md y el brief, arma la vertical en `src/verticals/<id>/`, sus clientes en `src/clients/`, sus assets, y su seccion de SPEC solo si el brief lo pide. No toca src/core, otras verticales, SPEC fuera de lo que pida el brief, ni STATE, EXECUTION, DECISIONES o INDICE. Si necesita tocar algo de eso, frena y reporta (D116). No hace push ni deploy. Reporte de 15 lineas.
- CLAUDE.md: sale la regla de la escena simple (D161); sale el deadline del 18/09 y la regla del viernes 18 (D164); "Hoy, carteleria" pasa a "Hoy, carteles y cajas" (D164).
- Verificacion sin construir nada: una sesion limpia de Claude Code invoca el agente con BRIEF_PLANTILLA.md y le pide solo que liste los archivos que crearia y que diga si algo del brief le falta. Se reporta que respondio.

## Cierre

- Backup de D163 (D165): con leads verificado en 3, DROP TABLE leads_backup_20260925 y rm de ~/backups/lokebox-quote/leads_prueba_20260925.json.
- Commit de cierre con STATE, INDICE con la fila de TAREA_035, _ULTIMO en 036 y DECISIONES con lo decidido en la ejecucion.
- Push a main y deploy como en TAREA_034.

## Criterios de aceptacion

Ademas de G1 a G6:

1. formatInteger con sus tests; cajas no usa formatLength para contar.
2. La hoja muestra breakdownCaption con precio y no sin precio, en las dos verticales.
3. Modo vista de carteles identico en dos corridas.
4. Snapshot de precios sin diff.
5. Pares de 1.4 aceptados por Joaquin: la pastilla no roza la caja en 04 mobile y nada queda corrido en modo cartel.
6. KIT.md en 250 lineas o menos, con rutas que existen (verificadas con ls).
7. BRIEF_PLANTILLA.md con el ejemplo de cajas completo.
8. vertical-builder.md con las prohibiciones de D161, en Sonnet.
9. CLAUDE.md sin la regla de escena simple ni el deadline del 18/09.
10. Backup borrado y leads en 3.

## Commits

Apertura de docs (esta tarea, SPEC 2.17, EXECUTION, STATE y DECISIONES D156 a D165), fase 1, fase 2, fase 3, cierre de docs.

## Reportes

Tope de 15 lineas: uno al terminar la fase 1, con los pares, y otro al cierre. El reporte va tambien a una seccion "Resultado" al final de este archivo. Si se frena, el reporte del freno va a esa seccion en un commit de docs.
