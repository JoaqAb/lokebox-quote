# TAREA_013 · Landing minima en /

Bloque 4. Ultima tarea de codigo del bloque: despues va el Canal C de video y capturas.

Prerrequisito: docs/STATE.md, SPEC 3, 4.1, 13 y 15 (version 1.17), docs/EXECUTION.md bloque 4.

## Contexto

`/` muestra hoy un indice temporal con los slugs crudos (`src/pages/IndexPage.tsx`). Se reemplaza por la landing de Lokebox Quote: que es, como funciona, para quien, las dos demos, los dos tiers con precio y contacto.

Canal B valido las capturas de TAREA_019: la sombra esta bien en los dos modos y el criterio 2 de DONE quedo resuelto. No se reabre nada del preview.

## Decisiones

- D1. JSON propio en `src/landing/landing.json`, con validacion en runtime propia. No es un cliente: no entra al registro de `src/clients` y no tiene ruta `/d/`.
- D2. La landing reusa los tokens `--q-` y las clases `.q-control`, `.q-on`, `.q-off`, `.q-hairline` y `.q-panel`. `themeFromLanding` emite seis variables: `--q-bg`, `--q-text`, `--q-muted`, `--q-accent`, `--q-surface` y `--q-border`, las dos ultimas con el mismo color-mix de `core/theme.ts`. No emite `--q-primary` ni `--q-stage`: ninguna clase que usa la landing los consume.
- D3. `core/theme.ts` exporta el helper de mezcla y las constantes `SURFACE_MIX_PCT` y `BORDER_MIX_PCT`, y `landingTheme.ts` los importa. core no importa nada de landing.
- D4. `/d/:slug` y `/d/:slug/quote` pasan a `React.lazy` con un unico `Suspense` alrededor de `Routes`. Fallback: un div vacio con `min-h-dvh`, sin texto, sin spinner y sin color propio. `/` y la ruta comodin quedan estaticas. SPEC 3 aclara que la regla de no lazy loading es del preview dentro de la pagina del cotizador, no de la ruta.
- D5. Contacto solo por email, con un boton mailto. Sin WhatsApp en la landing.
- D6. Los precios de los tiers son numeros en el JSON y se formatean con `formatCurrency` de `src/core/pricing/format.ts`, con currency y locale del JSON de la landing.
- D7. Cada href de demos se valida contra `listClientSlugs()`: tiene que ser `/d/<slug>` con un slug existente, y si no la validacion falla nombrando href y slug. La landing importa `listClientSlugs` y nada mas de `src/clients`, nada de `src/verticals`, y de `src/core/theme.ts` solo el helper de mezcla y sus constantes.
- D8. Sin logo: `brand.name` va como texto. Sin fuente nueva: el stack por defecto de Tailwind.
- D9. `index.html` con title y description estaticos. Sin Open Graph.
- D10. Sin prefetch de la ruta de demo.
- D11 (despues de la frenada). Se autoriza editar `vite.config.ts`: entra un chunk manual `react-vendor` con exactamente react, react-dom y scheduler, matcheados por `node_modules/react/`, `node_modules/react-dom/` y `node_modules/scheduler/` despues del grupo del vendor 3D. react-router y react-router-dom no entran: quedan en los chunks de app. Ningun otro chunk manual y sin tocar `chunkSizeWarningLimit`. Motivo: three-vendor tenia React adentro, arrastrado como dependencia de fiber y drei, asi que cualquier ruta que usara React precargaba el vendor 3D y el presupuesto de SPEC 3 venia midiendo mal desde TAREA_004. Separar react-vendor es el arreglo de esa mezcla, no un atajo para pasar C6.

## Archivos

Nuevos:

- `src/landing/landing.json`
- `src/landing/landingConfig.ts`: tipos y `validateLandingConfig(raw)`, mismo estilo que `core/clientConfig.ts`, sin librerias, mensajes con prefijo `Landing:` y el nombre de la clave que falta.
- `src/landing/landingConfig.test.ts`
- `src/landing/landingTheme.ts`: `themeFromLanding(landing)`
- `src/landing/landingTheme.test.ts`
- `src/landing/LandingPage.tsx`. Si pasa de 200 lineas se parte en `LandingTiers.tsx` y `LandingBullets.tsx`, en la misma carpeta, sin pasar de tres archivos de componente.

Editados:

