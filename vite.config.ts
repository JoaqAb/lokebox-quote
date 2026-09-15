import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Presupuesto de bundle de SPEC 3 (version 1.17): tres grupos de chunks, la app por debajo
// de 500 kB sumada, react-vendor por debajo de 250 kB y el vendor 3D por debajo de 1000 kB.
// No es silenciar la advertencia: el vendor pesa lo que pesa y no se puede partir,
// pero la app queda medible aparte y cualquier regresion vuelve a avisar.
const VENDOR_3D = ['three', '@react-three/fiber', '@react-three/drei']
// React va en su propio chunk. Sin este grupo, rolldown metia react, react-dom y scheduler
// dentro de three-vendor como dependencias de fiber y drei, y cualquier ruta que usara React
// precargaba el vendor 3D entero: / lo bajaba sin dibujar nada en 3D, y el presupuesto de
// SPEC 3 media mal desde TAREA_004. No es un atajo: es separar lo que estaba mezclado.
const VENDOR_REACT = ['react', 'react-dom', 'scheduler']

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Forma de funcion: el bundler de Vite 8 no acepta el objeto de Rollup.
        manualChunks(id: string): string | undefined {
          for (const pkg of VENDOR_3D) {
            if (id.includes(`node_modules/${pkg}/`)) {
              return 'three-vendor'
            }
          }
          for (const pkg of VENDOR_REACT) {
            if (id.includes(`node_modules/${pkg}/`)) {
              return 'react-vendor'
            }
          }
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
