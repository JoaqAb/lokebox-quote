# TAREA_030 · Escenario claro y cartel que se lee blanco

Bloque 10, ultima tarea (D106). Decisiones: D103 a D107.

## Por que

El bloque 10 midio pixeles y niveles, y no lo que ve un comprador. El preview sigue sobre un gris plano (--q-stage) que se lee como un visor tecnico, y el cartel de PVC, que en el JSON es #E8E8E4, sale gris medio (lum 176) sobre ese gris. Esta tarea cambia lo que se ve a primera vista. No agrega metricas nuevas.

Referencia visual de la direccion (maqueta hecha sobre capturas, no es el resultado exacto): Joaquin la tiene en el chat de Canal B. Si hace falta, se la pide.

## Alcance

C1. Escenario claro de estudio (D103). --q-stage deja de ser un color plano. Pasa a un fondo claro calido: degradado vertical de blanco calido arriba a gris perla abajo, con una vineta suave, del mismo lado de la paleta que el panel. Es del core, vale para los dos modos y para los dos clientes, y no sale del JSON del cliente. En modo cartel el canvas es transparente (alpha) y el fondo lo pone CSS, sin plano de fondo en la escena. El piso de la escena solo recibe sombra (material de sombra sobre transparente), asi que la sombra de contacto se ve sobre el degradado y no hay horizonte visible.

C2. El cartel se lee del color del JSON (D104). En modo cartel, con iluminacion none, la cara de PVC se lee casi blanca: luminancia media de la cara 225 o mas en northline 1440x900 con los valores por defecto. Se ajusta la exposicion o la luz del estudio del modo cartel, no el color del material. Aluminio y acrilico tienen que seguir leyendose como metal y acrilico sobre fondo claro (reflejos visibles, no planos). Modo vista no cambia de luz: su luz sale de photos[].light.

C3. Luces apagadas al iluminar (D105). En modo cartel, con iluminacion front o back, el escenario pasa a un degradado oscuro (grafito, no el gris actual) para que el halo y la cara iluminada se vean. La transicion dura entre 300 y 450 ms, con Framer Motion o transicion CSS del fondo, sin remontar el canvas (C5 de 029 se mantiene). Volver a none vuelve al claro con la misma transicion. En modo vista no cambia nada.

C4. Foto de vista como objeto (D107). En escritorio la caja contain de vista lleva radio de 14 px y una sombra suave hacia abajo sobre el escenario claro. En mobile la foto va a todo el ancho sin radio ni sombra, y la franja de controles lleva el color del escenario. Selector y zoom quedan legibles sobre claro y sobre oscuro: se revisa contraste de la pastilla y del zoom en los dos estados.

C5. Material de venta regenerado con scripts/venta.mjs y og con scripts/og.mjs, con los mismos nombres que en 029.

C6. Build, tsc, lint y tests en verde. Primer frame en slow 4G no sube mas de 0,3 s sobre 029.

## Aceptacion

La acepta Joaquin mirando, no una metrica. Code entrega en validacion/premium/030/antes-despues/ seis pares lado a lado (029 a la izquierda, 030 a la derecha), northline salvo donde se indica:
1. 1440x900, modo cartel, fachada, PVC, none.
2. 1440x900, modo cartel, fachada, acrilico, back.
3. 1440x900, modo cartel, letras, aluminio, none.
4. 1440x900, vista Front, fachada, PVC, none.
5. 390x844 norte, modo cartel, fachada, PVC, none.
6. 390x844 norte, vista Frente.
Mas la medicion de C2 (luminancia media de la cara del par 1).

No se rehace el metodo de anclaje ni se miden subpixeles: el anclaje de vista no deberia moverse, y si los tests de anclaje existentes pasan, alcanza.

## Limite de tiempo

Si la tarea pasa de 2 horas de trabajo, Code frena, commitea lo que este sano en una rama y reporta que falta. No se persigue perfeccion en esta tarea.

## Fuera

Cambios de layout, panel, precios, textos (D96 sigue), fotos nuevas, shaders custom, postproceso nuevo.

## Resultado (24/09/2026)

Estado: entregada. Codigo en ed79a4e. Pares en `validacion/premium/030/antes-despues/`, capturas en
`antes/` (worktree en cd50de3) y `despues/`, con `pares.mjs`, `unir.py`, `cara.py`, `c2-antes.txt`,
`c2-despues.txt`, `escenario.mjs`, `escenario.txt`, `escenario/`, `prueba-entorno/` y `carga.txt`.

- C1. Si. Estudio claro calido en los dos modos y los dos clientes, canvas transparente, sin plano
  de fondo ni horizonte: la sombra de apoyo cae sobre el degradado.
- C2. En parte. Cara de PVC del par 1: 226,1 de luminancia media sin las letras (215,3 con ellas),
  antes 175,9. Aluminio se lee metal, cepillado y con degradado. Acrilico: brillo en los cantos,
  cara bastante pareja. Probe entorno 1,5 y no cambia; no se persiguio mas (D106).
- C3. Si. Front y back pasan a grafito en 375 ms (opacidad 0,80 a los 150 ms), y none vuelve al
  claro igual. En vista con front el escenario sigue claro. Canvas sin remontar.
- C4. Si. Escritorio: radio de 14 px y sombra hacia abajo. Mobile: foto a todo el ancho, sin radio
  ni sombra, y la franja sobre el escenario. Selector y zoom legibles sobre claro y sobre grafito
  en los pares 1, 2 y 5.
- C5. Si. Material de venta 01 a 08, las seis de subir/ y la imagen de Open Graph, con los
  mismos nombres.
- C6. Si. Build sin avisos, tsc sin errores, lint limpio, 302 tests en verde, sin rayas largas.
  Slow 4G 4,1 s contra 4,0 de 029.

Decisiones de ejecucion en DECISIONES (24/09/2026, TAREA_030).
