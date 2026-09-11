# TAREA_004 · Iluminación, tótem, autorotación y presupuesto de rendimiento

Bloque 2 · martes 15. Depende de TAREA_003 (cerrada y aceptada, commits 4b54fa1 y 07928b2).
Referencias: SPEC secciones 3, 5.1 y 12 (versión 1.3). docs/EXECUTION.md bloque 2.
Cierra el bloque 2. Después de esta tarea el preview 3D no se vuelve a tocar hasta TAREA_007 (pulido).

## 1. Objetivo

Completar el preview: los tres modos de iluminación, el tipo `totem` con su poste, el barrido lento de cámara cuando nadie toca nada, y un presupuesto de rendimiento que degrada la escena en el orden de SPEC 12 si el dispositivo no da los fps.

Cierra cuando los tres modos de luz se distinguen a simple vista en las dos demos, el tótem aparece de pie delante del local con transición suave desde `facade`, la cámara barre sola y vuelve sin salto después de que el usuario arrastra, y la escena se mantiene fluida en un teléfono real con la degradación medida y reportada.

## 2. Lo que no entra

- Bloom y cualquier postprocessing. Quedan fuera del MVP por decisión de Canal B, ya reflejada en SPEC 1.3.
- Texto, logo o gráfica sobre el cartel. Es TAREA_007 como máximo, y probablemente nunca.
- Sombras proyectadas. Las únicas sombras siguen siendo las de contacto de drei.
- Cualquier asset que se descargue: modelos, texturas, fuentes, `Environment`, HDRI.
- Cambios en el panel, en el precio, en los textos o en los JSON de cliente, salvo lo que diga explícitamente esta tarea (no hay nada).
- Pulido visual general del layout. Es TAREA_007.

## 3. Decisiones de Canal B que esta tarea aplica

Las cuatro salen del reporte de TAREA_003 y ya están en SPEC 1.3 y en docs/DECISIONES.md. Acá va el qué hacer.

### 3.1 Presupuesto de bundle

`vite.config.ts`:

- Separar el vendor 3D del código de la app con `build.rollupOptions.output.manualChunks`: `three`, `@react-three/fiber` y `@react-three/drei` en un chunk propio.
- `build.chunkSizeWarningLimit: 1000`.

No es silenciar la advertencia: es declarar el presupuesto de SPEC 3. El vendor 3D pesa lo que pesa y no se puede partir, pero el código de la app queda medible aparte y cualquier regresión se ve. Si el chunk de la app pasa de 500 kB o el vendor de 1000 kB, el build vuelve a avisar.

No se hace lazy loading del preview. El preview es el producto: no puede aparecer después que el resto de la página.

### 3.2 Warning de THREE.Clock

Último paso de la tarea, después de que todo lo demás esté verde y commiteado. Un solo intento:

- `npm install @react-three/fiber@^9` para tomar la última 9.x. `three` no se toca: sigue fijado en ~0.185.1 por SPEC 3.
- Verificar build, tsc, lint, tests y las dos demos en el navegador.
- Si el warning desaparece y todo sigue en verde, queda y va en un commit propio.
- Si algo se rompe o el warning sigue: `git checkout -- package.json package-lock.json && npm ci`, y reportar. En ese caso el warning se acepta como ruido de tercero y sale de los criterios.

### 3.3 Reequilibrio de la composición

Con el modo por defecto (`none`) la vidriera todavía es el elemento más brillante de la escena y el cartel no compite. En `sceneGeometry.ts`:

- `GLASS_EMISSIVE_INTENSITY`: de 0.12 a 0.07.
- `LIGHTS.directionalIntensity`: de 0.6 a 0.8.

Con eso el material del cartel se lee por reflexión en vez de por emisión, que es lo correcto para un cartel sin luz. El criterio 14 lo mide.

### 3.4 SPEC 4.2

Ya corregido en SPEC 1.3. No hay nada que hacer en código: la interfaz de `SignPreview` sigue siendo `{ selection, visual, theme }`.

