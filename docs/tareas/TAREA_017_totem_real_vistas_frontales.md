# TAREA_017 · El totem se dibuja de verdad y salen las vistas en angulo

Bloque 4. Va despues de TAREA_016 y antes de TAREA_013 (landing).

Prerrequisito: docs/STATE.md, SPEC 5.1, 10 y 12 (version 1.15), docs/EXECUTION.md.

## Contexto

Hoy el totem se dibuja igual que el cartel de fachada y cobra 400 USD (270.000 ARS) de recargo por una estructura invisible. Decision tomada: no se saca el tipo y no se reemplaza por un cartel bandera perpendicular a la pared, porque en modo cartel no hay pared contra la que ser perpendicular y en fotos frontales un cartel perpendicular se ve de canto. Se dibuja el totem con panel, poste y base.

## Alcance

### A. Geometria del totem, en los dos modos

- Panel: el actual, con ancho y alto de la seleccion, espesor fijo (`SET.sign.thickness`) y texto en relieve de 3 mm con SignText3D, sin cambios.
- Poste vertical centrado debajo del panel y base apoyada en el piso.
- Origen del grupo del totem en la cara inferior de la base. Base de y 0 a `TOTEM_BASE_HEIGHT`, poste de `TOTEM_BASE_HEIGHT` a `TOTEM_POST_HEIGHT`, panel desde `TOTEM_POST_HEIGHT` hacia arriba.
- Constantes nombradas en `sceneGeometry.ts`, como las de la luz de estudio, nunca en el JSON:
  - `TOTEM_POST_HEIGHT` 1,10 m
  - `TOTEM_BASE_HEIGHT` 0,08 m
  - `TOTEM_BASE_DEPTH` 0,50 m
  - `TOTEM_POST_WIDTH_RATIO` 0,12 del ancho del panel, con clamp entre 0,12 y 0,35 m
  - `TOTEM_POST_DEPTH_FACTOR` 1,6 por el espesor del panel
  - `TOTEM_BASE_WIDTH_RATIO` 0,45 del ancho del panel, con piso de 0,50 m
  - `TOTEM_STRUCTURE_METALNESS` 0,2 y `TOTEM_STRUCTURE_ROUGHNESS` 0,6
- Poste y base en el color `--q-muted` del tema, derivado en `scenePalette`. Ningun hexadecimal en un componente de escena.
- Poste y base nunca emiten. front y back siguen afectando solo al panel, con las reglas de SPEC 12.
- Poste y base siguen al ancho amortiguado del panel, igual que halo y sombra.
- Sombra de apoyo del totem: el quad del degradado radial horizontal sobre el piso, centrado bajo la base, de 1,6 veces su ancho y su profundidad, en los dos modos. facade y letters quedan como estan.
- El tipo se resuelve en `visuals.ts`, que es donde se busca por id: `SignVisual.totem`. El preview no busca nada por id.

### B. Encuadre y orbita

- `sceneGeometry.ts` devuelve la caja del totem completo (panel, poste y base) y su centro.
- En modo cartel la distancia derivada de la huella proyectada usa esa caja, y el target de la camara y de OrbitControls es su centro. Margen 12 por ciento, polar 0,6 a 1,5, sin cambios.

### C. Modo vista

- `photos[].anchorGround` opcional: `{ x, y, metersToWidth }`. x e y son el punto de apoyo de la base, en fraccion del ancho y del alto de la foto, origen arriba a la izquierda. metersToWidth es la fraccion del ancho de la foto que ocupa un metro a la distancia del totem, mayor que el del anchor.
- Tipo totem y foto con anchorGround: el apoyo de la base cae en (x, y) con lens shift y la distancia sale de su metersToWidth. `cameraYawDeg`, `cameraPitchDeg` y `fovDeg` siguen saliendo del anchor.
- Validacion en `src/core/clientConfig.ts`: anchorGround, si esta, con x e y entre 0 y 1 y metersToWidth mayor que 0. Si el cliente ofrece el tipo totem y una foto no tiene anchorGround, falla al cargar con un mensaje que nombra el slug y el id de la foto.
- Calibracion con capturas hasta que la base apoye en la vereda, delante de la vitrina, sin tapar la puerta, con altura total plausible contra la puerta de la foto (unos 2,1 m). Front y Night del mismo cliente comparten valores.

