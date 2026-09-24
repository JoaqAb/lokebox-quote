# Canal C del bloque 9 · salida comercial

Fecha: 24/09/2026. Bloque 10 cerrado (D108). Listado del Catalog publicado (D110).
Orden: cada paso habilita el siguiente. Al terminar cada uno, marcarlo en la lista de reporte del final.

## Paso 1 · Planillas al repo y commit

Las dos planillas se descargan desde el chat del 24/09: `sign-prices-template.xlsx` (ingles, USD y ft) y `planilla-precios-carteles.xlsx` (espanol, ARS y m). Columna amarilla para el cliente, columna gris con el ejemplo de la demo, filas en el orden del JSON (D111).

```bash
cd ~/proyectos/lokebox-quote && mkdir -p docs/comercial/plantillas && mv "$(xdg-user-dir DOWNLOAD)"/sign-prices-template.xlsx "$(xdg-user-dir DOWNLOAD)"/planilla-precios-carteles.xlsx docs/comercial/plantillas/ && git add docs/ && git commit -m "docs: cierre del bloque 10 y Canal C del bloque 9" && git push
```

Verificacion: `git log -1 --stat` muestra docs/STATE.md, docs/EXECUTION.md, docs/DECISIONES.md, docs/tareas/INDICE.md, docs/comercial/ y las dos planillas. incoming/ no aparece.

## Paso 2 · Grabar los dos videos (D112)

Preparacion comun: Chrome en ventana nueva, zoom 100%, sin extensiones visibles, barra de marcadores oculta (Ctrl+Shift+B). Cada toma se ensaya dos veces antes de grabar. Grabar con la misma herramienta del video del 17/09. El formulario de la toma A guarda un lead de prueba en Supabase: se usa siempre el mismo nombre para poder filtrarlo.

### Toma A · 30 s, ingles, escritorio

URL: https://quote.lokebox.com/d/northline. Ventana en pantalla completa (F11) a 1440 x 900 o mayor. Esperar a que cargue el 3D antes de grabar.

| Tiempo | Accion | Que se ve |
|---|---|---|
| 0 a 3 s | Nada. Cartel de fachada, PVC, None | Cartel blanco en estudio claro, precio $360 |
| 3 a 6 s | Material: Aluminum | Cambia el material y el precio anima |
| 6 a 10 s | Sign type: Channel letters | Letras de aluminio con sombra, la mejor toma |
| 10 a 14 s | Lighting: Back-lit | Pasa a grafito, halo, precio sube |
| 14 a 17 s | Arrastrar el cartel un poco a la izquierda y soltar | Orbita corta |
| 17 a 21 s | Vista Front, despues Night | Letras sobre la fachada, de dia y de noche |
| 21 a 26 s | Request this quote. Nombre `Anna Demo`, email `anna@example.com`, enviar | Formulario y gracias |
| 26 a 30 s | View my quote | Hoja de cotizacion imprimible, quieta hasta el final |

El panel retroiluminado no se usa como toma de apertura (D109).

### Toma B · 15 s, espanol, mobile vertical

URL: https://quote.lokebox.com/d/norte. F12, Ctrl+Shift+M (modo dispositivo), dispositivo iPhone 12 Pro (390 x 844), recargar con F5. Grabar solo el area del telefono.

| Tiempo | Accion | Que se ve |
|---|---|---|
| 0 a 2 s | Nada. Solo el cartel, PVC, Sin luz | Cartel blanco, precio en la barra de abajo |
| 2 a 5 s | Tipo: Letras corporeas | Letras NORTE |
| 5 a 8 s | Material: Chapa | Metal cepillado |
| 8 a 11 s | Iluminacion: Retroiluminado (scrollear el panel) | Grafito y halo, el precio cambia |
| 11 a 15 s | Vista Noche | Letras de noche sobre la fachada, barra con Enviar por WhatsApp |

### Corte y compresion

Guardar los crudos como validacion/venta/crudo-en.mp4 y validacion/venta/crudo-es.mp4. Anotar el segundo donde empieza cada toma y reemplazar INICIO:

```bash
cd ~/proyectos/lokebox-quote/validacion/venta
ffmpeg -ss INICIO -i crudo-en.mp4 -t 30 -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -an -movflags +faststart video-30s-en.mp4
ffmpeg -ss INICIO -i crudo-es.mp4 -t 15 -vf "scale=1080:-2,fps=30" -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -an -movflags +faststart video-15s-es.mp4
ls -lh video-30s-en.mp4 video-15s-es.mp4
```

Verificacion: los dos se reproducen enteros, el de 15 s pesa menos de 16 MB (limite comodo para WhatsApp), ninguno muestra la barra de DevTools ni pestanas.

## Paso 3 · YouTube, no listado

1. https://studio.youtube.com, boton Crear (arriba a la derecha) > Subir videos > video-30s-en.mp4.
2. Titulo: `Interactive 3D Sign Configurator with Live Pricing`
3. Descripcion: `Quote tool for sign shops. Live demo: https://quote.lokebox.com`
4. Publico: No, no es contenido para ninos.
5. Visibilidad: No listado. Guardar.
6. Copiar el enlace del video.

Verificacion: el enlace abre el video en una ventana de incognito.

## Paso 4 · Editar el listado publicado (D38, D110)

Upwork > Find Work > Project Catalog (tambien desde el perfil, seccion Project Catalog). En el proyecto, boton de tres puntos > Edit. No tocar la categoria: si cambia, el proyecto sale de la vista mientras se revisa.

