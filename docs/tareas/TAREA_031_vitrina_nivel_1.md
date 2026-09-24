# TAREA_031 · Vitrina nivel 1: tres clientes nuevos de cartelería

Bloque 11 · Vitrina. Decisiones: D114 a D118. SPEC 2.11, sección 11.

## Objetivo

Sumar tres clientes ficticios de cartelería sobre el core actual, cada uno con una estética y una configuración distintas, y generar el material de vitrina (capturas) para el portfolio de Upwork y la web nueva. Es la prueba del principio de SPEC 2: un cliente nuevo es un JSON, un logo y sus fotos, sin tocar código.

## Regla que manda sobre todo lo demás (D116)

`git diff` de esta tarea no toca `src/core/` ni `src/verticals/`. Si un cliente no se puede expresar sin editar esos directorios (una validación que rechaza un locale, una moneda o una unidad, un texto que falta en el esquema, un contraste que el tema no puede resolver), la tarea se frena en ese punto y se reporta: qué cliente, qué clave, qué archivo y qué línea del core lo impide. No se parchea, no se ajusta el JSON para esquivarlo sin avisar. Ese hallazgo es parte del resultado.

Excepciones permitidas fuera de `src/clients/` y `public/`: `scripts/vitrina.mjs` (nuevo) y un test que valide todos los clientes del registro si no existe ya uno.

## Prerrequisito (Canal C, ya ejecutado antes de pegar esta tarea)

Seis fotos en `incoming/vitrina/`, generadas según docs/comercial/CANAL_C_VITRINA_FOTOS.md:

- `halcyon-front-day.png`, `halcyon-front-night.png`
- `afterglow-front-day.png`, `afterglow-front-night.png`
- `alba-front-day.png`, `alba-front-night.png`

Si falta alguna o alguna no cumple lo del documento (16:9, frontal, banda lisa sobre la puerta, sin texto ni marcas, noche con el mismo encuadre que el día, vereda visible en alba), se frena antes de empezar y se reporta cuál y por qué.

## Los tres clientes (D115)

Todos con `"vertical": "signs"`, `"poweredBy": true`, `"prices_placeholder": false`, marcas ficticias, emails en el dominio `.example` y teléfonos de ficción (555 en EE.UU., rangos de ficción de Ofcom en UK, 600 000 000 en España).

### halcyon · Halcyon Signworks

- `locale` `en-GB`. Moneda `{ "code": "GBP", "symbol": "£", "decimals": 0 }`. Unidades `{ "length": "m", "area": "m2" }`.
- Colores: `bg #F4F3F0`, `primary #C9C4BA`, `accent #A8823A`, `text #14181F`, `muted #5E6570`. Premium sobrio: corporativo, hoteles, oficinas.
- `cta` `form`. `pricing` `{ "display": "exact" }`.
- Tipos: `letters` y `facade` (`mount` `standoff`). Sin totem.
- Materiales: `aluminium` (Aluminium, visual igual al aluminum de northline), `brass` (Brass: `color #B08D57`, `finish polished`, `metalness 1`, `roughness 0.25`, `specularIntensity 1`, `clearcoat 0`, `clearcoatRoughness 0`, `anisotropy 0`, `normalScale 0.1`, `translucency 0`), `acrylic` (Acrylic, visual igual al de northline).
- Iluminación: `none` y `back`.
- `signText.default` `HALCYON`.
- Textos en inglés británico a partir de northline: aluminium, colour, enquiry. Tono formal.

### afterglow · Afterglow Signs

