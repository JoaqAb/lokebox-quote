# TAREA_009 · Escena clara y legibilidad del cartel

Bloque 4. Resuelve los seis defectos del preview que hicieron rechazar el criterio 2 de DONE. Los criterios estan escritos en `docs/EXECUTION.md`, bloque 4: aca se implementan, no se redefinen. SPEC 1.7 ya tiene el alcance; al cerrar se reescribe SPEC 12 con los valores finales de camara y orbita.

## 1. Los seis defectos y su causa

| # | Defecto | Causa |
|---|---|---|
| 1 | El cartel es un rectangulo liso, no se lee como cartel | La cara no tiene texto. No habia forma de poner glifos sin descargar una fuente. |
| 2 | La fachada es un plano negro sin material | `--q-bg` y `--q-primary` de los dos JSON son casi negros, y `scenePalette` deriva la fachada del primary tal cual. |
| 3 | Puerta y vidriera no se leen como escala | Estan, pero con el mismo negro que la pared y sin marco: no hay contraste que las separe. |
| 4 | El cartel flota | La unica sombra es `ContactShadows` en el piso, que no toca el cartel de fachada. |
| 5 | El cartel no es lo de mayor contraste | La vidriera emite y compite con el cartel. |
| 6 | Se ve el canto de la pared y el vacio | La fachada mide 9 m de ancho y la camara ve 13,9 m a 12 m de distancia. No hay fondo detras. |

## 2. Tema claro

`src/core/theme.ts` suma dos variables derivadas con `color-mix`, sin tocar las cinco del JSON:

- `--q-surface`: la superficie de un control en reposo, mezcla de `--q-text` sobre `--q-bg` en proporcion baja.
- `--q-border`: el borde de un control, la misma mezcla en proporcion mas alta.

Derivarlas con `color-mix` y no con hexadecimales fijos es lo que hace que el mismo token funcione en un tema claro y en uno oscuro: `bg-white/5` sobre un fondo claro es invisible, y ese es exactamente el defecto de hoy.

`src/index.css` reescribe `.q-control`, `.q-on` y `.q-off` sobre esos tokens. Los tres conservan nombre y firma publica: quien los usa no cambia. Cero variantes `dark:` en todo el arbol, que serian una segunda fuente de verdad del look (SPEC 4.1).

Los cinco colores de los dos JSON pasan a una paleta clara. Es la unica forma de tener escena clara: el tema sale siempre del JSON del cliente y no hay tema global del core.

## 3. Campo de texto del cartel

Un `kind` nuevo, `text`, que completa los cinco de SPEC 4.1.

- `src/core/ui/panelTypes.ts`: `{ kind: 'text'; maxLength: number }`.
- `src/core/ui/controls/TextInput.tsx`: componente nuevo, mismo patron que los otros cuatro.
- `src/core/ui/OptionsPanel.tsx`: una rama mas en el dispatch.
- `src/core/types.ts`: `SignSelection.text`, `SignOptions.signText` con `default` y `maxLength`, y `ClientTexts.signTextLabel`.
- `src/core/clientConfig.ts`: validacion de `signText` y de la clave de texto, y `defaultSelection` con el texto.
- `src/verticals/signs/fields.ts`: el campo en `signFields`, y el ida y vuelta en `valuesFromSelection` y `selectionFromValues`.
- `src/core/quote/quoteParams.ts`: la clave `x`, URL-encoded, en el orden `t, x, w, h, m, l, i, q` de SPEC 8. Una clave del otro modo (`lh` o `d`) presente es invalido, aunque el modo letters todavia no exista: es la regla de SPEC 8 y se puede cumplir hoy.
- Los dos JSON: `options.signText` y `texts.signTextLabel`.

El texto se valida de 1 a 18 caracteres. Vacio es invalido, tanto en el panel como en la URL.

## 4. Fachada extendida y legible

`src/verticals/signs/scene/sceneGeometry.ts` y `Storefront.tsx`:

- La fachada se ensancha mas alla de lo que ve la camara en todo el clamp de azimut, y gana un plano de fondo detras, asi no aparece ni el canto de la pared ni el vacio (defecto 6).
- Puerta y vidriera ganan marco, y la vidriera una division, para que se lean como referencia de escala (defecto 3). Son cajas simples, autorizadas por SPEC 12.
- La vidriera baja su emision para dejar de competir con el cartel (defecto 5).

## 5. Glifos en la cara del cartel

Modulo nuevo `src/verticals/signs/scene/glyphTexture.ts`:

- Una `CanvasTexture` por caracter, memoizada en un mapa por caracter, 128 px, `SRGBColorSpace`, `dispose` al desmontar.
- Fuente: `Arial, Helvetica, sans-serif`, el stack del sistema. Sin webfonts y sin ningun archivo que se descargue.
- El texto se compone en la cara del cartel con un plano por caracter, centrado y escalado al ancho disponible.

Una textura por caracter y no una por palabra: el visitante escribe letra a letra, y una textura por palabra se regeneraria en cada tecla.

## 6. Sombra de apoyo

Modulo nuevo `src/verticals/signs/scene/supportShadow.ts` mas su uso en la escena:

- Un quad con degradado radial generado en canvas, detras del cartel y apenas desplazado.
- No es una segunda pasada de sombras y no se apaga con la degradacion, asi que el cartel no flota en ningun nivel (defecto 4).
- `ContactShadows` se mantiene aparte, para el totem en el piso.

## 7. Escalar dusk

Un solo escalar con damp, 0 en `none` y 1 en `front` y `back`. Mueve intensidad de ambiente, intensidad y color de la direccional, color de fondo y color de la vereda. Sin geometria nueva y sin luces nuevas.

Motivo, de SPEC 12: en dia pleno la luz del cartel no se lee, y una escena nocturna fija no deja entender que el objeto es un cartel.

## 8. Camara y orbita

La composicion inicial queda explicitamente desbloqueada por SPEC 12. Criterio: la fachada entra completa con margen a los dos lados, puerta y vidriera dentro de cuadro, el cartel encuadrado como objeto principal, y nunca el canto de la pared ni el borde de la vereda en ningun punto del clamp.

Los tres limites de orbita se vuelven a medir en captura contra la fachada nueva y SPEC 12 se reescribe con los valores que salgan, sean los de TAREA_008 o mas amplios.

## 9. Reglas

- Cero assets descargados. Unica textura permitida: `CanvasTexture` en runtime.
- Cero hexadecimales nuevos en componentes de escena: todo color sale de `scenePalette` o del `visual` del material.
- Cero variantes `dark:` en ningun archivo.
- `.q-control`, `.q-on` y `.q-off` se reescriben, no se renombran ni se eliminan.
- La interfaz de `SignPreview` sigue siendo `selection`, `visual` y `theme`.
- Sin librerias nuevas.
- Nada de parches. Si algo pide un workaround, se frena y se reporta.

## 10. Fuera de alcance

Lo de TAREA_010: el tipo `letters`, `pricing` en el JSON, las reglas del motor por modo, `buildPanelFields`, las claves `lh` y `d` de la URL, y las tres claves de texto `letterHeightLabel`, `depthLabel` y `whatsappMessageLetters`. SPEC 10 lista 44 claves porque describe el estado posterior a TAREA_010; esta tarea deja 41.

## 11. Criterios

Los de `docs/EXECUTION.md`, bloque 4, TAREA_009, mas G1 a G6. Se reportan uno por uno.
