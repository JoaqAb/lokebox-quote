# TAREA_001 · tipos, JSON de clientes y motor de precios con tests

Bloque 1 (lunes 14). Depende de TAREA_000. Leer antes: CLAUDE.md y SPEC.md (secciones 5, 6, 10 y 11).

## Objetivo

Dejar la base de datos de configuración y el cálculo de precio terminados y probados, sin nada de React, sin 3D y sin Supabase. Al cerrar esta tarea, el precio de cualquier selección se puede calcular y verificar desde un test.

## 0. Commit previo

Antes de empezar, commitear los documentos que escribió Canal B y que ya están en el árbol de trabajo:

- SPEC.md (completo, versión 1.0)
- docs/EXECUTION.md
- docs/DECISIONES.md (nuevas líneas)
- docs/STATE.md
- CLAUDE.md (sección Alcance completada)
- docs/tareas/TAREA_001_tipos_json_motor_precios.md
- docs/tareas/_ULTIMO.md

Commit: `docs: SPEC 1.0, EXECUTION y TAREA_001`

## 1. Herramientas

Instalar vitest como dependencia de desarrollo, en la última versión compatible con Vite 8 y TypeScript 6. Si hay conflicto de peers, fijar versión concreta y explicarlo en el reporte. Prohibido `--legacy-peer-deps` y prohibido `--force`.

Agregar a package.json:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Configurar vitest dentro de vite.config.ts (entorno `node`, include `src/**/*.test.ts`). Si tsconfig.app.json no tiene `resolveJsonModule`, activarlo.

## 2. Archivos a crear

```
src/core/types.ts
src/core/clientConfig.ts
src/core/pricing/calculatePrice.ts
src/core/pricing/calculatePrice.test.ts
src/core/pricing/format.ts
src/core/pricing/format.test.ts
src/clients/index.ts
src/clients/northline.json
src/clients/norte.json
public/clients/northline/logo.svg
public/clients/norte/logo.svg
```

No tocar src/App.tsx, src/main.tsx ni src/index.css en esta tarea.

## 3. src/core/types.ts

Tipos del dominio, sin lógica. Incluye como mínimo:

- `CurrencyConfig`, `UnitsConfig`, `BrandConfig`, `ColorsConfig`.
- `SignTypeOption` (`id`, `label`, `priceFixed`), `MaterialOption` (`id`, `label`, `pricePerArea`, `visual: { color, metalness, roughness }`), `LightingOption` (`id`, `label`, `pricePerArea`, `visual: { mode: "none" | "front" | "back" }`).
- `RangeConfig` (`min`, `max`, `step`, `default`), `QuantityConfig` (`min`, `max`, `default`).
- `SignOptions` (types, width, height, materials, lighting, installation, quantity, discounts, rangePct).
- `ClientTexts`: las 34 claves de SPEC 10, todas requeridas, todas string.
- `ClientConfig`: slug, locale, vertical, currency, units, brand, cta (`"whatsapp" | "form" | "both"`), poweredBy, prices_placeholder, options, texts.
- `SignSelection`, `PriceRules`, `PriceLine`, `PriceResult` exactamente como en SPEC 6.

## 4. src/core/pricing/calculatePrice.ts

Función pura `calculatePrice(rules: PriceRules, selection: SignSelection): PriceResult`. Reglas de SPEC 6, con estas precisiones:

- Orden: área, material, iluminación, recargo de tipo, instalación, subtotal, descuento, total, rango.
- Cálculo en precisión completa. Redondeo solo al final, con un helper `roundTo(value, decimals)` local (`Math.round(value * 10 ** d) / 10 ** d`).
- `lines` en este orden: material, lighting, type (solo si `priceFixed` es mayor a 0), installation (solo si `installation` es true), discount (solo si `discountPct` es mayor a 0, con `amount` negativo).
- `labelKey` de cada línea: `lineMaterial`, `lineLighting`, `lineType`, `lineInstallation`, `lineDiscount`. Nunca texto literal visible.
- `detail`: string corto y determinista, sin formateo de moneda ni de locale. Ejemplos: `"24 x 15"` para material, `"350 + 24 x 10"` para instalación, `"10%"` para descuento. Definir el formato una sola vez y respetarlo en los tests.
- `amount` de las líneas es por unidad, no por cantidad. `subtotal` es `unitTotal` por `quantity`.
- Errores: si `materialId`, `lightingId` o `type` no existen en `rules`, lanzar `Error` con el id inválido en el mensaje. Si `width`, `height` o `quantity` son menores o iguales a 0, lanzar `Error`. Nunca devolver un precio silencioso.
- Prohibido dentro del archivo: React, three, Supabase, `Intl`, `Date`, `Math.random`, acceso a `window`.

