# SPEC · Lokebox Quote

Fuente de verdad del alcance. Si algo no está acá, no se construye.
Este documento se edita, no se contradice. Si una feature pone en riesgo el viernes 18, se simplifica o se elimina.

Versión: 2.14 · 25/09/2026

## 1. Objetivo

Cotizador visual interactivo que un negocio pone en su web. El visitante configura lo que necesita, ve un preview 3D que cambia en vivo, obtiene un precio estimado, deja sus datos, y el negocio recibe un lead estructurado.

Primera y única vertical del MVP: cartelería (custom signs). Desde 2.14 hay una segunda, cajas y packaging a medida (sección 21), que no entra en la landing (D125).

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
- Assets del preview (desde 2.0, D44): se deroga la lista cerrada de 1.9 y 1.14. Los assets 3D son archivos servidos desde `public/` y descargados en runtime, no entran al bundle de JavaScript. Qué tipos de asset se permiten lo dice la sección 12. El typeface sigue siendo opcional en runtime: si falta, el preview funciona sin texto. Desde 2.2 (D55) el producto no descarga HDRI: el entorno de estudio se genera en runtime (sección 12).
- Presupuesto de primera carga (desde 2.0, D44): la primera carga de `/d/<slug>` puede llegar a 8 MB de assets 3D, siempre detrás de la pantalla de carga con progreso real de la sección 12. El peso medido se anota acá al cerrar cada tarea que lo cambie. Medido en TAREA_023: 632 kB transferidos en total, de los que 79 kB son assets 3D (HDRI y typeface). Medido en TAREA_024, sin HDRI (D55): 567 kB transferidos, 554 kB de JS y 5 kB de typeface y JSON; primer frame en slow 4G 3,9 s.
- Presupuesto de bundle (desde 1.17, reducido en 2.0): se mantienen los tres grupos de chunks, `three-vendor` (three, @react-three/fiber, @react-three/drei y desde 2.0 postprocessing y @react-three/postprocessing), `react-vendor` (react, react-dom y scheduler) y los chunks de app. Desde 2.0 se derogan los topes de 1000 kB de `three-vendor` y de 500 kB de app (D44). Sigue el de `react-vendor`, por debajo de 250 kB sin comprimir. El build avisa si un chunk pasa el límite de aviso.
- Carga por ruta (desde 1.17): `/d/:slug` y `/d/:slug/quote` se cargan con `React.lazy`, para que `/` no descargue el vendor 3D. La regla de no lazy loading es del preview dentro de la página del cotizador, no de la ruta: el preview es el producto y no puede aparecer después que su panel, y sigue llegando junto con él porque la ruta entera es un chunk. Sin prefetch de la ruta de demo.

## 4. Arquitectura en tres capas

### 4.1 Core

Se escribe una vez y no conoce ninguna vertical ni ningún cliente concreto. Desde 2.13 (D133) habla con las verticales solo por el contrato de 4.4.

- Layout responsive. Desktop: preview a la izquierda, panel de opciones a la derecha, precio siempre visible. Mobile: preview arriba, opciones abajo, barra de precio fija al pie. Desde 2.8 (D90): header compacto en una línea, con logo, título y subtítulo más chico; el preview ocupa todo el ancho menos el panel y todo el alto útil (100dvh menos el header); el panel mide 400 px, tiene su propio scroll y deja fijos al pie el precio y el CTA (D93). Desde 2.8 (D95), en mobile el preview queda arriba, sticky, con 42svh de alto, el panel scrollea debajo y la barra fija al pie lleva precio y CTA. En `hidden` la barra lleva solo el CTA. Desde 2.9 (D98), por debajo de lg el alto del preview lo da el preview, con tope de 42svh: el core le da el ancho y el tope, y la vertical decide el alto. Desde 2.9 (D99), por debajo de lg el header no lleva subtítulo y el título baja a dos líneas como máximo, en un tamaño menor, sin puntos suspensivos.
- Panel de opciones genérico, renderizado desde el esquema de la vertical. Cinco `kinds` de control: choice, range, boolean, stepper y text. Desde 2.8 (D94) el panel se agrupa en pasos numerados que declara la vertical; el título de cada paso es la etiqueta que ya existe y el número no es texto. El control choice suma un swatch opcional en el descriptor, un color, que la vertical completa; el core no conoce la vertical. No entran claves nuevas en `texts` (D96).
- Tema del cliente: los cinco colores del JSON como variables CSS, más tres derivadas con `color-mix` en el contenedor raíz: `--q-surface`, `--q-border` y, desde 1.16, `--q-stage`, el escenario del modo cartel. El tema sale siempre del JSON del cliente: no hay tema global del core ni variantes `dark:`, que serían una segunda fuente de verdad del look.
- Composición del precio: función pura, contrato en 6.3. El cálculo de cada rubro es de su vertical; el de carteles está en 6.1.
- Contador de precio animado y rango.
- Captura de lead y CTA configurable: WhatsApp con mensaje armado, formulario con guardado en Supabase, o los dos.
- Hoja de cotización imprimible en HTML con estilos de impresión, con las claves de URL y las filas de selección que da la vertical (sección 8).
- i18n por JSON. Todo texto visible sale de la config del cliente. No hay strings de UI hardcodeados. Desde 2.13 (D135) el core valida solo las claves de `texts` que consume (sección 10).
- Registro de visitas por slug de cliente.

### 4.2 Vertical: cartelería

Desde 2.13 es el módulo `src/verticals/signs/`, que implementa el contrato de 4.4: su parte del JSON (sección 10), su selección, su cálculo (6.1), sus claves de la hoja (sección 8) y su preview (sección 12).

- Esquema de opciones y validaciones. Los descriptores del panel se arman con `buildPanelFields(config, selection)`: dependen del tipo elegido, porque los controles del modo area y del modo letters no son los mismos.
- Componente de preview 3D específico, con la interfaz de la sección 12: recibe `selection`, `visual` y `theme`, y no hace nada más.
- Nombres de materiales, tipos de cartel y modos de iluminación.

### 4.3 Cliente: JSON

Un archivo por cliente en `src/clients/<slug>.json`. Ruta pública `/d/<slug>`. Contiene marca, idioma, unidades, moneda, opciones habilitadas, precios, textos, CTA y contacto.

El registro descubre los JSON de la carpeta por nombre de archivo. Agregar un cliente es agregar el JSON y el logo, sin editar código. El campo `vertical` elige el módulo del registro de 4.4; un valor que no está en el registro es error de config y muestra la pantalla de error.

### 4.4 Contrato de vertical (desde 2.13, D133)

Una vertical es un módulo en `src/verticals/<id>/`, en dos partes.

- Lógica, pura, sin React ni three, importada de forma estática. Implementa:
  - `validate(raw, ctx)`: lee del JSON todo lo que no es del core (sección 10) y devuelve la config de la vertical, o lanza con el slug y la clave, con el mismo formato de error que la validación del core. `ctx` trae slug, locale, moneda, `cta` y `pricing.display` ya validados, para las reglas condicionales.
  - `defaultSelection(config)` y la traducción entre selección y valores del panel: `valuesFromSelection`, `selectionFromValues` y `applyFieldChange`.
  - `panelFields(config, selection)`: los descriptores del panel de 4.1.
  - `price(config, selection)`: arma sus componentes y compone con `composePrice` del core (6.3). Devuelve el `PriceResult` del core, más las claves propias que la vertical necesite.
  - `quantityOf(selection)`.
  - `lineDetail(config, line)`: el detalle visible de cada línea que emite la vertical, y `breakdownCaption(config, result)`: una línea opcional encima del desglose (en carteles, el área).
  - `encodeQuery(config, selection)` y `decodeQuery(config, params)`: las claves de la hoja (sección 8).
  - `sheetRows(config, selection)`: las filas de selección de la hoja.
  - `leadSelection(config, selection)`: lo que va a la columna `selection` de `leads`.
  - `whatsappMessage(config, selection, result, display)`: la plantilla y los tokens de la vertical, armados con `buildWhatsappMessage` del core.
- Vista: el componente de preview, cargado con `React.lazy`. Recibe la config de la vertical, la selección, el tema y lo de la pantalla de carga. Lo que haga adentro es de la vertical; en carteles la escena conserva la interfaz de la sección 12.

El registro de verticales vive fuera de `src/core`, en `src/app/`, y mapea el campo `vertical` del JSON a las dos partes (D121). `src/core` define los tipos del contrato y no importa de `src/verticals`, `src/clients` ni `src/app`. Las páginas `/d/<slug>` y `/d/<slug>/quote` son las mismas para toda vertical.

El core no tiene vocabulario de ningún rubro: en `src/core`, tests incluidos, no aparecen `totem`, `letters`, `facade`, `signText` ni identificadores `Sign*` (D122). Desde 2.14 tampoco los de cajas: `mailer`, `kraft`, `corrugated`, `BoxSelection`, `BoxesConfig` ni `BoxPrice`.

Desde 2.14 (D145) el contrato dice también lo que TAREA_032 tuvo que cubrir:

- `ClientConfig.json` guarda el JSON del cliente tal cual, y es lo que recibe `validate`.
- El `texts` del core deja pasar las claves que no son suyas, sin validarlas. `resolveTextKey` resuelve por nombre, contra el `texts` del cliente, las etiquetas de línea y de panel que emite la vertical; `PanelField.labelKey` es un string. Una clave que no existe lanza.
- `VerticalLogic<C, S, R>`: R es el resultado propio de la vertical, el `PriceResult` de 6.3 más sus claves, y es lo que reciben `breakdownCaption` y `whatsappMessage`.
- El registro borra los tipos de cada vertical en un solo lugar, `register` de `src/app/verticals.ts`.
- Mientras baja la vista lazy, el área del preview muestra la pantalla de carga del core.
- La vista recibe además `logo`, la ruta del logo del cliente (D144). Carteles no lo usa; cajas lo imprime.
- Una vertical no importa de otra. Lo que dos verticales comparten vive en el core, sin vocabulario de ninguna (D143).

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

