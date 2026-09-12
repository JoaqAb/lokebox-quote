# SPEC · Lokebox Quote

Fuente de verdad del alcance. Si algo no está acá, no se construye.
Este documento se edita, no se contradice. Si una feature pone en riesgo el viernes 18, se simplifica o se elimina.

Versión: 1.6 · 12/09/2026

## 1. Objetivo

Cotizador visual interactivo que un negocio pone en su web. El visitante configura lo que necesita, ve un preview 3D que cambia en vivo, obtiene un precio estimado, deja sus datos, y el negocio recibe un lead estructurado.

Primera y única vertical del MVP: cartelería (custom signs).

Canales de venta:

- Upwork Project Catalog. Demo en inglés, precios en USD.
- Salida en frío por WhatsApp a cartelerías de Tucumán. Demo en español, precios en pesos.

Fecha de DONE: viernes 18/09/2026.

## 2. Principios

- El proyecto existe para conseguir clientes. No es un SaaS y no es portfolio por sí mismo.
- Personalizar para un cliente nuevo es editar un JSON y reemplazar un logo. Nunca tocar código. Si una tarea rompe esta regla, se rehace.
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
- Presupuesto de bundle: el código de la app y el vendor 3D van en chunks separados. La app por debajo de 500 kB y el vendor 3D por debajo de 1000 kB sin comprimir. El build avisa si alguno se pasa. No hay lazy loading del preview: el preview es el producto y no puede aparecer después que el resto de la página.

## 4. Arquitectura en tres capas

### 4.1 Core

Se escribe una vez y no conoce ninguna vertical ni ningún cliente concreto.

- Layout responsive. Desktop: preview a la izquierda, panel de opciones a la derecha, precio siempre visible. Mobile: preview arriba, opciones abajo, barra de precio fija al pie.
- Panel de opciones genérico, renderizado desde el esquema de la vertical.
- Motor de precios. Función pura, contrato en la sección 6.
- Contador de precio animado y rango.
- Captura de lead y CTA configurable: WhatsApp con mensaje armado, formulario con guardado en Supabase, o los dos.
- Hoja de cotización imprimible en HTML con estilos de impresión.
- i18n por JSON. Todo texto visible sale de la config del cliente. No hay strings de UI hardcodeados.
- Registro de visitas por slug de cliente.

### 4.2 Vertical: cartelería

- Esquema de opciones y validaciones.
- Componente de preview 3D específico, con la interfaz de la sección 12: recibe `selection`, `visual` y `theme`, y no hace nada más.
- Nombres de materiales, tipos de cartel y modos de iluminación.

### 4.3 Cliente: JSON

Un archivo por cliente en `src/clients/<slug>.json`. Ruta pública `/d/<slug>`. Contiene marca, idioma, unidades, moneda, opciones habilitadas, precios, textos, CTA y contacto.

El registro descubre los JSON de la carpeta por nombre de archivo. Agregar un cliente es agregar el JSON y el logo, sin editar código.

## 5. Vertical cartelería

### 5.1 Tipos de cartel

Solo dos en el MVP.

- `facade`: panel montado sobre el frente del local.
- `totem`: letrero de pie frente al local. Lleva recargo fijo por estructura y poste.

### 5.2 Variables de configuración

| Variable | Control | Rango |
|---|---|---|
| Tipo | dos botones | facade, totem |
| Ancho | slider | del JSON. EN en pies, ES en metros |
| Alto | slider | del JSON |
| Material | tres opciones | EN: PVC, Aluminum, Acrylic. ES: PVC espumado, Chapa, Acrílico |
| Iluminación | tres opciones | EN: None, Front-lit, Back-lit. ES: Sin luz, Frontal, Retroiluminado |
| Instalación | sí / no | booleano |
| Cantidad | stepper | 1 a 10 |

### 5.3 Estructura de precio

1. Área = ancho por alto, en la unidad de área del cliente.
2. Material: precio por unidad de área.
3. Iluminación: adicional por unidad de área.
4. Tipo: recargo fijo por unidad (0 en facade).
5. Instalación: monto fijo más monto por unidad de área, por unidad.
6. Subtotal = precio unitario por cantidad.
7. Descuento por cantidad: porcentaje desde 2 unidades y desde 5 unidades. Se aplica el tramo más alto que corresponda, nunca dos.
8. Rango mostrado: total más y menos `rangePct` (default 8).

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

### 5.6 Disclaimer

Todo precio se muestra como estimación, siempre acompañado del texto del JSON: el presupuesto final lo confirma el negocio.

## 6. Motor de precios (contrato)