## 5. src/core/pricing/format.ts

`formatCurrency(value: number, currency: CurrencyConfig, locale: string): string` con `Intl.NumberFormat`. Es el único lugar donde se formatea plata. Test: el mismo número formateado en `en` con USD y en `es-AR` con ARS da dos strings distintos y sin decimales.

## 6. src/core/clientConfig.ts

- `validateClientConfig(raw: unknown): ClientConfig`. Validación manual, sin agregar librerías. Verifica: presencia y tipo de cada campo, las 34 claves de `texts`, que `options.types`, `materials` y `lighting` no estén vacíos, que los ids sean únicos, que `width.default` y `height.default` caigan dentro de su rango y sean múltiplos del step, y que `discounts` esté ordenado por `minQty` ascendente. Mensajes de error que digan qué falta y en qué cliente.
- `priceRulesFromClient(config: ClientConfig): PriceRules`. Es el puente entre el JSON y el motor.
- `defaultSelection(config: ClientConfig): SignSelection`.

`src/clients/index.ts`: registro con imports estáticos de los dos JSON, `getClient(slug: string): ClientConfig | null` que valida antes de devolver, y `listClientSlugs()`.

Tests de validación: un objeto al que le falta una clave de `texts` hace fallar `validateClientConfig`, y los dos clientes reales pasan.

