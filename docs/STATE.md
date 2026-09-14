# STATE

14/09/2026

## Bloque actual

Bloque 4. TAREA_012 cerrada: letras corporeas como tercer tipo en los dos clientes (motor, panel por modo, hoja con lh y d, WhatsApp de letters, una caja por letra en el preview). 170 pruebas en verde. El criterio abierto de TAREA_011 quedo cerrado: HDRI a 256x128, `studio-small-08-256.hdr`, 100.576 bytes, dentro de SPEC 3.
Verificado en captura: la hoja recalcula el total del cotizador ($1,440 en northline, $ 538.500 en norte), una clave del otro modo da error, 0 POST en la hoja, 390 px sin scroll horizontal, sin pedidos de red nuevos.

## Ultimo cerrado

TAREA_012, commit 08ca713 (codigo). Antes: c35bbb0 (SPEC 1.10) y a8bc9d9 (HDRI). Sin push ni deploy nuevo.

## Proximo

TAREA_013 (landing en `/`), despues Canal C de video y capturas.

## Bloqueos

SPEC 10 a editar: `options.depths[]` lleva `visual.depthMeters` (la medida que dibuja el preview; SPEC solo tenia el factor de precio). Limite conocido: el canvas ve 6 m de ancho, asi que un cartel de area de 20 ft o 18 letras de 3 ft se recortan en los bordes del canvas. Canal C: borrar de `visits` las filas con user_agent HeadlessChrome del 14/09.

## Comando para retomar

`cd ~/proyectos/lokebox-quote && cat docs/STATE.md docs/EXECUTION.md`
