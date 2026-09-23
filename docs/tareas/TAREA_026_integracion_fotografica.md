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
