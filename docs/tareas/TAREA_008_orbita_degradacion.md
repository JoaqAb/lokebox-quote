# TAREA_008 · Orbita y degradacion de rendimiento

Bloque 4. Abre de nuevo TAREA_007, que queda sin cerrar hasta que esta termine: el criterio 3 de DONE de SPEC 17 (sin errores visibles) falla hoy en produccion. SPEC pasa a 1.6 con esta tarea, solo en la seccion 12.

## 1. Que reporto Joaquin

Sobre `https://quote.lokebox.com/d/northline` y `/d/norte`, en produccion:

- El movimiento de camara es muy acotado.
- Al poco tiempo de arrastrar, la camara deja de responder.

## 2. Diagnostico

Reproducido en ventana headed sobre GPU real, no en headless y no sobre SwiftShader.

- GPU: `ANGLE (AMD, AMD Radeon Graphics (radeonsi renoir ACO), OpenGL 4.6)`.
- Fps medidos en la pagina, en ventanas de 2 segundos: **30,1 fps**, estables. Es el techo de vsync de la ventana, no una escena pesada: la escena no llega a exigir mas.
- `PERF.minFps` vale **45**. Como 30 es menor que 45, **toda** ventana de medicion falla, siempre, en cualquier escena.
- La escalera baja de a un nivel por ventana: calentamiento de 1000 ms, primera ventana de 2000 ms a los 3 s (nivel 1), segunda a los 5 s (nivel 2). El descenso es monotono, asi que no vuelve.
- En nivel 2, `SignScene` desmonta `OrbitControls` **y** `AutoOrbit`.

Medicion decisiva, sin ninguna interaccion del usuario: la escena se mueve sola (barrido de `AutoOrbit`) durante los primeros 4 segundos y **a los 5 segundos queda congelada para siempre**. Desde ahi, arrastrar no hace nada.

**Causa raiz**: el umbral de 45 fps es inalcanzable en una ventana con vsync a 30 Hz, que es una condicion normal y no una falla. La escena cae al nivel 2 a los 5 segundos de cargar, sola, y el nivel 2 apaga la orbita. Lo que Joaquin lee como "deja de responder al poco tiempo de arrastrar" es la orbita ya muerta antes de que el empiece a arrastrar.

Los 45 fps venian de mediciones de los bloques 2 y 3 tomadas sobre SwiftShader por software, que no son validas para GPU real y nunca representaron un techo de vsync.

El segundo sintoma, "movimiento muy acotado", es independiente: el azimut esta clampeado a +-0.4 rad, que son +-23 grados, sin polar util y sin zoom.

## 3. Recalibracion de la escalera

La escalera sigue siendo la misma: tres niveles, el mismo orden, sin escalones nuevos ni reordenados, sin volver a subir de nivel y sin caer a 2D.

Umbrales:

| | antes | ahora | por que |
|---|---|---|---|
| `minFps` | 45 | 24 | Queda por debajo de todo techo de vsync habitual (30, 60, 90, 120 Hz). Un dispositivo a 30 Hz sano deja de ser tratado como uno que no da abasto. Por debajo de 24 la escena si se ve a los tirones. |
| `warmupMs` | 1000 | 2000 | El primer segundo todavia tiene compilacion de shaders y subida de geometria. |
| `windowMs` | 2000 | 3000 | Una ventana mas larga diluye un tiron aislado, que hoy alcanza para bajar un nivel de forma permanente. |

Que apaga cada nivel:

- Nivel 0: todo.
- Nivel 1: sin sombras de contacto, techo de dpr mas bajo.
- Nivel 2: ademas sin barrido de camara y dpr 1.

**La orbita deja de ser uno de los escalones que se apagan.** Es entrada del usuario, no costo de dibujo: su costo por cuadro es despreciable frente a las sombras de contacto y al dpr, y apagarla no se distingue de una pagina rota. El barrido automatico si sigue en el nivel 2, porque es animacion continua y es cosmetica.

Se retira tambien el reseteo de camara del nivel 2: devolver la camara a su lugar mientras el usuario la esta arrastrando es, por si mismo, un defecto visible.

## 4. Ampliacion de la orbita

La composicion inicial de camara no se toca: `CAMERA.position`, `CAMERA.target` y `CAMERA.fov` quedan como estan.

| | antes | ahora |
|---|---|---|
| azimut | -0,40 a 0,40 rad | -0,75 a 0,75 rad |
| polar | 1,15 a 1,52 rad | 1,00 a 1,57 rad |
| zoom | apagado | 7 a 15 m de distancia |

Limites elegidos contra la geometria del set, no a ojo:

- La vereda es un plano de 20 x 8 con el borde de atras en z = 0. La fachada es una caja de 9 x 6 x 0,4 con la cara frontal en z = 0.
- El polar maximo se queda por debajo de pi/2 (1,5708): pasado ese valor la camara baja del alto del objetivo y empieza a rasar la vereda.
- A 15 m con fov 36 el semiancho visible es de unos 8,7 m contra los 10 m de media vereda, asi que el borde del plano no entra en cuadro.
- El azimut se verifica en captura en los dos extremos, con el cartel en su medida maxima.

`AUTO_ORBIT.amplitude` se mantiene en 0,3, holgadamente adentro del clamp nuevo: el barrido sigue sin llegar al tope, como pide SPEC 12.

## 5. Archivos

- `src/verticals/signs/scene/perfTier.ts`: los tres umbrales.
- `src/verticals/signs/scene/SignScene.tsx`: `OrbitControls` deja de depender del nivel, se retira el efecto de reseteo de camara, `AutoOrbit` sigue atado al nivel 2.
- `src/verticals/signs/scene/sceneGeometry.ts`: `ORBIT` con los limites nuevos y el zoom acotado.
- `SPEC.md` seccion 12: umbral, composicion del nivel 2 y limites de orbita.

## 6. Prohibido en esta tarea

- Cualquier cambio de colores, tipografia, espaciados, tema o materiales. El tema claro llega aparte, como TAREA_009.
- El motor de precios y los JSON de cliente.
- La composicion inicial de camara.

## 7. Tests

- `perfTier.test.ts`: los umbrales nuevos, y que `nextTier` sigue bajando de a uno, sin volver a subir y sin pasar de 2.
- `sceneGeometry.test.ts`: los limites de orbita son simetricos en azimut, el polar maximo queda por debajo de pi/2, el rango de zoom es creciente y positivo, y `AUTO_ORBIT.amplitude` sigue adentro del clamp de azimut.

Las 122 previas no se editan.

## 8. Criterios de aceptacion

1. G1 build en verde, app por debajo de 500 kB y `three-vendor` por debajo de 1000 kB.
2. G2 `tsc` 0 errores.
3. G3 lint 0.
4. G4 tests en verde, con las 122 previas intactas.
5. G5 cero guiones largos en lo nuevo o editado.
6. G6 sin parches.
7. Causa raiz identificada y medida, no supuesta, y escrita en el reporte.
8. Arrastrar la camara durante 60 segundos seguidos sigue respondiendo.
9. Los tres modos de luz siguen distinguiendose, con luminancia medida.
10. El descenso de nivel sigue respetando el orden de SPEC 12 y sigue sin volver a subir.
11. En 390 px no aparece scroll horizontal ni se rompe el marco del preview.
12. En los extremos de azimut, polar y zoom no se ve el vacio detras de la fachada ni por debajo de la vereda.
13. Los cuatro greps de arquitectura siguen en 0.
