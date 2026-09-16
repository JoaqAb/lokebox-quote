# TAREA_020 · Oferta, identidad y defectos de la demo

Bloque 6, miercoles 16. Va despues de TAREA_013.

Prerrequisito: docs/STATE.md, docs/EXECUTION.md bloque 6, SPEC 3, 12, 13, 15 y 16 (version 1.19), D14 a D30 en docs/DECISIONES.md.

## Contexto

El viernes 18 la demo EN sale a 40 carteleros de Tucuman. Hoy la demo pierde letras en cualquier
palabra con N o con tilde, el ultimo control del panel se ve rebanado al medio, y la landing
muestra dos tiers con precios que D17 mata. Los tres son defectos que el prospecto ve antes que
nada.

Prioridad: los puntos 1, 2 y 4 no se recortan. El 7 es lo primero que sale si no llega.

## Alcance

### 1. Subset del typeface con N y vocales con tilde

- `public/assets/quote/fonts/archivo-black-subset.typeface.json` pasa de 37 a 44 glifos: A a Z,
  0 a 9, espacio, y ademas N con virgulilla, A E I O U con tilde y U con dieresis.
- Solo mayusculas: el campo de texto del panel fuerza mayusculas desde TAREA_016.
- Mismo script y mismo comando que TAREA_016, con la cadena de caracteres extendida. El TTF es
  el mismo, sha256 `dd9a89a019b4849f66ab75455fe7bdf931311042cbb0f0f97acc061539703180`.
- Techo de 60 kB de SPEC 12 y 16. Peso final medido: 15.524 bytes.
- `opentype.js` sigue sin entrar a package.json: es de la herramienta, no de la app.
- Comando exacto, desde la raiz del repo:

```
curl -sSL -o /tmp/typeface/ArchivoBlack-Regular.ttf --create-dirs https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf
npm install --prefix /tmp/typeface opentype.js@1.3.4
NODE_PATH=/tmp/typeface/node_modules node scripts/typeface.cjs /tmp/typeface/ArchivoBlack-Regular.ttf public/assets/quote/fonts/archivo-black-subset.typeface.json "ABCDEFGHIJKLMNOPQRSTUVWXYZÑÁÉÍÓÚÜ0123456789 "
```

- El test del typeface cambia en tres puntos: el subset esperado, el caracter que no dibuja (ya
  no puede ser la N con virgulilla) y la medicion del peso, que pasa a contar bytes UTF-8 con
  `TextEncoder` porque el archivo deja de ser ASCII puro.
- No cambia nada mas: el avance del caracter ausente sigue siendo el del espacio, y la validacion
  de 1 a 18 caracteres no se toca.

### 2. Los dos defectos de D24

- El bloque de precio (`PriceBar`) lleva borde superior, que ya tiene, mas una sombra corta hacia
  arriba. Asi se lee como un bloque que se apoya sobre el panel y no como una linea de corte.
- El contenedor de scroll del panel, en `QuoteLayout`, lleva una mascara de degradado de unos
  24 px en su borde inferior, que desvanece el contenido que sigue debajo del recorte.
- La sombra y la mascara salen de las variables del tema: ningun hexadecimal nuevo.
- Verificacion en captura a 1440 y a 390. No es relleno inferior: eso se midio y se descarto el
  14/09, y lo que se ve cortado es el borde del scroll, que un relleno no cambia.

### 3. Logo de Lokebox en la landing

- `public/lokebox-logo-horizontal.svg`, ya copiado por Canal C. Autocontenido: el wordmark viene
  en trazos y no depende de ninguna fuente.
- Va en el encabezado y en el pie de la landing. Su ruta vive en `brand.logo` del JSON y se valida
  en runtime, como cualquier otra clave.
- No se toca la paleta ni entra ninguna fuente: la identidad visual se esta cerrando en otro
  frente y cuando cierre entra como edicion del JSON (D18).
- Las demos `/d/<slug>` siguen white label con el tema de su JSON.

### 4. La oferta en la landing

Sale la seccion de tiers completa: la clave `tiers` del JSON, su validacion, el componente y sus
tests. Entra la seccion de oferta, que dicta el JSON.

- `offer.price.setup` y `offer.price.monthly` son numeros (250 y 29) y se formatean con
  `formatCurrency` del core, con la moneda y el locale de la landing.