Archivo: `src/core/pricing/calculatePrice.ts`. Función pura. Sin React, sin Supabase, sin fetch, sin Date.now, sin Math.random, sin formateo de moneda adentro.

```ts
type SignSelection = {
  type: string;          // id de tipo, "facade" | "totem"
  width: number;
  height: number;
  materialId: string;
  lightingId: string;
  installation: boolean;
  quantity: number;
};

type PriceRules = {
  currency: { code: string; symbol: string; decimals: number };
  types: { id: string; label: string; priceFixed: number }[];
  materials: { id: string; label: string; pricePerArea: number }[];
  lighting: { id: string; label: string; pricePerArea: number }[];
  installation: { fixed: number; perArea: number };
  discounts: { minQty: number; pct: number }[];
  rangePct: number;
};

type PriceDetailValues =
  | { id: "material" | "lighting"; area: number; unitPrice: number }
  | { id: "type"; fixed: number }
  | { id: "installation"; fixed: number; perArea: number; area: number }
  | { id: "discount"; pct: number };

type PriceLine = {
  id: "material" | "lighting" | "type" | "installation" | "discount";
  labelKey: string;   // clave de texto, no texto literal
  detail: string;     // string técnico, no se muestra en pantalla
  amount: number;     // negativo en discount
  detailValues?: PriceDetailValues;  // números crudos, los formatea la UI
};

type PriceResult = {
  area: number;
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

- Ruta propia, `/d/<slug>/quote`, con el estado de la selección en la query y sin dependencia del servidor. Siete claves en orden fijo: `t` (tipo), `w` (ancho), `h` (alto), `m` (material), `l` (iluminación), `i` (instalación, 0 o 1) y `q` (cantidad). Los números van con punto decimal, iguales en todos los idiomas: la URL es canónica y el idioma vive en el JSON.
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
  "cta": "both",
  "poweredBy": true,
  "prices_placeholder": false,
  "options": {
    "types": [{ "id": "facade", "label": "Facade sign", "priceFixed": 0 }],
    "width": { "min": 2, "max": 20, "step": 0.5, "default": 8 },
    "height": { "min": 1, "max": 8, "step": 0.5, "default": 3 },
    "materials": [
      { "id": "pvc", "label": "PVC", "pricePerArea": 15, "visual": { "color": "#E8E8E4", "metalness": 0, "roughness": 0.8 } }
    ],
    "lighting": [{ "id": "none", "label": "None", "pricePerArea": 0, "visual": { "mode": "none" } }],
    "installation": { "fixed": 350, "perArea": 10 },
    "quantity": { "min": 1, "max": 10, "default": 1 },
    "discounts": [{ "minQty": 2, "pct": 5 }, { "minQty": 5, "pct": 10 }],
    "rangePct": 8
  },
  "texts": { "...": "todos los textos visibles" }
}
```

Las 40 claves de `texts` requeridas, iguales en los dos idiomas:

`headline`, `subheadline`, `configureTitle`, `typeLabel`, `widthLabel`, `heightLabel`, `materialLabel`, `lightingLabel`, `installationLabel`, `installationYes`, `installationNo`, `quantityLabel`, `priceLabel`, `priceRangeNote`, `disclaimer`, `ctaWhatsapp`, `ctaForm`, `formTitle`, `formName`, `formContact`, `formNote`, `formSubmit`, `formSending`, `thanksTitle`, `thanksBody`, `viewQuote`, `quoteTitle`, `quoteValidity`, `quoteDateLabel`, `quoteSelectionTitle`, `quoteBreakdownTitle`, `quotePrint`, `quoteBack`, `lineMaterial`, `lineLighting`, `lineType`, `lineInstallation`, `lineDiscount`, `poweredBy`, `whatsappMessage`.

Los números visibles se formatean con `Intl` y el locale del cliente: `8.5` en `en`, `2,5` en `es-AR`. Eso vale para las medidas (ancho y alto) en el panel, en el mensaje de WhatsApp y en la hoja de cotización, y también para el desglose y la línea de área, que además llevan la unidad y la moneda del cliente.

`whatsappMessage` es una plantilla con placeholders: `{type}`, `{width}`, `{height}`, `{unit}`, `{material}`, `{lighting}`, `{installation}`, `{quantity}`, `{min}`, `{max}`.

Validación: al cargar un cliente se valida la forma en runtime. Si falta una clave o un id referenciado no existe, la app muestra un error claro en pantalla y no renderiza el cotizador a medias.

## 11. Clientes de la demo

- EN: slug `northline`, marca ficticia Northline Signs. Estética oscura, tipografía grande, acento cálido.
- ES: slug `norte`, marca ficticia Norte Carteles. Mismo esquema con idioma, unidades, moneda y precios cambiados.

