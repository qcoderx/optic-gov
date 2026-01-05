import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      process: 'process/browser',
      util: 'util',
    },
  },
  define: {
    global: 'globalThis',
  },
})