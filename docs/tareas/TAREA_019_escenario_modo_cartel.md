# TAREA_019 · Escenario del modo cartel

Bloque 4. Va despues de TAREA_018 y antes de TAREA_013 (landing).

Prerrequisito: docs/STATE.md, SPEC 4.1, 11 y 12 (version 1.16), `src/core/theme.ts`.

## Contexto

Canal B valido TAREA_017 por capturas: el totem queda aceptado en los dos modos y en los dos clientes, y no se toca.

Canal B rechazo el criterio 2 de DONE por el contraste del modo cartel: el material claro del cartel casi no se despega de `--q-surface`, y en letters las letras corporeas de los dos clientes casi no se leen. Tambien la sublinea de los dos logos (SIGNS y CARTELES) queda en dos o tres pixeles de alto.

## Alcance

### 1. Tercera derivada del tema

- En `src/core/theme.ts`, `STAGE_MIX_PCT = 82` al lado de las dos constantes existentes, con su motivo: el marco del modo cartel es un escenario y tiene que contrastar con un cartel de material claro.
- `'--q-stage': mix(STAGE_MIX_PCT)`, con la misma funcion `mix`.
- `--q-surface` y `--q-border` no cambian: siguen en 6 y 16.
- Casos nuevos en `src/core/theme.test.ts`: la variable esta, usa color-mix sobre `--q-text` y `--q-bg`, y superficie y borde siguen en 6 y 16.

### 2. Fondo del marco segun la vista

- En `SignPreview.tsx` el marco usa `--q-stage` en modo cartel y `--q-surface` en modo vista, detras de la foto. Sin variantes `dark:`, sin segundo tema, sin hexadecimales.

### 3. Color de la sombra de apoyo

Entro despues de la frenada (ver Historia).

- `SUPPORT_SHADOW_COLOR`, constante casi negra en `sceneGeometry.ts` al lado de `SIGN_STUDIO_LIGHT` y de las constantes del totem, con su comentario: una sombra oscurece siempre y no tiene color de marca.
- `scenePalette().shadow` devuelve la constante. Sale `shadow` de `MIX`. `signText` sigue derivado del tema con 0,88.
- La opacidad 0,24 y la geometria de `SUPPORT_SHADOW` y `TOTEM_SHADOW` no cambian. Vale para los dos modos sin ramificar.
- Se editan los dos casos de `sceneGeometry.test.ts` que afirmaban la mezcla de la sombra y se agrega uno con dos temas distintos que dan la misma sombra.
- Si alguna de las tres comparaciones de luminancia de SPEC 12 fallara, se frena: no se tocan halo, opacidad ni umbrales.

### 4. Logos

- En los dos SVG la sublinea pasa a la misma linea que el nombre, como `tspan` a 14 en vez de 9 en un texto aparte. Sigue al nombre sin depender del ancho de la fuente del sistema. Sin codigo, sin assets nuevos, sin cambios en los JSON.

### 5. SPEC 1.16

- 12: el fondo del marco del modo cartel es `--q-stage`.
- 12: el color de la sombra de apoyo es una constante de escena casi negra, con su motivo.
- 4.1: tres derivadas con color-mix.
- 11: los dos clientes tienen paleta clara; sale la estetica oscura de northline.

### Fuera de alcance

- El relleno inferior del panel frente a la barra de precio (ver Historia). No se tocan el layout del panel, la barra ni el relleno.
- Ya decidido y no se propone de nuevo: la sombra proyectada direccional del modo vista, el cartel bandera, la calibracion por cuatro esquinas, reestructurar la estetica del proyecto, Quote en la landing de Lokebox.
- Nada del totem, de la luz de estudio, de los materiales, de la camara ni del encuadre.

## Historia

1. Se hicieron los puntos 1, 2 y 4 y se regeneraron las capturas. El contraste quedo resuelto: letras y panel claros sobre un marco oscuro.
2. Frenada: sobre `--q-stage` la sombra de apoyo aparecia como una mancha mas clara que el fondo. Medido: fondo 64,9, debajo del panel de facade media 69,0 y maximo 75,0 en northline, 69,5 y 75,5 en norte, y hasta 73,1 debajo de las letras. La causa: el color de la sombra se mezclaba de `--q-primary` y `--q-text`, un gris mas claro que el escenario, y al 24 por ciento aclaraba en vez de oscurecer. El brief pedia frenar antes de tocar la escena, y se freno.
3. El punto 3 del brief original pedia un relleno inferior en la columna del panel igual o mayor a la barra de precio. Medido con Playwright: al final del scroll ningun control queda tapado en 1440 ni en 390. En mobile el relleno ya sale de la altura real de la barra con ResizeObserver, y en desktop la barra es estatica al pie de la columna. Lo que se ve cortado al cargar es el borde del scroll, que un relleno no cambia. No se toco nada y se reporto.
4. Decision de Canal B: la sombra pasa a color de escena (punto 3 de este archivo) y el relleno sale del alcance, a revisar el jueves con el video.

## Criterios de aceptacion

- G1. Build sin warnings. App no mas de 2 kB arriba de 420,06 kB y vendor 3D en 963,55 kB.
- G2. Lint sin hallazgos, sin guiones largos, todos los tests en verde.
- G3. `npm run capturas`: en las seis de modo cartel la luminancia debajo del panel y debajo de las letras es igual o menor a la del fondo del marco, en los dos clientes. Sin mancha.
- G4. Las siete de modo vista: la foto cubre el marco, sin borde duro de sombra, y las tres comparaciones de luminancia de SPEC 12 pasan.
- G5. Sin criterio: el relleno salio del alcance.
- G6. En desktop y mobile la sublinea del logo se lee y el resto del layout no se movio.
- G7. SPEC 1.16 con las cuatro ediciones.
- G8. DECISIONES con seis lineas fechadas 14/09.
- G9. EXECUTION, STATE y este archivo cerrados, `_ULTIMO.md` en 020.
- G10. Commits, push y verificacion de deploy.

## Commits

1. Apertura: SPEC 1.16, DECISIONES, EXECUTION y este archivo.
2. Codigo: tema, marco, sombra, tests y logos.
3. Cierre: resultados en este archivo, STATE y `_ULTIMO.md` en 020.
