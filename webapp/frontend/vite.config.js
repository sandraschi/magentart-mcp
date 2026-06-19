import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['goliath'],
    port: 10898,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:10899',
        changeOrigin: true,
      },
    },
  },
})
