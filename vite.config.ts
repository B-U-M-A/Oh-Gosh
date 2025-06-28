import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default () => {
  return defineConfig({
    envDir: '../',
    server: {
      proxy: {
        '/.proxy/assets': {
          target: 'http://localhost:5173/assets',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/.proxy\/assets/, ''),
        },
      },
      allowedHosts: true,
    },
    plugins: [react()],
  })
}
