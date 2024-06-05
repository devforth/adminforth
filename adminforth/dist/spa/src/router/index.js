"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vue_router_1 = require("vue-router");
const HomeView_vue_1 = __importDefault(require("../views/HomeView.vue"));
const ResourceParent_vue_1 = __importDefault(require("@/views/ResourceParent.vue"));
const ListView_vue_1 = __importDefault(require("@/views/ListView.vue"));
const ShowView_vue_1 = __importDefault(require("@/views/ShowView.vue"));
const EditView_vue_1 = __importDefault(require("@/views/EditView.vue"));
const CreateView_vue_1 = __importDefault(require("@/views/CreateView.vue"));
const router = (0, vue_router_1.createRouter)({
    history: (0, vue_router_1.createWebHistory)(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView_vue_1.default
        },
        {
            path: '/login',
            name: 'login',
            component: () => Promise.resolve().then(() => __importStar(require('@/views/LoginView.vue')))
        },
        {
            path: '/resource/:resourceId',
            component: ResourceParent_vue_1.default,
            name: 'resource',
            children: [
                {
                    path: '',
                    component: ListView_vue_1.default,
                    name: 'resource-list'
                },
                {
                    path: 'show/:primaryKey',
                    component: ShowView_vue_1.default,
                    name: 'resource-show'
                },
                {
                    path: 'edit/:primaryKey',
                    component: EditView_vue_1.default,
                    name: 'resource-edit'
                },
                {
                    path: 'create',
                    component: CreateView_vue_1.default,
                    name: 'resource-create'
                },
            ]
        },
        /* IMPORTANT:ADMINFORTH ROUTES */
    ]
});
exports.default = router;
