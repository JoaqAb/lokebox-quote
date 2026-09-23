# TAREA_025 · Detalle del objeto y halo

Bloque 10, Quote premium. Tercera de cinco.

Prerrequisito: docs/STATE.md, CLAUDE.md, SPEC 10 y 12 (version 2.4) y
docs/tareas/TAREA_024_iluminacion_y_materiales_pbr.md.

## Contexto

Canal B acepta TAREA_024 (D63). El criterio 6b de 024 pasa aca: en modo vista el bloom se
derrama sobre la foto fuera de la banda del halo, y el halo de CanvasTexture tiene borde duro
desde antes. Canal B cierra D59 con D64: en vista no hay bloom y el halo es el unico mecanismo
de luz fuera del cartel. El halo se rehace con una banda de 0,3 y un perfil sin escalon (D65).

Ademas, el objeto todavia se lee como render: cantos vivos que no toman el brillo del estudio,
relieve sin bisel y un panel pegado a la pared. Esta tarea suma cantos redondeados, bisel en el
relieve y separadores cuando el tipo se monta con standoff (D68), y decide la sombra de apoyo del
modo cartel con una medicion (D67).

## Alcance

### 0. Apertura (commit de docs)

- TAREA_024 cerrada, 6b trasladado aca por D63. INDICE con a0ee0d1. STATE sin el bloqueo de 6b.
- DECISIONES D63 a D69.
- SPEC 2.4: seccion 12 (halo D65, bloom D64, alpha y 6b con la banda nueva, luminancia D66,
  sombra de apoyo D67, cantos y bisel) y seccion 10 (mount, D68).
- EXECUTION con TAREA_025 en lugar de TAREA_024.

### 1. Bloom y halo en vista

Archivos: `src/verticals/signs/scene/SignBoard.tsx`, `src/verticals/signs/scene/haloGeometry.ts`,
`src/verticals/signs/scene/sceneGeometry.ts`.

- En vista, los emisores no entran a la capa de bloom (D64). Cambiar de modo no remonta el canvas.
  El core no cambia.
- Halo segun D65: banda de 0,3 del alto del cartel por lado; en letters, del alto de letra.
  Perfil decreciente hasta 0 en el borde, con derivada 0 en el borde. Pico derivado de
  `light.ambient` de la foto elegida, con constantes nombradas, sin campo nuevo en el JSON.
- Antes de tocar el perfil, medir donde esta el escalon de hoy: en el contorno, dentro de la
  banda o en el borde. Revisar si el color del emisivo por encima de 1 satura en AgX y arma una
  meseta. Reportar la causa en una linea y corregirla en su origen, sin compensar.

### 2. Detalle del objeto

Archivos: `src/verticals/signs/scene/sceneGeometry.ts`, `src/verticals/signs/scene/surfaceParts.ts`,
`src/verticals/signs/scene/SignBoard.tsx`, `src/verticals/signs/scene/typeface.ts`,
`src/core/types.ts`, `src/core/clientConfig.ts`, `src/clients/northline.json`,
`src/clients/norte.json`.

- Cantos redondeados en el panel de facade y en el del totem: radio `EDGE_RADIUS_M` 0,004 en
  `sceneGeometry.ts`, con tope de 0,3 del espesor. Se conserva la particion en cara y cascara
  sobre la misma geometria, que es lo que usa la seleccion de bloom. Un test verifica la normal
  de cada parte, como el de TextGeometry.
- El relieve del texto del modo area lleva bisel con la misma proporcion que las letras.
- `options.types[].visual.mount` (D68): tipo, validacion y valores en los dos JSON (facade
  standoff, totem flush).
- Separadores cuando mount es standoff: cuatro, inset en las esquinas, acabado brushed con
  metalness 1, separacion de pared 0,03 m y diametro 0,02 m, con constantes nombradas. En vista
  el panel queda a esa distancia de la pared y la sombra de apoyo acompana el corrimiento.
- Geometrias memoizadas y con dispose al desmontar, igual que los glifos.

### 3. Sombra de apoyo en modo cartel (D67)

Medir la luminancia en la huella de apoyo bajo el cartel, con la sombra de mapa prendida y
apagada, sin el quad de apoyo, en los tres tipos y los dos clientes. Si la sombra de mapa
oscurece esa huella 10 niveles o mas en todos los casos, el quad sale del modo cartel. Si no,
queda. Reportar los numeros. Si el quad queda, comprobar igual que la sombra de mapa se ve en el
relieve y entre letras; si ahi tampoco aporta, se reporta y no se apaga.

## Criterios de aceptacion

1. G1 a G6 de EXECUTION.
2. Capturas con `npm run capturas` en `validacion/premium/025/`, con el recorrido de 024 mas
   cartel60 en back.
3. Vista sin bloom: los cuadros de back, identicos pixel a pixel con y sin
   `VITE_QUOTE_BLOOM=off`, en los dos clientes, los tres tipos y los tres materiales.
4. 6b nuevo:
   - Fuera de la banda de 0,3, diferencia 0 contra la foto sola.
   - Sobre la normal al contorno, la diferencia contra la foto sola decrece y llega a 0 en el borde.
   - Ningun salto entre pixeles vecinos supera el doble de la pendiente media de la banda (pico
     sobre ancho en px), sin contar el primer pixel pegado al contorno.
   - Pico de dia: 30 niveles o menos. Pico de noche: 45 o mas.
5. Luminancia de SPEC 12 con D66: pasa en todos los cuadros, el anillo incluido.
6. Criterio 3 de 024 sin regresion: de frente mas de 10, en cartel60 mas de 6, los tres pares.
7. Brillo de canto: en cartel60 con none, el p95 de una franja de 3 px sobre el canto vertical
   visible del panel supera la mediana de la cara en 10 niveles o mas, en los tres materiales y
   los dos clientes.
8. Sombra de apoyo: decidida por la regla de la seccion 3, con los numeros.
9. Primer frame en slow 4G de 6 s o menos. Triangulos del cartel mas pesado (letters, 18
   caracteres) medidos y reportados.
10. `src/core` sin imports de `src/verticals` ni de `src/clients`.
11. Tests: solo cambian por mount y por la geometria nueva.

Frenar y reportar solo si el redondeo rompe la particion en cara y cascara sin una solucion
limpia, o si el primer frame pasa de 6 s.

## Commits

1. docs: cierre de TAREA_024, apertura de TAREA_025, SPEC 2.4 y D63 a D69.
2. feat: detalle del objeto, halo sin escalon y vista sin bloom.
3. docs: cierre de TAREA_025.

Despues de los tres, push.
