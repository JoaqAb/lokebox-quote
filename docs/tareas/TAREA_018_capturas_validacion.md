# TAREA_018 · Set de capturas de validacion

Bloque 4. Va despues de TAREA_017 y antes de TAREA_013 (landing).

Prerrequisito: docs/STATE.md, SPEC 12 (version 1.15), docs/tareas/TAREA_017_totem_real_vistas_frontales.md.

## Contexto

Canal B tiene que ver el preview, no leer numeros sobre el preview. Las capturas de G3 y G4 de TAREA_017 quedaron en el scratchpad de la sesion y no en el arbol, asi que la validacion del totem y del criterio 2 de DONE no se puede hacer. Este set se regenera con un comando y Canal B lo lee por Filesystem.

## Alcance

Se toca: `scripts/capturas.mjs` (nuevo), `package.json` (script `capturas`, devDependency `playwright`, sale `@supabase/supabase-js`), `package-lock.json`, `.gitignore`, `docs/EXECUTION.md`, `docs/tareas/`.

No se toca: la escena, el motor, el panel, los JSON de cliente ni ningun test. El brief permite `data-testid` en los botones de tipo, en el selector de vistas y en el marco del preview; no hacen falta. El script lee las etiquetas de los botones de `src/clients/<slug>.json` (tipos, fotos, luz y `viewSignOnly`) y ubica el marco del preview como el padre del canvas. Asi `src/` queda sin cambios y ningun test puede romper por esto.

### Herramienta

- Playwright como devDependency, con su chromium instalado con `npx playwright install chromium`.
- Misma configuracion de navegador que las capturas de G3 de TAREA_017: chromium headless con `--use-gl=angle`, `--use-angle=swiftshader` y `--enable-unsafe-swiftshader`, `deviceScaleFactor` 1.
- Mismo metodo de giro: arrastres cortos en 20 pasos de 16 ms que empiezan en el centro del canvas y terminan dentro de el. Un arrastre que termina afuera deja un puntero colgado en OrbitControls (decision del 14/09). OrbitControls gira 2 pi por cada alto de canvas arrastrado, asi que 45 grados son un octavo del alto.
- Antes de cada captura: `blur` del elemento activo y `scrollTo(0, 0)`, para que el recorte coincida con el marco.

### Servidor

- El script levanta `vite` en el puerto 5288 con `--strictPort`, espera a que `/d/northline` responda 200 y lo baja al terminar, tambien si la corrida falla.
- Antes de cada navegacion, route de `**/*.supabase.co/**` a abort. Contador de requests abortadas y de requests a supabase.co que llegaron a respuesta, impresos al final.
- Nada de builds nuevos ni de tocar `dist/`.

### Determinismo

- Espera fija de 1500 ms despues de cada cambio de tipo, de vista o de modo de luz, antes de capturar.
- Al cargar cada pagina: `networkidle` y despues 1500 ms, para que entren el HDRI y el typeface.
- Despues del arrastre de 45 grados, 3000 ms: OrbitControls tiene damping y el giro sigue unos frames despues de soltar. Es un arrastre y no un cambio de tipo, vista o luz, asi que no contradice la espera de 1500.
- Sin `reducedMotion` de Playwright: prefers-reduced-motion cambia el preview.

### Set exacto

18 PNG en `validacion/`, que el script borra y rehace en cada corrida. Para northline y norte, con los defaults del JSON salvo lo que diga el nombre:

1. `<slug>-facade-cartel-frente.png`
2. `<slug>-letters-cartel-frente.png`
3. `<slug>-totem-cartel-frente.png`
4. `<slug>-totem-cartel-45.png`
5. `<slug>-totem-vista-front.png`
6. `<slug>-totem-vista-night.png`
7. `<slug>-facade-vista-night-back.png`
8. `<slug>-desktop-1440.png`
9. `<slug>-mobile-390.png`

Del 1 al 7, recorte del marco del preview con viewport 1440 x 900. El 4 es el estado del 3 girado 45 grados de azimut. El 8 es el viewport 1440 x 900 completo al cargar, sin tocar nada. El 9 es el viewport 390 x 844 completo al cargar, sin fullPage.

Al terminar el script imprime cada archivo con su tamano en bytes y las requests abortadas.

### Documentos

- TAREA_017: se corrigen las dos frases desactualizadas del alcance (el color de poste y base, y los tests que cambian).
- EXECUTION: bloque de TAREA_018 con criterios y comando.

### Limpieza

`@supabase/supabase-js` no lo importa ningun archivo de `src/` (grep vacio): se desinstala y se reporta el bundle. La capa de datos inserta por fetch contra PostgREST desde TAREA_005.

## Criterios de aceptacion

- G1. Build sin warnings y bundle sin cambios contra TAREA_017 (app 420 kB, vendor 3D 963,55 kB), o el numero nuevo si cambia por la dependencia de Supabase.
- G2. 202 tests en verde, sin tests nuevos y sin editar ninguno.
- G3. Lint sin hallazgos. Cero guiones largos en los archivos nuevos y editados.
- G4. Los 18 archivos existen con los nombres exactos, cada uno por encima de 20 kB, ninguno uniforme (varianza y conteo de colores). En los siete del preview el cartel esta dibujado.
- G5. Cero requests a supabase.co completadas y cero filas nuevas en `visits` durante la corrida.
- G6. Dos corridas seguidas dan el mismo set de nombres, la segunda sin pasos manuales.
- G7. `validacion/` ignorado por git y `git status` limpio despues de correr el script.
- G8. Commiteado y pusheado, con verificacion de deploy si el bundle cambio.

## Comando

`npm run capturas`

## Commits

1. Apertura: este archivo, EXECUTION y la correccion de TAREA_017.
2. Codigo: script, package.json, package-lock.json, .gitignore.
3. Cierre: resultados en este archivo, STATE, DECISIONES y `_ULTIMO.md` en 019.