1. Gallery, video: quitar el video actual y subir validacion/venta/video-30s-en.mp4.
2. Gallery, imagenes: quitar las actuales y subir las seis de validacion/venta/subir/ en orden, 01-letras-corporeas.png primero como portada.
3. Gallery, documento: subir validacion/venta/quote-northline.pdf.
4. Description: al final, dejar una linea en blanco y pegar:

```
See how it works: https://quote.lokebox.com

This is a demo to show you the product. It is not set up for your daily work.
```

5. Guardar y enviar. Upwork vuelve a revisar pero en general deja el proyecto visible mientras tanto.

Verificacion: abrir la vista publica del proyecto en incognito y ver video nuevo, portada de letras y el texto con el enlace. Captura para el reporte.

## Paso 5 · Portfolio item

Upwork > perfil > seccion Portfolio > boton + (Add a project).

- Project title: `Interactive 3D Sign Configurator with Live Pricing & Quote Capture`
- Your role: `Product design and full-stack development`
- Project description:

```
A quote tool for sign shops. The visitor picks the sign type, the size, the material and the lighting, and sees the sign in 3D. The price updates on screen as a range. The request arrives by WhatsApp or by form, with every option filled in, and the visitor can print the quote sheet.

Each shop gets its own page with its logo, colors, prices and texts, from one config file. Built with React, TypeScript, Three.js (React Three Fiber) and Supabase.

Live demo: https://quote.lokebox.com
```

- Skills and deliverables: React, Three.js, TypeScript, Supabase, Web Application.
- Content: bloque de video con el enlace de YouTube del paso 3; bloque de imagenes con las seis de validacion/venta/subir/ en el mismo orden; bloque de enlace con https://quote.lokebox.com.
- Publish.

Verificacion: el item aparece primero en el portfolio del perfil publico. Captura para el reporte.

## Paso 6 · Tucuman, tres mensajes en frio (D113)

Primera tanda: los tres de mayor fit de docs/comercial/TUCUMAN.md. Se manda el video-15s-es.mp4 con el texto como descripcion del video, desde el WhatsApp publico de Lokebox. Sin precio en el primer mensaje. Si wa.me dice que el numero no tiene WhatsApp, es fijo: se llama en horario comercial.

| Empresa | WhatsApp | Angulo |
|---|---|---|
| Lumilet | https://wa.me/5493812094376 | Su catalogo de corporeas ya es configurable |
| Multigrafica | https://wa.me/5493816615591 | Su web dice que el precio depende de medidas |
| GB Carteleria y Diseno | https://wa.me/5493815632375 | Lo visual: ver el cartel antes de pedirlo |

Lumilet:

```
Hola, ¿qué tal? Soy Joaquín, de Lokebox, acá en Tucumán. Vi en su web el catálogo de letras corpóreas por material e iluminación, y que cada opción termina en pedir cotización. Armé una herramienta para eso: el cliente elige tipo, medida, material y luz, lo ve en 3D con un precio estimado, y a ustedes les llega el pedido completo por WhatsApp. Les dejo un video corto y la demo para probar desde el celular: https://quote.lokebox.com/d/norte
Si les interesa, se la armo con su marca y sus precios. ¿Con quién lo puedo charlar?
```

Multigrafica:

```
Hola, ¿qué tal? Soy Joaquín, de Lokebox, acá en Tucumán. En su web dicen que el precio depende de las medidas y las características de cada cartel, así que imagino que muchas consultas llegan sin esos datos. Hice una herramienta para eso: el cliente arma su cartel (tipo, medida, material, iluminación), lo ve en 3D, ve un rango de precio y les manda el pedido completo por WhatsApp. Les dejo un video corto y la demo para probar desde el celular: https://quote.lokebox.com/d/norte
¿Les sirve que se la muestre con su marca?
```

GB Carteleria y Diseno:

```
Hola, ¿cómo va? Soy Joaquín, de Lokebox, acá en Tucumán. Vi sus trabajos de fachadas y corpóreas iluminadas. Armé una herramienta para que el cliente vea su cartel antes de pedirlo: elige tipo, medida, material y luz, lo ve en 3D de día y de noche, y a ustedes les llega el pedido completo por WhatsApp. Les dejo un video corto y la demo para probar desde el celular: https://quote.lokebox.com/d/norte
Si les interesa, se la armo con su marca. ¿Con quién hablo?
```

Seguimiento, a los 3 dias habiles sin respuesta, uno solo:

```
Hola, les escribo de nuevo por la herramienta de presupuestos que les pasé. ¿Pudieron verla? Si quieren, paso por el local y se la muestro en 10 minutos.
```

Si responden con interes: precio desde USD 250 de setup mas USD 29 por mes (docs/comercial/PRICING.md), y la planilla docs/comercial/plantillas/planilla-precios-carteles.xlsx recien despues del si comercial.

Registro en el CRM (https://docs.google.com/spreadsheets/d/1z7BtPI8cN8sE7pkxGYGbZrUNgeppIzyI87DO45Nhjvo/edit), una fila por empresa: estado `contactado`, canal `WhatsApp`, fecha de envio, proxima accion `seguimiento` con la fecha de 3 dias habiles despues.

## Reporte al chat orquestador

- Paso 1: hash del commit.
- Paso 2: duracion y peso de los dos videos.
- Paso 3: enlace de YouTube.
- Paso 4: captura del listado publico.
- Paso 5: captura del portfolio.
- Paso 6: fecha de envio de los tres mensajes y cualquier respuesta, textual.