### 6.1 Cálculo de carteles (vertical signs)

Desde 2.13 (D133, D134) este contrato es de la vertical de carteles y no del core. Archivo: `src/verticals/signs/pricing/calculateSignPrice.ts` (hasta 2.12, `src/core/pricing/calculatePrice.ts`). Arma sus componentes por unidad y compone con `composePrice` de 6.3. Su resultado es idéntico al de 2.12, verificado contra un snapshot tomado antes del refactor (D122). Función pura. Sin React, sin Supabase, sin fetch, sin Date.now, sin Math.random, sin formateo de moneda adentro.

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

function calculateSignPrice(rules: PriceRules, selection: SignSelection): SignPriceResult;
```

`SignPriceResult` es el `PriceResult` de 6.3 más `area`, `letters` y `letterHeight`, con la forma de arriba. Los tipos `SignSelection`, `PriceRules`, `PriceDetailValues` y los ids de `lines` de este bloque viven en la vertical. Qué líneas se muestran lo decide la vertical: iluminación siempre, tipo e instalación solo cuando suman, y el descuento lo agrega `composePrice`.

Reglas de cálculo:

- Se calcula en precisión completa y se redondea solo al final: `total`, `min`, `max` y cada `amount` de `lines`, a `currency.decimals`.
- `unitTotal` = material + iluminación + recargo de tipo + instalación, sin redondear.
- `subtotal` = `unitTotal` por cantidad.
- `discountPct` = el `pct` del tramo de mayor `minQty` que cumpla `quantity >= minQty`, o 0.
- `total` = `subtotal` menos el descuento, redondeado.
- `min` = total por (1 - rangePct/100), `max` = total por (1 + rangePct/100), redondeados.
- Si un id de material, iluminación o tipo no existe en las reglas, la función lanza un error con el id inválido en el mensaje. No devuelve un precio silencioso.
- Un `priceFixed` negativo es config inválida y la validación lo rechaza al cargar (desde 2.14, D138): un recargo que resta sin línea deja un desglose que no suma al total.
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

El formateo de moneda vive aparte, en `src/core/pricing/format.ts`, con `Intl.NumberFormat` y el locale del cliente. Desde 2.13 el detalle visible de las líneas de carteles (área por precio, letras por alto por precio por factor) lo arma la vertical con los formateadores del core; el core formatea solo el porcentaje del descuento.

`CurrencyConfig` de la sección 10 tiene una clave más que el `currency` de `PriceRules`: `display`, opcional, `"symbol" | "code"`. El bloque de tipos de arriba no la lleva a propósito. El motor no formatea, así que no tiene nada que hacer con ella: `priceRulesFromClient` la omite al armar las reglas y `display` viaja solo hasta `formatCurrency`. Es la misma razón por la que `symbol` y `decimals` están en las reglas pero no se usan para calcular.

### 6.3 Composición del precio (core, desde 2.13, D134)

Archivo: `src/core/pricing/composePrice.ts`. Pura, con las mismas prohibiciones que 6.1. Es la parte del cálculo que comparten todos los rubros; la vertical le pasa componentes ya calculados.

```ts
type PriceLine = {
  id: string;              // lo define la vertical, salvo "discount"
  labelKey: string;        // clave de texts
  detail: string;          // string técnico, no se muestra
  amount: number;          // redondeado a decimals; negativo en discount
  detailValues?: unknown;  // números crudos, los tipa y formatea la vertical
};

type PriceComponent = { line: Omit<PriceLine, "amount">; cost: number };  // cost en precisión completa

type PriceInput = {
  decimals: number;
  quantity: number;
  unit: PriceComponent[];                      // por unidad, en el orden del desglose
  discounts: { minQty: number; pct: number }[]; // puede estar vacía
  order: PriceComponent[];                     // por pedido; puede estar vacía
  rangePct: number;
};

type PriceResult = {
  unitTotal: number;
  subtotal: number;
  discountPct: number;
  total: number;
  min: number;
  max: number;
  lines: PriceLine[];
};

