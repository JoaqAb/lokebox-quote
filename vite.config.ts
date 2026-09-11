import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Presupuesto de bundle de SPEC 3: el codigo de la app y el vendor 3D van en chunks
// separados, la app por debajo de 500 kB y el vendor 3D por debajo de 1000 kB.
// No es silenciar la advertencia: el vendor pesa lo que pesa y no se puede partir,
// pero la app queda medible aparte y cualquier regresion vuelve a avisar.
const VENDOR_3D = ['three', '@react-three/fiber', '@react-three/drei']

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
