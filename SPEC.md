# SPEC · Lokebox Quote

Fuente de verdad del alcance. Si algo no está acá, no se construye.
Este documento se edita, no se contradice. Si una feature pone en riesgo el viernes 18, se simplifica o se elimina.

Versión: 1.11 · 14/09/2026

## 1. Objetivo

Cotizador visual interactivo que un negocio pone en su web. El visitante configura lo que necesita, ve un preview 3D que cambia en vivo, obtiene un precio estimado, deja sus datos, y el negocio recibe un lead estructurado.

Primera y única vertical del MVP: cartelería (custom signs).

Canales de venta:

- Upwork Project Catalog. Demo en inglés, precios en USD.
- Salida en frío por WhatsApp a cartelerías de Tucumán. Demo en español, precios en pesos.

Fecha de DONE: viernes 18/09/2026.

## 2. Principios

- El proyecto existe para conseguir clientes. No es un SaaS y no es portfolio por sí mismo.
- Personalizar para un cliente nuevo es editar un JSON y reemplazar sus assets: el logo y las fotos de fondo del preview. Nunca tocar código. Si una tarea rompe esta regla, se rehace. Las fotos entraron en 1.9 con el pivote del preview: siguen siendo archivos que se reemplazan, no código que se edita.
- Arquitectura mínima. Sin auth, sin multi-tenant, sin backoffice, sin permisos.
- Ningún código compartido con Lokebox por ahora. El motor de precios se escribe de forma que pueda copiarse a Lokey sin cambios.
- Nada relacionado con muros de contención, bloques de hormigón, takeoff ni flujos de construcción para contractors (restricción comercial por la oportunidad activa con Joe).
- Soluciones sólidas. Si algo requiere un parche, se frena y se decide.

## 3. Stack

- Vite + React + TypeScript + Tailwind v4 (plugin de Vite).
- React Router para las rutas `/d/<slug>`. Deploy estático con rewrite de SPA en `vercel.json`.
- React Three Fiber + drei para el preview 3D.
- Framer Motion para transiciones de UI y contador de precio.
- Supabase, proyecto propio separado del de Lokebox, para leads y visitas.
- Vitest para los tests del motor de precios.
- Deploy estático en Vercel. Dominio quote.lokebox.com.
- Versiones fijadas en package.json. React ~19.2.8 y three ~0.185.1 por compatibilidad con R3F y con @types/three.
- Assets estáticos del preview, desde 1.9: las fotos de fondo del cliente (2 o 3, 16:9, WebP, unos 1600 x 900) y un único HDRI de estudio para todo el producto, CC0, entre 100 y 200 kB. No entran al bundle de JavaScript: son archivos servidos desde `public/`. El HDRI es opcional en runtime: si falta, el preview funciona sin reflejo.
- Presupuesto de bundle: el código de la app y el vendor 3D van en chunks separados. La app por debajo de 500 kB y el vendor 3D por debajo de 1000 kB sin comprimir. El build avisa si alguno se pasa. No hay lazy loading del preview: el preview es el producto y no puede aparecer después que el resto de la página.

## 4. Arquitectura en tres capas

### 4.1 Core

Se escribe una vez y no conoce ninguna vertical ni ningún cliente concreto.

- Layout responsive. Desktop: preview a la izquierda, panel de opciones a la derecha, precio siempre visible. Mobile: preview arriba, opciones abajo, barra de precio fija al pie.
- Panel de opciones genérico, renderizado desde el esquema de la vertical. Cinco `kinds` de control: choice, range, boolean, stepper y text.
- Tema del cliente: los cinco colores del JSON como variables CSS, más `--q-surface` y `--q-border` derivadas con `color-mix` en el contenedor raíz. El tema sale siempre del JSON del cliente: no hay tema global del core ni variantes `dark:`, que serían una segunda fuente de verdad del look.
- Motor de precios. Función pura, contrato en la sección 6.
- Contador de precio animado y rango.
- Captura de lead y CTA configurable: WhatsApp con mensaje armado, formulario con guardado en Supabase, o los dos.
- Hoja de cotización imprimible en HTML con estilos de impresión.
- i18n por JSON. Todo texto visible sale de la config del cliente. No hay strings de UI hardcodeados.
- Registro de visitas por slug de cliente.

