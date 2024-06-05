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
exports.useCoreStore = void 0;
const vue_1 = require("vue");
const pinia_1 = require("pinia");
const utils_1 = require("@/utils");
const router_1 = __importDefault(require("@/router"));
function findHomepage(menu) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const item of menu) {
            if (item.homepage) {
                return item;
            }
            if (item.children) {
                const res = findHomepage(item.children);
                if (res) {
                    return res;
                }
            }
        }
        return null;
    });
}
exports.useCoreStore = (0, pinia_1.defineStore)('core', () => {
    const resourceById = (0, vue_1.ref)([]);
    const menu = (0, vue_1.ref)([]);
    const config = (0, vue_1.ref)({});
    const record = (0, vue_1.ref)({});
    const resourceColumns = (0, vue_1.ref)(null);
    const resourceColumnsError = (0, vue_1.ref)('');
    const resourceColumnsId = (0, vue_1.ref)(null);
    const user = (0, vue_1.ref)(null);
    function fetchMenuAndResource() {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield (0, utils_1.callAdminForthApi)({
                path: '/get_base_config',
                method: 'GET',
            });
            menu.value = resp.menu;
            resourceById.value = resp.resources.reduce((acc, resource) => {
                acc[resource.resourceId] = resource;
                return acc;
            }, {});
            config.value = resp.config;
            user.value = resp.user;
            // find homepage:true in menu recuresively
            if (import.meta.env.DEV) {
                return;
            }
            else {
                const homepage = yield findHomepage(menu.value);
                if (homepage) {
                    if (homepage.resourceId) {
                        // redirect to homepage
                        router_1.default.push({ name: 'resource-list', params: { resourceId: homepage.resourceId } });
                    }
                    else {
                        // redirect to path
                        router_1.default.push(homepage.path);
                    }
                }
            }
        });
    }
    function fetchRecord(_a) {
        return __awaiter(this, arguments, void 0, function* ({ resourceId, primaryKey }) {
            record.value = null;
            record.value = yield (0, utils_1.callAdminForthApi)({
                path: '/get_record',
                method: 'POST',
                body: {
                    resourceId: resourceId,
                    primaryKey: primaryKey,
                }
            });
        });
    }
    function fetchColumns(_a) {
        return __awaiter(this, arguments, void 0, function* ({ resourceId }) {
            if (resourceColumnsId.value === resourceId && resourceColumns.value) {
                // already fetched
                return;
            }
            resourceColumnsId.value = resourceId;
            resourceColumns.value = null;
            resourceColumnsError.value = '';
            const res = yield (0, utils_1.callAdminForthApi)({
                path: '/get_resource_columns',
                method: 'POST',
                body: {
                    resourceId,
                }
            });
            if (res.error) {
                resourceColumnsError.value = res.error;
            }
            else {
                resourceColumns.value = res.resource.columns;
            }
        });
    }
    function getPublicConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, utils_1.callAdminForthApi)({
                path: '/get_public_config',
                method: 'GET',
            });
            config.value = Object.assign(Object.assign({}, config.value), res);
        });
    }
    function logout() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, utils_1.callAdminForthApi)({
                path: '/logout',
                method: 'POST',
            });
        });
    }
    const username = (0, vue_1.computed)(() => {
        const usernameField = config.value.usernameField;
        return user.value && user.value[usernameField];
    });
    const userFullname = (0, vue_1.computed)(() => {
        const userFullnameField = config.value.userFullnameField;
        return user.value && user.value[userFullnameField];
    });
    return {
        config,
        resourceById,
        menu,
        username,
        userFullname,
        getPublicConfig,
        fetchMenuAndResource,
        fetchRecord,
        record,
        resourceColumns,
        fetchColumns,
        resourceColumnsError,
        logout
    };
});
