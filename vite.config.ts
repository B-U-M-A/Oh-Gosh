import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default ({ mode }: { mode: string }) => {
  return defineConfig({
    envDir: '../',
    server: {
      proxy: {
        '/.proxy/assets': {
          target: 'http://localhost:5173/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/\.proxy\/assets/, ''),
        },
        '/.proxy/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/\.proxy/, ''),
        },
      },
      hmr: {
        clientPort: 5173,
      },
      allowedHosts: true,
    },
    plugins: [react()],
  });
};