### 4.2 Vertical: cartelería

- Esquema de opciones y validaciones. Los descriptores del panel se arman con `buildPanelFields(config, selection)`: dependen del tipo elegido, porque los controles del modo area y del modo letters no son los mismos.
- Componente de preview 3D específico, con la interfaz de la sección 12: recibe `selection`, `visual` y `theme`, y no hace nada más.
- Nombres de materiales, tipos de cartel y modos de iluminación.

### 4.3 Cliente: JSON

Un archivo por cliente en `src/clients/<slug>.json`. Ruta pública `/d/<slug>`. Contiene marca, idioma, unidades, moneda, opciones habilitadas, precios, textos, CTA y contacto.

El registro descubre los JSON de la carpeta por nombre de archivo. Agregar un cliente es agregar el JSON y el logo, sin editar código.

## 5. Vertical cartelería

### 5.1 Tipos de cartel

Tres en el MVP. Cada tipo declara su modo de precio en el JSON, `pricing: "area"` o `pricing: "letters"`, y el motor ramifica por ahí.

- `facade`: panel montado sobre el frente del local. Modo area.
- `totem`: letrero de pie frente al local. Lleva recargo fijo por estructura y poste. Modo area.
- `letters`: letras corpóreas montadas sobre el frente del local, una por letra del texto, con volumen. Modo letters. Entra al MVP porque es lo que ofrecen los primeros prospectos de la salida en frío.

### 5.2 Variables de configuración

| Variable | Control | Rango | Modo |
|---|---|---|---|
| Tipo | tres botones | facade, totem, letters | los dos |
| Texto del cartel | campo de texto | 1 a 18 caracteres, default en el JSON | los dos |
| Ancho | slider | del JSON. EN en pies, ES en metros | area |
| Alto | slider | del JSON | area |
| Alto de letra | slider | del JSON. EN en pies, ES en metros | letters |
| Profundidad | tres opciones | del JSON, cada una con su factor | letters |
| Material | tres opciones | EN: PVC, Aluminum, Acrylic. ES: PVC espumado, Chapa, Acrílico | los dos |
| Iluminación | tres opciones | EN: None, Front-lit, Back-lit. ES: Sin luz, Frontal, Retroiluminado | los dos |
| Instalación | sí / no | booleano | los dos |
| Cantidad | stepper | 1 a 10 | los dos |

El panel muestra solo los controles del modo del tipo elegido. La selección conserva siempre todos los valores, con default del JSON, así cambiar de tipo no deja estado inválido y el motor ignora lo que no aplica.

El texto del cartel se usa en los dos modos: en la cara del panel en modo area, y como fuente de las letras en modo letters, donde la cantidad de letras sale de contar sus caracteres sin espacios. El default viene del JSON, el visitante lo edita, y eso es lo que hace que el preview se lea como su propio cartel.

### 5.3 Estructura de precio

Modo area (facade, totem):

1. Área = ancho por alto, en la unidad de área del cliente.
2. Material: precio por unidad de área.
3. Iluminación: adicional por unidad de área.
4. Tipo: recargo fijo por unidad (0 en facade).
5. Instalación: monto fijo más monto por unidad de área, por unidad.
6. Subtotal = precio unitario por cantidad.
7. Descuento por cantidad: porcentaje desde 2 unidades y desde 5 unidades. Se aplica el tramo más alto que corresponda, nunca dos.
8. Rango mostrado: total más y menos `rangePct` (default 8).

Modo letters:

1. Cantidad de letras = caracteres del texto sin contar espacios, entre 1 y 18.
2. Precio por letra = precio del material por unidad de alto de letra, por el alto de letra, por el factor de la profundidad elegida.
3. Material = precio por letra por cantidad de letras.
4. Iluminación: adicional por letra, por cantidad de letras. No por área.
5. Tipo: recargo fijo por unidad.
6. Instalación: monto fijo más monto por letra, por unidad.
7. Subtotal, descuento por cantidad y rango: idénticos al modo area.

