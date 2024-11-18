import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import portfinder from 'portfinder';

/**
 * Find the next available port after a specified port.
 * @param {number} startPort - The starting port to check.
 * @returns {Promise<number>} - A promise that resolves with the next available port.
 */
async function getNextAvailablePort(startPort) {
  return await portfinder.getPortPromise({ port: startPort });
};

const appPort = await getNextAvailablePort(5173);
const hmrPort = await getNextAvailablePort(5273);
console.log(`App port: ${appPort}. HMR port: ${hmrPort}`);
// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_ADMINFORTH_PUBLIC_PATH || '/',
  server: {
    port: appPort,
    hmr: {
      path: '/adminforth-dev-server-ws', // Set your custom WebSocket path here
      port: hmrPort,
    },
  },
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@@': fileURLToPath(new URL('./src/custom', import.meta.url)),
    }
  }
})
