# SPEC · Lokebox Quote

Fuente de verdad del alcance. Si algo no está acá, no se construye.
Este documento se edita, no se contradice. Si una feature pone en riesgo el viernes 18, se simplifica o se elimina.

Versión: 1.19 · 16/09/2026

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
- Assets estáticos del preview, desde 1.9: las fotos de fondo del cliente (2 o 3, 16:9, WebP, unos 1600 x 900) y un único HDRI de estudio para todo el producto, CC0, entre 100 y 200 kB. Desde 1.14 suma un único typeface JSON de Archivo Black (OFL), subsetado a A a Z, 0 a 9 y espacio, techo 60 kB, para el texto 3D del cartel. No entran al bundle de JavaScript: son archivos servidos desde `public/`. El HDRI es opcional en runtime: si falta, el preview funciona sin reflejo.
- Presupuesto de bundle (desde 1.17): tres grupos de chunks, con topes sin comprimir. `three-vendor` (solo three, @react-three/fiber y @react-three/drei) por debajo de 1000 kB; `react-vendor` (react, react-dom y scheduler) por debajo de 250 kB; y la suma de los chunks de app, todos los que no son vendor, por debajo de 500 kB. El build avisa si un chunk pasa el límite de aviso. Hasta 1.16 el chunk de vendor 3D incluía React, arrastrado como dependencia de fiber y drei, y el presupuesto de app se medía sobre un único chunk de entrada.
- Carga por ruta (desde 1.17): `/d/:slug` y `/d/:slug/quote` se cargan con `React.lazy`, para que `/` no descargue el vendor 3D. La regla de no lazy loading es del preview dentro de la página del cotizador, no de la ruta: el preview es el producto y no puede aparecer después que su panel, y sigue llegando junto con él porque la ruta entera es un chunk. Sin prefetch de la ruta de demo.

## 4. Arquitectura en tres capas

### 4.1 Core

Se escribe una vez y no conoce ninguna vertical ni ningún cliente concreto.

- Layout responsive. Desktop: preview a la izquierda, panel de opciones a la derecha, precio siempre visible. Mobile: preview arriba, opciones abajo, barra de precio fija al pie.
- Panel de opciones genérico, renderizado desde el esquema de la vertical. Cinco `kinds` de control: choice, range, boolean, stepper y text.
- Tema del cliente: los cinco colores del JSON como variables CSS, más tres derivadas con `color-mix` en el contenedor raíz: `--q-surface`, `--q-border` y, desde 1.16, `--q-stage`, el escenario del modo cartel. El tema sale siempre del JSON del cliente: no hay tema global del core ni variantes `dark:`, que serían una segunda fuente de verdad del look.
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
- `totem`: letrero de pie frente al local. Lleva recargo fijo por estructura y poste. Modo area. Desde 1.15 se dibuja de verdad y no como el cartel de fachada: el mismo panel con su texto en relieve, un poste vertical centrado debajo y una base apoyada en el piso. Motivo: el recargo cobraba una estructura que el preview no mostraba.
- `letters`: letras corpóreas montadas sobre el frente del local, una por letra del texto, con volumen. Modo letters. Entra al MVP porque es lo que ofrecen los primeros prospectos de la salida en frío.

### 5.2 Variables de configuración

| Variable | Control | Rango | Modo |
|---|---|---|---|
| Tipo | tres botones | facade, totem, letters | los dos |
| Texto del cartel | campo de texto, en mayúsculas (desde 1.14) | 1 a 18 caracteres, default en el JSON | los dos |
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

Si hay precio en pantalla lo decide el modo de visibilidad de la sección 6.2. Cuando lo hay, esta regla vale sin excepción; el rango con disclaimer es el modo `range`, el que usa la demo pública.

## 6. Motor de precios

### 6.1 Contrato

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

### 6.2 Visibilidad de precio

El motor no cambia. `calculatePrice` sigue siendo la función pura de 6.1 y sigue devolviendo `total`, `min`, `max` y `lines` en todos los casos. Lo que se agrega decide quién ve ese resultado, no cómo se calcula.