- `locale` `en`. Moneda USD como northline. Unidades `ft` y `sqft`.
- Tema oscuro: `bg #101114`, `primary #1C1E24`, `accent #FF3D7F`, `text #F2F2F4`, `muted #9A9CA6`. Bares, restaurantes, vida nocturna.
- `cta` `whatsapp`. `pricing` sin objeto (vale `range`).
- Tipos: `letters` y `facade` (`mount` `standoff`). Sin totem.
- Materiales: `pvc` y `acrylic` como northline, más `pink-acrylic` (Pink acrylic: igual al acrylic de northline con `color #FF3D7F`).
- Iluminación: `none`, `front`, `back`.
- `signText.default` `AFTERGLOW`.
- Textos en inglés de EE.UU., tono informal y corto.
- La primera foto es la de día, como en los otros clientes: la luz del modo cartel no depende de esto por TAREA_030, pero no se toca el orden para no abrir esa pregunta.

### alba · Rótulos Alba

- `locale` `es-ES`. Moneda `{ "code": "EUR", "symbol": "€", "decimals": 0 }`. Unidades `m` y `m2`.
- Colores: `bg #FBF6F0`, `primary #E7D6C3`, `accent #C4552D`, `text #2A1E17`, `muted #7A6A5E`. Cálido: cafeterías, panaderías, comercio de barrio.
- `cta` `both`. `pricing` `{ "display": "hidden" }`, con `whatsappMessageHidden` y `whatsappMessageHiddenLetters` sin ninguna cifra de precio.
- Tipos: los tres, `facade` (`standoff`), `totem` (`flush`) y `letters`. Las dos fotos llevan `anchorGround` con `wallY`.
- Materiales: `pvc`, `aluminio`, `metacrilato` (visual igual a pvc, aluminum y acrylic de norte).
- Iluminación: `none`, `front`, `back`.
- `signText.default` `ALBA`. Sin tildes en los textos por defecto del cartel.
- Textos en español de España a partir de norte: rótulo en lugar de cartel, tuteo, sin voseo.

### Rangos y precios (reglas fijas, sin criterio propio)

- Rangos de medidas, profundidades, cantidad, descuentos y `rangePct`: halcyon y alba copian los de `norte.json` (métricos); afterglow copia los de `northline.json`.
- Precios de afterglow: los de northline, iguales.
- Precios de halcyon y alba: se parte de northline. Por área (`pricePerArea`, `installation.perArea`): por 10,76 (pie cuadrado a metro cuadrado). Por altura de letra (`pricePerLetterHeight`): por 3,28 (pie a metro). Por letra y fijos: sin conversión de unidad. Después, moneda: por 0,78 para GBP y por 0,92 para EUR. Todo redondeado al múltiplo de 5 más cercano. `brass` vale 1,6 veces `aluminium` en cada precio. `pink-acrylic` vale lo mismo que `acrylic`.

### Logos

Un SVG por cliente en `public/clients/<slug>/logo.svg`, autocontenido: sin `<text>`, sin fuentes, sin imágenes embebidas, menos de 10 kB, legible a 32 px de alto. Letras como paths. Tres estilos distintos entre sí y distintos de northline y norte:

- halcyon: monograma geométrico con línea fina, serif trazada o capitales espaciadas, en `#14181F` con detalle `#A8823A`.
- afterglow: trazo redondeado de ancho constante, estilo tubo, en `#FF3D7F`, que se lea sobre `#101114`.
- alba: sans redondeada con un sol o semicírculo simple, en `#C4552D`.

### Fotos

Pasar las seis de `incoming/vitrina/` a `public/assets/quote/backgrounds/<slug>-front-day.webp` y `<slug>-front-night.webp`, con las mismas dimensiones que `northline-front-day.webp` y un peso de 150 kB o menos cada una, con la misma herramienta que usó TAREA_011. Ids `front-day` y `front-night`, labels `Front`/`Night` en inglés y `Frente`/`Noche` en español.

Calibración con `?calibrate=1`, igual que en TAREA_011: `anchor` sobre la banda lisa sobre la puerta, `metersToWidth` medido contra la puerta (unos 2,1 m de alto), cámara `cameraYawDeg 0`, `cameraPitchDeg 0`, `fovDeg 40`. En alba, `anchorGround` sobre la vereda con `wallY` en la línea donde la fachada toca la vereda. `light` por foto a partir de la de northline, ajustado a la dirección del sol que se ve en la foto de día; de noche, los valores de noche de northline.

