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

/**
 * Lazy chunks of the SPA (views, custom components of the app and plugins) get <link rel="prefetch">: the browser downloads
 * them with the lowest priority after the page load and runs nothing, so a page opened later takes its code from the cache.
 * Only what renders a lazy chunk is prefetched, not the chunks it imports lazily itself (dayjs locales, monaco languages).
 */
function prefetchLazyChunks(): Plugin {
  let base = '/';
  return {
    name: 'adminforth-prefetch-lazy-chunks',
    apply: 'build',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, { bundle }) {
        const chunks = new Map(Object.values(bundle!).filter((item) => item.type === 'chunk').map((chunk) => [chunk.fileName, chunk]));
        const withStaticImports = (fileNames: string[], skip: Set<string>) => {
          const result = new Set<string>();
          const stack = [...fileNames];
          while (stack.length) {
            const fileName = stack.pop()!;
            if (!result.has(fileName) && !skip.has(fileName)) {
              result.add(fileName);
              stack.push(...chunks.get(fileName)!.imports);
            }
          }
          return result;
        };
        const entries = [...chunks.values()].filter((chunk) => chunk.isEntry).map((chunk) => chunk.fileName);
        const initial = withStaticImports(entries, new Set());
        const lazy = withStaticImports([...initial].flatMap((fileName) => chunks.get(fileName)!.dynamicImports), initial);
        const files = new Set([...lazy].flatMap((fileName) => [fileName, ...chunks.get(fileName)!.viteMetadata!.importedCss]));
        // crossorigin like the module scripts and styles of Vite, otherwise the browser does not reuse the prefetched response
        return [...files].map((file) => ({ tag: 'link', attrs: { rel: 'prefetch', href: `${base}${file}`, crossorigin: '' }, injectTo: 'head' as const }));
      },
    },
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
  // Vite 5 dropped imports which are used only as types (`import { Ref } from 'vue'`), Vite 8 keeps them when
  // tsconfig has verbatimModuleSyntax and fails on the missing export: keep the old behavior for custom components of apps
  oxc: {
    typescript: {
      onlyRemoveTypeImports: false,
    },
  },
  plugins: [
    //ignoreTailwindErrors(),
    vue(),
    prefetchLazyChunks(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@@': fileURLToPath(new URL('./src/custom', import.meta.url)),
    }
  },
})
