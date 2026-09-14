# STATE

14/09/2026

## Bloque actual

Bloque 4. TAREA_014 con codigo y verificacion hechos, pendiente de la validacion de Joaquin del criterio 2 de DONE en captura. Viewer en dos modos (cartel por defecto con orbita, vista con foto), camara en perspectiva desde el anchor, halo de back en nueve celdas. SPEC 1.12. 181 pruebas en verde.
Medido en captura (noche de frente): cara none < front (northline 227,6 < 235,9; norte 222,4 < 230,3), anillo front < back (138,0 < 154,9; 185,8 < 195,2). Halo en cero a 8 px en northline (margen 8,5) y a 7 px en norte (margen 6,5), con caida suave. Modo cartel girado: back aclara los cantos hasta 18 niveles y oscurece la cara hasta 21 frente a front. Mismo canvas y seleccion al cambiar de vista; 390, 768 y 1440 px sin scroll horizontal. Bundle: app 416 kB, vendor 3D 962 kB.

## Ultimo cerrado

TAREA_012 (08ca713). TAREA_014: 5ffd50c (apertura), 69e872f (codigo). Sin push ni deploy nuevo.

## Proximo

Validacion de TAREA_014 por Joaquin. Despues TAREA_013 (landing, valores decididos en su archivo) y Canal C de video y capturas.

## Bloqueos

Las ocho fotos no tienen cartel impreso: el criterio "tapa el cartel impreso" se aplico como cartel sobre la franja y bordes que fugan con la fachada; ninguna foto salio del JSON. En modo cartel, girado a unos 60 grados, la punta cercana de un cartel ancho se sale del cuadro con el margen de 15 por ciento por lado. Canal C: borrar de `visits` las filas HeadlessChrome del 14/09.

## Comando para retomar

`cd ~/proyectos/lokebox-quote && cat docs/STATE.md docs/tareas/TAREA_014_viewer_dos_modos.md`
