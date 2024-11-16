import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_ADMINFORTH_PUBLIC_PATH || '/',
  server: {
    port: 5173,
    hmr: {
      path: '/adminforth-dev-server-ws', // Set your custom WebSocket path here
      port: 5273,
    },
  },
  plugins: [
    vue(),
    // {
    //   name: 'hmr-dynamic-port-plugin',
    //   configureServer(server) {
    //     server.httpServer?.once('listening', () => {
    //       const actualPort = server.config.server.port;
    //       if (server.ws) {
    //         if (!server.ws.options) {
    //           server.ws.options = {};
    //         }
    //         server.ws.options.port = actualPort; // Update the WebSocket port
    //       }
    //       console.log(`Server is running on port ${actualPort}`);
    //     });
    //   },
    // },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@@': fileURLToPath(new URL('./src/custom', import.meta.url)),
    }
  }
})