La profundidad no abre una línea propia del desglose: viaja como factor dentro de la línea de material y se ve en la sección de selección de la hoja. Una sexta línea arrastraría una clave de texto nueva, una fila nueva en la hoja y un id más en `PriceLine`, sin agregar información.

### 5.4 Valores de la demo EN (USD por pie cuadrado)

| Concepto | Valor |
|---|---|
| PVC | 15 |
| Aluminum | 25 |
| Acrylic | 35 |
| None | 0 |
| Front-lit | 60 |
| Back-lit | 80 |
| Recargo facade | 0 |
| Recargo totem | 400 fijo |
| Instalación | 350 fijo + 10 por sqft |
| Descuento | 5% desde 2 unidades, 10% desde 5 |
| rangePct | 8 |

Modo letters, demo EN (USD):

| Concepto | Valor |
|---|---|
| PVC, por letra y por pie de alto de letra | 40 |
| Aluminum | 70 |
| Acrylic | 95 |
| Profundidad 2 in / 4 in / 6 in | factor 1.0 / 1.2 / 1.4 |
| None / Front-lit / Back-lit, por letra | 0 / 70 / 120 |
| Recargo letters | 0 |
| Instalación | 350 fijo + 45 por letra |
| Alto de letra | 0.5 a 3 ft, paso 0.25, default 1 |

### 5.5 Valores de la demo ES (ARS por m²)

Derivados de los de EN con dólar de referencia 1500 y factor de mercado local 0,45, redondeados al millar. Quedan marcados con `"prices_placeholder": true` hasta reemplazarlos por precios reales de una cartelería.

| Concepto | Valor |
|---|---|
| PVC espumado | 109000 |
| Chapa | 182000 |
| Acrílico | 254000 |
| Sin luz | 0 |
| Frontal | 436000 |
| Retroiluminado | 581000 |
| Recargo facade | 0 |
| Recargo totem | 270000 fijo |
| Instalación | 236000 fijo + 73000 por m² |
| Descuento | 5% desde 2 unidades, 10% desde 5 |
| rangePct | 8 |

Modo letters, demo ES (ARS). Misma derivación, con el paso extra de pie a metro (por 3,2808) en los precios que van por alto de letra:

| Concepto | Valor |
|---|---|
| PVC espumado, por letra y por metro de alto de letra | 89000 |
| Chapa | 155000 |
| Acrílico | 210000 |
| Profundidad 5 / 10 / 15 cm | factor 1.0 / 1.2 / 1.4 |
| Sin luz / Frontal / Retroiluminado, por letra | 0 / 47000 / 81000 |
| Recargo letters | 0 |
| Instalación | 236000 fijo + 30000 por letra |
| Alto de letra | 0,15 a 0,90 m, paso 0,05, default 0,30 |

### 5.6 Disclaimer

Todo precio se muestra como estimación, siempre acompañado del texto del JSON: el presupuesto final lo confirma el negocio.

## 6. Motor de precios (contrato)

Archivo: `src/core/pricing/calculatePrice.ts`. Función pura. Sin React, sin Supabase, sin fetch, sin Date.now, sin Math.random, sin formateo de moneda adentro.