## 4. Archivos

Crear:

```
src/verticals/signs/scene/perfTier.ts
src/verticals/signs/scene/perfTier.test.ts
src/verticals/signs/scene/usePerfTier.ts
src/verticals/signs/scene/AutoOrbit.tsx
```

Modificar:

```
src/verticals/signs/scene/sceneGeometry.ts
src/verticals/signs/scene/sceneGeometry.test.ts
src/verticals/signs/scene/SignBoard.tsx
src/verticals/signs/scene/SignScene.tsx
src/verticals/signs/SignPreview.tsx
vite.config.ts
docs/STATE.md
docs/DECISIONES.md
docs/tareas/_ULTIMO.md
```

`SPEC.md`, `docs/EXECUTION.md` y este archivo ya están escritos por Canal B. No se editan en esta tarea.

## 5. Geometría nueva en sceneGeometry.ts

Sigue valiendo la regla: ningún número y ningún color se escribe dentro de un componente de escena. Todo sale de acá y todo lo que se pueda probar sin React se prueba.

```ts
export const TOTEM = {
  x: 0,
  z: 3.2,
  clearance: 1.6,                          // altura libre del borde inferior del cartel
  post: { widthFactor: 0.12, minWidth: 0.2, maxWidth: 0.6, depth: 0.2, overlap: 0.12 },
} as const

export type PostBox = { position: Vec3; size: Vec3 }

export type SignPlacement = {
  box: SignBox            // width, height, centerY
  position: Vec3          // centro del cartel
  post: PostBox | null    // null en facade
}

export function signPlacement(selection: SignSelection, lengthToMeters: number): SignPlacement
```

Reglas:

- `signBoxMeters` pasa a depender del tipo. `facade`: `centerY = WINDOW_TOP + SET.sign.gapOverWindow + height / 2`, como hoy. `totem`: `centerY = TOTEM.clearance + height / 2`.
- `signPlacement` con `facade`: `position = [0, box.centerY, SET.sign.z]`, `post = null`.
- `signPlacement` con `totem`: `position = [TOTEM.x, box.centerY, TOTEM.z]`, y el poste es una caja que va del piso al borde inferior del cartel más `overlap`, para que no se vea la junta. Alto = `TOTEM.clearance + TOTEM.post.overlap`, constante. Ancho = `clamp(box.width * widthFactor, minWidth, maxWidth)`, así un cartel de 6 m no queda sobre un palito. Profundidad fija.
- Las dos funciones lanzan con el id en el mensaje si el tipo no es `facade` ni `totem`. No hay tipo por defecto.
- `SET`, `PLACEMENT`, `CAMERA`, `ORBIT`, `WINDOW_TOP` y los tres factores de color no cambian de valor, salvo los dos de la sección 3.3.

Encuadre, también en `sceneGeometry.ts`, puro:

```ts
export const PREVIEW_ASPECT = 16 / 9      // el marco del preview es aspect-video

export function visibleHalfSizeAt(z: number, aspect: number): { halfWidth: number; halfHeight: number }
```

Se deriva de `CAMERA.fov` y de la distancia entre `CAMERA.position[2]` y `z`. Sirve para probar por test, y no a ojo, que el tótem entra en cuadro en los extremos del rango. La cámara no se mueve en `z`, así que alcanza con el plano del objeto.

## 6. Iluminación

Los tres modos vienen en `visual.lighting.mode`, que ya llega al preview desde TAREA_003 sin usarse. `none`, `front` y `back` están garantizados por la validación de la config.

