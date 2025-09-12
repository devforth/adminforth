import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import portfinder from 'portfinder';
import { Plugin } from 'vite';
import tailwindcss from 'tailwindcss';


/**
 * Find the next available port after a specified port.
 * @param {number} startPort - The starting port to check.
 * @returns {Promise<number>} - A promise that resolves with the next available port.
 */
async function getNextAvailablePort(startPort: number | undefined) {
  return await portfinder.getPortPromise({ port: startPort });
};

function ignoreTailwindErrors(): Plugin {
  return {
    name: 'ignore-tailwind-errors',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const originalWrite = res.write;
        res.write = function(chunk) {
          if (typeof chunk === 'string' && chunk.includes('tailwind')) {
            return true;
          }
          return originalWrite.call(this, chunk);
        };
        next();
      });
    },
    config(config, { command }) {
      if (command === 'build') {
        // Override PostCSS config for build
        config.css = config.css || {};
        config.css.postcss = {
          plugins: [
            {
              postcssPlugin: 'ignore-tailwind-errors',
              Once(root, helpers) {
                try {
                  return tailwindcss()(root, helpers);
                } catch (error: any) {
                  console.warn('TailwindCSS warning ignored:', error.message);
                  return;
                }
              }
            }
          ]
        };
      }
    }
  };
}


const appPort = await getNextAvailablePort(5173);
const hmrPort = await getNextAvailablePort(5273);
console.log(`SPA port: ${appPort}. HMR port: ${hmrPort}`);
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
    ignoreTailwindErrors(),
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@@': fileURLToPath(new URL('./src/custom', import.meta.url)),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // reduce the size of the vendor chunk
          // to only include the package name
          // helps to reduce consumption of memory
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
  },
})
