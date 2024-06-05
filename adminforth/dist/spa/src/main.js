"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vue_1 = require("vue");
const pinia_1 = require("pinia");
/* IMPORTANT:ADMINFORTH IMPORTS */
const App_vue_1 = __importDefault(require("./App.vue"));
const router_1 = __importDefault(require("./router"));
const app = (0, vue_1.createApp)(App_vue_1.default);
/* IMPORTANT:ADMINFORTH COMPONENT REGISTRATIONS */
app.use((0, pinia_1.createPinia)());
app.use(router_1.default);
/* IMPORTANT:ADMINFORTH CUSTOM USES */
app.mount('#app');
