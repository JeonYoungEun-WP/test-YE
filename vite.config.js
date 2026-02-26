import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/ga4report': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/ga4report/, '/ga4report'),
      },
      '/api/odoo': {
        target: 'https://works.wepick.kr',
        changeOrigin: true,
        rewrite: () => '/jsonrpc',
      },
    },
  },
})
