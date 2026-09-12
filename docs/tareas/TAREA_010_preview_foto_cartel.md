# TAREA_010 · Preview de foto fija con cartel 3D compuesto

Bloque 4. Pivote de arquitectura del preview: se descarta la escena 3D completa y el cartel pasa a componerse sobre una foto fija del cliente. Decision de producto de Joaquin, aprobada. SPEC pasa a 1.9.

Las letras corporeas, que eran TAREA_010, pasan a TAREA_011 sin cambios de alcance. La landing pasa a TAREA_012.

## 1. Por que

La escena 3D completa costo los bloques 2, 3 y medio 4 (TAREA_003, 004, 007, 008 y 009) y sigue siendo un local generico de cajas. Una foto real del rubro comunica en un segundo lo que la escena no comunica en diez, y el cartel, que es lo que se cotiza, sigue siendo 3D real con su material y sus modos de luz.

El costo hundido no es argumento para sostenerla: lo que se tira es geometria de set, no el motor de precios ni el cartel.

## 2. Que se descarta

Sale entero, con su codigo y sus pruebas:

- Fachada, puerta, vidriera, marcos, divisiones, zocalo, vereda y fondo (`Storefront.tsx`, el `SET` y el `PLACEMENT` de `sceneGeometry.ts`).
- Totem con poste. El tipo `totem` **sigue existiendo como tipo cotizable**: lo que sale es su geometria de poste, no su precio.
- Orbita, barrido de camara y `AutoOrbit.tsx`.
- Degradacion por rendimiento: `perfTier.ts`, `usePerfTier.ts` y sus pruebas. Sin escena que degradar, la escalera no tiene escalones.
- El escalar `dusk` y los colores de fondo y vereda derivados del tema.
- El criterio de luminancia contra la vidriera: sin vidriera no hay con que comparar.
- Sombras de contacto de drei.

## 3. Que se reutiliza sin tocar

- Motor de precios entero y sus pruebas.
- `SignBoard.tsx`: cartel, material, glifos, halo y la unica luz dinamica.
- `glyphTexture.ts` y `SignFace.tsx`.
- `supportShadow.ts`: el quad de apoyo sigue sirviendo, ahora contra la pared de la foto.
- Panel generico, capa de datos, CTA de WhatsApp, formulario y hoja imprimible.

## 4. Arquitectura nueva

Tres capas apiladas dentro del marco del preview, todas en el mismo cuadro 16:9:

1. **Foto**: `img` de fondo, del cliente, elegida por angulo.
2. **Canvas R3F transparente**: `alpha: true` y sin color de limpieza, con el cartel y nada mas.
3. **Controles**: selector de angulo y zoom, fuera del canvas.

El zoom es una transformacion CSS sobre el contenedor de las dos primeras capas, no un movimiento de camara: asi foto y cartel escalan juntos y no hay forma de que se desalineen.

Cambiar de angulo cambia de foto y de anclaje. No hay orbita: los angulos disponibles son los que el cliente tenga fotografiados.

## 5. Esquema de `photos` en el JSON del cliente

```json
"photos": [
  {
    "id": "front",
    "label": "Storefront",
    "src": "/clients/northline/photos/front.webp",
    "anchor": { "x": 0.5, "y": 0.38, "metersToWidth": 0.085, "yawDeg": 0, "pitchDeg": 0 },
    "light": { "ambient": 0.9, "keyIntensity": 1.4, "keyAzimuthDeg": -25, "keyElevationDeg": 35 }
  }
]
```