```ts
export const HALO = { padding: 0.35, gap: 0.008 } as const

export type LightingParams = {
  emissiveIntensity: number   // del cartel
  haloIntensity: number       // del plano de atras, 0 lo apaga
  lampIntensity: number       // de la unica luz dinamica, 0 la apaga
}

export const LIGHTING: Record<'none' | 'front' | 'back', LightingParams> = {
  none:  { emissiveIntensity: 0,    haloIntensity: 0,   lampIntensity: 0 },
  front: { emissiveIntensity: 0.18, haloIntensity: 0,   lampIntensity: 18 },
  back:  { emissiveIntensity: 0.9,  haloIntensity: 1.4, lampIntensity: 6 },
}

export function lightingParams(mode: string): LightingParams        // lanza con un modo desconocido
export function haloBox(placement: SignPlacement): { position: Vec3; size: [number, number] }
export function lampPosition(mode: string, placement: SignPlacement): Vec3 | null
```

- El halo es un plano, no una caja: se ve solo de frente y el azimut está clampeado a ±0.4. Tamaño = cartel más `HALO.padding` por lado en x y en y. Su `z` = `position[2] - SET.sign.thickness / 2 - HALO.gap`. En `facade` eso da 0.012, o sea 12 mm por delante de la fachada y 8 mm por detrás del cartel: no hay z-fighting con ninguno de los dos. En `totem` da 3.112.
- El color del halo sale de `visual.material.color`, igual que el cartel. Nada de hexadecimales en el componente.
- La luz dinámica es una `pointLight` y nunca hay más de una en escena, en ningún modo. Sin `castShadow`, con `decay` 2 y `distance` 8.
  - `front`: por delante y por arriba del cartel, `position = [x, centerY + height / 2 + 0.45, z + 0.85]`. Es la lámpara de brazo que lleva un cartel frontal.
  - `back`: en el mismo `z` del halo y centrada en el cartel, así lava la fachada alrededor del cartel y el retroiluminado se lee como luz y no solo como material brillante.
  - `none`: `null`, y el componente no renderiza ninguna luz.
- `lampIntensity` arranca en los valores de la tabla y se ajusta hasta cumplir los criterios 13 y 14. El valor final va reportado y la tabla del código queda con el valor final, no con el de esta tarea.
- Las tres intensidades se acomodan con el mismo `approach` de TAREA_003 y el mismo `DAMP_LAMBDA`, así cambiar de modo es una transición y no un salto. Con `prefers-reduced-motion` es instantáneo.

## 7. SignBoard pasa a ser el conjunto

`SignBoard.tsx` ya tiene el único `useFrame` de la escena y el `approach` que cierra exacto. En vez de repartir el damp entre cuatro componentes, que abre la puerta a que se desincronicen, el archivo se queda con todo el conjunto: cartel, poste, halo y luz. Un solo `useFrame`, una sola fuente de verdad.

```ts
type SignBoardProps = {
  placement: SignPlacement
  material: MaterialVisual
  lightingMode: string
  reducedMotion: boolean
}
```

- La geometría sigue siendo una sola `boxGeometry` unitaria para el cartel y una sola para el poste, más un `planeGeometry` unitario para el halo. Todo se dimensiona con `scale`. Nada se recrea por frame ni por cambio de opción.
- Se acomodan con damp: `scale.x`, `scale.y` y las tres coordenadas de `position` del cartel; el alto del poste; el tamaño y la posición del halo; `emissiveIntensity` del cartel; `haloIntensity`; `lampIntensity`; y color, `metalness` y `roughness` como hasta ahora.
- Pasar de `facade` a `totem` es entonces un solo movimiento continuo: el cartel sale de la fachada hacia la vereda y el poste crece desde el piso mientras llega. Es intencional y sale gratis.
- El poste y el halo están siempre montados. Cuando su escala queda por debajo de 0.01 se ponen en `visible={false}`, para no dibujar geometría degenerada. No se montan y desmontan por opción.
- El color del poste sale de la paleta: se agrega `post` a `ScenePalette`, derivado de `--q-muted` multiplicado por 0.45. Es la única variable de tema nueva que usa la escena y ya existe en los cinco colores del JSON.
- El primer frame sigue acomodándose de golpe. `emissive` ya no queda en negro fijo: el color emisivo es el del material y lo que se mueve es la intensidad.