- `src/App.tsx`: `/` apunta a `LandingPage`; las dos rutas de `/d/` con `React.lazy` y `Suspense`.
- `src/core/theme.ts`: exporta el helper de mezcla y las dos constantes, sin cambiar el valor de ninguna variable.
- `index.html`: title "Lokebox Quote, a visual quote builder" y meta description "Your customer configures the product, sees it in 3D and gets an estimate. You get the request with every detail already filled in."
- `scripts/capturas.mjs`: tres capturas de `/`, el set pasa de 18 a 21.
- `vite.config.ts`: el grupo `react-vendor` (D11).
- `SPEC.md` (1.17, 15/09/2026), `docs/DECISIONES.md`, `docs/EXECUTION.md`, `docs/STATE.md`.

Borrado:

- `src/pages/IndexPage.tsx`. `listClientSlugs` queda: lo usan la landing y los tests. Lo que quede sin uso por el borrado sale y se reporta.

## Forma y contenido de landing.json

```json
{
  "locale": "en",
  "currency": { "code": "USD", "symbol": "$", "decimals": 0 },
  "brand": { "name": "Lokebox Quote" },
  "colors": { "bg": "#FAFAF8", "text": "#101215", "muted": "#6E737B", "accent": "#1E56E0" },
  "texts": {
    "headline": "A visual quote builder for your website",
    "subheadline": "Your customer picks what they need, sees it in 3D and gets an estimate. You get the request with every detail already filled in.",
    "demosTitle": "Try a live demo",
    "howTitle": "How it works",
    "how": [
      "The visitor configures the product and watches it change in 3D.",
      "The price updates live, as an estimate range that you confirm later.",
      "You get the request by WhatsApp or email, with a printable quote."
    ],
    "forWhoTitle": "Who it is for",
    "forWho": [
      "Sign makers and print shops that quote by hand, one message at a time.",
      "Businesses that keep getting vague questions like how much for a sign.",
      "Owners who want the price question answered while the visitor is still on the page."
    ],
    "tiersTitle": "Pricing",
    "tierSetupLabel": "setup",
    "tierMonthlyLabel": "per month",
    "contactTitle": "Want one for your business?",
    "contactBody": "Tell me what you sell and how you charge for it. I reply with a demo built around your own product.",
    "contactButton": "Send an email",
    "footer": "Lokebox Quote. Built by Lokebox."
  },
  "demos": [
    { "id": "en", "label": "English demo", "href": "/d/northline" },
    { "id": "es", "label": "Spanish demo", "href": "/d/norte" }
  ],
  "tiers": [
    {
      "id": "starter",
      "name": "Starter",
      "setup": 750,
      "monthly": 79,
      "features": [
        "Quote builder with your brand, colors and logo",
        "One product family",
        "WhatsApp button, contact form or both",
        "Every request saved with the full selection",
        "Printable quote sheet"
      ]
    },
    {
      "id": "pro",
      "name": "Pro",
      "setup": 1500,
      "monthly": 149,
      "features": [
        "Everything in Starter",
        "Up to two related product families",
        "Advanced price rules",
        "Priority setup"
      ]
    }
  ],
  "contact": { "email": "hello@lokebox.com", "placeholder": true }
}
```

Validacion:

- `locale` string no vacio.
- `currency` con `code` y `symbol` strings no vacios y `decimals` entero mayor o igual a 0.
- `brand.name` string no vacio.
- Los cuatro colores contra `/^#[0-9A-Fa-f]{6}$/`.
- Todas las claves de `texts` presentes y no vacias; `how` y `forWho` listas de 3 strings no vacios.
- `demos` exactamente 2 entradas con ids unicos y `href` `/d/<slug>` con slug en `listClientSlugs()`.
- `tiers` exactamente 2 entradas con ids unicos, `setup` y `monthly` numeros finitos mayores que 0, `features` lista no vacia de strings no vacios.
- `contact.email` string con una arroba y un punto despues de la arroba; `contact.placeholder` boolean. El flag no tiene efecto visible ni test que afirme su valor: le avisa a Canal C que el email todavia no es el real, igual que `prices_placeholder`.

## Estructura de la pagina

