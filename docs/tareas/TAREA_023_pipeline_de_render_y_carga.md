# TAREA_023 · Pipeline de render y pantalla de carga

Bloque 10, Quote premium. Primera tarea del bloque.

Prerrequisito: docs/STATE.md, CLAUDE.md, SPEC 3, 10, 12, 16, 17 y 18 (version 2.0).

## Contexto

El viernes 18 paso y el listado del Catalog esta enviado (D37). Los techos que se pusieron
para llegar a esa fecha se levantan (D44). El objetivo del bloque es que el configurador
resista una comparacion lado a lado con un configurador comercial de referencia (D48), y que
ese nivel viva en core para que las proximas verticales lo hereden (SPEC 18).

Esta tarea pone la base: pipeline de render con postprocesado, sombras suaves, perfiles de
calidad y pantalla de carga con progreso real. No cambia materiales, escena ni panel.

## Alcance

### 1. SPEC 2.0 (commit de apertura)

- SPEC 3: se derogan los topes de 500 kB de app y 1000 kB de vendor 3D y la lista cerrada de
  assets. El tope de 250 kB de `react-vendor` sigue. Presupuesto nuevo: la primera carga de
  `/d/<slug>` puede llegar a 8 MB de assets 3D, siempre detras de pantalla de carga con
  progreso real. El peso medido se anota al cerrar.
- SPEC 12: se derogan la prohibicion de postprocesado, la de sombras de mapa y la de assets
  descargados en runtime. Permitidos: HDRI hasta 2k, mapas PBR y typefaces. Se documenta el
  pipeline de render y los dos perfiles.
- SPEC 16: sale "archivos de fuente en el 3D salvo el typeface". Postprocesado y assets en
  runtime no figuraban literalmente en la lista: se deja escrito que no estan fuera.
- SPEC 17: criterio 2 con la redaccion de D48.
- SPEC 18 nueva, capas premium. Plan por dias pasa a 19 y metrica a 20.
- SPEC 10: `texts` pasa de 46 a 47 claves con `loadingLabel`.

### 2. Dependencias

`@react-three/postprocessing` y `postprocessing`, versiones fijadas sin conflicto de peers con
three 0.185, R3F 9 y React 19.2.

### 3. Pipeline de render

- `src/core/preview/RenderPipeline.tsx`: un solo `EffectComposer` con N8AO, Bloom,
  ToneMapping AgX y SMAA. Recibe el perfil de calidad como prop.
- `src/core/preview/PreviewCanvas.tsx`: el Canvas del core. `antialias: false`, `alpha: true`,
  `flat` (NoToneMapping en el renderer: el tone mapping lo hace el composer una sola vez),
  `shadows="soft"`, `dpr` del perfil. Adentro, un Suspense que envuelve el contenido de la
  vertical y el pipeline. No conoce la vertical: la escena entra como children.
- N8AO conservador: se lee en el encuentro del cartel con su apoyo y en los cantos, no como
  contorno sucio.
- Bloom con umbral alto: solo lo dispara el emisivo del back-lit. En none y front el cartel no
  brilla. Se verifica midiendo.
- Sombras: la key del modo cartel proyecta; cartel, letras, relieve y estructura del totem
  proyectan y reciben. La sombra de apoyo con CanvasTexture se conserva; si queda redundante
  se anota para TAREA_025.
- Modo vista: canvas transparente sobre la foto. El composer tiene que respetar el alpha y el
  tone mapping no puede lavar la foto. Si no sale limpio, se frena y se reporta.

### 4. Perfiles de calidad

`src/core/preview/quality.ts`. Se elige una vez al montar por capacidad del dispositivo
(puntero grueso, `navigator.deviceMemory`, `hardwareConcurrency`). Sin fps y sin cambio en
caliente. La eleccion es una funcion pura con tests.

- high: dpr [1, 2], AO con muestras plenas, bloom, SMAA, sombras suaves.
- medium: dpr [1, 1.5], AO con la mitad de muestras, bloom y SMAA.

### 5. Pantalla de carga

- `src/core/ui/LoadingScreen.tsx`, sobre el marco del preview, fondo `--q-stage`, logo del
  cliente y `loadingLabel`. Progreso real con `useProgress` de drei, sin animacion simulada
  ni minimos. Se quita cuando el contenido del Suspense dibujo su primer frame. Posicion
  absoluta: no causa salto de layout.
- Para que el progreso sea real, el typeface y el HDRI pasan por el LoadingManager de three
  y suspenden: el typeface con `useLoader(FileLoader)` y el HDRI sin su Suspense propio.
  Los dos conservan su limite de error: si faltan, el cartel sale sin texto o sin reflejo.
- `loadingLabel`: EN "Preparing your sign", ES "Preparando tu cartel". Tipo, validacion y
  los dos JSON. La landing no monta el preview y no la lleva.

## Criterios de aceptacion

1. G1 a G6 de EXECUTION.
2. Capturas antes y despues con `npm run capturas`, los dos clientes, modo cartel y modo
   vista, los tres tipos, en `validacion/premium/023/`.
3. Peso total de la primera carga de `/d/<slug>`, tiempo hasta el primer frame del preview
   con throttling 4G y fps sostenidos en modo cartel con orbita, medidos y anotados.
4. Luminancia del cartel en none, front y back en los dos modos: none y front sin bloom,
   back con bloom, y sin cambios frente a hoy mas alla del tone mapping.
5. En modo vista la foto fuera del cartel queda igual que antes: el alpha se respeta.
6. Tests: solo cambian por el contrato de 47 claves, mas los nuevos de `quality.ts`.
7. `src/core` sigue sin importar de `src/verticals` ni de `src/clients`.

## Commits

1. docs: apertura de TAREA_023, SPEC 2.0.
2. feat: pipeline de render, perfiles de calidad y pantalla de carga.
3. docs: cierre de TAREA_023.

## Resultado (23/09/2026)

Estado: abierta, frenada en el Bloom. Codigo en 10d469e. Todo lo demas cumple.

1. G1 a G6: build sin warnings, tsc 0 errores, lint limpio, 244 tests en verde, sin guiones largos.
2. Capturas: 54 antes y 54 despues en `validacion/premium/023/`, con la GPU del equipo. Las
   dos corridas se sacaron con el mismo script y el mismo renderer.
3. Peso: 632 kB transferidos, 79 kB de assets 3D. Primer frame: 1,3 s en fast 4G y 4,1 s en
   slow 4G. Orbita: 60 fps a dpr 1 y 2 en GPU integrada AMD. Detalle en `mediciones.md`.
4. Bloom: NO cumple. Barrido de umbral de 2 a 12: con 3 o menos brilla la cara de front; con 4
   o mas el panel en back ya no dispara nada; los brillos del acrilico en letters front pasan
   12. No hay umbral que separe los dos. Se saco del pipeline y queda para decision.
5. Alpha en modo vista: la foto fuera del cartel es identica a la foto sola en los 36 cuadros
   de vista, diferencia 0. El tone mapping no la toca.
6. Luminancia: none baja 13 y front baja 10 en promedio (escala 0 a 255), por el cambio de
   ACES a AgX. En la cara, front sobre none y back bajo front siguen en 17 de 17 cuadros medibles.
7. `src/core` sin imports de `src/verticals` ni de `src/clients`.

Para TAREA_025: la sombra de apoyo con CanvasTexture sigue, y con la sombra de mapa no queda
redundante porque en modo cartel no hay piso que la reciba.