El JSON de cliente trae `pricing.display`, con cinco valores fijos:

- `exact`: muestra el precio calculado.
- `range`: muestra un rango con disclaimer, el de 5.3 y 5.6.
- `gated`: el visitante configura y ve el resumen y el preview; para ver el estimado deja contacto.
- `hidden`: no se muestra precio. La salida es el pedido estructurado.
- `internal`: el visitante no ve precio. El estimado viaja en el lead.

Reglas:

- Los cinco modos son capacidades del core. No son variantes por mercado, por idioma ni por canal de venta: cualquier cliente puede usar cualquiera de los cinco.
- La demo pública usa `range`.
- El lead guarda siempre el desglose y el estimado calculado, se muestre o no en pantalla. Ningún modo cambia lo que se persiste.
- La hoja de cotización de la sección 8 tiene dos plantillas: con precio, y brief de pedido sin precio. La segunda es la de `hidden`, y la de `gated` antes de la captura.
- Vista dueño: `?view=owner` es un query param sobre `/d/<slug>`, no una ruta nueva. Muestra el estimado y el desglose en modo lectura: no edita, no ajusta márgenes y no envía nada. No inserta visita en la sección 14.
- `pricing.display` es opcional y su default es `range`. Los JSON de la demo no traen la clave y siguen sirviendo `range` sin editarse.
- El desglose del lead va en una columna propia `lines` (jsonb) de la tabla `leads` de la sección 9, no dentro de `selection`.
- En `hidden` el CTA de la pantalla de confirmación del lead lleva a la misma hoja de la sección 8, que renderiza la plantilla de brief sin precio. Hay un solo camino de entrada a la hoja y la hoja sigue sin escribir nada.

Etapas de implementación:

- Antes del viernes 18: `exact`, `range` y `hidden`, la columna `lines` y la plantilla de brief. Es presentación y persistencia.
- Después del viernes 18, salvo que sobre tiempo: `gated`, `internal` y `?view=owner`. El viernes no depende de los cinco modos y la landing no los demuestra.

## 7. Flujo del lead

1. El usuario configura y ve el precio, según el modo de `pricing.display` de la sección 6.2.
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
- Dos plantillas, según el modo de visibilidad de la sección 6.2: con precio, y brief de pedido sin precio. Las dos comparten marca, selección, fecha y validez; la segunda no lleva desglose, total ni rango.
- Se llega desde la pantalla de confirmación del flujo del lead, con un enlace en pestaña nueva.

## 9. Datos (Supabase)

Tabla `leads`: `id`, `created_at`, `client_slug`, `channel` (whatsapp | form), `selection` (jsonb), `lines` (jsonb, el desglose por concepto que devuelve el motor), `price_total`, `price_min`, `price_max`, `contact_name`, `contact_value`, `note`, `status` (default `new`).

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
      "anchor": { "x": 0.5, "y": 0.38, "metersToWidth": 0.085, "cameraYawDeg": 0, "cameraPitchDeg": -8, "fovDeg": 40 },
      "anchorGround": { "x": 0.4, "y": 0.9, "metersToWidth": 0.12 },
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