```ts
type SignSelection = {
  type: string;          // id de tipo, "facade" | "totem" | "letters"
  width: number;         // modo area
  height: number;        // modo area
  text: string;          // los dos modos, 1 a 18 caracteres
  letterHeight: number;  // modo letters
  depthId: string;       // modo letters
  materialId: string;
  lightingId: string;
  installation: boolean;
  quantity: number;
};

type PriceRules = {
  currency: { code: string; symbol: string; decimals: number };
  types: { id: string; label: string; priceFixed: number; pricing: "area" | "letters" }[];
  materials: { id: string; label: string; pricePerArea: number; pricePerLetterHeight?: number }[];
  lighting: { id: string; label: string; pricePerArea: number; pricePerLetter?: number }[];
  depths: { id: string; label: string; factor: number }[];
  installation: { fixed: number; perArea: number; perLetter: number };
  discounts: { minQty: number; pct: number }[];
  rangePct: number;
};

type PriceDetailValues =
  | { id: "material" | "lighting"; mode: "area"; area: number; unitPrice: number }
  | { id: "material"; mode: "letters"; letters: number; letterHeight: number; unitPrice: number; depthFactor: number }
  | { id: "lighting"; mode: "letters"; letters: number; unitPrice: number }
  | { id: "type"; fixed: number }
  | { id: "installation"; mode: "area"; fixed: number; perArea: number; area: number }
  | { id: "installation"; mode: "letters"; fixed: number; perLetter: number; letters: number }
  | { id: "discount"; pct: number };

type PriceLine = {
  id: "material" | "lighting" | "type" | "installation" | "discount";
  labelKey: string;   // clave de texto, no texto literal
  detail: string;     // string técnico, no se muestra en pantalla
  amount: number;     // negativo en discount
  detailValues?: PriceDetailValues;  // números crudos, los formatea la UI
};

type PriceResult = {
  area: number;          // 0 en modo letters
  letters?: number;      // solo en modo letters
  letterHeight?: number; // solo en modo letters
  unitTotal: number;
  subtotal: number;
  discountPct: number;
  total: number;
  min: number;
  max: number;
  lines: PriceLine[];
};

function calculatePrice(rules: PriceRules, selection: SignSelection): PriceResult;
```

Reglas de cálculo:

- Se calcula en precisión completa y se redondea solo al final: `total`, `min`, `max` y cada `amount` de `lines`, a `currency.decimals`.
- `unitTotal` = material + iluminación + recargo de tipo + instalación, sin redondear.
- `subtotal` = `unitTotal` por cantidad.
- `discountPct` = el `pct` del tramo de mayor `minQty` que cumpla `quantity >= minQty`, o 0.
- `total` = `subtotal` menos el descuento, redondeado.
- `min` = total por (1 - rangePct/100), `max` = total por (1 + rangePct/100), redondeados.
- Si un id de material, iluminación o tipo no existe en las reglas, la función lanza un error con el id inválido en el mensaje. No devuelve un precio silencioso.
- Cantidad, ancho y alto se asumen ya validados por el panel. Si llegan menores o iguales a cero, la función lanza.

Reglas del modo letters, aditivas y sin tocar nada del modo area:

- El modo lo decide el `pricing` del tipo elegido. Un tipo sin `pricing` es config inválida y la función lanza.
- La cantidad de letras sale de contar los caracteres de `text` sin espacios. Menos de 1 o más de 18 lanza.
- Si el material elegido no tiene `pricePerLetterHeight`, o el `depthId` no existe en `depths`, la función lanza con el id inválido en el mensaje. El JSON decide así qué materiales se ofrecen en letras corpóreas: sin ese precio, el material no entra.
- `lighting.pricePerLetter` ausente se trata como config inválida, no como cero silencioso.
- `unitTotal` = letras por alto de letra por precio del material por factor de profundidad, más letras por precio de iluminación, más recargo del tipo, más instalación si corresponde. Sin redondear.
- `area` vale 0 y no se usa. La UI no muestra la línea de área en este modo.
- Los ids de `lines` no cambian: siguen siendo los mismos cinco.

Formato fijo de `detail` en modo letters: material `letras x altura x precio x factor`, iluminación `letras x precio`, instalación `fijo + letras x porLetra`. Tipo y descuento no cambian.

`detail` es un string técnico y determinista, sin locale y sin moneda. No se muestra en pantalla: el desglose visible se arma en la UI con `detailValues` y el locale del cliente. Se conserva porque es la forma legible del cálculo en los tests y en un volcado de datos.

El formateo de moneda vive aparte, en `src/core/pricing/format.ts`, con `Intl.NumberFormat` y el locale del cliente.

## 7. Flujo del lead

1. El usuario configura y ve el precio.
2. Botón principal según `cta` del JSON:
   - `whatsapp`: abre `wa.me` con mensaje armado (tipo, medidas, material, luz, instalación, cantidad y rango de precio).
   - `form`: formulario con nombre, contacto (email o teléfono) y comentario.
   - `both`: muestra los dos.
3. En los dos casos se intenta guardar el lead en Supabase antes de continuar. Si el insert falla, se sigue igual y nunca se bloquea al usuario. El error va a consola, no a la pantalla.
4. Pantalla de confirmación con botón para ver la cotización, que abre la hoja imprimible.