function composePrice(input: PriceInput): PriceResult;
```

Reglas:

- `quantity` menor o igual a 0, o no finito, lanza.
- `unitTotal` es la suma de los `cost` de `unit`, en su orden y sin redondear. `subtotal` es `unitTotal` por `quantity`.
- `discountPct` es el `pct` del tramo de mayor `minQty` con `quantity >= minQty`, o 0. Nunca dos tramos.
- `total` es `subtotal` por (1 - discountPct/100) más la suma de los `cost` de `order`, redondeado a `decimals`. Los componentes por pedido no se multiplican por la cantidad ni se descuentan.
- `min` y `max` son `total` por (1 - rangePct/100) y por (1 + rangePct/100), redondeados.
- `lines`: primero `unit`, con `amount` redondeado; después, si `discountPct` es mayor que 0, la línea `discount` con `labelKey` `lineDiscount`, `detail` `pct%`, `detailValues` `{ id: "discount", pct }` y `amount` igual a menos `unitTotal` por pct/100 redondeado, por unidad como las demás; al final `order`, con `amount` redondeado.
- Una línea entra si la vertical la pasa, aunque su costo sea 0. Qué se muestra es de la vertical.
- La vertical puede sumar claves propias al resultado. El core no las lee. Una clave opcional ausente va ausente, nunca en `undefined`.

### 6.2 Visibilidad de precio

El motor no cambia. El cálculo de la vertical (6.1) con `composePrice` (6.3) sigue siendo puro y sigue devolviendo `total`, `min`, `max` y `lines` en todos los casos. Lo que se agrega decide quién ve ese resultado, no cómo se calcula.

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

Presentación de cada modo, sin cambiar la lista de cinco:

- `range` es el bloque de precio actual, tal como está: estimado animado, línea de rango con `priceRangeNote`, y disclaimer. Es lo que muestran las dos demos y lo que está grabado en el video y en las capturas.
- `exact` es el mismo bloque sin la línea de rango. El disclaimer va igual: lo pide 5.6 en todos los casos, porque el número sigue siendo una estimación hasta que el negocio la confirma.
- `hidden` no muestra bloque de precio ni desglose en ninguna parte del cotizador, ni la barra fija de mobile. La salida es el pedido estructurado.

Etapas de implementación:

- Antes del viernes 18: `exact`, `range` y `hidden`, la columna `lines` y la plantilla de brief. Es presentación y persistencia.
- Después del viernes 18, salvo que sobre tiempo: `gated`, `internal` y `?view=owner`. El viernes no depende de los cinco modos y la landing no los demuestra.
- En la etapa 1 `gated` e `internal` no están implementados y la validación los rechaza al cargar, nombrando el valor. No caen a `range`: un fallback silencioso mostraría precio a un cliente que pidió no mostrarlo, que es exactamente el daño que el modo existe para evitar.

## 7. Flujo del lead

1. El usuario configura y ve el precio, según el modo de `pricing.display` de la sección 6.2.
2. Botón principal según `cta` del JSON. Desde 2.8 (D93) va en el bloque fijo de precio, en escritorio y en mobile, y no al final del panel:
   - `whatsapp`: abre `wa.me` con mensaje armado (tipo, medidas, material, luz, instalación, cantidad y rango de precio).
   - `form`: formulario con nombre, contacto (email o teléfono) y comentario.
   - `both`: muestra los dos.
3. En los dos casos se intenta guardar el lead en Supabase antes de continuar. Si el insert falla, se sigue igual y nunca se bloquea al usuario. El error va a consola, no a la pantalla.
4. Pantalla de confirmación con botón para ver la cotización, que abre la hoja imprimible. Vale para los dos canales: con WhatsApp, el clic abre `wa.me` en otra pestaña y el bloque pasa a la confirmación en la del cotizador (desde 2.13, D131; hasta 2.12 solo el formulario llegaba a esta pantalla).

## 8. Hoja de cotización imprimible

- Desde 2.13 (D133) las claves de la query son de la vertical: `encodeQuery` y `decodeQuery` del contrato de 4.4. El core fija la ruta y las reglas de esta sección: URL canónica, sin datos personales, sin completar con defaults, y un link inválido va a la pantalla de error. Las claves de carteles, las de abajo, no cambian, y los links ya publicados siguen valiendo (D122).
- Ruta propia, `/d/<slug>/quote`, con el estado de la selección en la query y sin dependencia del servidor. Claves de carteles, en orden fijo: `t` (tipo), `x` (texto del cartel, URL-encoded), `w` (ancho), `h` (alto), `lh` (alto de letra), `d` (profundidad), `m` (material), `l` (iluminación), `i` (instalación, 0 o 1), `q` (cantidad). Se escriben solo las del modo del tipo: `w` y `h` en modo area, `lh` y `d` en modo letters, el resto siempre. Los números van con punto decimal, iguales en todos los idiomas: la URL es canónica y el idioma vive en el JSON.
- Una clave del otro modo presente en la URL es un error, igual que una faltante. Un link ambiguo no se cotiza.
- En la URL no viaja ningún dato personal. La hoja muestra el contacto del negocio, no el del visitante.
- El precio se recalcula en el cliente con el `price` de la vertical a partir del JSON y de la query. No hay una segunda fuente de verdad de precios.
- Parámetros faltantes o inválidos (clave ausente, id que no existe, medida fuera de rango, cantidad no entera) muestran la pantalla de error. No se completan con los defaults del cliente: una hoja con un precio que el visitante nunca configuró es peor que un error. El paso del slider no se valida: un valor intermedio se cotiza tal cual.
- La hoja no escribe nada: ni lead ni visita.
- Marca del cliente: logo, nombre, contacto.
- Selección completa con nombres legibles, en las filas que arma la vertical con `sheetRows`, y desglose por concepto, total y rango.
- Fecha, validez (texto del JSON) y disclaimer.
- Una página A4 o carta, estilos `@media print`, sin librerías de PDF. La exportación la hace el navegador con imprimir a PDF. Los controles de la hoja (imprimir, volver) no se imprimen.
- Dos plantillas, según el modo de visibilidad de la sección 6.2: con precio, y brief de pedido sin precio. Las dos comparten marca, selección, fecha y validez; la segunda no lleva desglose, total ni rango.
- Se llega desde la pantalla de confirmación del flujo del lead, con un enlace en pestaña nueva.

## 9. Datos (Supabase)

Tabla `leads`: `id`, `created_at`, `client_slug`, `channel` (whatsapp | form), `selection` (jsonb), `lines` (jsonb, el desglose por concepto que devuelve el motor), `price_total`, `price_min`, `price_max`, `contact_name`, `contact_value`, `note`, `status` (default `new`).

Tabla `visits`: `id`, `created_at`, `client_slug`, `user_agent`, `referrer`.

La forma de `leads` sigue la que usaría Lokebox para un pedido en gestación. Solo inserts desde el frontend con la anon key. RLS activo, policy de insert para `anon`, sin select ni update ni delete.

## 10. JSON de cliente (forma)

Desde 2.13 (D133, D135, D136) el JSON sigue siendo un solo archivo plano y la validación se parte en dos. El core valida `slug`, `locale`, `vertical`, `currency`, `brand`, `cta`, `poweredBy`, `prices_placeholder`, `pricing` y sus 27 claves de `texts`. La vertical valida todo lo demás con su `validate` de 4.4: en carteles `units`, `photos`, `options`, sus 20 claves de `texts` y las dos plantillas condicionales de `hidden`. Ningún JSON de cliente cambia por esto. Una clave de `texts` es del core si y solo si la consume `src/core` o las páginas genéricas. `units` pasa a la vertical porque qué se mide y en qué unidad es del rubro; los formateadores de números siguen en el core. El ejemplo de abajo es de carteles.

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
      { "id": "facade", "label": "Facade sign", "priceFixed": 0, "pricing": "area", "visual": { "mount": "standoff" } },
      { "id": "letters", "label": "Channel letters", "priceFixed": 0, "pricing": "letters" }
    ],
    "signText": { "default": "NORTHLINE", "maxLength": 18 },
    "width": { "min": 2, "max": 20, "step": 0.5, "default": 8 },
    "height": { "min": 1, "max": 8, "step": 0.5, "default": 3 },
    "letterHeight": { "min": 0.5, "max": 3, "step": 0.25, "default": 1 },
    "depths": [{ "id": "d2", "label": "2 in", "factor": 1, "visual": { "depthMeters": 0.05 } }],
    "materials": [
      {
        "id": "pvc", "label": "PVC", "pricePerArea": 15, "pricePerLetterHeight": 40,
        "visual": {
          "color": "#E8E8E4", "finish": "foam", "metalness": 0, "roughness": 0.9,
          "specularIntensity": 0.3, "clearcoat": 0, "clearcoatRoughness": 0,
          "anisotropy": 0, "normalScale": 0.3, "translucency": 0
        }
      }
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

`currency.display` (desde 1.20): opcional, `"symbol" | "code"`. Sin la clave vale `"symbol"`, que es lo que muestran los dos clientes de la demo. Con `"code"`, `formatCurrency` escribe `USD 250` en lugar de `$250`. La usa la landing de la sección 13, donde el precio se lee fuera de contexto y un símbolo solo no dice en qué moneda está. Los JSON de los dos clientes no traen la clave y no cambian.

`materials[].visual` (desde 2.1, D52): el material deja de ser color, metalness y roughness. Lleva los parámetros físicos del material y `finish`, el acabado. Los parámetros son del cliente y van al JSON; los generadores de mapas son del código, y `finish` elige cuál se usa. Todas las claves son obligatorias, para que un cliente nuevo no herede valores escondidos en el código:

- `color`: hexadecimal, el color base y el del emisivo.
- `finish`: `"foam"` (espumado, mate con microrelieve), `"brushed"` (cepillado, con anisotropía) o `"polished"` (pulido). Otro valor falla nombrándolo.
- `metalness`, `roughness`, `specularIntensity`, `clearcoat`, `clearcoatRoughness` y `anisotropy`: los de `MeshPhysicalMaterial`, entre 0 y 1.
- `normalScale`: entre 0 y 1, la fuerza del relieve del mapa normal generado.
- `translucency`: entre 0 y 1, cuánto de la luz de `back` deja pasar la cara. 0 es una cara opaca, que en `back` queda apagada; el acrílico opal la tiene mayor que 0 y en `back` su cara enciende pareja (sección 12).

No hay `transmission`, `thickness` ni `ior`: la transmisión está descartada (D54, sección 12).

`options.types[].visual.mount` (desde 2.4, D68): cómo se monta el panel, `"flush"` (al ras) o `"standoff"` (con separadores). Obligatorio en los tipos con `pricing` `"area"`; en los de `"letters"` no va. Otro valor, o la clave ausente en un tipo de área, falla nombrando el slug y el id del tipo. Motivo: montar con separadores o al ras es dato del negocio y no del código (sección 2). Con `standoff` el preview dibuja cuatro separadores metálicos en las esquinas y el panel queda separado de la pared; con `flush` el panel apoya directo. Las medidas de los separadores son constantes nombradas de la escena, nunca del JSON. En los dos clientes de la demo `facade` va con `standoff` y `totem` con `flush`.

`options.depths[]` suma `visual.depthMeters` (desde 1.11): la medida real de la profundidad, la que dibuja el preview. `factor` sigue siendo el multiplicador de precio de la sección 6 y no una medida; derivar la profundidad del `label` sería parsear texto. Mismo patrón que `materials[].visual`.

`photos` (desde 1.9, conteo ampliado en 1.10): una entrada por ángulo fotografiado, 2 a 4 por cliente, la primera es la que se muestra al cargar. Desde 1.15 los dos clientes de la demo traen dos fotos frontales, Front y Night, y salen las vistas en ángulo: en una foto frontal `x`, `y` y `metersToWidth` alcanzan para componer el cartel y el totem. `id` único dentro del cliente. `label` es la etiqueta visible del ángulo y vive acá y no en `texts` porque la cantidad de fotos varía por cliente y una clave fija por ángulo no existiría: es el mismo criterio de `options.types[].label` y `options.materials[].label`. `anchor` dice dónde y de qué tamaño se dibuja el cartel sobre esa foto: `x` e `y` son el centro en fracción del ancho y del alto, con origen arriba a la izquierda; `metersToWidth` es qué fracción del ancho de la foto ocupa un metro de cartel, expresado así y no como factor abstracto para poder calcularlo contra una medida conocida de la foto en vez de a ojo; `cameraYawDeg`, `cameraPitchDeg` y `fovDeg` (desde 1.12, reemplazan a `yawDeg` y `pitchDeg`) describen la cámara que tomó la foto: la cámara en perspectiva del viewer orbita alrededor del cartel con ese azimut y esa elevación, con ese campo de visión vertical, y el cartel no se rota. `cameraYawDeg` positivo pone la cámara a la derecha del frente del cartel; `cameraPitchDeg` negativo la pone por debajo del centro del cartel, que es lo normal en una foto de fachada. `fovDeg` es mayor que 0 y menor que 180. `anchorGround` (desde 1.15, opcional en la forma): el anclaje del totem en esa foto. `x` e `y` son el punto de apoyo de la base, en fracción del ancho y del alto de la foto, origen arriba a la izquierda; `metersToWidth` es la fracción del ancho de la foto que ocupa un metro medido a la distancia del totem, que está más cerca de la cámara que la fachada y por eso es mayor que el del `anchor`. La cámara (`cameraYawDeg`, `cameraPitchDeg`, `fovDeg`) sigue saliendo del `anchor`: describe la cámara y no cambia por tipo. Regla: si un cliente ofrece el tipo `totem` y alguna de sus fotos no tiene `anchorGround`, la config es inválida y la validación falla al cargar con un mensaje que nombra el slug y el id de la foto. Un totem flotando sobre la banda de la fachada es peor que un error. Desde 2.7 (D85) `anchorGround` suma `wallY`, obligatorio cuando existe `anchorGround` y validado igual: la fracción del alto de la foto donde la fachada toca la vereda en la columna del apoyo, entre 0 y 1 y por encima de `y`. Se calibra con `?calibrate=1`, que dibuja la línea. `light` es la luz de la escena del cartel en esa foto, para que su volumen case con ella. Solo se usa en modo vista: el modo cartel tiene su luz de estudio (sección 12).

Las 47 claves de `texts` requeridas, iguales en los dos idiomas:

`headline`, `subheadline`, `configureTitle`, `typeLabel`, `widthLabel`, `heightLabel`, `materialLabel`, `lightingLabel`, `installationLabel`, `installationYes`, `installationNo`, `quantityLabel`, `priceLabel`, `priceRangeNote`, `disclaimer`, `ctaWhatsapp`, `ctaForm`, `formTitle`, `formName`, `formContact`, `formNote`, `formSubmit`, `formSending`, `thanksTitle`, `thanksBody`, `viewQuote`, `quoteTitle`, `quoteValidity`, `quoteDateLabel`, `quoteSelectionTitle`, `quoteBreakdownTitle`, `quotePrint`, `quoteBack`, `lineMaterial`, `lineLighting`, `lineType`, `lineInstallation`, `lineDiscount`, `poweredBy`, `whatsappMessage`, `signTextLabel`, `letterHeightLabel`, `depthLabel`, `whatsappMessageLetters`, `previewZoomLabel`, `viewSignOnly`, `loadingLabel`.

Desde 2.13 (D135) se reparten así. Del core, 27: `headline`, `subheadline`, `configureTitle`, `priceLabel`, `priceRangeNote`, `disclaimer`, `ctaWhatsapp`, `ctaForm`, `formTitle`, `formName`, `formContact`, `formNote`, `formSubmit`, `formSending`, `thanksTitle`, `thanksBody`, `viewQuote`, `quoteTitle`, `quoteValidity`, `quoteDateLabel`, `quoteSelectionTitle`, `quoteBreakdownTitle`, `quotePrint`, `quoteBack`, `lineDiscount`, `poweredBy`, `loadingLabel`. De carteles, 20: `typeLabel`, `widthLabel`, `heightLabel`, `materialLabel`, `lightingLabel`, `installationLabel`, `installationYes`, `installationNo`, `quantityLabel`, `signTextLabel`, `letterHeightLabel`, `depthLabel`, `previewZoomLabel`, `viewSignOnly`, `lineMaterial`, `lineLighting`, `lineType`, `lineInstallation`, `whatsappMessage`, `whatsappMessageLetters`. Si al refactorizar un archivo del core consume una clave de la segunda lista, se frena y se reporta: la lista se corrige acá, no en el código por su cuenta.

`previewZoomLabel` es la etiqueta del zoom del viewer. `viewSignOnly` (desde 1.12) es la etiqueta del botón del modo cartel en el selector de vistas: EN "The sign", ES "Solo el cartel". `loadingLabel` (desde 2.0, D47) es el texto de la pantalla de carga del preview: EN "Preparing your sign", ES "Preparando tu cartel".

Los números visibles se formatean con `Intl` y el locale del cliente: `8.5` en `en`, `2,5` en `es-AR`. Eso vale para las medidas (ancho y alto) en el panel, en el mensaje de WhatsApp y en la hoja de cotización, y también para el desglose y la línea de área, que además llevan la unidad y la moneda del cliente.

`whatsappMessage` es la plantilla del modo area, con placeholders: `{type}`, `{text}`, `{width}`, `{height}`, `{unit}`, `{material}`, `{lighting}`, `{installation}`, `{quantity}`, `{min}`, `{max}`.

`whatsappMessageLetters` es la plantilla del modo letters: `{type}`, `{text}`, `{letters}`, `{letterHeight}`, `{unit}`, `{material}`, `{depth}`, `{lighting}`, `{installation}`, `{quantity}`, `{min}`, `{max}`. Son dos plantillas y no una con placeholders vacíos, porque un mensaje con huecos es lo primero que lee el prospecto.

`pricing` (desde 1.20): objeto opcional con el modo de visibilidad de precio de la sección 6.2.

```ts
pricing?: { display?: "exact" | "range" | "gated" | "hidden" | "internal" }
```

Sin el objeto, o con el objeto y sin `display`, vale `range`. No está en el ejemplo de arriba porque los dos clientes de la demo no lo traen. En la etapa 1 la validación acepta `exact`, `range` y `hidden`, y rechaza `gated`, `internal` y cualquier otro valor nombrándolo.

Dos claves de texto condicionales, y solo dos, dependen de este objeto: `whatsappMessageHidden` y `whatsappMessageHiddenLetters`. Son las plantillas de WhatsApp sin precio, con los mismos placeholders que `whatsappMessage` y `whatsappMessageLetters` menos `{min}` y `{max}`. Son opcionales en la forma, y la validación las exige solo cuando `pricing.display` es `hidden` y el `cta` del cliente incluye WhatsApp, fallando con el nombre de la clave que falta. Mismo patrón condicional que `anchorGround` con el tipo `totem`. No entran a las 47 claves requeridas: obligarlas para todos haría editar los dos JSON de la demo, que usan `range` y nunca las renderizan. En `hidden` el mensaje no puede contener ninguna cifra de precio.

Validación: al cargar un cliente se valida la forma en runtime. Si falta una clave o un id referenciado no existe, la app muestra un error claro en pantalla y no renderiza el cotizador a medias.

## 11. Clientes de la demo

- EN: slug `northline`, marca ficticia Northline Signs. Paleta clara, tipografía grande, acento cálido.
- ES: slug `norte`, marca ficticia Norte Carteles. Paleta clara y mismo esquema, con idioma, unidades, moneda y precios cambiados.

Desde 2.11 (D114, D115), tres clientes de vitrina, sin cambios de código, para portfolio y material de venta. Desde 2.13 (D137) también son demos de la landing, junto con las dos de la salida comercial:

- `halcyon`, Halcyon Signworks: en-GB, GBP, metros, precio `exact`, CTA formulario, premium sobrio.
- `afterglow`, Afterglow Signs: en, USD, pies, precio `range`, CTA WhatsApp, tema oscuro.
- `alba`, Rótulos Alba: es-ES, EUR, metros, precio `hidden`, CTA los dos, cálido, con totem.

Desde 2.14 (D125), dos clientes de la vertical cajas, fuera de la landing:

- `foldline`, Foldline Packaging: en, USD, pulgadas, precio `range`, CTA los dos.
- `cajasur`, Caja Sur: es-AR, ARS, centímetros, precio `range`, CTA WhatsApp.

Desde 1.16 esta sección dice lo que los JSON ya tienen: los dos clientes de la demo usan paleta clara, y la estética oscura de northline no existe desde hace varias versiones.

Sin marcas reales, sin fotos reales, sin logos de terceros.

## 12. Preview: viewer en dos modos

Desde 1.12 el viewer tiene dos modos sobre el mismo canvas R3F, que no se remonta al cambiar de modo ni de vista y no reinicia la selección.

1. Modo cartel, el default al cargar. Sin foto. Fondo `--q-stage` del marco (desde 1.16, antes `--q-surface`): el marco es un escenario y tiene que contrastar con un cartel de material claro, que sobre la superficie casi no se despegaba. En modo vista el marco sigue en `--q-surface`, detrás de la foto. Desde 2.8 (D91) sale el marco 16:9 fijo: en modo cartel el canvas llena la zona del preview; en modo vista foto y canvas van juntos en una caja con la proporción de la foto, entera (contain) y centrada sobre `--q-stage`, así el anclaje sigue siendo relativo al rectángulo de la foto. Desde 2.10 (D103) el fondo del preview, en los dos modos, es el escenario del core: estudio claro cálido, degradado vertical con viñeta, fijo del producto y no del JSON; el canvas es transparente y el fondo lo pone CSS, sin plano de fondo en la escena. En modo cartel con iluminación front o back pasa a grafito con una transición de 375 ms, sin remontar el canvas (D105). Desde 2.13 (D132), con un tema oscuro, luminancia relativa de `brand.colors.bg` menor a 0,2, el escenario es grafito en los dos modos desde la carga y no cambia con la iluminación: el estudio claro al lado de un panel oscuro se leía como otro producto. Se deriva del tema, sin campo nuevo en el JSON. Desde 2.10 (D107) en escritorio la foto de vista lleva radio de 14 px y sombra suave; en mobile va a todo el ancho, sin radio ni sombra. El cartel solo, con su sombra de apoyo, y el visitante lo gira con el mouse o el dedo.
2. Modo vista. Una foto del cliente con el cartel compuesto encima, fijo, sin órbita: es el pivote de 1.9 con la cámara nueva.

El selector de vistas es una fila de botones: el primero es el modo cartel, con la etiqueta `viewSignOnly`, seleccionado al cargar; después uno por foto de `photos`, con su `label`. Desde 2.8 (D92) es un control segmentado sobre el preview, abajo al centro. Desde 2.9 (D98, D100) el selector y el zoom van en una franja de controles al pie de la zona del preview, y nunca quedan encima de la foto. En modo vista la caja contain de la foto se calcula sobre la zona menos esa franja; en escritorio, además, menos un margen de 24 px por lado, así la foto no toca el panel ni el borde de la ventana. En mobile la foto va a todo el ancho y la zona mide el alto de la foto más la franja, con tope de 42svh, el mismo en modo cartel y en modo vista: cambiar de modo no mueve el layout. En modo cartel se usa la proporción de la última foto elegida, o la de la primera. El modo cartel no cambia: el canvas llena la zona y la franja queda sobre el escenario.

Cámara en perspectiva en los dos modos. Motivo: la ortográfica de 1.9 dibujaba el cartel de frente sobre fotos tomadas en tres cuartos, y girar el cartel no reproduce la fuga de una foto. Se orbita la cámara alrededor del cartel; el cartel no se rota nunca.

- Modo cartel: `fov` 30. Target en el centro de la caja de encuadre: la del cartel, o desde 1.15 la del totem completo con panel, poste y base. Distancia (desde 1.13): se deriva en cada frame de la huella proyectada de la caja del cartel (ancho, alto y espesor) con la orientación actual de la cámara, con damp, y 12 por ciento de margen por lado. En modo letters la caja es la del conjunto de letras, no la de una. En el tipo `totem` la caja incluye poste y base. No se usa la esfera contenedora ni un margen fijo: la esfera dimensiona para el peor caso y achica el cartel en la vista frontal, que es la que se ve al cargar. `OrbitControls` con azimut libre de 360 grados, ángulo polar entre 0,6 y 1,5 rad (nunca desde abajo), sin paneo, sin zoom de rueda y sin autorotación. Luz de estudio propia del modo (desde 1.13): el entorno de estudio más una key, con constantes nombradas en el código. No va al JSON del cliente: es del producto, no de un cliente. Desde 2.10 (D104), con iluminación none el estudio prende las luces: más key y luz ambiente, con el entorno igual, para que el cartel se lea del color del JSON (el PVC, casi blanco); con front o back vuelve a la luz de siempre.
- Modo vista: la cámara sale del anchor de la foto. Se ubica en `cameraYawDeg` y `cameraPitchDeg` alrededor del cartel, con `fovDeg` como campo vertical, a la distancia en la que un metro de cartel ocupa `metersToWidth` del ancho de la foto. El centro del cartel cae en (`x`, `y`) de la foto con un corrimiento de la vista de la cámara (lens shift), no moviendo el cartel. Con el tipo `totem` (desde 1.15) la distancia y el corrimiento salen de `anchorGround`, y el punto que cae en (`x`, `y`) es el apoyo de la base; los ángulos y el fov siguen saliendo del `anchor`. El canvas cubre el cuadro entero. Desde 2.6 (D81) la cámara no orbita ni corre la vista: toma la orientación y el `fovDeg` del `anchor`, con `cameraPitchDeg` 0 como mirada horizontal, y se ubica de modo que el anclaje (el centro del cartel, o el apoyo del tótem) caiga en su (`x`, `y`) de la foto fuera del eje, a la profundidad en la que un metro ocupa `metersToWidth` del ancho. La altura de la cámara sale de esos datos, sin campo nuevo: con pitch 0 el tótem queda con la cámara a unos 1,84 m del piso en northline y 2,04 m en norte. Vale para los tres tipos. Corrige la decisión del 14/09: pitch 0 es mirar horizontal, no estar a la altura del piso.

Zoom por modo, con el mismo control. Desde 2.8 (D92) sale la barra de zoom: el zoom va con la rueda, con pinch y con dos botones + y − sobre el preview, con `aria-label` derivado de `previewZoomLabel`. Los rangos y los dos mecanismos no cambian:

- Modo cartel: multiplica la distancia derivada de la huella entre 1,0 y 0,55. Solo acercar.
- Modo vista: transformación CSS sobre el contenedor de foto y canvas juntos, nunca un movimiento de cámara, así foto y cartel escalan juntos y no existe el desalineado.

Assets (desde 2.0, D45): se deroga la lista cerrada de tres assets y la prohibición de assets descargados en runtime. Quedan permitidos, servidos desde `public/`: las fotos de fondo del cliente, HDRI de hasta 2k, mapas PBR y typefaces, dentro del presupuesto de primera carga de la sección 3. El producto no usa HDRI desde 2.2 (D55), ver Entorno de estudio. El texto 3D del cartel sigue saliendo del typeface JSON de Archivo Black (OFL) de 1.14, porque el glifo pintado sobre una caja se leía como un azulejo y no como la letra corpórea que el producto vende. Sigue prohibido todo modelo importado y `Text` y `Text3D` de drei. Se derogan también la prohibición de postprocesado y la de sombras de mapa: las regula el pipeline de render de abajo.

Permitido y acotado: texturas generadas en runtime, que no descargan nada y no pesan en el bundle. Con `CanvasTexture`, desde 1.14, una sola cosa: el degradado radial de la sombra de apoyo. Hasta 2.3 lo compartía el halo de `back`; desde 2.4 (D65) el halo lleva su perfil en el alpha de los vértices y no usa textura. Los glifos con `CanvasTexture` salen. Desde 2.1 (D53), los mapas de los acabados, que se generan con ruido determinista y nunca se descargan (ver Material).

Texto 3D (desde 1.14): un componente único, `SignText3D`, con `TextGeometry` de three sobre el typeface. `curveSegments` 4, bisel chico, una sola geometría por carácter memoizada y con `dispose` al desmontar. Por carácter y no por palabra: el visitante escribe letra a letra. El espaciado sale del avance de cada glifo del typeface. Cara y cantos con el material elegido.

- Cartel en modo area: caja cuyas dimensiones siguen ancho y alto en tiempo real con transición suave. Espesor fijo. En la cara va el texto del cartel en relieve de 3 mm con `SignText3D`, centrado y escalado al ancho disponible, sin salirse del panel en ninguna medida del rango. Desde 2.4 el panel, el de fachada y el del totem, tiene los cantos redondeados, con un radio constante nombrado de 4 mm y tope de 0,3 del espesor, y el relieve lleva bisel con la misma proporción que las letras: un canto vivo no toma el brillo del estudio y se lee como render.
- Cartel en modo letters (desde 1.14): una letra corpórea con `SignText3D` por carácter del texto sin espacios, máximo 18, con el contorno real del glifo, canto y bisel. Alto de letra de la selección, profundidad `visual.depthMeters` de la opción elegida. En `back` de modo cartel la cara de la letra no emite y emiten sus cantos y su cara trasera, igual que el panel.
- El tipo `totem` (desde 1.15): el panel del modo area sin cambios, con su texto en relieve, un poste vertical centrado debajo y una base apoyada en el piso, con su recargo de precio intacto. El origen del totem es la cara inferior de la base: base de 0 a `TOTEM_BASE_HEIGHT` (0,08 m), poste de ahí a `TOTEM_POST_HEIGHT` (1,10 m) y panel desde `TOTEM_POST_HEIGHT` hacia arriba. Medidas proporcionales con límites, para que no se rompa en los extremos del slider de ancho: poste de 0,12 del ancho del panel entre 0,12 y 0,35 m, y de 1,6 veces el espesor del panel de profundidad; base de 0,45 del ancho del panel con piso de 0,50 m, y 0,50 m de profundidad. Son constantes nombradas del código de la escena, como la luz de estudio, nunca del JSON. Poste y base van en el color `muted` del tema, con metalness 0,2 y roughness 0,6, y nunca emiten: `front` y `back` afectan solo al panel.
- Sombra de apoyo: quad con el degradado radial, detrás del cartel y apenas desplazado, en los dos modos. Su color (desde 1.16) es una constante de escena casi negra y no sale del tema del cliente: una sombra oscurece siempre, y un color derivado de una paleta clara puede quedar más claro que el fondo que tiene detrás. En el tipo `totem` (desde 1.15) el quad va horizontal sobre el piso, centrado bajo la base, de 1,6 veces su ancho y su profundidad, en los dos modos. Desde 2.4 (D67): en modo vista se queda, porque el canvas es transparente y la sombra de mapa no tiene receptor; en modo cartel sale solo si la sombra de mapa ya oscurece la huella de apoyo por su cuenta. Medido en TAREA_025: la oscurece 0 niveles en los tres tipos y los dos clientes, porque en modo cartel no hay receptor debajo del cartel, y el quad queda en los dos modos.
- Material (desde 2.1, D52 a D54): las caras del cartel y de las letras son `MeshPhysicalMaterial` con los parámetros físicos del `visual` (sección 10) y los mapas del acabado. Motivo: con color, metalness y roughness solos, PVC y acrílico se veían iguales entre sí incluso con el HDRI 1k (medido el 14/09), y en las capturas de TAREA_023 los tres materiales se leían como el mismo plástico claro.
  - Mapas (D53): roughness y normal, generados en runtime con ruido determinista en `src/core/preview/`, uno por acabado, memoizados y con `dispose` al desmontar, igual que las geometrías de glifo. Nunca se descarga un mapa: si un acabado pareciera necesitar uno fotográfico, se frena y se decide. El mapa se repite por metro de superficie y no se estira con el slider de medida.
  - `foam`, el PVC espumado: mate, microrelieve fino y reflejo especular bajo. No refleja el estudio.
  - `brushed`, la chapa: metálico, con anisotropía horizontal en la cara y a lo largo de cada canto. Sin el entorno de estudio la anisotropía no se lee.
  - `polished`, el acrílico opal: roughness de base baja y clearcoat alto con clearcoatRoughness baja. Se separa del PVC por reflejo, no por transparencia: refleja el estudio y el PVC no.
- Entorno de estudio (desde 2.2, D55): se genera en runtime con `Environment` y `Lightformer` de drei, se renderiza una vez al montar, nunca se ve de fondo y solo da reflejo. Vive en `src/core/preview/` con el resto del pipeline, con constantes nombradas. Es un rig de contraste: fuentes brillantes y acotadas contra un entorno oscuro, que es lo que hace que una superficie pulida se lea como pulida. Las fuentes van ubicadas para que su reflejo caiga en la cara en la vista frontal del modo cartel, la que se ve al cargar: de frente, el panel refleja lo que está detrás de la cámara. En modo vista la intensidad del rig escala con `light.ambient` de la foto elegida: la luz de la foto sigue mandando. Desde 2.3 (D60) las fuentes se reparten alrededor del eje vertical, como un estudio con varios softboxes, y no solo donde arranca la cámara: la separación entre materiales tiene que seguir al girar el cartel. Desde 2.3 (D61) la fuente especular del modo vista sale de la foto: su dirección deriva de `keyAzimuthDeg` y `keyElevationDeg` del `light` de la foto elegida, así el brillo cae donde está el sol de esa foto, y el dato sigue viniendo del JSON.
  - Separación de materiales por modo (desde 2.3, D60 y D61). En modo cartel se mide como diferencia entre materiales: mediana de la diferencia absoluta sobre la cara, sin la sombra de apoyo, mayor a 10 niveles de frente y mayor a 6 con el cartel girado 60 grados, en los tres pares. Que la separación baje al girar es aceptable; que desaparezca, no. En modo vista se mide por contraste interno de la cara, p95 menos p50 de la luminancia: el acrílico supera al PVC en más de 8 niveles en la foto de día. Motivo: en vista la luz sale de la foto, una fachada de día deja la cara en 205, donde AgX comprime, y abrir recorrido tonal pediría oscurecer el cartel respecto de la foto, que es lo que hace que un compuesto se lea como pegado.
  - HDRI descargado descartado (2.2, D55). Con el 1k de Studio Small 08 el primer frame en slow 4G llegó a 8,7 s contra un tope de 6 s, y el 2k pesa 3,8 MB con gzip. Además un entorno de contraste bajo, parejo, es la causa medida de que acrílico y PVC dieran el mismo píxel. Descartados también el HDR en JPG, por las bandas en el metal, y la carga diferida del HDRI, por D47. Desde 2.3 (D62) tampoco vuelve como segunda opción: además del primer frame, en vista el límite es la compresión tonal en 205 y no la resolución del entorno.
  - Transmisión descartada (2.1, D54). El acrílico es opal: difunde la luz y no deja ver lo que tiene detrás, que es lo que hace un cartel real. Motivo medido: el canvas es transparente en los dos modos, la foto y el escenario son capas HTML, y el pase de transmisión de three no tiene escena que samplear; con alpha de limpieza menor a 1 limpia su buffer con blanco a medio alpha. Con transmission 1 el acrílico sube hasta 32 niveles hacia el blanco en modo vista, sin mostrar la fachada, y baja 25 en modo cartel, gris. Se descarta también mover la foto y el escenario adentro de WebGL: rompe el zoom CSS del modo vista, el criterio de alpha con diferencia 0 y la capa HTML del marco, y el producto no gana. No se reintenta en otra vertical sin resolver antes el fondo.
- Iluminación: tres modos, nunca más de una luz dinámica, colores del `visual` del material.
  - `none`: sin emisión y sin luz agregada.
  - `front`: emisión baja en la cara más una luz puntual por delante y por arriba.
  - `back`: los cantos y la cara trasera emiten. En modo cartel (desde 1.13) la cara no emite: queda en el color del material apenas oscurecido, y no hay halo. Excepción desde 2.1: una cara con `translucency` mayor que 0, el acrílico opal, enciende por emisión pareja en toda la superficie, en los dos modos, con la intensidad de los cantos por su `translucency`. Sale la emisión en la cara para back, porque un back-lit real tiene la cara apagada y el resplandor detrás, y con la cara emisiva back y front no se distinguen de frente. En modo vista la cara emite poco, lo justo para que el texto siga legible, y hay halo: el resplandor detrás del cartel, color del emisivo del material. Desde 2.4 (D65) el halo es una banda de 0,3 del alto del cartel por lado, y en letters del alto de letra, con un perfil que decrece hasta 0 en el borde con derivada 0 en el borde, así no hay escalón. El pico se deriva de `light.ambient` de la foto elegida, con constantes nombradas en el código y sin campo nuevo en el JSON: de noche el halo tiene que leerse y de día apenas acompaña. Compone como cobertura sobre la foto, con el color del material multiplicado por una constante de brillo, la luz de los LED rebotada en la pared. En letters rodea la tinta del texto y no la caja de avances. Desde 2.6 (D80) el tótem no tiene halo en modo vista: es exento, no tiene pared a la distancia de montaje, y su halo caía sobre el vidrio de la vidriera con un pico de 155 a 177 niveles. Su `back` se lee en cantos y cara trasera. Desde 2.5 (D75) la banda de letters es más ancha: con 0,3 del alto de letra subía 52 niveles en 5 píxeles y hacía meseta entre letras, y se leía como una placa blanca con borde. Desde 2.7 (D86) el halo de letras no satura: el pico compuesto queda al menos 8 niveles debajo del techo del tone mapping, y en la banda los píxeles a 3 niveles o menos del máximo son 15 por ciento o menos. El perfil decrece desde la tinta, con derivada 0 en el borde, y no desde la caja de la palabra. El pico de noche sobre la pared es de 30 niveles o más, y sigue la pendiente media de 5 niveles por píxel como máximo (D75). Motivo medido: en norte de noche la meseta quedaba en 234 sobre toda la caja de la palabra, con las letras en 185, y se leía como placa. Motivo medido: con la banda de 0,12 el halo mide 6 píxeles y no puede bajar de 60 niveles a 0 sin escalón; sin bloom el borde duro medía de 35 a 92 niveles y en captura se leía como un marco blanco. En modo vista el halo es el único mecanismo de luz fuera del cartel (D64).
- Los tres modos se distinguen con luminancia medida sobre la región del cartel (desde 1.13). Desde 2.5 (D72), en modo vista la cara del acrílico no se compara entre `front` y `back`: manda el anillo, y la cara en `back` no queda más de 10 niveles debajo de `front`; D57 sigue en modo cartel. Motivo: sin bloom (D64) la cara solo sube por emisivo, el relieve no emite, y subir `translucency` sube la desviación. Desde 2.4 (D66), si la cara del acrílico en `front` está en 220 o más, que es el techo de AgX para un blanco, la cara no se compara entre `front` y `back`: manda el anillo, 12 píxeles fuera de la caja, que crece de `front` a `back` también en modo cartel. Desde 2.6 (D80) el anillo en modo vista se mide solo en facade y letters: el tótem en vista no tiene halo. Desde 2.2 (D57) la comparación depende del material, porque la cara del acrílico opal enciende en `back`. En los tres materiales la cara crece de `none` a `front`, y el anillo inmediato crece de `front` a `back` en modo vista. En PVC y chapa, caras opacas, la cara baja de `front` a `back`. En el acrílico la cara sube de `front` a `back` y su desviación estándar baja: un opal retroiluminado da resplandor parejo, y `front` da un foco con caída. Se miden en modo vista con la misma foto; las de la cara también en modo cartel, de frente y sin girar, y desde 1.15 también en el tipo `totem`. En modo cartel la máscara de la cara excluye la sombra de apoyo.
- No hay escalar `dusk`. No hay degradación por rendimiento medido: la calidad sale de un perfil que se elige una vez al montar, por capacidad del dispositivo (D46).
- Luz de la escena del cartel: en modo vista sale del `light` de la foto elegida, nunca de constantes del código. Desde 2.5 (D77) el color del ambiente y de la key de vista se tiñe con la crominancia de la foto elegida alrededor del anclaje: se calcula en el core, una vez por foto, en un rectángulo fijo alrededor de (`x`, `y`) que no depende del tamaño del cartel, y se mezcla con una fuerza nombrada en el código. Sin campo nuevo en el JSON. El modo cartel no cambia. Desde 2.6 (D82) el tinte alcanza también al entorno de estudio en modo vista, que es la parte del ambiente que refleja. En modo cartel es la luz de estudio del producto, con constantes nombradas, y nunca del JSON.
- Interfaz del componente: recibe `selection`, `visual`, `theme`, las fotos y las etiquetas. El preview no recibe la config del cliente y no busca nada por id.
- Escala: la escena trabaja siempre en metros. Las medidas de la selección se multiplican por el factor de `visual` (1 en metros, 0.3048 en pies).
- Colores: el color del cartel sale del `visual` del material. Ningún hexadecimal escrito en un componente de escena.
- Si el navegador no tiene WebGL, el modo vista muestra la foto sola.

Pipeline de render (desde 2.0, D45):

- Un solo `EffectComposer`, en este orden: N8AO, Bloom, ToneMapping AgX y SMAA. Desde 2.4 el tone mapping AgX distingue cobertura de luz (`CoverageToneMapping`, en `src/core/preview/`): un píxel que tapa la foto a medias se mapea con su color sobre alpha y vuelve a multiplicarse por alpha, y donde el mapa del bloom tiene resplandor se mapea como antes. Motivo medido: con el canvas transparente, AgX y sRGB sobre el color premultiplicado no bajaban con el alpha y el halo tenía 69 niveles donde tocaban 12, con corte en el borde de la malla. En modo cartel el cuadro cambia como mucho 1 nivel. El renderer va con `antialias` apagado, porque el AA lo hace SMAA, y sin tone mapping propio, para no aplicarlo dos veces.
- N8AO conservador, en metros de escena: se lee en el encuentro del cartel con su apoyo y en los cantos, no como contorno.
- Bloom selectivo por emisores (desde 2.1, D50). La vertical declara qué mallas emiten, habilitando en ellas la capa de bloom que exporta el core, igual que decide qué proyecta sombra; el core solo recibe la selección y la hace brillar. El umbral de luminancia deja de ser el mecanismo. Motivo medido en TAREA_023: con umbral sobre la luminancia del cuadro ningún valor separaba el emisivo de los brillos, porque los especulares del acrílico bajo la puntual de `front` pasan 12 de luminancia lineal y los cantos de `back` quedan por debajo de 4; y el panel en `back` visto de frente no tiene emisor a la vista, así que da 0 píxeles en todo umbral, lo que es correcto. Un umbral no separa un especular de un emisivo, y subir el emisivo para que pase queda rechazado. La selección son los emisores de `back`: cantos y cara trasera del panel y de las letras, y la cara con `translucency` mayor que 0. Para que la cara apagada no entre, panel y letras se dibujan como dos mallas sobre la misma geometría, la cara y la cáscara. En `none` y `front` la selección está vacía y el cuadro no cambia ni un píxel. Desde 2.4 (D64) en modo vista no hay bloom: la vertical no habilita la capa en sus emisores cuando el modo es vista, y el core no cambia. Motivo medido: el bloom es de pantalla y se derrama sobre lo que la foto tenga al lado del cartel, en northline sobre el vidrio de la planta alta y no sobre la pared, y en letras la banda del halo medía 3 o 4 píxeles. En modo cartel el bloom queda como está.
- Sombras suaves de mapa: el canvas va con `PCFShadowMap` y radio de filtro en la luz, y la key del modo cartel proyecta. Desde 2.8 (D88) el pipeline del core controla los mapas de sombra: `shadowMap.autoUpdate` en false y `needsUpdate` en true una vez por cuadro, antes del pase principal, con la cámara en las capas que proyectan. El bloom y la atenuación reusan esos mapas sin volver a dibujarlos. Desde 2.5 (D76) la key del modo vista también proyecta, con la dirección de la key de la foto elegida, sobre un receptor de solo sombra (`ShadowMaterial`): un plano en la pared detrás del cartel en fachada y letters, y un plano de piso en el apoyo de `anchorGround` en el tótem, del tamaño de la caja del cartel más un margen nombrado. La cámara de sombra se ajusta a esa caja. La opacidad sale de `light.ambient` y de la intensidad de la key, con constantes nombradas: a más ambiente, menos sombra. Desde 2.6 (D79) la sombra es atenuación y no luz, y no pasa por el tone mapping: los receptores se dibujan en una capa propia del core, en un target aparte, y el pase final compone alpha = 1 − (1 − s)(1 − a) con el color de la cobertura de luz mapeada sola. Sobre la foto queda C_luz + (1 − s)(1 − a)·foto. La vertical marca los receptores con esa capa, como marca los emisores del bloom. Motivo medido: mezclada antes del tone mapping, en northline fachada de día la sombra pasaba de −92 y −98 a 2 y 27 debajo del halo. Deroga el descarte del 14/09: hoy cada foto declara azimut y elevación de su key. El quad de apoyo de vista sale solo si el receptor ya oscurece su huella 10 niveles o más en todos los casos. Desde 2.7 (D85) el receptor de piso del tótem termina en la línea de fachada: se recorta en la profundidad que da el rayo de la cámara por (`x` del apoyo, `wallY`) sobre el piso. No hay receptor vertical para el tótem: la fachada es vidrio y una sombra difusa sobre vidrio se lee falsa. Motivo medido: la sombra del panel caía como cuña sobre el zócalo y la puerta de northline de día. `PCFSoftShadowMap` está deprecado en three 0.185 y cae a `PCFShadowMap` con un aviso por consola. La sombra de apoyo con `CanvasTexture` se conserva.
- En modo vista el canvas sigue transparente sobre la foto: el composer respeta el alpha y el tone mapping no toca la foto, que es una capa HTML debajo del canvas. Desde 2.2 (D58) se verifica en dos partes. En `none` y `front` la foto fuera del cartel queda idéntica a la foto sola, diferencia 0: es el test del alpha. Desde 2.5 (D78), fuera del cartel y fuera de la zona de sombra. En `back` la luz que cae afuera vive dentro de la banda del halo, desde 2.4 (D65) 0,3 del alto del cartel por lado, y desde 2.5 (D75) en letters `HALO_LETTERS_BAND` del alto de letra, entre 0,5 y 1,0, con pendiente media contra la foto de 5 niveles por píxel como máximo: fuera de la banda, diferencia 0 contra la foto sola; sobre la normal al contorno la diferencia decrece y llega a 0 en el borde, y ningún salto entre píxeles vecinos supera el doble de la pendiente media de la banda, sin contar el primer píxel pegado al contorno, con tolerancia de 1 nivel por la cuantización de 8 bits (D71). Como en vista no hay bloom (D64), la luz de afuera es solo el halo.

Perfiles de calidad (desde 2.0, D46). Se elige uno al montar el preview, por capacidad del dispositivo: puntero grueso, `navigator.deviceMemory` y `hardwareConcurrency`. No se mide fps y no se cambia de perfil en caliente.

- `high`: dpr entre 1 y 2, AO con muestras plenas, bloom, SMAA y sombras suaves.
- `medium`: dpr entre 1 y 1,5, AO con la mitad de las muestras; bloom, SMAA y sombras se conservan.

Pantalla de carga (desde 2.0, D47): ocupa el marco del preview sobre `--q-stage`, con el logo del cliente y `loadingLabel`, mientras el contenido del canvas está suspendido. El progreso es el real del LoadingManager de three, sin animación simulada ni mínimos artificiales. Se quita cuando la escena dibujó su primer frame, sin salto de layout.

## 13. Landing (quote.lokebox.com)

Una página en `/` con identidad Lokebox, en inglés y sin selector de idioma. Corta. Reescrita en 1.19.

- JSON propio en `src/landing/landing.json`, validado en runtime como el de cliente. No es un cliente: no entra al registro de `src/clients` y no tiene ruta `/d/`. Forma: `locale`; `currency` con `code`, `symbol` y `decimals`; `brand` con `name` y `logo`; `colors` con `bg`, `text`, `muted` y `accent` en hexadecimal de seis dígitos; `texts` con todos los textos visibles, más `how` y `forWho` como listas de tres; `demos`, exactamente cinco desde 2.13 (D137), con `id`, `label` y `href`: las dos de la salida comercial y las tres de la vitrina; `offer` con `price`, `setup`, `monthly` y `more`; `contact` con `email` y `placeholder`.
- `contact.placeholder` avisa a Canal C que el email todavía no es el público, igual que `prices_placeholder`. No tiene efecto visible.
- Identidad: la landing lleva el logo horizontal de Lokebox, `public/lokebox-logo-horizontal.svg`, en el encabezado y en el pie, con su ruta en `brand.logo` y validada en runtime. Es el único lugar del producto donde aparece la identidad Lokebox: las demos `/d/<slug>` siguen white label con el tema de su JSON. La paleta y las variables siguen como en 1.17 y no se tocan en esta versión: cuando cierre la identidad visual, entra como edición del JSON. Sin fuente propia.
- Orden de secciones: encabezado con el logo; hero con headline, subheadline y los botones a las demos; how it works con tres pasos numerados; who it is for con tres puntos; oferta; contacto; footer con el logo y la línea de `texts.footer`. El nombre de la marca viaja en el `alt` del logo, como en el encabezado del cotizador: no se repite al lado de la imagen.
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

CRM, auth, usuarios, multi-tenant, panel de administración, permisos, integraciones, email transaccional, generación de PDF en servidor, modelos 3D importados, editor visual del JSON, un cuarto tipo de cartel, más de dos verticales.

Desde 2.12 (D119) la segunda vertical, cajas, está en alcance del bloque 12. Desde 2.13 el contrato de vertical está en 4.4, la composición del precio en 6.3, las claves de la hoja en 8 y la partición del JSON en 10. Desde 2.14 la vertical cajas está en la sección 21.

Desde 2.0 (D45) no están fuera de alcance el postprocesado, los assets descargados en runtime ni los typefaces: los regula la sección 12.

Desde 1.18 también quedan fuera:

- Ajuste manual de precio o de margen desde la vista dueño.
- Generación de propuesta y envío desde la vista dueño.
- Render de imagen con IA. Queda anotado como upsell del listado, no se construye.

## 17. Criterio de DONE

1. Se entiende en menos de 10 segundos.
2. Resiste una comparación lado a lado con un configurador comercial de referencia (D48).
3. El flujo completo funciona en las dos demos.
4. Sin errores visibles.
5. Fluido en mobile.
6. Se puede grabar un video de 30 segundos convincente.
7. Capturas atractivas.
8. Desplegado en quote.lokebox.com.
9. Listado del Project Catalog listo para publicar.

## 18. Capas premium

Desde 2.0 (D44). El nivel visual del preview vive en core, para que las próximas verticales lo hereden sin reescribirlo.

- Viven en `src/core/`: el pipeline de render y el canvas que lo monta (`src/core/preview/`), los perfiles de calidad (`src/core/preview/quality.ts`), la pantalla de carga (`src/core/ui/LoadingScreen.tsx`), los controles del panel (`src/core/ui/controls/`) y, desde 2.1, los generadores de mapas por acabado y la capa de bloom (`src/core/preview/`). Desde 2.2, también el entorno de estudio generado (`src/core/preview/`). Desde 2.5, el tone mapping por cobertura y la medición del tinte de la foto (`photoTint`); desde 2.6 (D79), la capa de atenuación de las sombras de vista. Desde 2.8, el control de los mapas de sombra por cuadro (D88), el layout de escritorio y mobile (D90, D95), el panel en pasos y el swatch del control choice (D94).
- No conocen la vertical. La vertical entrega su escena como contenido del canvas del core y decide qué objetos proyectan sombra, cuáles emiten y, desde 2.6, cuáles reciben sombra como atenuación, marcándolos con la capa que exporta el core. El core decide cómo se renderiza.
- `src/core` sigue sin importar de `src/verticals`, de `src/clients` ni, desde 2.13, de `src/app`.
- La pantalla de carga necesita el logo del cliente y `loadingLabel`: el preview de la vertical los recibe como props, junto con las etiquetas de la sección 12.

## 19. Plan por días

El detalle de bloques, tareas y criterios está en docs/EXECUTION.md.

- Lunes 14: tipos, JSON de los dos clientes, motor de precios con tests, panel de opciones, precio animado, primer deploy.
- Martes 15: preview 3D completo y rendimiento en mobile.
- Miércoles 16: rutas por cliente, lead, Supabase, quote imprimible, visitas, demo ES, dominio.
- Jueves 17: pulido visual, mobile, landing, video, capturas.
- Viernes 18: listado del Catalog, planilla de precios, lista de 40 cartelerías, plantilla de mensaje.

## 20. Métrica de la semana siguiente

30 mensajes por WhatsApp. Objetivo: 5 respuestas y 1 llamada. Con eso se decide seguir, cambiar de nicho o pausar.

## 21. Vertical cajas (desde 2.14)

Módulo `src/verticals/boxes/`, id `boxes`, con el contrato de 4.4 (D119, D123 a D125, D141 a D144). Cajas y packaging a medida. Sin fotos y sin modo vista: el preview es solo el estudio.

### 21.1 Selección y panel

```ts
type BoxSelection = {
  style: string;       // id de estilo
  length: number;      // medidas interiores, en la unidad de largo del cliente
  width: number;
  height: number;
  materialId: string;
  printingId: string;
  quantity: number;    // uno de los escalones de quantities
};
```

Panel en cinco pasos: estilo (choice); medidas interiores, con título `dimensionsLabel` y largo, ancho y alto como range con la unidad; material (choice con swatch del color de su `visual`); impresión (choice); cantidad (choice, un botón por escalón, con el número formateado con Intl y el locale del cliente).

`materials[].styles` es opcional: sin la clave el material vale para todos los estilos; con la clave, solo para esos. El panel muestra solo los materiales del estilo elegido. Si al cambiar de estilo el material elegido no vale, pasa al primero que vale, en el orden del JSON. La validación exige que cada estilo tenga al menos un material y que el default sea coherente.

### 21.2 Precio

Unidades: `units.length` `"in"` con `units.area` `"sqft"`, o `"cm"` con `"m2"`. Otra combinación falla al cargar. Conversión fija: pulgada cuadrada sobre 144 da sqft, centímetro cuadrado sobre 10000 da m2.

Plancha desplegada (D142): cada estilo declara en `blank` una o más piezas rectangulares. Cada lado de una pieza es `{ l, w, h, add }` y vale `l` por largo más `w` por ancho más `h` por alto más `add`, con `add` en la unidad de largo del cliente. Área de plancha por caja: la suma de largo por ancho de cada pieza, pasada a la unidad de área.

Componentes por caja, en este orden:

1. `material`: área de plancha por `pricePerArea` del material. Clave `lineMaterial`. Entra siempre.
2. `printing`: área de plancha por `pricePerArea` de la impresión. El precio de cada opción ya dice qué caras imprime: la de exterior e interior lo trae por las dos. Clave `linePrinting`. Entra siempre, en 0 sin impresión.
3. `assembly`: `assembly` del estilo, fijo por caja. Clave `lineAssembly`. Entra solo si es mayor que 0.

Por pedido: `setup`, el `setup` de la impresión. Clave `lineSetup`. Entra solo si es mayor que 0. No se multiplica por la cantidad ni se descuenta (6.3).

Escalones (D141): `quantities` es una lista `{ qty, pct }` con `qty` y `pct` estrictamente crecientes y el primer `pct` en 0. La cantidad solo puede ser uno de esos `qty`. Pasan a `composePrice` como `discounts` con `minQty` igual a `qty`: el factor del escalón de D123 es 1 menos pct/100 sobre el precio del escalón mínimo, y se ve como la línea de descuento del core. `rangePct` como en carteles.

Resultado: el `PriceResult` de 6.3 más `blankArea`, el área de plancha por caja sin redondear, y `quantity`, la cantidad de la selección, que es lo que lee `breakdownCaption` (D146). `detailValues` de material e impresión: `{ id, blankArea, unitPrice }`, que `lineDetail` formatea como área con su unidad por precio con su moneda; armado y preparación sin detalle. `breakdownCaption` es `perBoxCaption` con `{quantity}` formateado: dice que las líneas son por caja y la preparación por pedido.

Mismas prohibiciones de pureza que 6.1. Un id que no existe, un material que no vale para el estilo, una medida fuera de rango o una cantidad fuera de los escalones lanza con el valor en el mensaje.

### 21.3 Hoja, lead y WhatsApp

Claves de la hoja, en este orden y todas siempre: `s` estilo, `l` largo, `w` ancho, `h` alto, `m` material, `p` impresión, `q` cantidad. Punto decimal. Las reglas de la sección 8 valen igual: un material que no vale para el estilo o una `q` fuera de los escalones es un link inválido.

Filas de la hoja: estilo; medidas interiores como largo por ancho por alto con la unidad, formateadas con Intl; material; impresión; cantidad.

`leadSelection`: `{ style, length, width, height, unit, materialId, printingId, quantity }`.

`whatsappMessage`: plantilla con `{style}`, `{length}`, `{width}`, `{height}`, `{unit}`, `{material}`, `{printing}`, `{quantity}`, `{min}` y `{max}`. `whatsappMessageHidden`: la misma sin `{min}` ni `{max}`, condicional como en carteles (sección 10): se exige solo con `hidden` y un CTA que incluya WhatsApp.

### 21.4 JSON

Las claves del core no cambian (sección 10). La vertical valida `units`, `options` y sus claves de `texts`. Un cliente de cajas no lleva `photos`.

```json
{
  "vertical": "boxes",
  "units": { "length": "in", "area": "sqft" },
  "options": {
    "styles": [
      {
        "id": "mailer", "label": "Mailer box", "assembly": 0.25,
        "blank": [{ "length": { "l": 1, "w": 0, "h": 4, "add": 1 }, "width": { "l": 0, "w": 2, "h": 3, "add": 1.5 } }],
        "visual": { "shape": "mailer" }
      },
      {
        "id": "two-piece", "label": "Lid and base", "assembly": 0.6,
        "blank": [
          { "length": { "l": 1, "w": 0, "h": 2, "add": 0.25 }, "width": { "l": 0, "w": 1, "h": 2, "add": 0.25 } },
          { "length": { "l": 1, "w": 0, "h": 0.8, "add": 0.5 }, "width": { "l": 0, "w": 1, "h": 0.8, "add": 0.5 } }
        ],
        "visual": { "shape": "two-piece", "lidDepth": 0.4 }
      },
      {
        "id": "shipping", "label": "Shipping box", "assembly": 0.1,
        "blank": [{ "length": { "l": 2, "w": 2, "h": 0, "add": 1.5 }, "width": { "l": 0, "w": 1, "h": 1, "add": 0.25 } }],
        "visual": { "shape": "shipping" }
      }
    ],
    "length": { "min": 4, "max": 24, "step": 0.5, "default": 10 },
    "width": { "min": 3, "max": 18, "step": 0.5, "default": 8 },
    "height": { "min": 1, "max": 12, "step": 0.5, "default": 4 },
    "materials": [
      {
        "id": "kraft", "label": "Kraft corrugated", "pricePerArea": 0.35,
        "visual": {
          "color": "#B8895A", "finish": "foam", "metalness": 0, "roughness": 0.95,
          "specularIntensity": 0.25, "clearcoat": 0, "clearcoatRoughness": 0,
          "anisotropy": 0, "normalScale": 0.35, "translucency": 0, "thicknessMm": 3
        }
      },
      { "id": "rigid", "label": "Rigid, paper-wrapped", "pricePerArea": 1.6, "styles": ["two-piece"], "visual": { "...": "igual forma" } }
    ],
    "printing": [
      { "id": "none", "label": "No print", "pricePerArea": 0, "setup": 0, "visual": { "logo": "none", "inside": false } },
      { "id": "one", "label": "1 color, outside", "pricePerArea": 0.15, "setup": 60, "visual": { "logo": "accent", "inside": false } }
    ],
    "quantities": [{ "qty": 50, "pct": 0 }, { "qty": 100, "pct": 10 }, { "qty": 250, "pct": 20 }],
    "defaults": { "style": "mailer", "materialId": "kraft", "printingId": "one", "quantity": 250 },
    "rangePct": 10
  }
}
```

- `styles[].visual.shape`: `"mailer"` (autoarmable, tapa con bisagra atrás), `"two-piece"` (fondo y tapa telescópica) o `"shipping"` (caja de envío con cuatro solapas arriba). `lidDepth`, obligatorio solo en `two-piece`, entre 0 y 1: el alto de la tapa como fracción del alto. Es dato de la escena, como `depthMeters` en carteles: el precio sale de `blank`.
- `materials[].visual`: la forma de `materials[].visual` de carteles (sección 10) más `thicknessMm`, mayor que 0, el espesor que dibuja la escena.
- `printing[].visual`: `logo` `"none"`, `"accent"` (la silueta del logo en el acento del tema) u `"original"` (sus colores), e `inside`, las caras interiores en el acento.
- `defaults`: la selección inicial; las medidas salen del `default` de cada range.

Claves de `texts` de cajas, 17: `styleLabel`, `dimensionsLabel`, `lengthLabel`, `widthLabel`, `heightLabel`, `materialLabel`, `printingLabel`, `quantityLabel`, `previewZoomLabel`, `viewClosed`, `viewOpen`, `lineMaterial`, `linePrinting`, `lineAssembly`, `lineSetup`, `perBoxCaption`, `whatsappMessage`. Más `whatsappMessageHidden`, condicional. Varias se llaman igual que claves de carteles: el `texts` es plano y cada vertical valida las suyas.

Valores de `foldline` (USD, decimals 2, pulgadas y sqft, `prices_placeholder` false): los del ejemplo, y además:

| Concepto | Valor |
|---|---|
| White corrugated | 0.50 por sqft, todos los estilos |
| Kraft corrugated | 0.35, todos los estilos |
| Rigid, paper-wrapped | 1.60, solo two-piece |
| Full color, outside | 0.45 por sqft, setup 120 |
| Full color, inside and out | 0.80 por sqft, setup 180 |
| Escalones | 50 / 100 / 250 / 500 / 1000 con 0 / 10 / 20 / 28 / 35 por ciento |

Valores de `cajasur` (ARS, decimals 0, cm y m2, `prices_placeholder` true), derivados de los de foldline con dólar 1500 y factor 0,45 como en 5.5:

| Concepto | Valor |
|---|---|
| Estilos | Mailer autoarmable 170, Tapa y fondo 410, Caja de envío 70 de armado |
| `add` de plancha, en cm | mailer 2,5 y 4; tapa y fondo 0,6 en el fondo y 1,2 en la tapa; envío 4 y 0,6 |
| Kraft corrugado / Blanco corrugado / Rígido forrado | 2500 / 3600 / 11600 por m2; rígido solo en tapa y fondo |
| Sin impresión / 1 color exterior / Full color exterior / Full color exterior e interior | 0 / 1100 / 3300 / 5800 por m2; preparación 0 / 40000 / 81000 / 122000 |
| Medidas | largo 10 a 60, ancho 8 a 45, alto 3 a 30, paso 1; default 30 x 20 x 15 |
| Escalones y rango | los de foldline; rangePct 10 |
| Defaults | caja de envío, kraft, 1 color exterior, 100 |

### 21.5 Preview

- Solo estudio: el escenario del core (D103, D132), la luz de estudio de carteles sin iluminación, el entorno y el pipeline del core. Nada emite, así que la selección del bloom queda vacía.
- Geometría paramétrica por `shape`, con las medidas interiores pasadas a metros (0,0254 por pulgada, 0,01 por centímetro) y el espesor del material. Cantos con un radio chico nombrado. Sin modelos importados.
- Abierta y cerrada: control segmentado en la franja de controles del preview (D98, D100), con `viewClosed` y `viewOpen`, cerrada al cargar, transición suave. No es selección: no cambia el precio y no va a la URL ni al lead. El mailer abre la tapa por la bisagra, two-piece levanta la tapa y la corre al costado, shipping abre las cuatro solapas.
- Material: `MeshPhysicalMaterial` desde el `visual`, con los acabados del core. Un acabado nuevo solo si las capturas muestran que los existentes no alcanzan (D124).
- Impresión (D144): el logo del cliente, rasterizado una vez a `CanvasTexture` desde su archivo, con `dispose` al desmontar, centrado en la cara exterior de la tapa (en shipping, en la cara lateral larga del frente), con un ancho relativo nombrado. Con `accent`, la silueta en el acento del tema; con `original`, sus colores. Con `inside`, las caras interiores en el acento.
- Sombra de apoyo en el piso y key que proyecta, como el totem en modo cartel.
- Cámara: la del modo cartel de la sección 12 (fov 30, órbita con los mismos límites, distancia por la huella de la caja de encuadre con 12 por ciento de margen, zoom de 1,0 a 0,55). La caja de encuadre incluye la tapa o las solapas abiertas.
- Por debajo de lg el alto del preview es 3/4 del ancho, con el tope de 42svh (D98).
- Ningún hexadecimal en la escena: colores del `visual` y del tema.
