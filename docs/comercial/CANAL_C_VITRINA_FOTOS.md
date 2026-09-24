# Canal C del bloque 11 · fotos de la vitrina

Fecha: 24/09/2026. Prerrequisito de TAREA_031. Seis fotos: tres fachadas, cada una de día y de noche con el mismo encuadre.

## Qué tiene que tener cada foto

- Horizontal 16:9, 1920 x 1080 o mayor.
- Tomada de frente, cámara recta a la altura de los ojos, sin inclinación.
- Una banda de pared lisa y vacía sobre la puerta, donde va el cartel.
- Una puerta visible entera (sirve de escala).
- Sin texto, sin carteles, sin logos, sin marcas, sin personas.
- En alba, vereda visible delante de la fachada (ahí se apoya el totem).
- La de noche es la misma imagen que la de día: se genera la de día y después se edita esa imagen a noche. Si el encuadre cambia, se regenera.

## Cómo generarlas

Con la misma herramienta de imágenes que usaste para el paquete del 14/09. Para cada cliente: prompt de día, se elige la mejor, y sobre esa imagen el prompt de noche.

### halcyon (premium, hotel u oficina)

Día:

```
Photorealistic straight-on front view of the entrance of a small upscale boutique hotel, pale limestone facade, tall dark bronze double door in the center, a wide smooth empty band of stone wall above the door with nothing on it, no signs, no text, no logos, no people, soft overcast daylight from the left, eye-level camera, no perspective tilt, 16:9, architectural photography
```

Noche (sobre la imagen de día):

```
Same image, same framing and camera, at night: dark blue sky, warm light from inside the glass of the door, two small wall lights beside the door, the band above the door stays empty and dark, no signs, no text
```

### afterglow (bar o restaurante)

Día:

```
Photorealistic straight-on front view of a small bar in an old red brick building, black steel framed glass door in the center, a wide smooth empty band of painted dark wall above the door with nothing on it, no signs, no text, no logos, no people, late afternoon light from the right, eye-level camera, no perspective tilt, 16:9, street photography
```

Noche:

```
Same image, same framing and camera, at night: dark street, warm amber light from inside the bar through the glass, wet pavement reflections, the band above the door stays empty and dark, no signs, no text
```

### alba (cafetería o panadería de barrio, España)

Día:

```
Photorealistic straight-on front view of a small bakery cafe on a Spanish street, whitewashed facade with terracotta tiles at the base, wooden glass door in the center, a wide smooth empty band of white wall above the door with nothing on it, a wide clean sidewalk in front of the facade visible at the bottom of the image, no signs, no text, no logos, no people, sunny morning light from the left, eye-level camera, no perspective tilt, 16:9, architectural photography
```

Noche:

```
Same image, same framing and camera, at night: dark sky, warm light from inside the cafe through the glass door, a street lamp light on the sidewalk, the band above the door stays empty and dark, no signs, no text
```

## Dónde se guardan

```bash
mkdir -p ~/proyectos/lokebox-quote/incoming/vitrina
```

Guardar como PNG con estos nombres exactos:

```
halcyon-front-day.png    halcyon-front-night.png
afterglow-front-day.png  afterglow-front-night.png
alba-front-day.png       alba-front-night.png
```

Verificación:

```bash
cd ~/proyectos/lokebox-quote/incoming/vitrina && ls -1 && file *.png
```

Tienen que salir seis archivos PNG, todos horizontales. Abrí cada par día y noche lado a lado y confirmá que la puerta y la banda están en el mismo lugar.