- Mobile primero, una columna, contenedor centrado de 960 px de ancho maximo, padding lateral generoso.
- El tema se aplica una vez, con el style del contenedor raiz. Fondo `var(--q-bg)`, texto `var(--q-text)`, secundario `var(--q-muted)`.
- Orden: encabezado con `brand.name` como texto; hero (headline, subheadline, demosTitle y los dos botones); how it works (titulo y tres pasos numerados); who it is for (titulo y tres bullets); pricing (titulo y dos tarjetas); contacto (titulo, cuerpo y boton); footer.
- Botones de demo: `<a href>` nativos a los href del JSON, no Link de React Router ni rutas armadas desde el registro. El primero `.q-control .q-on`, el segundo `.q-control .q-off`.
- Tarjetas de tier: `.q-panel` con borde `.q-hairline`, apiladas en mobile y en dos columnas desde 768 px. Cada una con name, la linea de setup, la de mensual y las features como lista. Linea de setup: `formatCurrency(tier.setup, currency, locale)`, espacio y `texts.tierSetupLabel`; igual la mensual con `tierMonthlyLabel`. Ninguna palabra escrita en el codigo.
- Contacto: `<a href="mailto:...">` con `.q-control .q-on` y el texto de `contactButton`.
- Cero literales de texto en el JSX de la landing: ni en nodos de texto, ni en `aria-label`, ni en `title`. La unica excepcion de strings en el codigo del proyecto sigue siendo la pantalla de error.
- La landing no importa three ni el preview, y no inserta visitas ni leads.

## Ediciones de SPEC (1.17, 15/09/2026)

- 3: `/d/:slug` y `/d/:slug/quote` se cargan con `React.lazy` para que `/` no descargue el vendor 3D. La regla de no lazy loading es del preview dentro de la pagina del cotizador, no de la ruta: el preview sigue llegando junto con su panel porque la ruta entera es un chunk.
- 13: reescrita con la forma del JSON, el orden de secciones, el contacto solo por email, el reuso de los tokens `--q-` con las dos derivadas y la validacion de los href contra el registro de clientes.
- 15: sin cambios; los valores del JSON son los de SPEC.

## Criterios de aceptacion

G1 a G6 de docs/EXECUTION.md, y ademas, cada uno con su numero en Resultados:

- C1 (redefinido despues de la frenada). Topes por grupo: three-vendor por debajo de 1000 kB (esperado 952,28), react-vendor por debajo de 250 kB (esperado 189,60), la suma de los chunks que no son vendor por debajo de 500 kB (esperado 251,88), build sin warnings y ningun chunk por encima del limite de aviso. Los numeros fijos 963,55 kB y 420,04 kB se retiran: con react-vendor cambio lo que hay dentro de cada chunk y dejaron de ser comparables.
- C2. `npx tsc -b --force` con 0 errores y `npm run lint` sin hallazgos.
- C3. Tests en verde. Los 205 previos sin editar, mas al menos 6 casos de landingConfig (JSON valido pasa, clave de texts faltante, color no hexadecimal, href a un slug inexistente, tier con setup en 0, email sin arroba) y 2 de landingTheme (las seis variables, y superficie y borde iguales a los del mismo porcentaje de mezcla).
- C4. Sin guiones largos en ningun archivo nuevo o editado.
- C5. Carga de `/` sobre el build servido con `npx vite preview`, cache deshabilitado, tres corridas: `loadEventEnd` por debajo de 2000 ms. Las tres y el peor caso.
- C6. En `/` no se pide three-vendor ni ningun otro asset del preview, verificado con Playwright listando las URLs de red.
- C7. `/d/northline` con el mismo metodo, tres corridas antes y tres despues de React.lazy. El antes tiene peor caso 86 ms, asi que el peor caso de despues no puede pasar de 386 ms. Si es peor, se frena y se reporta, sin prefetch.
- C8. En `/d/northline` panel y preview aparecen juntos: ningun estado intermedio con el panel visible y el marco vacio. Verificado en captura.
- C9. Los dos botones llevan a `/d/northline` y `/d/norte` y las dos demos renderizan completas, verificado en navegador.
- C10. Cero strings de UI en el codigo de la landing, con el resultado del grep sobre `src/landing`.
- C11. 390 px sin scroll horizontal y revision en 390, 768 y 1440 px. Tres capturas nuevas de `/` en `validacion/`: `landing-390.png`, `landing-768.png` y `landing-1440.png`, agregadas a `scripts/capturas.mjs`. El set pasa de 18 a 21.
- C12. Cero POST a supabase.co en la carga de `/` y cero filas nuevas en `visits`.
- C13. React no queda duplicado dentro de three-vendor: sobre dist, un marcador interno de react-dom con 0 apariciones en three-vendor y al menos una en react-vendor. Que three-vendor importe react-vendor es esperado.

## Frenada

Con las rutas en React.lazy, `dist/index.html` seguia precargando three-vendor: React estaba dentro de ese chunk y el entry de `/` lo importaba de ahi, asi que C6 fallaba. El arreglo pedia tocar `vite.config.ts`, fuera de la lista de archivos, y cambiaba three-vendor, que C1 fijaba en 963,55 kB. Se freno con la salida probada y descartada, y Canal B respondio con D11 y el C1 redefinido.

## Commits y deploy

