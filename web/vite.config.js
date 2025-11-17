import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  server:{
      proxy:{
        '/api':{
          target:"http://localhost:3000",
          secure:false,
        },
      },
  },
  plugins: [react()],
  define: {
    'process.env': '{}',
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['simple-peer'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})