## Material de vitrina

`scripts/vitrina.mjs`, siguiendo `scripts/venta.mjs`: sin nombres de utilidades de Tailwind en el script. Corre contra el build local y escribe en `validacion/vitrina/<slug>/` (ignorado por git) para los cinco clientes, northline y norte incluidos:

| Archivo | Tamaño | Qué muestra |
|---|---|---|
| `01-desktop-cartel.png` | 1440 x 900 | Modo cartel con la configuración de portada |
| `02-desktop-dia.png` | 1440 x 900 | Vista Front con la configuración de portada |
| `03-desktop-noche.png` | 1440 x 900 | Vista Night con la configuración de portada |
| `04-mobile.png` | 390 x 844, DPR 3 | Modo cartel, mobile |
| `05-cuadrado.png` | 1080 x 1080 | Solo el preview, recortado, para redes y web |
| `06-ancho.png` | 1200 x 630 | Solo el preview, recortado, para tarjetas y web |

Configuración de portada, por URL o estado, sin tocar el JSON:

- halcyon: `letters`, `brass`, `back`, profundidad intermedia.
- afterglow: `letters`, `pink-acrylic`, `front`.
- alba: `totem`, `aluminio`, `front`.
- northline y norte: la de TAREA_029 para el material de venta.

Más `validacion/vitrina/00-grilla.png`, 1920 x 1080: los cinco `05-cuadrado.png` en grilla sobre fondo `#F2F1EE`, sin texto. Si la configuración de portada no se puede fijar sin tocar core, el script hace los clics del panel, igual que venta.mjs.

## Criterios de aceptación

1. Los tres JSON validan al cargar y `/d/halcyon`, `/d/afterglow` y `/d/alba` renderizan sin error en consola.
2. `git diff --stat` no muestra archivos en `src/core/` ni en `src/verticals/` (D116).
3. Flujo completo en los tres: configurar, precio según su modo, lead por su CTA con el nombre `Vitrina Test`, pantalla de gracias y hoja imprimible. Filas en `leads` verificadas con una consulta por `contact_name`.
4. alba (`hidden`): ninguna cifra de precio en pantalla, en el mensaje de WhatsApp ni en la hoja. Se verifica buscando `€` y dígitos seguidos de `€` en el DOM y en la URL de wa.me.
5. halcyon (`exact`): precio exacto sin rango, con `£` y formato `en-GB`. alba con `€` y `2,5` en `es-ES`.
6. afterglow: contraste de 4,5:1 o más en todo texto sobre `bg`, `surface` y los controles activos (`.q-on`), medido y reportado por par de colores. Si el fallo viene de D18 o de cómo el core deriva colores, se reporta por la regla D116, sin parche.
7. Fotos: seis webp de 150 kB o menos, cartel apoyado en la banda y totem apoyado en la vereda, verificado en `02` y `03` de cada cliente.
8. Logos: tres SVG sin `<text>`, menos de 10 kB, legibles en el header de desktop y de mobile.
9. `scripts/vitrina.mjs` genera los 31 archivos y lista tamaño y dimensiones de cada uno.
10. Un test valida todos los JSON del registro de clientes (existente o nuevo).
11. Deploy: push a main, Vercel en verde, y las tres rutas nuevas responden 200 en https://quote.lokebox.com.
12. G1 a G6 de docs/EXECUTION.md.

## Cierre

Commit de código, commit de docs con docs/STATE.md, docs/tareas/INDICE.md (fila de TAREA_031 con el hash) y docs/DECISIONES.md con lo que se decidió durante la tarea, una línea cada una. Reporte a Canal B: hash, lista de hallazgos D116 si los hubo, contrastes de afterglow, rutas de las 31 capturas.
