import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  resolve: {
    alias: {
      // Ensure the 'xlsx' import resolves to the ESM build that exists in node_modules
      xlsx: 'xlsx/xlsx.mjs',
    },
  },
})