## 8. Hoja de cotización imprimible

- Ruta propia, `/d/<slug>/quote`, con el estado de la selección en la query y sin dependencia del servidor. Orden fijo de claves: `t` (tipo), `x` (texto del cartel, URL-encoded), `w` (ancho), `h` (alto), `lh` (alto de letra), `d` (profundidad), `m` (material), `l` (iluminación), `i` (instalación, 0 o 1), `q` (cantidad). Se escriben solo las del modo del tipo: `w` y `h` en modo area, `lh` y `d` en modo letters, el resto siempre. Los números van con punto decimal, iguales en todos los idiomas: la URL es canónica y el idioma vive en el JSON.
- Una clave del otro modo presente en la URL es un error, igual que una faltante. Un link ambiguo no se cotiza.
- En la URL no viaja ningún dato personal. La hoja muestra el contacto del negocio, no el del visitante.
- El precio se recalcula en el cliente con `calculatePrice` a partir del JSON y de la query. No hay una segunda fuente de verdad de precios.
- Parámetros faltantes o inválidos (clave ausente, id que no existe, medida fuera de rango, cantidad no entera) muestran la pantalla de error. No se completan con los defaults del cliente: una hoja con un precio que el visitante nunca configuró es peor que un error. El paso del slider no se valida: un valor intermedio se cotiza tal cual.
- La hoja no escribe nada: ni lead ni visita.
- Marca del cliente: logo, nombre, contacto.
- Selección completa con nombres legibles y desglose por concepto, total y rango.
- Fecha, validez (texto del JSON) y disclaimer.
- Una página A4 o carta, estilos `@media print`, sin librerías de PDF. La exportación la hace el navegador con imprimir a PDF. Los controles de la hoja (imprimir, volver) no se imprimen.
- Se llega desde la pantalla de confirmación del flujo del lead, con un enlace en pestaña nueva.

## 9. Datos (Supabase)

Tabla `leads`: `id`, `created_at`, `client_slug`, `channel` (whatsapp | form), `selection` (jsonb), `price_total`, `price_min`, `price_max`, `contact_name`, `contact_value`, `note`, `status` (default `new`).

Tabla `visits`: `id`, `created_at`, `client_slug`, `user_agent`, `referrer`.

La forma de `leads` sigue la que usaría Lokebox para un pedido en gestación. Solo inserts desde el frontend con la anon key. RLS activo, policy de insert para `anon`, sin select ni update ni delete.

## 10. JSON de cliente (forma)

```json
{
  "slug": "northline",
  "locale": "en",
  "vertical": "signs",
  "currency": { "code": "USD", "symbol": "$", "decimals": 0 },
  "units": { "length": "ft", "area": "sqft" },
  "brand": {
    "name": "Northline Signs",
    "logo": "/clients/northline/logo.svg",
    "colors": { "bg": "#07080A", "primary": "#101317", "accent": "#FF7A18", "text": "#F4F2EF", "muted": "#8A8F98" },
    "phone": "+1 555 010 2233",
    "whatsapp": "15550102233",
    "email": "hello@northlinesigns.test"
  },
  "photos": [
    {
      "id": "front",
      "label": "Storefront",
      "src": "/clients/northline/photos/front.webp",
      "anchor": { "x": 0.5, "y": 0.38, "metersToWidth": 0.085, "yawDeg": 0, "pitchDeg": 0 },
      "light": { "ambient": 0.9, "keyIntensity": 1.4, "keyAzimuthDeg": -25, "keyElevationDeg": 35 }
    }
  ],
  "cta": "both",
  "poweredBy": true,
  "prices_placeholder": false,
  "options": {
    "types": [
      { "id": "facade", "label": "Facade sign", "priceFixed": 0, "pricing": "area" },
      { "id": "letters", "label": "Channel letters", "priceFixed": 0, "pricing": "letters" }
    ],
    "signText": { "default": "NORTHLINE", "maxLength": 18 },
    "width": { "min": 2, "max": 20, "step": 0.5, "default": 8 },
    "height": { "min": 1, "max": 8, "step": 0.5, "default": 3 },
    "letterHeight": { "min": 0.5, "max": 3, "step": 0.25, "default": 1 },
    "depths": [{ "id": "d2", "label": "2 in", "factor": 1, "visual": { "depthMeters": 0.05 } }],
    "materials": [
      { "id": "pvc", "label": "PVC", "pricePerArea": 15, "pricePerLetterHeight": 40, "visual": { "color": "#E8E8E4", "metalness": 0, "roughness": 0.8 } }
    ],
    "lighting": [{ "id": "none", "label": "None", "pricePerArea": 0, "pricePerLetter": 0, "visual": { "mode": "none" } }],
    "installation": { "fixed": 350, "perArea": 10, "perLetter": 45 },
    "quantity": { "min": 1, "max": 10, "default": 1 },
    "discounts": [{ "minQty": 2, "pct": 5 }, { "minQty": 5, "pct": 10 }],
    "rangePct": 8
  },
  "texts": { "...": "todos los textos visibles" }
}
```