- `offer.setup`, `offer.monthly` y `offer.more` son listas de strings, cada una con su titulo
  en `texts`.
- Los textos son literales, en ingles, y no se reescriben:
  - titulo: "What you get"
  - precio: "From USD 250 setup, plus USD 29 per month."
  - setup: "Quote tool with your logo, your colors and your texts." / "Up to three sign types,
    with all their options." / "3D preview that changes while the visitor picks options." /
    "Price on screen as a range, with your own note." / "Leads with the full configuration, by
    WhatsApp or by form." / "Printable quote sheet." / "Your prices loaded and checked with you."
  - abono, titulo "Included every month": "Prices kept up to date, up to two updates per month." /
    "Your page online, with your address and its certificate." / "Orders saved with the full
    configuration." / "Small changes at no cost." / "Product improvements included." / "Support
    with an answer within one working day." / "Cancel whenever you want and keep your data."
  - mas, titulo "Built on request, quoted case by case": "More sign types, or another product
    family." / "More complex price rules." / "Your photos of real jobs in the preview." /
    "Another language on the same page."
  - demos, titulo "See how it works", botones "See the English demo" y "See the Spanish demo", y
    debajo "This is a demo to show you the product. It is not set up for your daily work."
- En la landing no se usa la palabra gratis ni ninguna promesa de prueba (D25).
- Cero strings de UI en `src/landing`.

### 5. Capturas de landing

Rehacer las tres capturas de landing del set de 21 con `npm run capturas`. El resto del set se
regenera igual, sin cambios esperados.

### 6. Material comercial

- `docs/comercial/PRICING.md` reescrito con el esquema de D17: un solo precio piso para todos los
  mercados, add-ons sin precio, y sin tiers, sin planes por mercado y sin founding.
- Borrador del texto del listado del Catalog, con el eje de D15 (hasta tres tipos de cartel con
  todas sus variantes, no cantidad de familias) y el mismo precio de la landing.

### 7. Open Graph, recortable

Imagen de 1200x630 y sus meta tags en `index.html`. Es lo primero que se recorta si no llega.

## Archivos

- `public/assets/quote/fonts/archivo-black-subset.typeface.json`
- `src/verticals/signs/scene/typeface.test.ts`
- `src/core/ui/PriceBar.tsx`, `src/core/ui/QuoteLayout.tsx`, `src/index.css`
- `src/landing/landing.json`, `src/landing/landingConfig.ts`, `src/landing/LandingPage.tsx`,
  `src/landing/landingConfig.test.ts`
- `index.html`, `public/og-lokebox-quote.png` (punto 7)
- `docs/comercial/PRICING.md`, `docs/comercial/UPWORK.md`
- `SPEC.md` (1.19), `docs/DECISIONES.md`, `docs/EXECUTION.md`, `docs/tareas/INDICE.md`

## Criterios de aceptacion

- G1 a G6.
- Topes de bundle por grupo de SPEC 3: three-vendor por debajo de 1000 kB, react-vendor por debajo
  de 250 kB, suma de chunks de app por debajo de 500 kB, con los tres numeros anotados.
- `/` sigue sin pedir el vendor 3D ni los assets del preview.
- El woff2 de titulos no existe y no se agrega.
- Cero strings de UI en `src/landing`, verificado con grep.
- Typeface por debajo de 60 kB con el numero medido, y N, A, E, I, O, U con tilde y U con dieresis
  dibujando letra en modo letters y en el relieve del modo area.
- Los dos defectos de D24 verificados en captura a 1440 y a 390.
- El logo aparece en encabezado y pie de `/`, y un `brand.logo` que falte hace fallar la
  validacion nombrando la clave.
- La landing no muestra ninguna tarjeta de tier y muestra la oferta con sus cuatro bloques.
- Las tres capturas de landing del set de 21 rehechas.

## Commits y deploy

1. Docs de apertura: SPEC 1.19, D14 a D30, INDICE, EXECUTION, STATE y este archivo.
2. Codigo, con el typeface, la landing, los dos defectos y el material comercial.
3. Docs de cierre: docs/STATE.md reescrito, docs/DECISIONES.md, INDICE y `_ULTIMO.md` en 021.

Despues: `git push` a origin/main y verificacion del deploy repitiendo el curl hasta tres
respuestas nuevas seguidas.
