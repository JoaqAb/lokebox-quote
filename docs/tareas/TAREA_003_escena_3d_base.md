# TAREA_003 · Escena 3D base de la vertical cartelería

Bloque 2 · martes 15. Depende de TAREA_002 (cerrada) y del deploy de Canal C (hecho: https://lokebox-quote.vercel.app).
Referencias: SPEC secciones 4.2, 5.1, 5.2 y 12 (versión 1.2). docs/EXECUTION.md bloque 2.
No hay dependencias nuevas: `three`, `@react-three/fiber` y `@react-three/drei` ya están en package.json.

## 1. Objetivo

Reemplazar el cuerpo provisorio de `SignPreview` por la escena 3D base: vereda, fachada, puerta, vidriera y el cartel tipo `facade` como caja con dimensiones reactivas, materiales tomados del `visual` del JSON, ambiente nocturno y cámara con órbita limitada.

Cierra cuando las dos demos muestran la escena, el cartel sigue los sliders con transición suave y cambiar de material cambia color, metalness y roughness a la vista.

## 2. Lo que no entra

Va a TAREA_004: los tres modos de iluminación, el tótem con poste, la autorotación y el presupuesto de rendimiento en mobile.
No entra nunca: modelos importados, texturas, fuentes tipográficas (`Text` de drei), `Environment` o cualquier asset que se descargue, postprocessing, shaders custom, sombras de mapa, texto o logo sobre el cartel.

## 3. Cambio de interfaz (ya reflejado en SPEC 1.2)

`SignPreview` pasa a recibir tres props:

```ts
type SignPreviewProps = {
  selection: SignSelection
  visual: SignVisual
  theme: Record<string, string>
}
```

`SignVisual` lo arma la vertical, no el core y no el preview:

```ts
export type SignVisual = {
  material: MaterialVisual      // color, metalness, roughness del material elegido
  lighting: LightingVisual      // { mode } del modo elegido. TAREA_003 lo recibe y no lo usa
  lengthToMeters: number        // 1 si units.length es "m", 0.3048 si es "ft"
}

export function resolveSignVisual(config: ClientConfig, selection: SignSelection): SignVisual
export function lengthToMeters(unit: string): number
```

- Función pura, sin React, en `src/verticals/signs/visuals.ts`.
- Lanza con el id en el mensaje si `materialId` o `lightingId` no existen en `config.options`. No devuelve un visual por defecto.
- `lengthToMeters` lanza si la unidad no es `m` ni `ft`.
- El preview no recibe `ClientConfig`, no importa `src/clients` y no busca nada por id.

`src/pages/QuotePage.tsx`: calcula `resolveSignVisual(config, selection)` en el render, junto al precio, y lo pasa al preview. Nada más cambia ahí.

## 4. Archivos

Crear:

```
src/verticals/signs/visuals.ts
src/verticals/signs/visuals.test.ts
src/verticals/signs/scene/sceneGeometry.ts
src/verticals/signs/scene/sceneGeometry.test.ts
src/verticals/signs/scene/webgl.ts
src/verticals/signs/scene/Storefront.tsx
src/verticals/signs/scene/SignBoard.tsx
src/verticals/signs/scene/SignScene.tsx
src/verticals/signs/SignPreviewFallback.tsx
```

Modificar: `src/verticals/signs/SignPreview.tsx`, `src/pages/QuotePage.tsx`, `src/core/ui/QuoteLayout.tsx` (sección 9), `tsconfig.app.json` (sección 10), `docs/STATE.md`, `docs/DECISIONES.md`, `docs/tareas/_ULTIMO.md`.

`SPEC.md`, `docs/EXECUTION.md` y este archivo ya están escritos por Canal B. No se editan en esta tarea.

## 5. Escala y geometría del set

La escena trabaja siempre en metros. Las medidas de la selección se multiplican por `visual.lengthToMeters`.

`src/verticals/signs/scene/sceneGeometry.ts`, puro, sin React y sin JSX:

```ts
export const SET = {
  sidewalk: { width: 20, depth: 8 },
  facade: { width: 9, height: 6, depth: 0.4 },
  door: { width: 1.1, height: 2.2, depth: 0.08, x: -2.6 },
  window: { width: 4.2, height: 1.8, depth: 0.08, x: 1.2, sill: 0.9 },
  sign: { thickness: 0.14, z: 0.09, gapOverWindow: 0.35 },
} as const

export function signBoxMeters(
  selection: SignSelection,
  lengthToMeters: number,
): { width: number; height: number; centerY: number }
```

Reglas de armado:

- La vereda es un plano de 20 x 8, horizontal, con el borde de atrás en `z = 0` y el resto hacia la cámara.
- La fachada es una caja de 9 x 6 x 0.4 con la cara frontal en `z = 0` y la base en `y = 0`.
- La puerta y la vidriera son cajas apoyadas sobre la cara frontal, con la cara frontal en `z = 0.04`, para que no haya z-fighting con la fachada. El antepecho de la vidriera está en `y = 0.9`, así que su borde superior queda en `y = 2.7`.
- El cartel es una caja centrada en `x = 0`, con espesor fijo `0.14` y centro en `z = 0.09`.
- `centerY` del cartel = borde superior de la vidriera (2.7) más `gapOverWindow` (0.35) más la mitad del alto. El cartel sube cuando crece, y nunca pisa la vidriera.
- Con los rangos de los dos JSON el cartel entra siempre: el ancho máximo es 6.1 m contra una fachada de 9 m, y el borde superior máximo queda en 5.6 m contra una fachada de 6 m. Esto se verifica con tests, no a ojo.

## 6. Colores de la escena

`scenePalette(theme)` en `sceneGeometry.ts`, pura:

- `facade`: el valor de `--q-primary` tal cual.
- `sidewalk`: `--q-primary` multiplicado por 0.55 (usar `Color` de three, sin hexadecimales escritos a mano).
- `doorFrame` y `windowFrame`: `--q-bg`.
- `glass`: `--q-accent`, con `emissiveIntensity` fija y baja (0.12), para que el local se lea como abierto de noche. Es ambiente, no es el modo de iluminación del cartel, que es TAREA_004.
- El color del cartel no sale del tema: sale de `visual.material.color`.
- Ningún hexadecimal escrito dentro de un componente de escena. Todos los colores se derivan del `theme` o del `visual`.

## 7. Componentes de escena

`Storefront.tsx`: recibe `{ palette }` y arma vereda, fachada, puerta y vidriera con `meshStandardMaterial`. Estático, sin estado, sin `useFrame`.

`SignBoard.tsx`: recibe `{ box, material }` donde `box` es lo que devuelve `signBoxMeters` y `material` es `visual.material`.

- Una sola `boxGeometry` de 1 x 1 x 1 creada una vez. El tamaño se aplica con `scale`. Prohibido recrear geometría por frame o por cambio de slider.
- La transición es por `useFrame` con `MathUtils.damp` sobre `scale.x`, `scale.y` y `position.y`, con lambda alrededor de 12, que da unos 200 ms de acomodamiento. Sin Framer Motion adentro del canvas.
- `color`, `metalness` y `roughness` también se acomodan suave: `Color.lerp` para el color y `damp` para los dos números.
- Con `prefers-reduced-motion` el cambio es instantáneo, sin damp.
- `emissive` queda en negro en esta tarea.

`SignScene.tsx`: contenido del canvas. Cámara, luces, `Storefront`, `SignBoard` y `OrbitControls`.

- Cámara perspectiva: `fov` 36, posición `[0, 3.2, 12]`, mirando a `[0, 3.2, 0]`.
- Ambiente nocturno: `ambientLight` con intensidad 0.35 y una `directionalLight` suave en `[3, 7, 6]` con intensidad 0.6, sin `castShadow`. Más `ContactShadows` de drei a la altura de la vereda, con `opacity` 0.5, `blur` 2.4 y `resolution` 512.
- `OrbitControls` de drei con `target` `[0, 3.2, 0]`, `enablePan` false, `enableZoom` false, `enableDamping` true, `dampingFactor` 0.08, `rotateSpeed` 0.45, `minAzimuthAngle` -0.4, `maxAzimuthAngle` 0.4, `minPolarAngle` 1.15, `maxPolarAngle` 1.52. `autoRotate` queda en false: es TAREA_004.
- Sin `Suspense`, sin loaders, sin `useLoader`: no hay un solo asset que se descargue.

`SignPreview.tsx`: el host. Mantiene el marco actual (`aspect-video w-full`, borde y esquinas redondeadas) para no tocar el layout, y adentro pone el `Canvas` con `dpr={[1, 1.75]}` y `gl={{ antialias: true }}`. Si `hasWebGL()` es false, renderiza `SignPreviewFallback` en vez del canvas.

`SignPreviewFallback.tsx`: el cuerpo provisorio de TAREA_002 movido tal cual, sin cambios de comportamiento. Es la caída por falta de WebGL, no una degradación por rendimiento.

`webgl.ts`: `hasWebGL(): boolean`. Devuelve false y no lanza si `document` no existe. Cachea el resultado a nivel de módulo, para no crear un canvas por render.

## 8. Reactividad

- El canvas se monta una sola vez por cliente. Cambiar un slider no lo remonta y no cambia la cantidad de geometrías.
- El precio y la escena leen la misma `selection` del render. Sin estado duplicado, sin `useEffect` de sincronización, sin debounce.
- `frameloop` queda en el default (`always`), porque hay damping de escena y de órbita. El presupuesto de rendimiento en mobile es TAREA_004.

## 9. Fix acotado del padding en mobile

En producción, en 390 px, la barra de precio tapa el stepper de cantidad. El padding inferior del panel es hoy el valor fijo `13rem` y la barra mide más que eso cuando el disclaimer ocupa varias líneas.

Solución: derivarlo de la altura real de la barra.

- En `QuoteLayout`, medir el contenedor de la barra con un `ResizeObserver` y escribir la altura en una variable CSS en el contenedor raíz, por ejemplo `--q-price-h`.
- El padding inferior del panel en mobile pasa a ser `calc(var(--q-price-h, 13rem) + 2rem + env(safe-area-inset-bottom))`.
- En desktop no cambia nada: la barra es estática al pie de la columna.
- Sin números mágicos nuevos y sin `setTimeout`.

## 10. strict explícito

`tsconfig.app.json` no declara `"strict": true`. Hoy está activo solo porque TypeScript 6 lo trae por defecto. Agregar la clave explícita y verificar que `npx tsc -b --force` sigue en 0 errores.

## 11. Reglas

- Nada de parches. Si algo pide un workaround, frenar y reportar sin commitear.
- Si algo contradice SPEC.md 1.2, frenar y reportar. No resolver por cuenta propia.
- Sin guiones largos en ningún archivo.
- Sin `any`, sin `as` para tapar un tipo, sin `@ts-expect-error`.
- Sin dependencias nuevas.
- Cero strings de UI nuevos.
- `src/core` no importa nada de `src/verticals` ni de `src/clients`, y no importa `three` ni `@react-three/*`.

## 12. Tests

Entorno node, solo `src/**/*.test.ts`. Sin tests de componentes.

`src/verticals/signs/visuals.test.ts`:

1. `resolveSignVisual` con la selección default de northline devuelve el `visual` de pvc igual al del JSON, y `lighting.mode` en `none`.
2. Para los tres materiales de los dos clientes, el `visual` devuelto es exactamente el del JSON (seis casos).
3. Para los tres modos de luz de los dos clientes, `mode` sale `none`, `front` y `back`.
4. Lanza con un `materialId` inexistente y lanza con un `lightingId` inexistente, con el id en el mensaje.
5. `lengthToMeters` devuelve 0.3048 con `ft`, 1 con `m`, y lanza con cualquier otra unidad.

`src/verticals/signs/scene/sceneGeometry.test.ts`:

6. `signBoxMeters` convierte bien: northline 8 x 3 ft da 2.4384 x 0.9144 m, y norte 2.5 x 1 m da 2.5 x 1.
7. En los cuatro extremos de ancho y alto de los dos clientes, el cartel entra en la fachada: media anchura menor o igual a `SET.facade.width / 2 - 0.3`, y borde superior menor o igual a `SET.facade.height - 0.2`.
8. En los mismos casos, el borde inferior del cartel queda al menos 0.2 por encima del borde superior de la vidriera.
9. `scenePalette` deriva del tema: `facade` es el hex de `--q-primary` y `sidewalk` tiene luminancia menor, para los dos clientes.
10. `hasWebGL()` devuelve false en entorno node y no lanza.

Los 52 tests previos siguen en verde y no se editan. Total esperado: 62.

## 13. Criterios de aceptación

1. G1: `npm run build` en verde, sin warnings. Reportar el tamaño del bundle antes y después, porque entra three.
2. G2: `npx tsc -b --force` con 0 errores, ya con `"strict": true` explícito en tsconfig.app.json.
3. G3: `npm run lint` y `npx oxlint --deny-warnings`, los dos sin hallazgos.
4. G4: `npm test` en verde, 62 tests, con los 10 nuevos de la sección 12 mapeados uno a uno y comentados con su número.
5. G5: sin guiones largos en ningún archivo nuevo o editado, verificado con el grep unicode de TAREA_002.
6. G6: sin parches. Cada decisión que hubo que tomar queda en docs/DECISIONES.md.
7. `/d/northline` y `/d/norte` muestran vereda, fachada, puerta, vidriera y el cartel, sin errores ni warnings en consola.
8. Mover el slider de ancho o de alto cambia la caja con transición suave, y `renderer.info.memory.geometries` no crece entre el estado inicial y después de barrer los dos sliders de punta a punta.
9. Cambiar material cambia el material del mesh del cartel: `material.color.getHexString()` coincide con el `visual.color` del JSON para los tres materiales, y `metalness` y `roughness` coinciden con los del JSON, en los dos clientes.
10. En los extremos de los rangos, en pantalla, el cartel queda dentro de la fachada y por encima de la vidriera en los dos clientes.
11. La órbita está limitada: arrastrar hasta el tope en las cuatro direcciones deja la fachada encuadrada, sin ver el borde del set ni el fondo por debajo de la vereda. Sin pan y sin zoom, ni con la rueda ni con dos dedos.
12. Rendimiento en desktop: barrer el slider de ancho de punta a punta durante 3 segundos y reportar el promedio de fps medido con `requestAnimationFrame`. Mínimo 60 fps en desktop.
13. Sin WebGL el preview muestra el fallback y la app no rompe. Verificarlo forzando que la creación de contexto falle, no borrando código.
14. La interfaz de `SignPreview` es `{ selection, visual, theme }`, y `grep -rn "clients\|ClientConfig" src/verticals/signs/scene src/verticals/signs/SignPreview.tsx` no devuelve nada.
15. `grep -rn "three\|@react-three" src/core` devuelve cero, y el grep de aislamiento de `src/core` sobre `verticals` y `clients` sigue en cero en código de producción.
16. En 390 px, con el panel a mitad de scroll y con el panel scrolleado al fondo, la barra de precio no tapa el stepper de cantidad. Reportar la altura medida de la barra y el padding resultante en los dos idiomas, que tienen disclaimers de largo distinto.
17. docs/STATE.md y docs/tareas/_ULTIMO.md actualizados (`_ULTIMO.md` a 004), commit de docs separado del commit de código, y `git push` con el árbol limpio.

## 14. Reporte de cierre

Los 17 criterios uno por uno con el comando y el resultado, la lista de archivos creados y modificados, los tests nuevos con su cantidad, el tamaño del bundle antes y después, los fps medidos, cualquier desvío con el motivo, y el hash de los commits.