`photos` (desde 1.9, conteo ampliado en 1.10): una entrada por ángulo fotografiado, 2 a 4 por cliente, la primera es la que se muestra al cargar. Desde 1.15 los dos clientes de la demo traen dos fotos frontales, Front y Night, y salen las vistas en ángulo: en una foto frontal `x`, `y` y `metersToWidth` alcanzan para componer el cartel y el totem. `id` único dentro del cliente. `label` es la etiqueta visible del ángulo y vive acá y no en `texts` porque la cantidad de fotos varía por cliente y una clave fija por ángulo no existiría: es el mismo criterio de `options.types[].label` y `options.materials[].label`. `anchor` dice dónde y de qué tamaño se dibuja el cartel sobre esa foto: `x` e `y` son el centro en fracción del ancho y del alto, con origen arriba a la izquierda; `metersToWidth` es qué fracción del ancho de la foto ocupa un metro de cartel, expresado así y no como factor abstracto para poder calcularlo contra una medida conocida de la foto en vez de a ojo; `cameraYawDeg`, `cameraPitchDeg` y `fovDeg` (desde 1.12, reemplazan a `yawDeg` y `pitchDeg`) describen la cámara que tomó la foto: la cámara en perspectiva del viewer orbita alrededor del cartel con ese azimut y esa elevación, con ese campo de visión vertical, y el cartel no se rota. `cameraYawDeg` positivo pone la cámara a la derecha del frente del cartel; `cameraPitchDeg` negativo la pone por debajo del centro del cartel, que es lo normal en una foto de fachada. `fovDeg` es mayor que 0 y menor que 180. `anchorGround` (desde 1.15, opcional en la forma): el anclaje del totem en esa foto. `x` e `y` son el punto de apoyo de la base, en fracción del ancho y del alto de la foto, origen arriba a la izquierda; `metersToWidth` es la fracción del ancho de la foto que ocupa un metro medido a la distancia del totem, que está más cerca de la cámara que la fachada y por eso es mayor que el del `anchor`. La cámara (`cameraYawDeg`, `cameraPitchDeg`, `fovDeg`) sigue saliendo del `anchor`: describe la cámara y no cambia por tipo. Regla: si un cliente ofrece el tipo `totem` y alguna de sus fotos no tiene `anchorGround`, la config es inválida y la validación falla al cargar con un mensaje que nombra el slug y el id de la foto. Un totem flotando sobre la banda de la fachada es peor que un error. `light` es la luz de la escena del cartel en esa foto, para que su volumen case con ella. Solo se usa en modo vista: el modo cartel tiene su luz de estudio (sección 12).

Las 46 claves de `texts` requeridas, iguales en los dos idiomas:

`headline`, `subheadline`, `configureTitle`, `typeLabel`, `widthLabel`, `heightLabel`, `materialLabel`, `lightingLabel`, `installationLabel`, `installationYes`, `installationNo`, `quantityLabel`, `priceLabel`, `priceRangeNote`, `disclaimer`, `ctaWhatsapp`, `ctaForm`, `formTitle`, `formName`, `formContact`, `formNote`, `formSubmit`, `formSending`, `thanksTitle`, `thanksBody`, `viewQuote`, `quoteTitle`, `quoteValidity`, `quoteDateLabel`, `quoteSelectionTitle`, `quoteBreakdownTitle`, `quotePrint`, `quoteBack`, `lineMaterial`, `lineLighting`, `lineType`, `lineInstallation`, `lineDiscount`, `poweredBy`, `whatsappMessage`, `signTextLabel`, `letterHeightLabel`, `depthLabel`, `whatsappMessageLetters`, `previewZoomLabel`, `viewSignOnly`.

`previewZoomLabel` es la etiqueta del zoom del viewer. `viewSignOnly` (desde 1.12) es la etiqueta del botón del modo cartel en el selector de vistas: EN "The sign", ES "Solo el cartel".

Los números visibles se formatean con `Intl` y el locale del cliente: `8.5` en `en`, `2,5` en `es-AR`. Eso vale para las medidas (ancho y alto) en el panel, en el mensaje de WhatsApp y en la hoja de cotización, y también para el desglose y la línea de área, que además llevan la unidad y la moneda del cliente.

`whatsappMessage` es la plantilla del modo area, con placeholders: `{type}`, `{text}`, `{width}`, `{height}`, `{unit}`, `{material}`, `{lighting}`, `{installation}`, `{quantity}`, `{min}`, `{max}`.

`whatsappMessageLetters` es la plantilla del modo letters: `{type}`, `{text}`, `{letters}`, `{letterHeight}`, `{unit}`, `{material}`, `{depth}`, `{lighting}`, `{installation}`, `{quantity}`, `{min}`, `{max}`. Son dos plantillas y no una con placeholders vacíos, porque un mensaje con huecos es lo primero que lee el prospecto.