Sin marcas reales, sin fotos reales, sin logos de terceros.

## 12. Preview 3D

Escena mínima. Sin modelos externos, sin texturas pesadas, sin física, sin partículas, sin shaders custom.

Prohibido en toda la vertical 3D: modelos importados, texturas, fuentes tipográficas (`Text` de drei), `Environment` o cualquier asset que se descargue en runtime, postprocessing y sombras de mapa. Las sombras son las de contacto de drei.

- Fachada: caja para el frente del local, plano para la vereda, dos cajas para puerta y vidriera. Colores neutros oscuros.
- Cartel: caja cuyas dimensiones siguen ancho y alto en tiempo real con transición suave. Espesor fijo.
- Material: cambia color, metalness y roughness según el `visual` del material.
- Iluminación: tres modos. `none` sin emisión y sin luz agregada. `front` con emisión baja en el cartel más una luz puntual por delante y por arriba, apuntando a la cara. `back` con emisión alta en el cartel más un plano emisivo apenas más grande detrás y una luz puntual entre el cartel y su apoyo, que lava la superficie de atrás. Nunca más de una luz dinámica en escena. El color emisivo y el del halo salen del `visual` del material.
- Sin bloom. El postprocessing está prohibido en esta misma sección, así que el bloom queda fuera del MVP y no es parte de la degradación por rendimiento.
- Tótem: la misma caja sobre un poste, de pie sobre la vereda delante del local, centrada en x. El poste va del piso al borde inferior del cartel, con un solapamiento mínimo para que no se vea la junta, y su ancho escala con el ancho del cartel dentro de un mínimo y un máximo. El cambio de tipo es una transición continua, no un salto.
- Ambiente: escena nocturna, luz ambiente baja, una direccional suave, sombras de contacto de drei.
- Cámara: composición inicial fija, con órbita limitada alrededor de ella. Los límites dejan explorar el modelo sin que entren en cuadro el vacío detrás de la fachada ni el borde de la vereda: azimut ±0.75 rad, polar de 1.00 a 1.57 rad (siempre por debajo de π/2) y zoom acotado entre 7 y 15 m de distancia. Cuando no hay interacción, barrido lento de ida y vuelta dentro del clamp de azimut, nunca hasta el tope. Arrastrar lo detiene y al soltar se reanuda con retardo y sin salto. No corre con `prefers-reduced-motion`.
- La órbita es entrada del usuario, no costo de dibujo: nunca se apaga por rendimiento, en ningún nivel. Apagarla no se distingue de una página rota, y su costo por cuadro es despreciable frente a las sombras de contacto y al dpr.
- Interfaz del componente: recibe `selection`, `visual` y `theme`. Nada más. `visual` es lo que devuelve `resolveSignVisual(config, selection)` de la vertical: el `visual` del material elegido, el `visual` de la iluminación elegida y el factor de conversión de la unidad de longitud del cliente a metros. El preview no recibe la config del cliente y no busca nada por id.
- Escala: la escena trabaja siempre en metros. Las medidas de la selección se multiplican por el factor de `visual` (1 en metros, 0.3048 en pies).
- Colores de la escena: se derivan del `theme` del cliente con operaciones de color. Ningún hexadecimal escrito en un componente de escena. El color del cartel sale del `visual` del material.
- Si el navegador no tiene WebGL, el preview cae a un bloque plano equivalente al provisorio de TAREA_002. Esa caída es por ausencia de WebGL, no la degradación por rendimiento de la última línea de esta sección.
- Rendimiento: fluido en un teléfono medio. Se mide en ventanas de 3 segundos, descartando los primeros 2 segundos, y el umbral es 24 fps. El umbral queda por debajo de todo techo de vsync habitual (30, 60, 90 y 120 Hz): una pantalla a 30 Hz sana no es un dispositivo que no da abasto, y tratarla como tal apagaba la escena a los 5 segundos de cargar. La degradación tiene tres niveles y baja de uno en uno, en este orden: nivel 0 todo; nivel 1 sin sombras de contacto y con techo de dpr más bajo; nivel 2 además sin barrido de cámara y dpr 1. El descenso es monótono: el nivel nunca vuelve a subir, para que la escena no parpadee entre configuraciones. No se vuelve a 2D: el bloque plano es solo la caída por ausencia de WebGL.

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

CRM, auth, usuarios, multi-tenant, panel de administración, permisos, integraciones, email transaccional, generación de PDF en servidor, modelos 3D importados, editor visual del JSON, más de dos tipos de cartel, más de una vertical.

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
