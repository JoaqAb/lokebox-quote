# TAREA_026 · Integracion fotografica

Bloque 10, Quote premium. Cuarta de cinco.

Prerrequisito: docs/STATE.md, CLAUDE.md, SPEC 12 (version 2.5) y
docs/tareas/TAREA_025_detalle_del_objeto_y_halo.md.

## Contexto

Canal B acepta TAREA_025 (D70 a D74). Queda un defecto medido del halo de letras: con la banda de
0,3 del alto de letra sube 52 niveles en 5 px contra la foto y hace meseta entre letras, y se lee
como una placa blanca con borde (D75). Ademas el cartel en modo vista todavia se lee pegado sobre
la foto: no proyecta sombra y su luz no toma el color de la foto. Esta tarea suma la sombra
proyectada de la key de la foto sobre un receptor de solo sombra (D76) y tine ambiente y key con
la crominancia de la foto alrededor del anclaje (D77). El criterio 6a pasa a excluir la zona de
sombra (D78).

## Alcance

### 0. Apertura (commit de docs)

- TAREA_025 cerrada y aceptada. INDICE con 2360566. STATE sin los bloqueos de los criterios 5 y 7.
- DECISIONES D70 a D78.
- SPEC 2.5: seccion 12 con D71, D72 y D75 a D78.
- EXECUTION con TAREA_026 en lugar de TAREA_025.

### 1. Halo en letters (D75)

Archivos: `src/verticals/signs/scene/haloGeometry.ts`, `src/verticals/signs/scene/sceneGeometry.ts`.

- La banda de letters deja de ser 0,3 del alto de letra y pasa a `HALO_LETTERS_BAND`, fraccion
  del alto de letra, elegida entre 0,5 y 1,0 por medicion para cumplir el criterio 3.
- Fachada y totem no cambian. El pico sigue saliendo de `light.ambient` (D65).

### 2. Sombra proyectada en vista (D76)

Archivos: `src/verticals/signs/scene/SignScene.tsx`, `src/verticals/signs/scene/SignBoard.tsx`,
`src/verticals/signs/scene/sceneGeometry.ts`.

- Receptor de solo sombra (`ShadowMaterial`): en facade y letters un plano en la pared detras
  del cartel; en totem un plano de piso en el apoyo de `anchorGround`. Tamano: la caja del cartel
  mas un margen con nombre.
- Proyecta la key de la foto, con su azimut y elevacion. Solo en vista.
- La camara de sombra se ajusta a la caja del cartel mas ese margen.
- Opacidad derivada de `light.ambient` y de la intensidad de la key, con constantes nombradas: a
  mas ambiente, menos sombra.
- La sombra compone como cobertura por `CoverageToneMapping`. Se verifica en la sonda que no deja
  anillo ni borde.
- Quad de apoyo en vista: medir la huella con el receptor y sin el quad, en los tres tipos, los
  dos clientes y la foto de dia. Si el receptor oscurece la huella 10 niveles o mas en todos los
  casos, el quad sale de vista. Si no, queda. Reportar los numeros.

### 3. Casado de tono (D77)

Archivos: `src/core/preview/photoTint.ts` (nuevo, funcion pura), `src/verticals/signs/PhotoStage.tsx`,
`src/verticals/signs/scene/SignScene.tsx`.

- `photoTint` recibe los pixeles RGBA de la foto y un rectangulo normalizado, y devuelve la
  crominancia media en lineal, normalizada a luminancia 1. Sin React ni three.
- PhotoStage la calcula una vez por foto cargada, en un rectangulo centrado en el (x, y) del
  anclaje, con ancho y alto en fraccion de la foto como constantes con nombre. No depende del
  tamano del cartel: mover un slider no cambia el tono.
- En vista, ambient y key se mezclan con ese color segun `TINT_STRENGTH`. El modo cartel no cambia.

## Criterios de aceptacion

1. G1 a G6 de EXECUTION.
2. Capturas con `npm run capturas` en `validacion/premium/026/`, con el recorrido de 025.
3. Halo, en los 36 cuadros back de vista: pendiente media contra la foto (pico sobre ancho de
   banda en px) de 5 niveles por px o menos; pico de dia 30 o menos y de noche 45 o mas; fuera
   de la banda, diferencia 0; forma con D71, 36 de 36.
4. Sombra: en totem de dia, la vereda junto a la base, del lado opuesto al azimut de la key, se
   oscurece 15 niveles o mas, tres materiales y dos clientes. En facade y letters de dia la
   sombra aparece del lado opuesto a la key, con niveles y px reportados. De noche, cada tipo
   tiene menos sombra que de dia.