## 8. Autorotación

`AutoOrbit.tsx`, adentro del canvas, sin JSX visible. Lee los controles con `useThree`, que ya están publicados porque `OrbitControls` usa `makeDefault`.

```ts
export const AUTO_ORBIT = {
  amplitude: 0.3,        // rad. Queda dentro del clamp de +-0.4 de ORBIT
  periodSeconds: 16,
  idleMs: 2500,
  reacquireLambda: 2,
  snapEpsilon: 0.02,
} as const

export function autoAzimuth(elapsedSeconds: number): number   // amplitude * sin(2 pi t / period)
```

- `autoRotate` de `OrbitControls` no sirve acá: con el azimut clampeado gira hasta el tope y se queda pegado. El barrido es una ida y vuelta, manejada por nosotros.
- Interacción: suscribirse a los eventos `start` y `end` de los controles y guardar el instante de la última. Mientras el usuario arrastra, y hasta `idleMs` después de soltar, `AutoOrbit` no toca nada.
- El reloj del barrido avanza siempre. Al reanudar, si la distancia entre el azimut actual y el objetivo es mayor que `snapEpsilon` se acerca con `MathUtils.damp` y `reacquireLambda`; cuando entra en `snapEpsilon` se fija exacto al objetivo. Así no hay salto al soltar ni al reanudar.
- Después de escribir el azimut, llamar a `controls.update()` en el mismo callback: drei actualiza los controles con prioridad negativa, o sea antes que nosotros.
- No corre con `prefers-reduced-motion` ni en el nivel 2 de rendimiento.

## 9. Presupuesto de rendimiento

`perfTier.ts`, puro, sin React:

```ts
export type PerfTier = 0 | 1 | 2

export const PERF = {
  warmupMs: 1000,
  windowMs: 2000,
  minFps: 45,
  dpr: { 0: [1, 1.75], 1: [1, 1.25], 2: [1, 1] },
} as const

export function nextTier(tier: PerfTier, fps: number): PerfTier
```

- `nextTier` baja un nivel si `fps < PERF.minFps` y devuelve el mismo nivel en cualquier otro caso. Del 2 no se baja más. El descenso es monótono: nunca se vuelve a subir de nivel, porque un medidor que sube y baja produce una escena que parpadea entre configuraciones.
- Qué apaga cada nivel, en el orden de SPEC 12:
  - Nivel 0: todo. `dpr` `[1, 1.75]`, sombras de contacto, órbita, autorotación.
  - Nivel 1: sin `ContactShadows`, `dpr` `[1, 1.25]`.
  - Nivel 2: además sin `OrbitControls` y sin autorotación, `dpr` `[1, 1]`, y la cámara vuelve una vez a `CAMERA.position` mirando a `CAMERA.target`.
- Nunca se vuelve a 2D. El fallback plano es solo por ausencia de WebGL.

`usePerfTier.ts`: hook que corre adentro del canvas. Acumula frames y tiempo en `useFrame`, descarta `warmupMs`, y cada `windowMs` calcula los fps de la ventana y llama a `nextTier`. Si el nivel cambió, avisa por callback y reinicia la ventana. Cuando llega al nivel 2 deja de medir.

El estado del nivel vive en `SignScene` con `useState`: cambia dos veces como máximo en toda la vida del canvas, así que el costo de re-render es irrelevante. `SignScene` aplica el `dpr` con `setDpr` de `useThree` y monta o no las sombras, la órbita y `AutoOrbit` según el nivel.

## 10. SignScene y SignPreview

`SignScene` recibe `{ placement, material, lightingMode, palette, reducedMotion }`. Nada de `ClientConfig` y nada de buscar por id, igual que antes.

`SignPreview` calcula `signPlacement(selection, visual.lengthToMeters)` y pasa `visual.lighting.mode`. Su interfaz pública no cambia: sigue siendo `{ selection, visual, theme }`. El `dpr` inicial del `Canvas` es el del nivel 0.

