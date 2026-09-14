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