`pricing.display` (desde 1.18): el modo de visibilidad de precio de la sección 6.2. No está en el ejemplo de arriba porque su obligatoriedad y su valor por defecto se deciden en el bloque de implementación.

Validación: al cargar un cliente se valida la forma en runtime. Si falta una clave o un id referenciado no existe, la app muestra un error claro en pantalla y no renderiza el cotizador a medias.

## 11. Clientes de la demo

- EN: slug `northline`, marca ficticia Northline Signs. Paleta clara, tipografía grande, acento cálido.
- ES: slug `norte`, marca ficticia Norte Carteles. Paleta clara y mismo esquema, con idioma, unidades, moneda y precios cambiados.

Desde 1.16 esta sección dice lo que los JSON ya tienen: los dos clientes de la demo usan paleta clara, y la estética oscura de northline no existe desde hace varias versiones.

Sin marcas reales, sin fotos reales, sin logos de terceros.

## 12. Preview: viewer en dos modos

Desde 1.12 el viewer tiene dos modos sobre el mismo canvas R3F, que no se remonta al cambiar de modo ni de vista y no reinicia la selección.

1. Modo cartel, el default al cargar. Sin foto. Fondo `--q-stage` del marco (desde 1.16, antes `--q-surface`): el marco es un escenario y tiene que contrastar con un cartel de material claro, que sobre la superficie casi no se despegaba. En modo vista el marco sigue en `--q-surface`, detrás de la foto. El cartel solo, con su sombra de apoyo, y el visitante lo gira con el mouse o el dedo.
2. Modo vista. Una foto del cliente con el cartel compuesto encima, fijo, sin órbita: es el pivote de 1.9 con la cámara nueva.

El selector de vistas es una fila de botones: el primero es el modo cartel, con la etiqueta `viewSignOnly`, seleccionado al cargar; después uno por foto de `photos`, con su `label`.

Cámara en perspectiva en los dos modos. Motivo: la ortográfica de 1.9 dibujaba el cartel de frente sobre fotos tomadas en tres cuartos, y girar el cartel no reproduce la fuga de una foto. Se orbita la cámara alrededor del cartel; el cartel no se rota nunca.

- Modo cartel: `fov` 30. Target en el centro de la caja de encuadre: la del cartel, o desde 1.15 la del totem completo con panel, poste y base. Distancia (desde 1.13): se deriva en cada frame de la huella proyectada de la caja del cartel (ancho, alto y espesor) con la orientación actual de la cámara, con damp, y 12 por ciento de margen por lado. En modo letters la caja es la del conjunto de letras, no la de una. En el tipo `totem` la caja incluye poste y base. No se usa la esfera contenedora ni un margen fijo: la esfera dimensiona para el peor caso y achica el cartel en la vista frontal, que es la que se ve al cargar. `OrbitControls` con azimut libre de 360 grados, ángulo polar entre 0,6 y 1,5 rad (nunca desde abajo), sin paneo, sin zoom de rueda y sin autorotación. Luz de estudio propia del modo (desde 1.13): el HDRI más una key, con constantes nombradas en el código de la escena. No va al JSON del cliente: es del producto, no de un cliente.
- Modo vista: la cámara sale del anchor de la foto. Se ubica en `cameraYawDeg` y `cameraPitchDeg` alrededor del cartel, con `fovDeg` como campo vertical, a la distancia en la que un metro de cartel ocupa `metersToWidth` del ancho de la foto. El centro del cartel cae en (`x`, `y`) de la foto con un corrimiento de la vista de la cámara (lens shift), no moviendo el cartel. Con el tipo `totem` (desde 1.15) la distancia y el corrimiento salen de `anchorGround`, y el punto que cae en (`x`, `y`) es el apoyo de la base; los ángulos y el fov siguen saliendo del `anchor`. El canvas cubre el cuadro entero.

Zoom por modo, con el mismo control:

- Modo cartel: multiplica la distancia derivada de la huella entre 1,0 y 0,55. Solo acercar.
- Modo vista: transformación CSS sobre el contenedor de foto y canvas juntos, nunca un movimiento de cámara, así foto y cartel escalan juntos y no existe el desalineado.

Assets permitidos, y solo estos tres, servidos desde `public/`: las fotos de fondo del cliente, un único HDRI de estudio para todo el producto y, desde 1.14, un único typeface JSON de Archivo Black (OFL) subsetado a mayúsculas A a Z, números 0 a 9 y espacio, con techo de 60 kB y un solo uso: el texto 3D del cartel. Motivo: el glifo pintado sobre una caja se leía como un azulejo y no como la letra corpórea que el producto vende. Sigue prohibido todo modelo importado, cualquier otro archivo de fuente, `Text` y `Text3D` de drei, postprocessing y sombras de mapa.

Permitido y acotado: texturas generadas en runtime con `CanvasTexture`, que no descargan nada y no pesan en el bundle. Desde 1.14 se usan para una sola cosa: el degradado radial que comparten la sombra de apoyo y el halo de `back`. Los glifos con `CanvasTexture` salen.

Texto 3D (desde 1.14): un componente único, `SignText3D`, con `TextGeometry` de three sobre el typeface. `curveSegments` 4, bisel chico, una sola geometría por carácter memoizada y con `dispose` al desmontar. Por carácter y no por palabra: el visitante escribe letra a letra. El espaciado sale del avance de cada glifo del typeface. Cara y cantos con el material elegido.

- Cartel en modo area: caja cuyas dimensiones siguen ancho y alto en tiempo real con transición suave. Espesor fijo. En la cara va el texto del cartel en relieve de 3 mm con `SignText3D`, centrado y escalado al ancho disponible, sin salirse del panel en ninguna medida del rango.
- Cartel en modo letters (desde 1.14): una letra corpórea con `SignText3D` por carácter del texto sin espacios, máximo 18, con el contorno real del glifo, canto y bisel. Alto de letra de la selección, profundidad `visual.depthMeters` de la opción elegida. En `back` de modo cartel la cara de la letra no emite y emiten sus cantos y su cara trasera, igual que el panel.
- El tipo `totem` (desde 1.15): el panel del modo area sin cambios, con su texto en relieve, un poste vertical centrado debajo y una base apoyada en el piso, con su recargo de precio intacto. El origen del totem es la cara inferior de la base: base de 0 a `TOTEM_BASE_HEIGHT` (0,08 m), poste de ahí a `TOTEM_POST_HEIGHT` (1,10 m) y panel desde `TOTEM_POST_HEIGHT` hacia arriba. Medidas proporcionales con límites, para que no se rompa en los extremos del slider de ancho: poste de 0,12 del ancho del panel entre 0,12 y 0,35 m, y de 1,6 veces el espesor del panel de profundidad; base de 0,45 del ancho del panel con piso de 0,50 m, y 0,50 m de profundidad. Son constantes nombradas del código de la escena, como la luz de estudio, nunca del JSON. Poste y base van en el color `muted` del tema, con metalness 0,2 y roughness 0,6, y nunca emiten: `front` y `back` afectan solo al panel.
- Sombra de apoyo: quad con el degradado radial, detrás del cartel y apenas desplazado, en los dos modos. Su color (desde 1.16) es una constante de escena casi negra y no sale del tema del cliente: una sombra oscurece siempre, y un color derivado de una paleta clara puede quedar más claro que el fondo que tiene detrás. En el tipo `totem` (desde 1.15) el quad va horizontal sobre el piso, centrado bajo la base, de 1,6 veces su ancho y su profundidad, en los dos modos.
- Material: cambia color, metalness y roughness según el `visual` del material. El HDRI de estudio es lo que hace que `metalness` alto se distinga.
- Iluminación: tres modos, nunca más de una luz dinámica, colores del `visual` del material.
  - `none`: sin emisión y sin luz agregada.
  - `front`: emisión baja en la cara más una luz puntual por delante y por arriba.
  - `back`: los cantos y la cara trasera emiten. En modo cartel (desde 1.13) la cara no emite: queda en el color del material apenas oscurecido, y no hay halo. Sale la emisión en la cara para back, porque un back-lit real tiene la cara apagada y el resplandor detrás, y con la cara emisiva back y front no se distinguen de frente. En modo vista la cara emite poco, lo justo para que el texto siga legible, y hay halo: el degradado radial detrás del cartel, con un margen de 0,12 del alto del cartel por lado, opacidad máxima 0,55, color del emisivo del material y sin borde duro.
