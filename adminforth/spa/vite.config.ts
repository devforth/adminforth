import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


const customLogger = {
  info(msg: string) {
    // Filter out the lines containing '➜ Local:' or '➜ Network:'
    if (!msg.includes('➜')) {
      console.log(msg);
    }
  },
  warnOnce(msg: string) {
    console.warn('warn once', msg);
    if (!this.hasWarned) {
      this.hasWarned = true;
    }
  },
  warn(msg: string) {
    console.warn(msg);
  },
  error(msg: string) {
    console.error(msg);
  },
  clear() {
    console.clear();
  },
  hasWarned: false,
};

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_ADMINFORTH_PUBLIC_PATH || '/',
  server: {
    port: 5173,
    strictPort: true, // better predictability
  },
  customLogger,
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