`options.depths[]` suma `visual.depthMeters` (desde 1.11): la medida real de la profundidad, la que dibuja el preview. `factor` sigue siendo el multiplicador de precio de la sección 6 y no una medida; derivar la profundidad del `label` sería parsear texto. Mismo patrón que `materials[].visual`.

`photos` (desde 1.9, conteo ampliado en 1.10): una entrada por ángulo fotografiado, 2 a 4 por cliente, la primera es la que se muestra al cargar. `id` único dentro del cliente. `label` es la etiqueta visible del ángulo y vive acá y no en `texts` porque la cantidad de fotos varía por cliente y una clave fija por ángulo no existiría: es el mismo criterio de `options.types[].label` y `options.materials[].label`. `anchor` dice dónde y de qué tamaño se dibuja el cartel sobre esa foto: `x` e `y` son el centro en fracción del ancho y del alto, con origen arriba a la izquierda; `metersToWidth` es qué fracción del ancho de la foto ocupa un metro de cartel, expresado así y no como factor abstracto para poder calcularlo contra una medida conocida de la foto en vez de a ojo; `yawDeg` y `pitchDeg` giran el cartel para acompañar el ángulo de la foto. `light` es la luz de la escena del cartel en esa foto, para que su volumen case con ella.

Las 44 claves de `texts` requeridas, iguales en los dos idiomas:

`headline`, `subheadline`, `configureTitle`, `typeLabel`, `widthLabel`, `heightLabel`, `materialLabel`, `lightingLabel`, `installationLabel`, `installationYes`, `installationNo`, `quantityLabel`, `priceLabel`, `priceRangeNote`, `disclaimer`, `ctaWhatsapp`, `ctaForm`, `formTitle`, `formName`, `formContact`, `formNote`, `formSubmit`, `formSending`, `thanksTitle`, `thanksBody`, `viewQuote`, `quoteTitle`, `quoteValidity`, `quoteDateLabel`, `quoteSelectionTitle`, `quoteBreakdownTitle`, `quotePrint`, `quoteBack`, `lineMaterial`, `lineLighting`, `lineType`, `lineInstallation`, `lineDiscount`, `poweredBy`, `whatsappMessage`, `signTextLabel`, `letterHeightLabel`, `depthLabel`, `whatsappMessageLetters`.

Los números visibles se formatean con `Intl` y el locale del cliente: `8.5` en `en`, `2,5` en `es-AR`. Eso vale para las medidas (ancho y alto) en el panel, en el mensaje de WhatsApp y en la hoja de cotización, y también para el desglose y la línea de área, que además llevan la unidad y la moneda del cliente.

`whatsappMessage` es la plantilla del modo area, con placeholders: `{type}`, `{text}`, `{width}`, `{height}`, `{unit}`, `{material}`, `{lighting}`, `{installation}`, `{quantity}`, `{min}`, `{max}`.

`whatsappMessageLetters` es la plantilla del modo letters: `{type}`, `{text}`, `{letters}`, `{letterHeight}`, `{unit}`, `{material}`, `{depth}`, `{lighting}`, `{installation}`, `{quantity}`, `{min}`, `{max}`. Son dos plantillas y no una con placeholders vacíos, porque un mensaje con huecos es lo primero que lee el prospecto.

