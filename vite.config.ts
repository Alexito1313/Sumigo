import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En producción GitHub Pages sirve en https://alexito1313.github.io/JapoWeb/ → base con la subruta.
// En desarrollo servimos en '/' para que el dev server y el preview sean cómodos.
// (Cuando se empaquete con Capacitor para tiendas, cambiar base a './'.)
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/JapoWeb/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
}))