### D. Salen las vistas en angulo

- Salen de `northline.json` y `norte.json` las fotos `angle-left-day` y `angle-right-day`. Quedan Front y Night.
- Se borran los cuatro .webp sin referencia de `public/assets/quote/backgrounds/`.
- El selector queda en tres botones: viewSignOnly, Front, Night. El modo cartel sigue seleccionado al cargar.
- El test de `clientConfig.test.ts` que lista las cuatro ids pasa a listar las dos: es el unico test previo que cambia, y cambia por este punto.

### E. Documentos

SPEC 1.15 (5.1, 10 y 12), tres lineas en DECISIONES, entrada en EXECUTION, STATE al cierre.

### Fuera de alcance

Motor de precios, flujo de lead, hoja imprimible, typeface. Ningun tipo de cartel ni asset nuevo.

## Archivos

- `src/verticals/signs/scene/sceneGeometry.ts`, `sceneGeometry.test.ts`, `SignBoard.tsx`, `SignScene.tsx`
- `src/verticals/signs/PhotoStage.tsx`, `src/verticals/signs/visuals.ts`
- `src/core/types.ts`, `src/core/clientConfig.ts`, `src/core/clientConfig.test.ts`
- `src/clients/northline.json`, `src/clients/norte.json`
- `public/assets/quote/backgrounds/` (cuatro .webp borrados)
- `SPEC.md`, `docs/DECISIONES.md`, `docs/EXECUTION.md`, `docs/STATE.md`, `docs/tareas/_ULTIMO.md`

## Criterios de aceptacion

Medidos, con el numero anotado en la seccion Resultados al cierre.

- G1: build sin warning de presupuesto, app por debajo de 500 kB, vendor 3D por debajo de 1000 kB, sin pedidos de red nuevos.
- G2: tests en verde. Los 194 previos intactos, salvo la lista de ids de fotos, mas los nuevos de la caja del totem.
- G3: modo cartel, totem, los dos clientes, capturas a 0, 45, 90 y 180 grados de azimut en los dos extremos del polar: se ven panel, poste y base; nada toca el borde; margen minimo en px.
- G4: extremos del rango de ancho y alto en los dos clientes: la base es mas angosta que el panel y mas ancha que el poste, y nada se sale del cuadro.
- G5: facade, totem, facade no remonta el canvas ni reinicia la seleccion, y el precio sigue mostrando la linea de recargo de tipo. priceFixed 400 en EN y 270000 en ES sin cambios.
- G6: modo vista, Front y Night, los dos clientes, con totem: la base apoya en la vereda y la altura es plausible contra la puerta. Una captura de cada una.
- G7: las tres comparaciones de luminancia de SPEC 12 en facade y letters, y las dos de la cara tambien en totem.
- G8: poste y base no emiten: la luminancia del poste entre none y back difiere menos del 3 por ciento.
- G9: 390, 768 y 1440 px sin scroll horizontal con el selector de tres vistas.
- G10: el selector muestra tres botones y el modo cartel arranca seleccionado.

## Commits y deploy

1. Apertura: SPEC 1.15, DECISIONES, EXECUTION y este archivo.
2. Codigo.
3. Cierre: resultados en este archivo, STATE, DECISIONES y `_ULTIMO.md` en 018.

Push a origin/main y verificacion de que /d/northline y /d/norte responden 200 en produccion con el commit nuevo. Si el checkpoint de seguridad de Vercel frena curl y headless, la verificacion queda pendiente de Canal C.

## Resultados

Medido el 14/09/2026 en Chromium headless con SwiftShader, canvas de 769 x 431 px a 1440 px de viewport.