Validación: al cargar un cliente se valida la forma en runtime. Si falta una clave o un id referenciado no existe, la app muestra un error claro en pantalla y no renderiza el cotizador a medias.

## 11. Clientes de la demo

- EN: slug `northline`, marca ficticia Northline Signs. Estética oscura, tipografía grande, acento cálido.
- ES: slug `norte`, marca ficticia Norte Carteles. Mismo esquema con idioma, unidades, moneda y precios cambiados.

Sin marcas reales, sin fotos reales, sin logos de terceros.

## 12. Preview: foto fija con cartel 3D compuesto

Desde 1.9 el preview no es una escena 3D completa. Es una foto real del rubro con el cartel renderizado encima, en un canvas transparente. Motivo: la escena de cajas costó tres bloques y seguía siendo un local genérico, mientras una foto comunica el rubro en un segundo. Lo que se cotiza, el cartel, sigue siendo 3D real con su material, su volumen y sus tres modos de luz.

Tres capas apiladas en el mismo cuadro 16:9, dentro del marco del preview:

1. Foto de fondo del cliente, elegida por ángulo.
2. Canvas R3F transparente (`alpha: true`, sin color de limpieza) con el cartel y nada más.
3. Controles fuera del canvas: selector de ángulo y zoom.

El zoom es una transformación CSS sobre el contenedor de las dos primeras capas, nunca un movimiento de cámara: así foto y cartel escalan juntos y no existe el desalineado. Cambiar de ángulo cambia de foto y de anclaje. No hay órbita: los ángulos son los que el cliente tenga fotografiados.

Assets permitidos, y solo estos dos: las fotos de fondo del cliente y un único HDRI de estudio para todo el producto, ambos servidos desde `public/`. Sigue prohibido todo modelo importado, archivo de fuente, `Text` y `Text3D` de drei, postprocessing y sombras de mapa. La prohibición en bloque de "ningún asset que se descargue" dejó de ser cierta en 1.9 y se reescribe acá en vez de quedar contradicha.

Permitido y acotado: texturas generadas en runtime con `CanvasTexture`, que no descargan nada y no pesan en el bundle. Se usan para dos cosas y nada más: los glifos del texto del cartel y el degradado de la sombra de apoyo. Una textura por glifo, memoizada por caracter, 128 px, `SRGBColorSpace`, `dispose` al desmontar. Por caracter y no por palabra: el visitante escribe letra a letra, y por palabra se regeneraría en cada tecla. La fuente es el stack del sistema (`Arial, Helvetica, sans-serif`), sin webfonts: en Linux mapea a Liberation Sans, que es métricamente compatible, así que el cuadro no se desarma entre sistemas.

