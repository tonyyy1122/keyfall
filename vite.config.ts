import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// npm run dev 時，付款相關的路徑轉給 npm run dev:api（wrangler dev）。
const api = { target: 'http://127.0.0.1:8787', changeOrigin: false }

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 47321,
    strictPort: true,
    proxy: { '/api': api, '/admin': api },
  },
  preview: {
    host: '0.0.0.0',
    port: 47321,
    strictPort: true,
    proxy: { '/api': api, '/admin': api },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        sponsor: resolve(import.meta.dirname, 'sponsor.html'),
        missing: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
})
