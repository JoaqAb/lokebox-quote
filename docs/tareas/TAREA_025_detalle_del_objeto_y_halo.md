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

## Resultado (23/09/2026)

Estado: entregada, con los criterios 4 (en parte), 5 y 7 para Canal B. Codigo en 2360566.
Mediciones en `validacion/premium/025/` (`medir.py`, `canto.py`, `sonda.mjs`, `c3.txt` a
`c7.txt`, `c4-forma.txt`, `sombra/medicion.txt`, `triangulos.txt`, `carga.txt`), capturas en
`despues/` y `sinbloom/`, 220 cuadros por corrida.

Causa del borde duro del halo, medida con `sonda.mjs` (fondo negro y blanco): AgX y la
codificacion sRGB se aplicaban al color premultiplicado del canvas transparente. La curva sobre
color por alpha no baja con el alpha: el ultimo pixel de la malla, alpha 0,06, salia en 69
niveles en lugar de 12, con rgb mayor que alpha, y cortaba a 0 fuera de la malla. No es el
emisivo por encima de 1: el halo es MeshBasic con color hasta 1. Se corrige en el pipeline del
core con `CoverageToneMapping`: la cobertura se mapea con su color derecho y vuelve a
multiplicarse por alpha; donde el mapa del bloom tiene resplandor se mapea como antes. En modo
cartel el cuadro cambia como mucho 1 nivel en unos mil pixeles.

1. G1 a G6: build sin avisos, tsc sin errores, lint limpio, 274 tests en verde, sin rayas largas.
2. Capturas: si, 220 en `despues/` y 220 en `sinbloom/`, con cartel60 en back.
3. Vista sin bloom: si, 36 de 36 cuadros de back identicos con y sin `VITE_QUOTE_BLOOM=off`.
4. 6b nuevo. Contra la foto: 0 pixeles fuera de la banda en 36 de 36; pico de dia 24 como
   maximo, de noche 50,6 como minimo. Forma, sobre fondo negro (la diferencia contra la foto
   suma los bordes de la foto dentro de la banda, una viga o una ventana): 28 de 36. Fallan 3 de
   fachada de dia en northline, salto 3,0 contra 2,9 permitido, por el escalonado de 8 bits con
   un pico de 32 niveles en 22 px; y 5 de letras de norte, banda de 5 a 6 px, donde las muestras
   de los lados caen en los huecos de la E (inferido).
5. Luminancia con D66: cara front mayor que none 42 de 42, opacos 28 de 28, anillo en vista 24
   de 24, anillo del acrilico en el techo 2 de 2, acrilico en modo cartel 4 de 4. No en acrilico
   en vista, 8 de 8: sin bloom (D64) la cara de back queda debajo de front (215 contra 218 de dia
   en northline) y su desviacion sube. Con translucency 1 la media pasa (224,5 contra 218,4) pero
   la desviacion sube mas (27,9 contra 23,6): la cara incluye el relieve, que no emite. Choque
   entre D64 y D57 para Canal B. translucency queda en 0,4.
6. Criterio 3 de 024: si, 36 de 36.
7. Brillo de canto: no, 1 de 6 (fachada, cartel60, none). El canto de 4 mm mide cerca de 1 px y
   refleja el hueco oscuro del rig entre modulos: en chapa se lee como linea oscura. Probado sin
   commitear: radio de 20 mm, 1 de 6; tiras de canto en el rig, 1 de 6 y la cara del PVC sube 9
   niveles, que mueve el criterio 6. Para Canal B.
8. Sombra de apoyo: la sombra de mapa oscurece la huella 0 niveles en los 6 casos, porque en
   modo cartel no hay receptor debajo del cartel. El quad queda. Sobre el cartel aporta poco:
   0 px en el relieve de fachada, hasta 221 px con maximo 11 niveles en letras y totem.
9. Primer frame en slow 4G 3,9 s, 567 kB. Cartel mas pesado: letters con 18 ochos, 29.880
   triangulos. Panel redondeado 300 (cara 50, cascara 250), separadores 256.
10. Si: `src/core` sin imports de `src/verticals` ni de `src/clients`.
11. Tests: cambian por mount, la geometria nueva (panel, halo, relieve, separadores) y el
    contorno del halo en letters. 259 a 274.

Decisiones de ejecucion en DECISIONES (23/09/2026, TAREA_025).