- Cartel en modo area: caja cuyas dimensiones siguen ancho y alto en tiempo real con transición suave. Espesor fijo. En la cara va el texto del cartel con la textura de glifos, centrado y escalado al ancho disponible.
- Cartel en modo letters: una caja por letra, ancho de cada una medido con `measureText`, profundidad igual a la opción elegida, glifo en la cara frontal y cantos con el color del material. Máximo 18 cajas. El alto de letra sale de la selección.
- El tipo `totem` sigue siendo un tipo cotizable, pero ya no dibuja poste ni se para sobre una vereda: sin set 3D no hay piso donde apoyarlo. Se dibuja como el cartel de fachada, con su recargo de precio intacto.
- Sombra de apoyo: quad con degradado radial generado en canvas, detrás del cartel y apenas desplazado, para que no flote sobre la foto.
- Material: cambia color, metalness y roughness según el `visual` del material. El HDRI de estudio es lo que hace que `metalness` alto se distinga: con sola una direccional y ambiente, el aluminio se ve igual que el PVC.
- Iluminación: tres modos. `none` sin emisión y sin luz agregada. `front` con emisión baja en el cartel más una luz puntual por delante y por arriba, apuntando a la cara. `back` con emisión alta en el cartel más un plano emisivo apenas más grande detrás y una luz puntual entre el cartel y su apoyo. Nunca más de una luz dinámica. El color emisivo y el del halo salen del `visual` del material.
- Los tres modos se distinguen con luminancia medida, sobre la región del cartel, con la misma foto en los tres: la luminancia de la cara crece de `none` a `front`, y la del anillo inmediato crece de `front` a `back`. Son dos comparaciones y no una cadena de tres porque con fondo de foto nada de la capa 3D puede iluminar el entorno: en `front` la lámpara alumbra la cara y el anillo sigue siendo la foto intacta, y el único modo que agrega luz alrededor del cartel es `back`, por su halo. Pedir `none` menor que `front` menor que `back` en el anillo era arrastrar el criterio de una escena que ya no existe.
- No hay escalar `dusk`. Con una foto fija de fondo, cambiar la hora de la luz del cartel sin que cambie la foto lo deja en una escena que no le corresponde. Si el cliente provee una foto de atardecer entre sus ángulos, el efecto vuelve sin código.
- No hay degradación por rendimiento. Sin set 3D no quedan escalones que apagar: el canvas dibuja un cartel y su halo.
- Luz de la escena del cartel: sale del `light` de la foto elegida, no de constantes del código. Sin eso, un cartel iluminado desde la izquierda sobre una foto con sol a la derecha se lee como pegado.
- Interfaz del componente: recibe `selection`, `visual`, `theme` y la foto elegida. El preview no recibe la config del cliente y no busca nada por id.
- Escala: la escena trabaja siempre en metros. Las medidas de la selección se multiplican por el factor de `visual` (1 en metros, 0.3048 en pies), y el `metersToWidth` del anclaje las lleva a la foto.
- Colores: el color del cartel sale del `visual` del material. Ningún hexadecimal escrito en un componente de escena.
- Si el navegador no tiene WebGL, se muestra la foto sola con el bloque plano del cartel encima, equivalente al provisorio de TAREA_002.

## 13. Landing (quote.lokebox.com)

Una página con identidad Lokebox: qué es, para quién, botón a la demo EN y a la demo ES, los dos tiers con precio, y contacto. Corta. Se hace el jueves 17.

## 14. Tracking

- Un insert en `visits` por carga de `/d/<slug>`, una sola vez por sesión.
- Sin cookies, sin analytics de terceros, sin banner de consentimiento.

## 15. Tiers comerciales (referencia para el Catalog)

- Starter: cotizador visual con la marca del cliente, precios simples, CTA WhatsApp, "Powered by Lokebox" al pie.
- Standard: Starter más captura de lead, guardado en tabla, hoja de cotización imprimible y sin "Powered by".
- Advanced: no se construye. Si alguien lo pide, se cotiza a mano.

El cliente entrega antes de empezar: logo, colores, WhatsApp o mail, y sus reglas de precio en la planilla plantilla.

## 16. Fuera de alcance

CRM, auth, usuarios, multi-tenant, panel de administración, permisos, integraciones, email transaccional, generación de PDF en servidor, modelos 3D importados, archivos de fuente en el 3D, editor visual del JSON, un cuarto tipo de cartel, más de una vertical.

## 17. Criterio de DONE

1. Se entiende en menos de 10 segundos.
2. Parece un producto de más valor que su precio.
3. El flujo completo funciona en las dos demos.
4. Sin errores visibles.
5. Fluido en mobile.
6. Se puede grabar un video de 30 segundos convincente.
7. Capturas atractivas.
8. Desplegado en quote.lokebox.com.
9. Listado del Project Catalog listo para publicar.

## 18. Plan por días

El detalle de bloques, tareas y criterios está en docs/EXECUTION.md.

- Lunes 14: tipos, JSON de los dos clientes, motor de precios con tests, panel de opciones, precio animado, primer deploy.
- Martes 15: preview 3D completo y rendimiento en mobile.
- Miércoles 16: rutas por cliente, lead, Supabase, quote imprimible, visitas, demo ES, dominio.
- Jueves 17: pulido visual, mobile, landing, video, capturas.
- Viernes 18: listado del Catalog, planilla de precios, lista de 40 cartelerías, plantilla de mensaje.

## 19. Métrica de la semana siguiente

30 mensajes por WhatsApp. Objetivo: 5 respuestas y 1 llamada. Con eso se decide seguir, cambiar de nicho o pausar.
