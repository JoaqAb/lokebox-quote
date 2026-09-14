# TAREA_015 · Cierre del modo cartel

Bloque 4. Va despues de TAREA_014 y antes de TAREA_013 (landing).

Prerrequisito: docs/STATE.md, docs/EXECUTION.md bloque 4, SPEC 10 y 12 (version 1.13).

## Contexto

TAREA_014 dejo el viewer en dos modos. El modo cartel tiene tres defectos:

1. Girado a unos 60 grados, la punta cercana de un cartel ancho se sale del cuadro. La distancia base encuadra solo el frente con 15 por ciento de margen por lado y no mira la perspectiva de la caja girada.
2. En back la cara sigue emitiendo. De frente, sin girar, back y front casi no se distinguen, y un back-lit real tiene la cara apagada y el resplandor detras.
3. La luz sale del `light` de la primera foto, que es la luz de una foto y no la de un estudio.

Esta tarea reabre solo el modo cartel. El modo vista y la calibracion de las ocho fotos no se tocan.

## Alcance

### 1. Encuadre en modo cartel

- La distancia de camara se deriva en cada frame de la huella proyectada de la caja del cartel con la orientacion actual de la camara (azimut y polar), con damp.
- Margen: 12 por ciento por lado. Misma convencion que el 15 de TAREA_014: el cuadro mide la huella por 1,24 en cada eje, con el centro del cuadro en el target.
- La caja es ancho, alto y espesor: en modo area el panel con `SET.sign.thickness`; en modo letters el conjunto de letras, con el ancho total de la palabra, el alto de letra y `visual.depthMeters`. Nunca una sola letra.
- Calculo cerrado y puro en `sceneGeometry.ts`: para cada una de las ocho esquinas y cada eje de la camara, la distancia minima que la deja dentro del cuadro con margen. Manda la mayor.
- No se usa la esfera contenedora ni un margen fijo: la esfera dimensiona para el peor caso y achica el cartel en la vista frontal, que es la que se ve al cargar.
- El slider de zoom queda como multiplicador sobre esa distancia, entre 1,0 y 0,55, solo acercar.
- Al entrar al modo cartel la distancia se aplica de golpe; despues sigue con damp. Con `prefers-reduced-motion` va sin damp.

### 2. Back en modo cartel

- La cara frontal no emite y queda en el color del material apenas oscurecido, con una constante nombrada.
- Emiten los cantos y la cara trasera, igual que hoy.
- Vale para el panel y para cada letra.
- Sin halo, igual que hoy.
- Modo vista sin cambios: su cara, su halo y su tabla de luz quedan como en 1.12.

### 3. Criterio de luminancia de SPEC 12

Tres comparaciones sobre la region del cartel, que reemplazan al par actual:

1. La cara crece de none a front.
2. La cara baja de front a back.
3. El anillo inmediato crece de front a back, en modo vista.

La 1 y la 2 se miden en modo vista con la misma foto y tambien en modo cartel, de frente y sin girar.

### 4. Luz del modo cartel

- Deja de salir del `light` de la primera foto.
- Luz de estudio propia del modo: el HDRI mas una key, con constantes nombradas en `sceneGeometry.ts`.
- No va al JSON del cliente: es del producto.
- En modo vista la luz sigue saliendo del `light` de la foto elegida.
- `PhotoStage` y `SignPreview` dejan de recibir y pasar `lightPhoto`.

### 5. Defectos de la validacion en captura

No se agregaron defectos: el brief llego sin lista.

## Archivos

- `src/verticals/signs/scene/sceneGeometry.ts`, `src/verticals/signs/scene/sceneGeometry.test.ts`
- `src/verticals/signs/scene/SignScene.tsx`, `src/verticals/signs/scene/SignBoard.tsx`
- `src/verticals/signs/PhotoStage.tsx`, `src/verticals/signs/SignPreview.tsx`
- `src/verticals/signs/calibration/CalibrationPreview.tsx`: solo sale la prop `lightPhoto`.
- `SPEC.md` (1.13), `docs/DECISIONES.md`, `docs/EXECUTION.md`

## Criterios de aceptacion

- G1 a G6. Los 181 tests previos quedan intactos salvo los que cambian por el contrato de SPEC 12, y esos se editan sin tocar un numero que no cambio.
- En modo cartel, girando 360 grados en los dos clientes y con el cartel en su medida maxima, ninguna punta se sale del cuadro en ningun azimut, verificado en captura en el extremo del rango.
- De frente, el cartel ocupa al menos tanto cuadro como hoy con el 15 por ciento fijo. Medido, no a ojo.
- Back se distingue de front en modo cartel sin girar, con las dos mediciones de cara.
- Las tres comparaciones de luminancia de SPEC 12, con numeros, en los dos clientes.
- El modo vista y los anchors de las ocho fotos quedan identicos: ninguna medicion de perspectiva cambia.
- Vendor 3D por debajo de 1000 kB. Esta en 962: sin dependencias nuevas.
- 390, 768 y 1440 px sin defectos.

## Commits

1. Docs de apertura: SPEC 1.13, docs/DECISIONES.md, este archivo y la entrada en EXECUTION.
2. Codigo.
3. Docs de cierre: docs/STATE.md reescrito, docs/DECISIONES.md con lo que salga de la ejecucion, docs/tareas/_ULTIMO.md en 016.