`QuotePage.tsx` no se toca.

## 11. Reglas

- Nada de parches. Si algo pide un workaround, frenar y reportar sin commitear.
- Si algo contradice SPEC 1.3, frenar y reportar. No resolver por cuenta propia.
- Sin guiones largos en ningún archivo.
- Sin `any`, sin `as` para tapar un tipo, sin `@ts-expect-error`.
- Sin dependencias nuevas. El único cambio de dependencia permitido es el de la sección 3.2, y es el último paso.
- Cero strings de UI nuevos. Esta tarea no agrega ni una clave a `texts`.
- `src/core` no importa nada de `src/verticals` ni de `src/clients`, y no importa `three` ni `@react-three/*`.
- Ningún hexadecimal ni número de escena dentro de un componente.

## 12. Tests

Entorno node, solo `src/**/*.test.ts`. Sin tests de componentes. Los 63 previos siguen en verde y no se editan, salvo que alguno afirme algo que esta tarea cambia a propósito, y en ese caso va reportado.

`sceneGeometry.test.ts`:

1. `signBoxMeters` con `type` `totem`: `centerY = TOTEM.clearance + height / 2`, en los dos clientes, con las medidas por defecto.
2. `signPlacement` con `facade`: `position` es `[0, centerY, SET.sign.z]` y `post` es `null`.
3. `signPlacement` con `totem`: `position` es `[TOTEM.x, centerY, TOTEM.z]`, el alto del poste es `clearance + overlap` en cualquier medida, y el ancho es el `clamp` esperado en tres casos: ancho mínimo, ancho medio y ancho máximo de cada cliente.
4. `signBoxMeters` y `signPlacement` lanzan con un tipo desconocido, con el id en el mensaje.
5. En los cuatro extremos de ancho y alto de los dos clientes, con `totem`, el cartel entra en cuadro: media anchura menor o igual a `visibleHalfSizeAt(TOTEM.z, PREVIEW_ASPECT).halfWidth` menos 0.2, y borde superior menor o igual al borde superior visible a esa `z`.
6. En los mismos casos, el borde inferior del cartel está a `TOTEM.clearance` del piso y el poste lo alcanza (alto del poste mayor o igual a `clearance`).
7. `lightingParams` devuelve los tres valores de la tabla para `none`, `front` y `back`, y lanza con cualquier otro modo, con el modo en el mensaje.
8. `haloBox`: el tamaño es el del cartel más `2 * HALO.padding` en cada eje, y la `z` está entre la cara de apoyo y la cara trasera del cartel, en `facade` y en `totem`.
9. `lampPosition`: `null` en `none`; en `front` queda por encima del borde superior del cartel y con `z` mayor que la del cartel; en `back` coincide con la `z` del halo. En los dos tipos.
10. `scenePalette` devuelve `post`, derivado de `--q-muted`, con luminancia menor que la de `--q-muted`, y lanza si falta `--q-muted`.
11. `autoAzimuth`: el valor absoluto nunca pasa `AUTO_ORBIT.amplitude`, `amplitude` es menor que `ORBIT.maxAzimuthAngle`, y en un período completo pasa por los dos extremos y por el cero.

`perfTier.test.ts`:

12. `nextTier` baja 0 a 1 y 1 a 2 con fps por debajo de `minFps`, deja el nivel igual con fps por encima, y del 2 no baja.
13. `PERF.dpr` es monótono decreciente en el techo, y el nivel 0 coincide con el `dpr` inicial del `Canvas`.

Total esperado: 76. Cada test nuevo va comentado con su número de esta sección.

## 13. Criterios de aceptación

