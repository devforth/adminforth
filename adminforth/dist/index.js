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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _AdminForth_defaultConfig;
Object.defineProperty(exports, "__esModule", { value: true });
const auth_js_1 = __importDefault(require("./auth.js"));
const mongo_js_1 = __importDefault(require("./dataConnectors/mongo.js"));
const postgres_js_1 = __importDefault(require("./dataConnectors/postgres.js"));
const sqlite_js_1 = __importDefault(require("./dataConnectors/sqlite.js"));
const codeInjector_js_1 = __importDefault(require("./modules/codeInjector.js"));
const utils_js_1 = require("./modules/utils.js");
const express_js_1 = __importDefault(require("./servers/express.js"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const types_js_1 = require("./types.js");
const AVAILABLE_SHOW_IN = ['list', 'edit', 'create', 'filter', 'show'];
class AdminForth {
    constructor(config) {
        _AdminForth_defaultConfig.set(this, {
            deleteConfirmation: true,
        });
        this.config = Object.assign(Object.assign({}, __classPrivateFieldGet(this, _AdminForth_defaultConfig, "f")), config);
        this.validateConfig();
        this.express = new express_js_1.default(this);
        this.auth = new auth_js_1.default();
        this.codeInjector = new codeInjector_js_1.default(this);
        this.connectors = {};
        this.statuses = {};
    }
    validateConfig() {
        if (this.config.rootUser) {
            if (!this.config.rootUser.username) {
                throw new Error('rootUser.username is required');
            }
            if (!this.config.rootUser.password) {
                throw new Error('rootUser.password is required');
            }
            console.log('\n ⚠️⚠️⚠️ [INSECURE ALERT] config.rootUser is set, please create a new user and remove config.rootUser from config before going to production\n');
        }
        if (this.config.auth) {
            if (!this.config.auth.resourceId) {
                throw new Error('No config.auth.resourceId defined');
            }
            if (!this.config.auth.passwordHashField) {
                throw new Error('No config.auth.passwordHashField defined');
            }
            const userResource = this.config.resources.find((res) => res.resourceId === this.config.auth.resourceId);
            if (!userResource) {
                throw new Error(`Resource with id "${this.config.auth.resourceId}" not found`);
            }
        }
        if (!this.config.customization) {
            this.config.customization = {};
        }
        if (!this.config.customization.customComponentsDir) {
            this.config.customization.customComponentsDir = './custom';
        }
        const errors = [];
        if (!this.config.baseUrl) {
            this.config.baseUrl = '';
        }
        if (!this.config.brandName) {
            this.config.brandName = 'AdminForth';
        }
        if (!this.config.datesFormat) {
            this.config.datesFormat = 'MMM D, YYYY HH:mm:ss';
        }
        if (this.config.resources) {
            this.config.resources.forEach((res) => {
                var _b, _c;
                if (!res.table) {
                    errors.push(`Resource "${res.dataSource}" is missing table`);
                }
                // if itemLabel is not callable, throw error
                if (res.itemLabel && typeof res.itemLabel !== 'function') {
                    errors.push(`Resource "${res.dataSource}" itemLabel is not a function`);
                }
                res.resourceId = res.resourceId || res.table;
                res.label = res.label || res.table.charAt(0).toUpperCase() + res.table.slice(1);
                if (!res.dataSource) {
                    errors.push(`Resource "${res.resourceId}" is missing dataSource`);
                }
                if (!res.columns) {
                    res.columns = [];
                }
                res.columns.forEach((col) => {
                    var _b;
                    col.label = col.label || (0, utils_js_1.guessLabelFromName)(col.name);
                    if (col.showIn && !Array.isArray(col.showIn)) {
                        errors.push(`Resource "${res.resourceId}" column "${col.name}" showIn must be an array`);
                    }
                    // check col.required is string or object
                    if (col.required && !((typeof col.required === 'boolean') || (typeof col.required === 'object'))) {
                        errors.push(`Resource "${res.resourceId}" column "${col.name}" required must be a string or object`);
                    }
                    // if it is object check the keys are one of ['create', 'edit']
                    if (typeof col.required === 'object') {
                        const wrongRequiredOn = Object.keys(col.required).find((c) => !['create', 'edit'].includes(c));
                        if (wrongRequiredOn) {
                            errors.push(`Resource "${res.resourceId}" column "${col.name}" has invalid required value "${wrongRequiredOn}", allowed keys are 'create', 'edit']`);
                        }
                    }
                    // same for editingNote
                    if (col.editingNote && !((typeof col.editingNote === 'string') || (typeof col.editingNote === 'object'))) {
                        errors.push(`Resource "${res.resourceId}" column "${col.name}" editingNote must be a string or object`);
                    }
                    if (typeof col.editingNote === 'object') {
                        const wrongEditingNoteOn = Object.keys(col.editingNote).find((c) => !['create', 'edit'].includes(c));
                        if (wrongEditingNoteOn) {
                            errors.push(`Resource "${res.resourceId}" column "${col.name}" has invalid editingNote value "${wrongEditingNoteOn}", allowed keys are 'create', 'edit']`);
                        }
                    }
                    const wrongShowIn = col.showIn && col.showIn.find((c) => !AVAILABLE_SHOW_IN.includes(c));
                    if (wrongShowIn) {
                        errors.push(`Resource "${res.resourceId}" column "${col.name}" has invalid showIn value "${wrongShowIn}", allowed values are ${AVAILABLE_SHOW_IN.join(', ')}`);
                    }
                    col.showIn = ((_b = col.showIn) === null || _b === void 0 ? void 0 : _b.map(c => c.toLowerCase())) || AVAILABLE_SHOW_IN;
                });
                //check if resource has bulkActions
                if ((_b = res.options) === null || _b === void 0 ? void 0 : _b.bulkActions) {
                    let bulkActions = res.options.bulkActions;
                    if (!Array.isArray(bulkActions)) {
                        errors.push(`Resource "${res.resourceId}" bulkActions must be an array`);
                        bulkActions = [];
                    }
                    if ((_c = res.options) === null || _c === void 0 ? void 0 : _c.allowDelete) {
                        bulkActions.push({
                            label: `Delete checked`,
                            state: 'danger',
                            icon: 'flowbite:trash-bin-outline',
                            action: (_d) => __awaiter(this, [_d], void 0, function* ({ selectedIds }) {
                                const connector = this.connectors[res.dataSource];
                                yield Promise.all(selectedIds.map((recordId) => __awaiter(this, void 0, void 0, function* () {
                                    yield connector.deleteRecord({ resource: res, recordId });
                                })));
                            })
                        });
                    }
                    const newBulkActions = bulkActions.map((action) => {
                        return Object.assign(action, { id: (0, uuid_1.v1)() });
                    });
                    bulkActions = newBulkActions;
                }
            });
            if (!this.config.menu) {
                errors.push('No config.menu defined');
            }
            // check if there is only one homepage: true in menu, recursivly
            let homepages = 0;
            const browseMenu = (menu) => {
                menu.forEach((item) => {
                    if (item.component && item.resourceId) {
                        errors.push(`Menu item cannot have both component and resourceId: ${JSON.stringify(item)}`);
                    }
                    if (item.component && !item.path) {
                        errors.push(`Menu item with component must have path : ${JSON.stringify(item)}`);
                    }
                    // make sure component starts with @@
                    if (item.component) {
                        if (!item.component.startsWith('@@')) {
                            errors.push(`Menu item component must start with @@ : ${JSON.stringify(item)}`);
                        }
                        const path = item.component.replace('@@', this.config.customization.customComponentsDir);
                        if (!fs_1.default.existsSync(path)) {
                            errors.push(`Menu item component "${item.component.replace('@@', '')}" does not exist in "${this.config.customization.customComponentsDir}"`);
                        }
                    }
                    if (item.homepage) {
                        homepages++;
                        if (homepages > 1) {
                            errors.push('There must be only one homepage: true in menu, found second one in ' + JSON.stringify(item));
                        }
                    }
                    if (item.children) {
                        browseMenu(item.children);
                    }
                });
            };
            browseMenu(this.config.menu);
        }
        // check for duplicate resourceIds and show which ones are duplicated
        const resourceIds = this.config.resources.map((res) => res.resourceId);
        const uniqueResourceIds = new Set(resourceIds);
        if (uniqueResourceIds.size != resourceIds.length) {
            const duplicates = resourceIds.filter((item, index) => resourceIds.indexOf(item) != index);
            errors.push(`Duplicate fields "resourceId" or "table": ${duplicates.join(', ')}`);
        }
        //add ids for onSelectedAllActions for each resource
        if (errors.length > 0) {
            throw new Error(`Invalid AdminForth config: ${errors.join(', ')}`);
        }
    }
    postProcessAfterDiscover(resource) {
        resource.columns.forEach((column) => {
            // if db/user says column is required in boolean, exapd
            if (typeof column.required === 'boolean') {
                column.required = { create: column.required, edit: column.required };
            }
            // same for editingNote
            if (typeof column.editingNote === 'string') {
                column.editingNote = { create: column.editingNote, edit: column.editingNote };
            }
        });
        resource.dataSourceColumns = resource.columns.filter((col) => !col.virtual);
    }
    discoverDatabases() {
        return __awaiter(this, void 0, void 0, function* () {
            this.statuses.dbDiscover = 'running';
            this.connectorClasses = {
                'sqlite': sqlite_js_1.default,
                'postgres': postgres_js_1.default,
                'mongodb': mongo_js_1.default,
            };
            if (!this.config.databaseConnectors) {
                this.config.databaseConnectors = Object.assign({}, this.connectorClasses);
            }
            this.config.dataSources.forEach((ds) => {
                const dbType = ds.url.split(':')[0];
                if (!this.config.databaseConnectors[dbType]) {
                    throw new Error(`Database type ${dbType} is not supported, consider using databaseConnectors in AdminForth config`);
                }
                this.connectors[ds.id] = new this.config.databaseConnectors[dbType]({ url: ds.url, fieldtypesByTable: ds.fieldtypesByTable });
            });
            yield Promise.all(this.config.resources.map((res) => __awaiter(this, void 0, void 0, function* () {
                if (!this.connectors[res.dataSource]) {
                    throw new Error(`Resource '${res.table}' refers to unknown dataSource '${res.dataSource}'`);
                }
                const fieldTypes = yield this.connectors[res.dataSource].discoverFields(res.table);
                if (!Object.keys(fieldTypes).length) {
                    throw new Error(`Table '${res.table}' (In resource '${res.resourceId}') has no fields or does not exist`);
                }
                if (!res.columns) {
                    res.columns = Object.keys(fieldTypes).map((name) => ({ name }));
                }
                res.columns.forEach((col, i) => {
                    if (!fieldTypes[col.name] && !col.virtual) {
                        throw new Error(`Resource '${res.table}' has no column '${col.name}'`);
                    }
                    // first find discovered values, but allow override
                    res.columns[i] = Object.assign(Object.assign({}, fieldTypes[col.name]), col);
                });
                this.postProcessAfterDiscover(res);
                // check if primaryKey column is present
                if (!res.columns.some((col) => col.primaryKey)) {
                    throw new Error(`Resource '${res.table}' has no column defined or auto-discovered. Please set 'primaryKey: true' in a columns which has unique value for each record and index`);
                }
            })));
            this.statuses.dbDiscover = 'done';
            // console.log('⚙️⚙️⚙️ Database discovery done', JSON.stringify(this.config.resources, null, 2));
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('AdminForth init');
        });
    }
    bundleNow(_b) {
        return __awaiter(this, arguments, void 0, function* ({ hotReload = false, verbose = false }) {
            this.codeInjector.bundleNow({ hotReload, verbose });
        });
    }
    setupEndpoints(server) {
        server.endpoint({
            noAuth: true,
            method: 'POST',
            path: '/login',
            handler: (_b) => __awaiter(this, [_b], void 0, function* ({ body, response }) {
                const { username, password } = body;
                let token;
                if (username === this.config.rootUser.username && password === this.config.rootUser.password) {
                    token = this.auth.issueJWT({ username, pk: null });
                }
                else {
                    // get resource from db
                    if (!this.config.auth) {
                        throw new Error('No config.auth defined');
                    }
                    const userResource = this.config.resources.find((res) => res.resourceId === this.config.auth.resourceId);
                    const userRecord = yield this.connectors[userResource.dataSource].getData({
                        resource: userResource,
                        filters: [
                            { field: this.config.auth.usernameField, operator: types_js_1.AdminForthFilterOperators.EQ, value: username },
                        ],
                        limit: 1,
                        offset: 0,
                        sort: [],
                    }).data[0];
                    if (!userRecord) {
                        return { error: 'User not found' };
                    }
                    const passwordHash = userRecord[this.config.auth.passwordHashField];
                    console.log('User record', userRecord, passwordHash); // why does it has no hash?
                    const valid = yield auth_js_1.default.verifyPassword(password, passwordHash);
                    if (valid) {
                        token = this.auth.issueJWT({
                            username, pk: userRecord[userResource.columns.find((col) => col.primaryKey).name]
                        });
                    }
                    else {
                        return { error: INVALID_MESSAGE };
                    }
                }
                response.setHeader('Set-Cookie', `adminforth_jwt=${token}; Path=${this.config.baseUrl || '/'}; HttpOnly; SameSite=Strict`);
                return { ok: true };
            }),
        });
        server.endpoint({
            noAuth: true,
            method: 'POST',
            path: '/logout',
            handler: (_c) => __awaiter(this, [_c], void 0, function* ({ response }) {
                response.setHeader('Set-Cookie', `adminforth_jwt=; Path=${this.config.baseUrl || '/'}; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
                return { ok: true };
            }),
        });
        server.endpoint({
            noAuth: true,
            method: 'GET',
            path: '/get_public_config',
            handler: (_d) => __awaiter(this, [_d], void 0, function* ({ body }) {
                // find resource
                if (!this.config.auth) {
                    throw new Error('No config.auth defined');
                }
                const usernameField = this.config.auth.usernameField;
                const resource = this.config.resources.find((res) => res.resourceId === this.config.auth.resourceId);
                const usernameColumn = resource.columns.find((col) => col.name === usernameField);
                return {
                    brandName: this.config.brandName,
                    usernameFieldName: usernameColumn.label,
                    loginBackgroundImage: this.config.auth.loginBackgroundImage,
                };
            }),
        });
        server.endpoint({
            method: 'GET',
            path: '/get_base_config',
            handler: (_e) => __awaiter(this, [_e], void 0, function* ({ input, adminUser, cookies }) {
                const cookieParsed = this.auth.verify(cookies['adminforth_jwt']);
                let username = '';
                let userFullName = '';
                if (cookieParsed['pk'] == null) {
                    username = this.config.rootUser.username;
                }
                else {
                    const userResource = this.config.resources.find((res) => res.resourceId === this.config.auth.resourceId);
                    const user = yield this.connectors[userResource.dataSource].getData({
                        resource: userResource,
                        filters: [
                            { field: userResource.columns.find((col) => col.primaryKey).name, operator: types_js_1.AdminForthFilterOperators.EQ, value: cookieParsed['pk'] },
                        ],
                        limit: 1,
                        offset: 0,
                        sort: [],
                    });
                    if (!user.data.length) {
                        return { error: 'Unauthorized' };
                    }
                    username = user.data[0][this.config.auth.usernameField];
                    userFullName = user.data[0][this.config.auth.userFullName];
                }
                const userData = {
                    [this.config.auth.usernameField]: username,
                    [this.config.auth.userFullName]: userFullName
                };
                return {
                    user: userData,
                    resources: this.config.resources.map((res) => ({
                        resourceId: res.resourceId,
                        label: res.label,
                    })),
                    menu: this.config.menu,
                    config: {
                        brandName: this.config.brandName,
                        datesFormat: this.config.datesFormat,
                        deleteConfirmation: this.config.deleteConfirmation,
                        auth: this.config.auth,
                        usernameField: this.config.auth.usernameField,
                    },
                    adminUser,
                };
            }),
        });
        server.endpoint({
            method: 'POST',
            path: '/get_resource_columns',
            handler: (_f) => __awaiter(this, [_f], void 0, function* ({ body }) {
                const { resourceId } = body;
                if (!this.statuses.dbDiscover) {
                    return { error: 'Database discovery not started' };
                }
                if (this.statuses.dbDiscover !== 'done') {
                    return { error: 'Database discovery is still in progress, please try later' };
                }
                const resource = this.config.resources.find((res) => res.resourceId == resourceId);
                if (!resource) {
                    return { error: `Resource ${resourceId} not found` };
                }
                return { resource };
            }),
        });
        server.endpoint({
            method: 'POST',
            path: '/get_resource_data',
            handler: (_g) => __awaiter(this, [_g], void 0, function* ({ body }) {
                const { resourceId, limit, offset, filters, sort } = body;
                if (!this.statuses.dbDiscover) {
                    return { error: 'Database discovery not started' };
                }
                if (this.statuses.dbDiscover !== 'done') {
                    return { error: 'Database discovery is still in progress, please try later' };
                }
                const resource = this.config.resources.find((res) => res.resourceId == resourceId);
                if (!resource) {
                    return { error: `Resource ${resourceId} not found` };
                }
                const data = yield this.connectors[resource.dataSource].getData({
                    resource,
                    limit,
                    offset,
                    filters,
                    sort,
                });
                return Object.assign(Object.assign({}, data), { options: resource === null || resource === void 0 ? void 0 : resource.options });
            }),
        });
        server.endpoint({
            method: 'POST',
            path: '/get_min_max_for_columns',
            handler: (_h) => __awaiter(this, [_h], void 0, function* ({ body }) {
                const { resourceId } = body;
                if (!this.statuses.dbDiscover) {
                    return { error: 'Database discovery not started' };
                }
                if (this.statuses.dbDiscover !== 'done') {
                    return { error: 'Database discovery is still in progress, please try later' };
                }
                const resource = this.config.resources.find((res) => res.resourceId == resourceId);
                if (!resource) {
                    return { error: `Resource '${resourceId}' not found` };
                }
                const item = yield this.connectors[resource.dataSource].getMinMaxForColumns({
                    resource,
                    columns: resource.columns.filter((col) => [
                        types_js_1.AdminForthTypes.INT,
                        types_js_1.AdminForthTypes.FLOAT,
                        types_js_1.AdminForthTypes.DATE,
                        types_js_1.AdminForthTypes.DATETIME,
                        types_js_1.AdminForthTypes.TIME,
                        types_js_1.AdminForthTypes.DECIMAL,
                    ].includes(col.type) && col.allowMinMaxQuery === true),
                });
                return item;
            }),
        });
        server.endpoint({
            method: 'POST',
            path: '/get_record',
            handler: (_j) => __awaiter(this, [_j], void 0, function* ({ body }) {
                var _k, _l;
                const { resourceId, primaryKey } = body;
                const resource = this.config.resources.find((res) => res.resourceId == resourceId);
                const primaryKeyColumn = resource.columns.find((col) => col.primaryKey);
                const connector = this.connectors[resource.dataSource];
                const record = yield connector.getRecordByPrimaryKey(resource, primaryKey);
                if (!record) {
                    return { error: `Record with ${primaryKeyColumn.name} ${primaryKey} not found` };
                }
                // execute hook if needed
                if ((_k = resource.hooks) === null || _k === void 0 ? void 0 : _k.show) {
                    const resp = yield ((_l = resource.hooks) === null || _l === void 0 ? void 0 : _l.show({ resource, record, adminUser }));
                    if (!resp || (!resp.ok && !resp.error)) {
                        throw new Error(`Hook must return object with {ok: true} or { error: 'Error' } `);
                    }
                    if (resp.error) {
                        return { error: resp.error };
                    }
                }
                const labler = resource.itemLabel || ((record) => `${resource.label} ${record[primaryKeyColumn.name]}`);
                record._label = labler(record);
                return record;
            })
        });
        server.endpoint({
            noAuth: true, // TODO
            method: 'POST',
            path: '/create_record',
            handler: (_m) => __awaiter(this, [_m], void 0, function* ({ body, adminUser }) {
                var _o, _p, _q, _r, _s, _t, _u, _v, _w;
                console.log('create_record', body, this.config.resources);
                const resource = this.config.resources.find((res) => res.resourceId == body['resourceId']);
                if (!resource) {
                    return { error: `Resource '${body['resourceId']}' not found` };
                }
                const record = body['record'];
                // execute hook if needed
                if ((_p = (_o = resource.hooks) === null || _o === void 0 ? void 0 : _o.create) === null || _p === void 0 ? void 0 : _p.beforeSave) {
                    const resp = yield ((_r = (_q = resource.hooks) === null || _q === void 0 ? void 0 : _q.create) === null || _r === void 0 ? void 0 : _r.beforeSave({ resource, record, adminUser }));
                    if (!resp || (!resp.ok && !resp.error)) {
                        throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
                    }
                    if (resp.error) {
                        return { error: resp.error };
                    }
                }
                for (const column of resource.columns) {
                    if (column.fillOnCreate) {
                        if (body['record'][column.name] === undefined) {
                            body['record'][column.name] = column.fillOnCreate({
                                initialRecord: body['record'], adminUser
                            });
                        }
                    }
                    if (((_s = column.required) === null || _s === void 0 ? void 0 : _s.create) && body['record'][column.name] === undefined) {
                        return { error: `Column '${column.name}' is required` };
                    }
                    if (column.isUnique) {
                        const existingRecord = yield this.connectors[resource.dataSource].getData({
                            resource,
                            filters: [{ field: column.name, operator: types_js_1.AdminForthFilterOperators.EQ, value: body['record'][column.name] }],
                            limit: 1,
                            sort: [],
                            offset: 0
                        });
                        if (existingRecord.data.length > 0) {
                            return { error: `Record with ${column.name} ${body['record'][column.name]} already exists` };
                        }
                    }
                }
                // remove virtual columns from record
                for (const column of resource.columns.filter((col) => col.virtual)) {
                    if (record[column.name]) {
                        delete record[column.name];
                    }
                }
                const connector = this.connectors[resource.dataSource];
                yield connector.createRecord({ resource, record });
                // execute hook if needed
                if ((_u = (_t = resource.hooks) === null || _t === void 0 ? void 0 : _t.create) === null || _u === void 0 ? void 0 : _u.afterSave) {
                    const resp = yield ((_w = (_v = resource.hooks) === null || _v === void 0 ? void 0 : _v.create) === null || _w === void 0 ? void 0 : _w.afterSave({ resource, record, adminUser }));
                    if (!resp || (!resp.ok && !resp.error)) {
                        throw new Error(`Hook afterSave must return object with {ok: true} or { error: 'Error' } `);
                    }
                    if (resp.error) {
                        return { error: resp.error };
                    }
                }
                return {
                    newRecordId: body['record'][connector.getPrimaryKey(resource)]
                };
            })
        });
        server.endpoint({
            noAuth: true, // TODO
            method: 'POST',
            path: '/update_record',
            handler: (_x) => __awaiter(this, [_x], void 0, function* ({ body, adminUser }) {
                var _y, _z, _0, _1, _2, _3, _4, _5;
                console.log('update_record', body);
                const resource = this.config.resources.find((res) => res.resourceId == body['resourceId']);
                if (!resource) {
                    return { error: `Resource '${body['resourceId']}' not found` };
                }
                const recordId = body['recordId'];
                const connector = this.connectors[resource.dataSource];
                const oldRecord = yield connector.getRecordByPrimaryKey(resource, recordId);
                if (!oldRecord) {
                    const primaryKeyColumn = resource.columns.find((col) => col.primaryKey);
                    return { error: `Record with ${primaryKeyColumn.name} ${recordId} not found` };
                }
                const record = body['record'];
                // execute hook if needed
                if ((_z = (_y = resource.hooks) === null || _y === void 0 ? void 0 : _y.edit) === null || _z === void 0 ? void 0 : _z.beforeSave) {
                    const resp = yield ((_1 = (_0 = resource.hooks) === null || _0 === void 0 ? void 0 : _0.edit) === null || _1 === void 0 ? void 0 : _1.beforeSave({ resource, record, adminUser }));
                    if (!resp || (!resp.ok && !resp.error)) {
                        throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
                    }
                    if (resp.error) {
                        return { error: resp.error };
                    }
                }
                const newValues = {};
                for (const col of resource.columns.filter((col) => !col.virtual)) {
                    if (record[col.name] !== oldRecord[col.name]) {
                        newValues[col.name] = connector.setFieldValue(col, record[col.name]);
                    }
                }
                if (Object.keys(newValues).length > 0) {
                    yield connector.updateRecord({ resource, recordId, record, newValues });
                }
                // execute hook if needed
                if ((_3 = (_2 = resource.hooks) === null || _2 === void 0 ? void 0 : _2.edit) === null || _3 === void 0 ? void 0 : _3.afterSave) {
                    const resp = yield ((_5 = (_4 = resource.hooks) === null || _4 === void 0 ? void 0 : _4.edit) === null || _5 === void 0 ? void 0 : _5.afterSave({ resource, record, adminUser }));
                    if (!resp || (!resp.ok && !resp.error)) {
                        throw new Error(`Hook afterSave must return object with {ok: true} or { error: 'Error' } `);
                    }
                    if (resp.error) {
                        return { error: resp.error };
                    }
                }
                return {
                    newRecordId: recordId
                };
            })
        });
        server.endpoint({
            noAuth: true, // TODO
            method: 'POST',
            path: '/delete_record',
            handler: (_6) => __awaiter(this, [_6], void 0, function* ({ body }) {
                var _7, _8, _9, _10, _11, _12, _13, _14;
                const resource = this.config.resources.find((res) => res.resourceId == body['resourceId']);
                if (!resource) {
                    return { error: `Resource '${body['resourceId']}' not found` };
                }
                // execute hook if needed
                if ((_8 = (_7 = resource.hooks) === null || _7 === void 0 ? void 0 : _7.delete) === null || _8 === void 0 ? void 0 : _8.beforeSave) {
                    const resp = yield ((_10 = (_9 = resource.hooks) === null || _9 === void 0 ? void 0 : _9.delete) === null || _10 === void 0 ? void 0 : _10.beforeSave({ resource, record, adminUser }));
                    if (!resp || (!resp.ok && !resp.error)) {
                        throw new Error(`Hook beforeSave must return object with {ok: true} or { error: 'Error' } `);
                    }
                    if (resp.error) {
                        return { error: resp.error };
                    }
                }
                const connector = this.connectors[resource.dataSource];
                yield connector.deleteRecord({ resource, recordId: body['primaryKey'] });
                // execute hook if needed
                if ((_12 = (_11 = resource.hooks) === null || _11 === void 0 ? void 0 : _11.delete) === null || _12 === void 0 ? void 0 : _12.afterSave) {
                    const resp = yield ((_14 = (_13 = resource.hooks) === null || _13 === void 0 ? void 0 : _13.delete) === null || _14 === void 0 ? void 0 : _14.afterSave({ resource, record, adminUser }));
                    if (!resp || (!resp.ok && !resp.error)) {
                        throw new Error(`Hook afterSave must return object with {ok: true} or { error: 'Error' } `);
                    }
                    if (resp.error) {
                        return { error: resp.error };
                    }
                }
                return {
                    recordId: body['primaryKey']
                };
            })
        });
        server.endpoint({
            noAuth: true, // TODO
            method: 'POST',
            path: '/start_bulk_action',
            handler: (_15) => __awaiter(this, [_15], void 0, function* ({ body }) {
                const { resourceId, actionId, recordIds } = body;
                const resource = this.config.resources.find((res) => res.resourceId == resourceId);
                if (!resource) {
                    return { error: `Resource '${resourceId}' not found` };
                }
                const action = resource.options.bulkActions.find((act) => act.id == actionId);
                if (!action) {
                    return { error: `Action '${actionId}' not found` };
                }
                else {
                    yield action.action({ selectedIds: recordIds });
                }
                return {
                    actionId,
                    recordIds,
                    resourceId,
                    status: 'success'
                };
            })
        });
    }
}
_a = AdminForth, _AdminForth_defaultConfig = new WeakMap();
AdminForth.Types = types_js_1.AdminForthTypes;
AdminForth.Utils = {
    generatePasswordHash: (password) => __awaiter(void 0, void 0, void 0, function* () {
        return yield auth_js_1.default.generatePasswordHash(password);
    })
};
exports.default = AdminForth;
