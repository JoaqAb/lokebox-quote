# STATE

23/09/2026

## Bloque actual

Bloque 10, Quote premium, con SPEC 2.3 (D55 a D62). TAREA_024 entregada con codigo en a0ee0d1: entorno de estudio generado con lightformers, sin HDRI; materiales PBR con mapas en runtime; acrilico opal; bloom selectivo por emisores. 259 tests en verde. Primer frame en slow 4G 3,9 s, 567 kB.

## Ultimo cerrado

TAREA_023, pipeline de render y pantalla de carga (D49). Codigo en 10d469e.

## Proximo

Canal B acepta o no TAREA_024 por el criterio 6b y decide halo contra bloom (D59). Para TAREA_025: revisar la sombra de apoyo con CanvasTexture.
Bloque 9, Canal C, sigue pendiente: portfolio de Upwork, planilla de precios, lista de Tucuman y el enlace a la demo cuando el listado salga de Under Review.

## Bloqueos

TAREA_024, criterio 6b: el derrame del bloom sale de la banda del halo y el halo tiene borde duro desde antes. Detalle en la tarea.
Pendientes D18 (contraste del texto sobre `.q-on` con la identidad nueva) y D30 (etapa 2 de SPEC 6.2, `gated`, `internal` y `?view=owner`).

## Comando para retomar

`cd ~/proyectos/lokebox-quote && cat docs/STATE.md SPEC.md`
