# TAREA_000: crear repo, scaffold y documentación base

Fecha: 11/09/2026

## Enunciado resumido

1. Crear el proyecto en /home/joaquin/proyectos con Vite, template react-ts, nombre lokebox-quote. git init con rama principal main. Instalar tailwindcss y @tailwindcss/vite (Tailwind v4 como plugin de Vite), framer-motion, three, @react-three/fiber, @react-three/drei, @supabase/supabase-js y react-router-dom, más @types/three como dependencia de desarrollo. Dejar `npm run dev` y `npm run build` sin errores, borrar el contenido de ejemplo de Vite y que App.tsx muestre solo el título "Lokebox Quote". Crear .env.example con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY vacías y asegurar que .env está en .gitignore.
2. Crear la estructura de carpetas: src/core, src/core/pricing, src/verticals/signage, src/clients, src/pages, docs y docs/tareas.
3. Escribir la documentación base: CLAUDE.md, SPEC.md, docs/EXECUTION.md, docs/STATE.md, docs/DECISIONES.md, docs/tareas/_ULTIMO.md, este archivo y un README.md corto en inglés.
4. Commit inicial y repo público en GitHub con gh, pusheando main.

## Resultado

Hecho. El proyecto quedó creado y funcionando.

- `npm run build` pasa con tsc en verde y sin warnings de tipos.
- `npm run dev` levanta en http://localhost:5173 y sirve la app con Tailwind v4 compilando.
- App.tsx muestra solo el título "Lokebox Quote". Se borró App.css, src/assets y public/icons.svg.
- Tailwind v4 quedó configurado como plugin de Vite en vite.config.ts, y src/index.css contiene solo `@import "tailwindcss";`.
- Estructura de carpetas creada, con .gitkeep en las que quedan vacías.
- .env.example creado y .env agregado a .gitignore.
- Documentación base escrita.
- Repo público publicado en github.com/JoaqAb/lokebox-quote con el commit inicial.

## Desvíos

- React quedó fijado en la línea 19.2 (~19.2.8) en lugar de la 19.3 que traía el template de Vite. Motivo: @react-three/fiber 9.7.0 declara el peer `react >=19 <19.3`, así que con 19.3 la instalación fallaba. Se fijó la versión en vez de forzar la resolución de peers, que habría dejado el árbol inconsistente.
- three quedó fijado en la línea 0.185 (~0.185.1) en lugar de 0.186, para que coincida con @types/three 0.185.4, que es la última publicada. Así los tipos se corresponden con la API real en tiempo de ejecución.
- El template de Vite ya traía @types/three y @types/node en devDependencies, así que no hubo que agregarlos.