5. 6a segun D78. Fuera del cartel, en back, sigue valiendo el criterio 3.
6. Tono: en none en vista, la distancia a*b* de CIELAB entre la media de la cara y la del anillo
   baja 30 por ciento o mas contra las capturas de 025, promediada por cliente. La luminancia
   media de la cara se mueve 5 niveles o menos.
7. Luminancia de SPEC 12 con D66 y D72: pasa en todos los cuadros.
8. Criterio 3 de 024 sin regresion.
9. Modo cartel sin cambios: cada cuadro de modo cartel a 1 nivel o menos de su cuadro de 025.
10. Primer frame en slow 4G de 6 s o menos.
11. `src/core` sin imports de `src/verticals` ni de `src/clients`.
12. Tests: `photoTint` con tests propios. Los demas cambian solo por la banda de letters y por el
    receptor.

Frenar y reportar solo si la sombra sobre el canvas transparente no compone sin anillo, o si el
primer frame pasa de 6 s.

## Commits

1. docs: cierre de TAREA_025, apertura de TAREA_026, SPEC 2.5 y D70 a D78.
2. feat: integracion fotografica.
3. docs: cierre de TAREA_026.

Despues de los tres, push.

## Freno (23/09/2026)

Estado: frenada por la condicion de freno de la sombra. Codigo sin commitear en el arbol de trabajo;
mediciones en `validacion/premium/026/mediciones.md`.

La sombra sola compone exacta por CoverageToneMapping. En back, donde el halo cae sobre la sombra,
el pixel mezcla dos coberturas de distinto color y el tone mapping de la mezcla sale mas claro que
la suma de las capas: la sombra desaparece dentro de la banda y queda un escalon en su borde
(northline fachada de dia, abajo: none -92 a -98, back 2, 7, 20, 27). Para Canal B, ademas: el
totem de noche no cumple la pendiente de 5 con la banda fija y el pico de D65; la sombra de piso del
totem no se ve con la camara de SPEC 12 (decision del 14/09); el tono baja 34 por ciento en
northline y 28 en norte.

## Revision (23/09/2026, SPEC 2.6, D79 a D82)

Canal B resuelve el freno. Sigue sobre el arbol de trabajo, sin descartar lo hecho.

- Capa de atenuacion (D79): `src/core/preview/RenderPipeline.tsx`, `src/core/preview/CoverageToneMapping.tsx`
  y la constante de capa junto a la del bloom en `src/core/preview/render.ts`. Los receptores de
  sombra pasan a esa capa y salen del pase principal.
- Totem sin halo en vista (D80): `src/verticals/signs/scene/SignBoard.tsx`.
- Camara de vista (D81): donde se arma hoy con el anchor (`SignScene.tsx`), con la geometria pura
  en `sceneGeometry.ts` y sus tests.

Criterios, que reemplazan a los de arriba donde se pisan:

1. G1 a G6.
2. Capturas en `validacion/premium/026/`, con el recorrido de 025.
3. Composicion: en la sonda, sobre fondo gris medio, el cuadro back con sombra coincide a 2 niveles o
   menos con la formula de D79 aplicada a halo y sombra medidos por separado. En northline fachada
   de dia la franja de abajo conserva la sombra bajo el halo.
4. Halo, en los 24 cuadros back de vista de facade y letters: pendiente contra la foto de 5 niveles
   por px o menos; pico de dia 30 o menos y de noche 45 o mas; fuera de la banda, diferencia 0;
   forma sobre negro (D71), 24 de 24.
5. Totem en vista: sin halo en los 12 cuadros; de dia la vereda del lado opuesto a la key se
   oscurece 15 niveles o mas en 6 de 6; la cara superior de la base se ve; de noche, menos sombra
   que de dia.
6. Anclaje: con la camara nueva, el apoyo del totem y el centro de facade y letters caen en su
   (x, y) de la foto a 1 px o menos, en las cuatro fotos.
7. Sombra de facade y letters, 6a (D78), luminancia con D66, D72 y D80, criterio 3 de 024 y modo
   cartel igual a 025: sin regresion.
8. Tono: la distancia a*b* baja 25 por ciento o mas en cada cliente, y la luminancia de la cara se
   mueve 5 niveles o menos.
9. Primer frame en slow 4G de 6 s o menos.
10. `src/core` sin imports de `src/verticals` ni de `src/clients`.
11. Tests en verde. Cambian solo por la capa de atenuacion, la camara de vista, el halo del totem y lo
    que ya cambio en esta tarea.

Frenar y reportar solo si con la camara de D81 alguna foto deja el apoyo del totem fuera de la
vereda, o una fuga del cartel en contra de la fachada visible en captura, o si el primer frame pasa
de 6 s.

Commits: docs de D79 a D82 y SPEC 2.6; codigo; cierre. Despues, push de todo.