1. Apertura: este archivo.
2. Codigo.
3. Cierre: SPEC, DECISIONES, EXECUTION, STATE y este archivo con los numeros. `_ULTIMO.md` queda en 020: 013 ya existia y es menor.

Push a origin/main. Confirmar por la API de Vercel que el deploy del commit de codigo esta listo, y despues curl a `/`, `/d/northline` y `/d/norte` esperando 200 y el hash de bundle nuevo.

## Resultados

Medido el 15/09/2026 sobre `npx vite preview` del build, con Playwright y chromium headless, cache deshabilitado por CDP y un contexto nuevo por corrida.

El antes de `/` medido sobre el indice viejo (84 ms de peor caso) no sirve como referencia: era otra pagina y bajaba three-vendor.

- C1: build sin warnings y ningun chunk sobre el limite de aviso.

| Chunk | Grupo | Tamano |
|---|---|---|
| index (entry, landing y router) | app | 73,47 kB |
| QuotePage | app | 164,38 kB |
| resolveClient | app | 8,09 kB |
| QuoteSheetPage | app | 5,38 kB |
| rolldown-runtime | app | 0,71 kB |
| react-vendor | react-vendor | 189,60 kB |
| three-vendor | three-vendor | 952,28 kB |
| index.css | estilos | 22,90 kB |

  App sumada 252,03 kB (tope 500), react-vendor 189,60 kB (tope 250), three-vendor 952,28 kB (tope 1000). react-router y react-router-dom quedan en el entry de app: 2 apariciones de `react-router` en el entry y 0 en los dos vendors.
- C2: `npx tsc -b --force` sin errores y `npm run lint` sin hallazgos.
- C3: 215 tests en verde. Los 205 previos sin editar, mas 8 de landingConfig (JSON valido, clave de texts faltante, color no hexadecimal, href a un slug inexistente, setup en 0, email sin arroba, how sin tres pasos, ids de tier repetidos) y 2 de landingTheme (seis variables, y superficie y borde iguales a la mezcla del core).
- C4: cero guiones largos en los archivos nuevos y editados.
- C5: `/` con loadEventEnd de 38, 32 y 37 ms. Peor caso 38 ms.
- C6: pedidos de red de `/`: el documento, el entry, rolldown-runtime, react-vendor y el CSS. Ni three-vendor, ni QuotePage, ni HDRI, ni typeface, ni fotos.
- C7: `/d/northline` loadEventEnd antes 86, 83 y 79 ms (peor 86); despues 40, 37 y 45 ms (peor 45). Como con React.lazy el evento load puede llegar antes que los chunks de la ruta, se midio tambien el primer frame con panel y canvas visibles, sobre un build del commit de apertura: antes 159, 117 y 127 ms en la corrida caliente (la primera corrida en frio dio 2136); despues 384, 374 y 372 ms. La demo aparece unos 225 a 260 ms mas tarde que antes, por la descarga en cascada de los chunks de la ruta, y queda dentro de los 300 ms de margen tambien con esa medida. Sin prefetch.
- C8: en cada frame desde la navegacion se muestreo si habia panel sin canvas: 0 frames en las seis corridas de despues. Panel y canvas aparecen en el mismo frame.
- C9: desde `/`, el primer boton lleva a `/d/northline` y el segundo a `/d/norte`; las dos demos renderizan con canvas, panel ("Build your sign" y "Armá tu cartel") y precio ($360 y $ 272.500).
- C10: grep sobre `src/landing` de nodos de texto con letras y de `aria-label`, `title`, `placeholder` y `alt` literales: 0 resultados.
- C11: scrollWidth igual al ancho de la ventana en 390, 768 y 1440 px. Capturas de pagina entera en `validacion/`: landing-390.png 157695 bytes, landing-768.png 158657 bytes, landing-1440.png 167424 bytes. El set queda en 21. En la revision los puntos de "Who it is for" salian como circulos vacios y pasaron a un punto de acento en una lista no ordenada.
- C12: 0 POST a supabase.co en la carga de `/` en los tres anchos y en las tres corridas. `/` no importa la capa de datos. Las filas de `visits` no se pueden contar con la anon key (RLS devuelve lista vacia); sin requests no hay insert posible.
- C13: sobre dist, `__SECRET_INTERNALS` da 0 en los dos vendors porque React 19 lo renombro. Con el marcador interno de react-dom de React 19, `__DOM_INTERNALS`: 0 en three-vendor y 2 en react-vendor. La definicion de `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE` esta 1 vez en react-vendor y 0 en three-vendor; three-vendor solo la lee desde react-reconciler, dependencia de fiber, e importa react-vendor.