## 7. src/clients/northline.json

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
    "email": "hello@northlinesigns.example"
  },
  "cta": "both",
  "poweredBy": true,
  "prices_placeholder": false,
  "options": {
    "types": [
      { "id": "facade", "label": "Facade sign", "priceFixed": 0 },
      { "id": "totem", "label": "Totem sign", "priceFixed": 400 }
    ],
    "width": { "min": 2, "max": 20, "step": 0.5, "default": 8 },
    "height": { "min": 1, "max": 8, "step": 0.5, "default": 3 },
    "materials": [
      { "id": "pvc", "label": "PVC", "pricePerArea": 15, "visual": { "color": "#E8E8E4", "metalness": 0, "roughness": 0.8 } },
      { "id": "aluminum", "label": "Aluminum", "pricePerArea": 25, "visual": { "color": "#B8BDC4", "metalness": 0.9, "roughness": 0.35 } },
      { "id": "acrylic", "label": "Acrylic", "pricePerArea": 35, "visual": { "color": "#F2F5F7", "metalness": 0.1, "roughness": 0.15 } }
    ],
    "lighting": [
      { "id": "none", "label": "None", "pricePerArea": 0, "visual": { "mode": "none" } },
      { "id": "front", "label": "Front-lit", "pricePerArea": 60, "visual": { "mode": "front" } },
      { "id": "back", "label": "Back-lit", "pricePerArea": 80, "visual": { "mode": "back" } }
    ],
    "installation": { "fixed": 350, "perArea": 10 },
    "quantity": { "min": 1, "max": 10, "default": 1 },
    "discounts": [{ "minQty": 2, "pct": 5 }, { "minQty": 5, "pct": 10 }],
    "rangePct": 8
  },
  "texts": {
    "headline": "Your sign price in 60 seconds",
    "subheadline": "Choose the size, the material and the lighting. See it in 3D and get an instant estimate.",
    "configureTitle": "Build your sign",
    "typeLabel": "Sign type",
    "widthLabel": "Width",
    "heightLabel": "Height",
    "materialLabel": "Material",
    "lightingLabel": "Lighting",
    "installationLabel": "Installation",
    "installationYes": "Yes, install it for me",
    "installationNo": "No, I install it",
    "quantityLabel": "Quantity",
    "priceLabel": "Estimated price",
    "priceRangeNote": "Estimated range",
    "disclaimer": "This is an estimate. The final price is confirmed by Northline Signs.",
    "ctaWhatsapp": "Send on WhatsApp",
    "ctaForm": "Request this quote",
    "formTitle": "Where do we send the quote?",
    "formName": "Your name",
    "formContact": "Email or phone",
    "formNote": "Anything we should know?",
    "formSubmit": "Send request",
    "formSending": "Sending",
    "thanksTitle": "Thanks, we got your request",
    "thanksBody": "We will answer within one business day.",
    "viewQuote": "View my quote",
    "quoteTitle": "Sign quote",
    "quoteValidity": "This quote is valid for 15 days.",
    "lineMaterial": "Material",
    "lineLighting": "Lighting",
    "lineType": "Sign structure",
    "lineInstallation": "Installation",
    "lineDiscount": "Quantity discount",
    "poweredBy": "Powered by Lokebox",
    "whatsappMessage": "Hi, I want a quote for a {type}, {width} x {height} {unit}, {material}, lighting: {lighting}, installation: {installation}, quantity {quantity}. Estimated range {min} to {max}."
  }
}
```

## 8. src/clients/norte.json

Misma forma. Cambian idioma, unidades, moneda, marca, precios y textos. `prices_placeholder` en `true`.

```json
{
  "slug": "norte",
  "locale": "es-AR",
  "vertical": "signs",
  "currency": { "code": "ARS", "symbol": "$", "decimals": 0 },
  "units": { "length": "m", "area": "m2" },
  "brand": {
    "name": "Norte Carteles",
    "logo": "/clients/norte/logo.svg",
    "colors": { "bg": "#08090C", "primary": "#12161C", "accent": "#4DA3FF", "text": "#F2F4F7", "muted": "#868D99" },
    "phone": "+54 381 555 0123",
    "whatsapp": "5493815550123",
    "email": "hola@nortecarteles.example"
  },
  "cta": "both",
  "poweredBy": true,
  "prices_placeholder": true,
  "options": {
    "types": [
      { "id": "facade", "label": "Cartel de fachada", "priceFixed": 0 },
      { "id": "totem", "label": "Tótem", "priceFixed": 270000 }
    ],
    "width": { "min": 0.6, "max": 6, "step": 0.1, "default": 2.5 },
    "height": { "min": 0.3, "max": 2.5, "step": 0.1, "default": 1 },
    "materials": [
      { "id": "pvc", "label": "PVC espumado", "pricePerArea": 109000, "visual": { "color": "#E8E8E4", "metalness": 0, "roughness": 0.8 } },
      { "id": "aluminum", "label": "Chapa", "pricePerArea": 182000, "visual": { "color": "#B8BDC4", "metalness": 0.9, "roughness": 0.35 } },
      { "id": "acrylic", "label": "Acrílico", "pricePerArea": 254000, "visual": { "color": "#F2F5F7", "metalness": 0.1, "roughness": 0.15 } }
    ],
    "lighting": [
      { "id": "none", "label": "Sin luz", "pricePerArea": 0, "visual": { "mode": "none" } },
      { "id": "front", "label": "Frontal", "pricePerArea": 436000, "visual": { "mode": "front" } },
      { "id": "back", "label": "Retroiluminado", "pricePerArea": 581000, "visual": { "mode": "back" } }
    ],
    "installation": { "fixed": 236000, "perArea": 73000 },
    "quantity": { "min": 1, "max": 10, "default": 1 },
    "discounts": [{ "minQty": 2, "pct": 5 }, { "minQty": 5, "pct": 10 }],
    "rangePct": 8
  },
  "texts": {
    "headline": "El precio de tu cartel en 60 segundos",
    "subheadline": "Elegí la medida, el material y la iluminación. Miralo en 3D y llevate una estimación al instante.",
    "configureTitle": "Armá tu cartel",
    "typeLabel": "Tipo de cartel",
    "widthLabel": "Ancho",
    "heightLabel": "Alto",
    "materialLabel": "Material",
    "lightingLabel": "Iluminación",
    "installationLabel": "Instalación",
    "installationYes": "Sí, quiero que lo instalen",
    "installationNo": "No, lo instalo yo",
    "quantityLabel": "Cantidad",
    "priceLabel": "Precio estimado",
    "priceRangeNote": "Rango estimado",
    "disclaimer": "Es una estimación. El presupuesto final lo confirma Norte Carteles.",
    "ctaWhatsapp": "Enviar por WhatsApp",
    "ctaForm": "Pedir este presupuesto",
    "formTitle": "¿A dónde te mandamos el presupuesto?",
    "formName": "Tu nombre",
    "formContact": "Email o teléfono",
    "formNote": "¿Algo que tengamos que saber?",
    "formSubmit": "Enviar pedido",
    "formSending": "Enviando",
    "thanksTitle": "Gracias, recibimos tu pedido",
    "thanksBody": "Te respondemos dentro de un día hábil.",
    "viewQuote": "Ver mi presupuesto",
    "quoteTitle": "Presupuesto de cartel",
    "quoteValidity": "Este presupuesto tiene 15 días de validez.",
    "lineMaterial": "Material",
    "lineLighting": "Iluminación",
    "lineType": "Estructura",
    "lineInstallation": "Instalación",
    "lineDiscount": "Descuento por cantidad",
    "poweredBy": "Powered by Lokebox",
    "whatsappMessage": "Hola, quiero un presupuesto de un {type}, {width} x {height} {unit}, {material}, iluminación: {lighting}, instalación: {installation}, cantidad {quantity}. Rango estimado {min} a {max}."
  }
}
```

## 9. Logos placeholder

Dos SVG simples, solo texto con la tipografía del sistema y el color de acento del cliente, alto 40 px, ancho automático. Sin imágenes embebidas, sin fuentes externas, sin logos de terceros.

## 10. Tests obligatorios del motor

Con las reglas de northline salvo donde diga norte. Los números son exactos y no se negocian: si el código da otra cosa, se arregla el código, no el test.

| # | Selección | total | min | max |
|---|---|---|---|---|
| 1 | facade, 8 x 3, pvc, front, instalación sí, qty 1 | 2390 | 2199 | 2581 |
| 2 | igual al 1 con qty 2 | 4541 | 4178 | 4904 |
| 3 | igual al 1 con qty 5 | 10755 | 9895 | 11615 |
| 4 | totem, 3 x 6, acrylic, back, instalación sí, qty 2 | 5700 | 5244 | 6156 |
| 5 | facade, 8 x 3, aluminum, none, instalación no, qty 1 | 600 | 552 | 648 |
| 6 | norte: facade, 2.5 x 1, pvc, front, instalación sí, qty 1 | 1781000 | 1638520 | 1923480 |
| 7 | norte: totem, 2 x 1.2, acrylic, back, instalación sí, qty 5 | 12083400 | 11116728 | 13050072 |

Además:

- Tramos de descuento: qty 1 da 0%, qty 2 y qty 4 dan 5%, qty 5 y qty 10 dan 10%. Nunca se acumulan dos tramos.
- Caso 5: `lines` tiene exactamente dos entradas (material y lighting con amount 0) y no incluye type ni installation ni discount. Definir en el test si la línea de lighting con amount 0 se incluye o no, y que el código sea consistente con esa decisión.
- Caso 1: la suma de los `amount` de las líneas positivas es igual a `unitTotal`.
- Errores: `materialId` inexistente lanza, `lightingId` inexistente lanza, `type` inexistente lanza, `quantity` 0 lanza, `width` 0 lanza. Cinco tests, cada uno verificando que el mensaje contiene el valor inválido.
- Pureza: llamar dos veces con el mismo input da resultados profundamente iguales, y la función no muta el objeto `selection` ni `rules`.

## 11. Criterios de aceptación

1. `npm run build` en verde, sin errores ni warnings.
2. `npx tsc -b --force` con 0 errores.
3. `npm run lint` sin hallazgos.
4. `npm test` en verde, con todos los casos de la sección 10.
5. `grep -rniE "react|three|supabase|Intl|window" src/core/pricing/calculatePrice.ts` no devuelve nada.
6. `getClient("northline")` y `getClient("norte")` devuelven config válida. Un JSON al que se le quita una clave de `texts` hace fallar la validación con mensaje claro.
7. Sin guiones largos en ningún archivo (verificar con grep).
8. Sin `any` en los archivos nuevos, salvo el `unknown` de entrada de la validación.
9. docs/STATE.md y docs/tareas/_ULTIMO.md actualizados. Commit de la tarea con mensaje claro, aparte del commit de docs del punto 0.

## 12. Qué no hacer

- Nada de React, componentes, hooks, rutas ni 3D.
- Nada de Supabase ni variables de entorno.
- No agregar librerías además de vitest (sin zod, sin lodash, sin dinero.js).
- No inventar opciones, materiales, tipos de cartel ni claves de texto que no estén en SPEC.
- No cambiar los precios de los JSON.
- Si algo de esta tarea contradice a SPEC.md, frenar y reportar. No resolverlo por cuenta propia.