1. G1: `npm run build` en verde y sin warnings, ya con el chunk del vendor 3D separado. Reportar el tamaño de los dos chunks, sin comprimir y gzip.
2. G2: `npx tsc -b --force` con 0 errores.
3. G3: `npm run lint` y `npx oxlint --deny-warnings`, los dos sin hallazgos.
4. G4: `npm test` en verde, 76 tests, con los 13 nuevos mapeados uno a uno y comentados con su número.
5. G5: sin guiones largos, con el grep unicode de TAREA_002.
6. G6: sin parches. Cada decisión que hubo que tomar queda en docs/DECISIONES.md.
7. Los tres modos de luz se distinguen a simple vista en los dos clientes, en los tres materiales. Reportarlo con una medición, no a ojo: luminancia media del rectángulo del cartel en captura, para los tres modos, y la relación entre `front` y `none` y entre `back` y `none`. `back` tiene que dar además luminancia media del anillo del halo mayor que la de la fachada alrededor.
8. Cambiar de modo es una transición suave, no un salto: muestrear la intensidad emisiva del material del cartel a los 0, 40 y 400 ms de cambiar de `none` a `back`, y verificar que el valor final es exactamente el de la tabla.
9. `totem` en los dos clientes: el cartel aparece de pie delante del local, sobre la vereda, con el poste desde el piso hasta el borde inferior y sin junta visible. La transición desde `facade` es continua, y `renderer.info.memory.geometries` no crece al ir y volver entre los dos tipos tres veces.
10. En los cuatro extremos de los rangos, con `totem`, en pantalla, el cartel entra en cuadro y no se superpone con la puerta ni con la vidriera de forma que tape la escena. Reportar el bounding box en los cuatro extremos de los dos clientes.
11. Autorotación: sin tocar nada, el azimut se mueve entre los dos extremos del barrido y nunca llega al clamp de `ORBIT`. Arrastrar detiene el barrido; al soltar, el barrido se reanuda después de `idleMs` sin salto visible (reportar el delta máximo de azimut por frame en el momento de reanudar). Con `prefers-reduced-motion` no hay barrido.
12. Presupuesto de rendimiento: reportar fps promedio en los tres niveles, en 390 x 844, con el barrido de un slider de punta a punta durante 3 segundos. Forzar el descenso con throttling de CPU del navegador y verificar que el orden es sombras y dpr primero, órbita y autorotación después, que el nivel nunca vuelve a subir, y que en el nivel 2 la cámara queda en `CAMERA.position`. La escena nunca cae a 2D.
13. Rendimiento en desktop con la escena completa y el modo `back`: barrer el slider de ancho 3 segundos y reportar el promedio de fps. Aclarar si el entorno tiene aceleración por hardware o no, porque en TAREA_003 no la tenía.
14. Composición con el modo por defecto (`none`): la luminancia media del rectángulo del cartel es mayor o igual que la de la vidriera, en los dos clientes, ya con los valores de la sección 3.3.
15. Sin WebGL sigue apareciendo el fallback plano y la app no rompe.
16. `grep -rn "three\|@react-three" src/core` devuelve cero, `grep -rn "clients\|ClientConfig" src/verticals/signs/scene src/verticals/signs/SignPreview.tsx` devuelve cero, y `grep -rnE "#[0-9a-fA-F]{3,8}" src/verticals/signs/scene/*.tsx` devuelve cero.
17. Consola limpia en las dos demos, en los tres modos y en los dos tipos: cero errores. Sobre los warnings, el resultado de la sección 3.2 decide: o no queda ninguno, o queda solo el de `THREE.Clock` y está reportado como ruido de tercero.
18. docs/STATE.md y docs/tareas/_ULTIMO.md actualizados (`_ULTIMO.md` a 005), bloque 2 cerrado en STATE, commit de docs separado del commit de código, el cambio de dependencia de la sección 3.2 en un commit propio, y `git push` con el árbol limpio.

## 14. Reporte de cierre

Los 18 criterios uno por uno con el comando y el resultado, la lista de archivos creados y modificados, los tests nuevos con su cantidad, el tamaño de los dos chunks antes y después, los fps por nivel, el valor final de `lampIntensity` de cada modo, el resultado del intento de subir R3F, cualquier desvío con el motivo, y el hash de los commits.
