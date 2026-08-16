import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // nunca publica os .jsx originais via DevTools -> Sources
    sourcemap: false,
  },
})
