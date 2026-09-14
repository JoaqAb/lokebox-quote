# STATE

14/09/2026

## Bloque actual

Bloque 4. TAREA_017 cerrada: el totem se dibuja con panel, poste y base en los dos modos, con sombra en el piso, caja de encuadre completa y anchorGround en modo vista validado al cargar. Salen las vistas en angulo: quedan Front y Night. SPEC 1.15. 202 pruebas en verde.
Medido: totem en modo cartel a 0, 45, 90 y 180 grados en los dos polares y en los extremos de medida, margen minimo 40 px; base mas angosta que el panel y mas ancha que el poste en los ocho extremos. Poste sin emision (0,00 por ciento entre none y back). Luminancia de SPEC 12 en facade, letters y totem en los dos clientes; numeros en la tarea. Facade en modo vista identico a TAREA_016.
Bundle: app 420 kB, vendor 3D 963,55 kB, sin pedidos nuevos. 390, 768 y 1440 px sin scroll horizontal, selector de tres botones.

## Ultimo cerrado

TAREA_017: da07808 (apertura), dd67b51 (codigo). Detalle y numeros en docs/tareas/TAREA_017_totem_real_vistas_frontales.md.

## Proximo

Validacion de TAREA_014 a 017 por Joaquin en captura. Brief de TAREA_018 (EXECUTION no la tiene). Despues TAREA_013 (landing) y Canal C de video y capturas.

## Bloqueos

Produccion tiene el checkpoint de seguridad de Vercel: curl y headless no pasan, la verificacion del deploy se hace por la API de Vercel. El typeface no trae Ñ ni vocales con tilde. Letras claras sobre fondo claro con poco contraste de frente. En norte de dia el anillo de back de facade crece menos de un nivel. Canal C: borrar de `visits` las filas HeadlessChrome del 14/09.

## Comando para retomar

`cd ~/proyectos/lokebox-quote && cat docs/STATE.md docs/tareas/TAREA_017_totem_real_vistas_frontales.md`