- `id`: unico dentro del cliente. El primero de la lista es el que se muestra al cargar.
- `label`: la etiqueta visible del angulo. Va aca y no en `texts` porque la cantidad de fotos varia por cliente y una clave fija por angulo no existiria. Es el mismo criterio que ya usan `options.types[].label` y `options.materials[].label`, que tampoco viven en `texts`.
- `src`: ruta publica, servida desde `public/clients/<slug>/photos/`.
- `anchor`: donde y de que tamano se dibuja el cartel sobre esa foto.
  - `x`, `y`: centro del cartel, en fraccion del ancho y del alto de la foto, con origen arriba a la izquierda.
  - `metersToWidth`: que fraccion del ancho de la foto ocupa **un metro** de cartel. Es la escala, y se expresa asi y no como un factor abstracto para que se pueda calcular con una medida conocida de la foto (el alto de una puerta, por ejemplo) en vez de a ojo.
  - `yawDeg`, `pitchDeg`: giro del cartel para acompanar el angulo de la foto. 0 en una foto frontal.
- `light`: la luz de la escena del cartel en esa foto, para que el volumen del cartel case con la foto.
  - `ambient`, `keyIntensity`: intensidades.
  - `keyAzimuthDeg`, `keyElevationDeg`: de donde viene la luz en esa foto. Sin esto, un cartel iluminado desde la izquierda sobre una foto con sol a la derecha se lee como pegado.

La validacion de runtime de `clientConfig.ts` exige la lista no vacia, ids unicos, `x` e `y` entre 0 y 1, `metersToWidth` mayor que 0, y los angulos finitos.

## 6. HDRI de estudio

Un solo archivo para todo el producto, no uno por cliente, en `public/hdri/`. CC0, entre 100 y 200 kB, formato `.hdr` o `.exr` chico. Se carga con `Environment` de drei apuntando a ese archivo local.

Sirve para que el material del cartel refleje algo: con solo una direccional y ambiente, `metalness` alto se ve gris plano y el aluminio no se distingue del PVC.

Si el archivo no esta, el preview funciona igual sin reflejo: la carga es opcional y su ausencia no rompe nada.

## 7. Fotos de fondo

Las provee Joaquin por Canal C: banco gratuito o generadas por IA, 16:9, aproximadamente 1600 x 900, WebP, 2 a 3 por cliente.

Si al ejecutar la tarea no estan, se avanza con placeholders de color solido del mismo aspect ratio y el punto de reemplazo queda anotado en STATE. El placeholder es un archivo real en la misma ruta, no una rama en el codigo: reemplazarlo es pisar el archivo.

## 8. Los tres modos de luz

Se siguen distinguiendo con luminancia medida, pero el criterio cambia de referencia porque ya no hay fachada ni vidriera contra que medir.

Criterio nuevo, sobre la region del cartel y su halo, con la misma foto en los tres:

- El contraste local del cartel contra su entorno inmediato crece de `none` a `front`.
- La luminancia del halo crece `none` menor que `front` menor que `back`.

El escalar `dusk` sale: con una foto fija de fondo, cambiar la hora de la luz del cartel sin que cambie la foto deja al cartel flotando en una escena que no le corresponde. Si Joaquin provee una foto de atardecer entre las 2 o 3, el efecto vuelve solo, y sin codigo.

## 9. Reglas

- Assets: esta tarea autoriza dos que antes estaban prohibidos, las fotos del cliente y el HDRI unico, y **solo esos dos**. Sigue prohibido todo modelo importado, archivo de fuente, `Text` y `Text3D`. SPEC 12 se reescribe en consecuencia: la prohibicion en bloque deja de ser cierta y dejarla escrita seria contradecirse.
- Cero strings de UI hardcodeados. Las etiquetas de angulo salen del JSON.
- `src/core` sigue sin importar de `src/verticals` ni de `src/clients`, y sin importar `three`.
- La interfaz del preview sigue siendo `selection`, `visual` y `theme`, mas la foto elegida. El preview sigue sin recibir la config completa.
- Sin librerias nuevas.
- Nada de parches. Si algo pide un workaround, se frena y se reporta.

## 10. Criterios de aceptacion

Los de `docs/EXECUTION.md`, bloque 4, TAREA_010, mas G1 a G6.

## 11. Fuera de alcance

Letras corporeas, que son TAREA_011, y la landing, que es TAREA_012.
