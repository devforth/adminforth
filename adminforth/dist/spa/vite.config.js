"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_url_1 = require("node:url");
const vite_1 = require("vite");
const plugin_vue_1 = __importDefault(require("@vitejs/plugin-vue"));
const customLogger = {
    info(msg) {
        // Filter out the lines containing '➜ Local:' or '➜ Network:'
        if (!msg.includes('➜')) {
            console.log(msg);
        }
    },
    warn(msg) {
        console.warn(msg);
    },
    error(msg) {
        console.error(msg);
    },
    clear() {
        console.clear();
    },
    hasWarned: false,
};
// https://vitejs.dev/config/
exports.default = (0, vite_1.defineConfig)({
    base: process.env.VITE_ADMINFORTH_PUBLIC_PATH || '/',
    server: {
        port: 5173,
        strictPort: true, // better predictability
    },
    customLogger,
    plugins: [
        (0, plugin_vue_1.default)(),
    ],
    resolve: {
        alias: {
            '@': (0, node_url_1.fileURLToPath)(new node_url_1.URL('./src', import.meta.url)),
            '@@': (0, node_url_1.fileURLToPath)(new node_url_1.URL('./src/custom', import.meta.url)),
        }
    }
});