- Los tres modos se distinguen con luminancia medida sobre la región del cartel, con tres comparaciones (desde 1.13): la cara crece de `none` a `front`, la cara baja de `front` a `back`, y el anillo inmediato crece de `front` a `back` en modo vista. Las tres se miden en modo vista con la misma foto; las dos de la cara se miden también en modo cartel, de frente y sin girar, y desde 1.15 también en el tipo `totem`.
- No hay escalar `dusk` ni degradación por rendimiento.
- Luz de la escena del cartel: en modo vista sale del `light` de la foto elegida, nunca de constantes del código. En modo cartel es la luz de estudio del producto, con constantes nombradas, y nunca del JSON.
- Interfaz del componente: recibe `selection`, `visual`, `theme`, las fotos y las etiquetas. El preview no recibe la config del cliente y no busca nada por id.
- Escala: la escena trabaja siempre en metros. Las medidas de la selección se multiplican por el factor de `visual` (1 en metros, 0.3048 en pies).
- Colores: el color del cartel sale del `visual` del material. Ningún hexadecimal escrito en un componente de escena.
- Si el navegador no tiene WebGL, el modo vista muestra la foto sola.

## 13. Landing (quote.lokebox.com)

Una página en `/` con identidad Lokebox, en inglés y sin selector de idioma. Corta. Reescrita en 1.19.

- JSON propio en `src/landing/landing.json`, validado en runtime como el de cliente. No es un cliente: no entra al registro de `src/clients` y no tiene ruta `/d/`. Forma: `locale`; `currency` con `code`, `symbol` y `decimals`; `brand` con `name` y `logo`; `colors` con `bg`, `text`, `muted` y `accent` en hexadecimal de seis dígitos; `texts` con todos los textos visibles, más `how` y `forWho` como listas de tres; `demos`, exactamente dos, con `id`, `label` y `href`; `offer` con `price`, `setup`, `monthly` y `more`; `contact` con `email` y `placeholder`.
- `contact.placeholder` avisa a Canal C que el email todavía no es el público, igual que `prices_placeholder`. No tiene efecto visible.
- Identidad: la landing lleva el logo horizontal de Lokebox, `public/lokebox-logo-horizontal.svg`, en el encabezado y en el pie, con su ruta en `brand.logo` y validada en runtime. Es el único lugar del producto donde aparece la identidad Lokebox: las demos `/d/<slug>` siguen white label con el tema de su JSON. La paleta y las variables siguen como en 1.17 y no se tocan en esta versión: cuando cierre la identidad visual, entra como edición del JSON. Sin fuente propia.
- Orden de secciones: encabezado con el logo; hero con headline, subheadline y los dos botones a las demos; how it works con tres pasos numerados; who it is for con tres puntos; oferta; contacto; footer con el logo y la línea de `texts.footer`. El nombre de la marca viaja en el `alt` del logo, como en el encabezado del cotizador: no se repite al lado de la imagen.
- Oferta, en lugar de la tabla de tiers: un solo precio presentado como piso, con el título y la línea de precio de `texts`, y tres listas que salen del JSON. `offer.setup` es lo que incluye el setup, `offer.monthly` lo que incluye el abono con su propio título, y `offer.more` lo que se construye por más y se cotiza caso por caso, también con su título. El precio no se compara contra ningún plan y no hay precios de add-ons.
- `offer.price.setup` y `offer.price.monthly` son números en el JSON y se formatean con el formateo de moneda del core, con la moneda y el locale de la landing. La línea de precio se arma con esos dos números y las palabras de `texts`.
- Los botones de demo son enlaces nativos a los `href` del JSON. Cada `href` tiene que ser `/d/<slug>` con un slug del registro de clientes: si no, la validación falla nombrando el `href` y el slug. Debajo de los botones va una línea que aclara que es una demostración y no está preparada para el trabajo diario del visitante. En la landing no se usa la palabra gratis ni ninguna promesa de prueba.
- Contacto solo por email, con un botón `mailto`. Sin WhatsApp en la landing.
- Reusa los tokens `--q-` y las clases de control del cotizador. El tema de la landing emite `--q-bg`, `--q-text`, `--q-muted` y `--q-accent` del JSON, más `--q-surface` y `--q-border` derivadas con el mismo `color-mix` y los mismos porcentajes del tema de cliente. No emite `--q-primary` ni `--q-stage`: ninguna clase que usa la landing los consume.
- Cero strings de UI en el código de la landing. No importa three ni el preview, no inserta visitas ni leads, y no usa fuente propia.
- `index.html` lleva title y description estáticos. Open Graph con imagen de 1200x630 es opcional y último: es lo primero que se recorta si el viernes se pone en riesgo.

