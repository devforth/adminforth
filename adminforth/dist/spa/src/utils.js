"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIcon = exports.callAdminForthApi = exports.callApi = void 0;
const vue_1 = require("vue");
const router_1 = __importDefault(require("./router"));
function callApi(_a) {
    return __awaiter(this, arguments, void 0, function* ({ path, method, body = undefined }) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        };
        const fullPath = `${import.meta.env.VITE_ADMINFORTH_PUBLIC_PATH || ''}${path}`;
        const r = yield fetch(fullPath, options);
        if (r.status == 401) {
            console.log('router', router_1.default);
            router_1.default.push({ name: 'login' });
            return null;
        }
        return yield r.json();
    });
}
exports.callApi = callApi;
function callAdminForthApi(_a) {
    return __awaiter(this, arguments, void 0, function* ({ path, method, body = undefined }) {
        try {
            return callApi({ path: `/adminapi/v1${path}`, method, body });
        }
        catch (e) {
            console.error('error', e);
            return { error: `Unexpected error: ${e}` };
        }
    });
}
exports.callAdminForthApi = callAdminForthApi;
function getIcon(icon) {
    // icon format is "feather:icon-name". We need to get IconName in pascal case
    if (!icon.includes(':')) {
        throw new Error('Icon name should be in format "icon-set:icon-name"');
    }
    const [iconSet, iconName] = icon.split(':');
    const compName = 'Icon' + iconName.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    return (0, vue_1.resolveComponent)(compName);
}
exports.getIcon = getIcon;