- G1: build sin warnings. App 420,02 kB, vendor 3D 963,55 kB. Pedidos al cargar y recorrer las tres vistas: pagina, favicon, logo, HDRI, typeface y las dos fotos frontales del cliente. Ninguno nuevo; salen los de las dos fotos en angulo.
- G2: 202 tests en verde. De los 194 previos cambian tres, solo por el punto D: la lista de ids de fotos pasa de cuatro a dos, y dos tests que usaban photos[2] y photos[3] pasan a photos[1]. Nuevos: 4 del totem en sceneGeometry y 4 de anchorGround en clientConfig.
- G3: 16 capturas de totem a 0, 45, 90 y 180 grados en polar 0,6 y 1,5, los dos clientes. Se ven panel, poste y base. Margen minimo al borde: 40 px en los dos clientes. Es el margen de 12 por ciento del alto: 431 x (1 - 1 / 1,24) / 2 = 41,7 px.
- G4: extremos de ancho y alto, de frente, en px de captura:

| Cliente | Ancho x alto | Panel | Base | Poste |
|---|---|---|---|---|
| northline | min x min | 145 | 121 | 29 |
| northline | min x max | 59 | 49 | 11 |
| northline | max x min | 607 | 277 | 35 |
| northline | max x max | 595 | 265 | 33 |
| norte | min x min | 143 | 121 | 29 |
| norte | min x max | 57 | 49 | 11 |
| norte | max x min | 605 | 277 | 35 |
| norte | max x max | 575 | 257 | 33 |

  Base mas angosta que el panel y mas ancha que el poste en los ocho. 16 capturas mas de esos extremos a 0 y 90 grados en los dos polares: margen minimo 40 px.
- G5: facade, totem, facade con el ancho al maximo: el canvas conserva la marca puesta antes del cambio (no se remonto) y el ancho sigue en 20 ft y 6 m. Linea de recargo con totem: "Sign structure $400" y "Estructura $ 270.000". priceFixed sin cambios.
- G6: anchorGround calibrado en captura. northline { x 0,23, y 0,925, metersToWidth 0,13 } y norte { x 0,25, y 0,9, metersToWidth 0,11 }, compartidos entre Front y Night. La base apoya en la vereda delante de la vitrina izquierda y la puerta queda libre. Altura: la puerta de la foto mide 185 px en northline y 140 px en norte para 2,1 m (88 y 67 px por metro); el totem por defecto mide 2,01 m en 201 px y 2,10 m en 178 px (100 y 85 px por metro), mas grande por metro porque esta mas cerca de la camara. Capturas: `t17/northline-vista-0.png`, `-1`, `t17/norte-vista-0.png`, `-1` en la sesion.
- G7: luminancia de la cara, none / front / back.

| Cliente | Tipo | Modo cartel | Modo vista, cara | Modo vista, anillo |
|---|---|---|---|---|
| northline | facade | 212,4 / 223,0 / 210,2 | 211,0 / 222,3 / 213,3 | 143,2 / 143,2 / 145,5 |
| northline | letters | 233,2 / 239,5 / 233,7 | 236,1 / 244,9 / 239,2 | 192,5 / 192,5 / 200,6 |
| northline | totem | 212,7 / 223,4 / 210,6 | 155,5 / 161,9 / 159,1 | no aplica |
| norte | facade | 196,6 / 208,4 / 194,8 | 199,0 / 211,2 / 201,0 | 222,3 / 222,3 / 222,6 |
| norte | letters | 233,8 / 240,4 / 234,5 | 236,1 / 245,4 / 239,1 | 219,9 / 220,2 / 222,4 |
| norte | totem | 197,5 / 209,4 / 195,8 | 147,2 / 154,0 / 151,9 | no aplica |

  En letters, modo vista, la cara y el anillo se miden sobre la silueta de las letras (erosionada 1 px, y banda de 1 a 4 px por fuera), no sobre la caja: la caja mezcla la foto entre letras y el halo que se ve por los huecos, y daba back mayor que front en la cara. facade en modo vista queda identico pixel a pixel a TAREA_016.
- G8: luminancia del centro del poste en modo cartel, none y back: northline 151,3 y 151,3, norte 155,7 y 155,7. Diferencia 0,00 por ciento.
- G9: 390, 768 y 1440 px en los dos clientes: scrollWidth igual al ancho de la ventana, selector de tres botones sin desborde.
- G10: tres botones (The sign, Front, Night; Solo el cartel, Frente, Noche) y el primero con aria-pressed true al cargar.