## 14. Tracking

- Un insert en `visits` por carga de `/d/<slug>`, una sola vez por sesión.
- Sin cookies, sin analytics de terceros, sin banner de consentimiento.

## 15. Oferta comercial

Un solo precio público para todos los mercados, presentado como piso:

- Setup: USD 250. Mensual: USD 29.
- El piso filtra al prospecto. Lo que exceda el alcance cotizado va por add-ons, cotizados caso por caso y sin precio publicado: un precio de add-on que todavía no medimos se convierte en techo.
- Se empieza por Tucumán y el piso sube después de los primeros clientes.
- No hay tiers, ni planes por mercado, ni oferta founding.

Lo que incluye el setup: cotizador con el logo, los colores y los textos del cliente; hasta tres tipos de cartel con todas sus variantes; preview 3D que cambia mientras el visitante elige; precio en pantalla como rango, con su propia nota; leads con la configuración completa, por WhatsApp o por formulario; hoja de cotización imprimible; y sus precios cargados y revisados con él.

Lo que incluye el abono, los siete puntos, sin reducirlo a mantenimiento de precios: precios al día con hasta dos actualizaciones por mes; la página online, con su dirección y su certificado; pedidos guardados con la configuración completa; cambios chicos sin costo; mejoras del producto incluidas; soporte con respuesta dentro de un día hábil; y cancelación cuando quiera, conservando sus datos.

Lo que se construye por más y se cotiza caso por caso: más tipos de cartel u otra familia de producto; reglas de precio más complejas; sus fotos de trabajos reales en el preview; otro idioma en la misma página.

El eje de lo que se entrega son hasta tres tipos de cartel con todas sus variantes, no una cantidad de familias de producto: es lo que el producto hace hoy y lo que el visitante ve en la demo.

Tucumán se trabaja con `/d/norte` más WhatsApp y sin precio propio, con un solo número público. El WhatsApp es el canal de la salida en frío, no un botón de la página.

El cliente entrega antes de empezar: logo, colores, WhatsApp o mail, y sus reglas de precio en la planilla plantilla.

## 16. Fuera de alcance

CRM, auth, usuarios, multi-tenant, panel de administración, permisos, integraciones, email transaccional, generación de PDF en servidor, modelos 3D importados, archivos de fuente en el 3D salvo el typeface de la sección 12, editor visual del JSON, un cuarto tipo de cartel, más de una vertical.

Desde 1.18 también quedan fuera:

- Ajuste manual de precio o de margen desde la vista dueño.
- Generación de propuesta y envío desde la vista dueño.
- Render de imagen con IA. Queda anotado como upsell del listado, no se construye.

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
