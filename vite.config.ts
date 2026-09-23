import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Presupuesto de bundle de SPEC 3: tres grupos de chunks. Desde la version 2.0 (D44) solo
// sigue el tope de react-vendor, 250 kB; los de la app y el vendor 3D se derogaron. El vendor
// 3D suma el pipeline de render: postprocessing, su envoltorio de R3F y n8ao, el AO que este
// trae como dependencia. El limite de aviso queda por encima de lo que pesa hoy, como alarma
// de regresion y no como tope de SPEC.
const VENDOR_3D = ['three', '@react-three/fiber', '@react-three/drei', 'postprocessing', '@react-three/postprocessing', 'n8ao']
// React va en su propio chunk. Sin este grupo, rolldown metia react, react-dom y scheduler
// dentro de three-vendor como dependencias de fiber y drei, y cualquier ruta que usara React
// precargaba el vendor 3D entero: / lo bajaba sin dibujar nada en 3D, y el presupuesto de
// SPEC 3 media mal desde TAREA_004. No es un atajo: es separar lo que estaba mezclado.
const VENDOR_REACT = ['react', 'react-dom', 'scheduler']

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1400,
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
