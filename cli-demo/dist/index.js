var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import express from 'express';
import AdminForth, { AdminForthDataTypes, Filters } from 'adminforth';
export var admin = new AdminForth({
    baseUrl: '',
    auth: {
        usersResourceId: 'users', // resource to get user during login
        usernameField: 'email', // field where username is stored, should exist in resource
        passwordHashField: 'passwordHash',
    },
    customization: {
        brandName: 'My Admin',
        datesFormat: 'D MMM YY',
        timeFormat: 'HH:mm:ss',
        emptyFieldPlaceholder: '-',
    },
    dataSources: [{
            id: 'maindb',
            url: "sqlite://".concat(process.env.DATABASE_FILE),
        }],
    resources: [
        {
            dataSource: 'maindb',
            table: 'user',
            resourceId: 'users',
            label: 'Users',
            recordLabel: function (r) { return "\uD83D\uDC64 ".concat(r.email); },
            columns: [
                {
                    name: 'id',
                    primaryKey: true,
                    fillOnCreate: function () { return Math.random().toString(36).substring(7); },
                    showIn: ['list', 'filter', 'show'],
                },
                {
                    name: 'email',
                    required: true,
                    isUnique: true,
                    enforceLowerCase: true,
                    validation: [
                        AdminForth.Utils.EMAIL,
                    ]
                },
                {
                    name: 'createdAt',
                    type: AdminForthDataTypes.DATETIME,
                    showIn: ['list', 'filter', 'show'],
                    fillOnCreate: function () { return (new Date()).toISOString(); },
                },
                {
                    name: 'role',
                    enum: [
                        { value: 'superadmin', label: 'Super Admin' },
                        { value: 'user', label: 'User' },
                    ]
                },
                {
                    name: 'password',
                    virtual: true,
                    required: { create: true },
                    editingNote: { edit: 'Leave empty to keep password unchanged' },
                    minLength: 8,
                    type: AdminForthDataTypes.STRING,
                    showIn: ['create', 'edit'],
                    masked: true,
                },
                { name: 'passwordHash', backendOnly: true, showIn: [] }
            ],
        },
        {
            table: 'post',
            resourceId: 'posts',
            dataSource: 'maindb',
            label: 'Posts',
            recordLabel: function (r) { return "\uD83D\uDCDD ".concat(r.title); },
            columns: [
                {
                    name: 'id',
                    primaryKey: true,
                    fillOnCreate: function () { return Math.random().toString(36).substring(7); },
                    showIn: ['list', 'filter', 'show'],
                },
                {
                    name: 'title',
                    type: AdminForthDataTypes.STRING,
                    required: true,
                    showIn: ['list', 'create', 'edit', 'filter', 'show'],
                    maxLength: 255,
                    minLength: 3,
                },
                {
                    name: 'content',
                    showIn: ['list', 'create', 'edit', 'filter', 'show'],
                },
                {
                    name: 'createdAt',
                    showIn: ['list', 'filter', 'show',],
                    fillOnCreate: function () { return (new Date()).toISOString(); },
                },
                {
                    name: 'published',
                    required: true,
                },
                {
                    name: 'authorId',
                    foreignResource: {
                        resourceId: 'users',
                    },
                    showIn: ['list', 'filter', 'show'],
                    fillOnCreate: function (_a) {
                        var adminUser = _a.adminUser;
                        return adminUser.dbUser.id;
                    }
                }
            ],
        }
    ],
    menu: [
        {
            label: 'Core',
            icon: 'flowbite:brain-solid', // any icon from iconify supported in format <setname>:<icon>, e.g. from here https://icon-sets.iconify.design/flowbite/
            open: true,
            children: [
                {
                    homepage: true,
                    label: 'Posts',
                    icon: 'flowbite:home-solid',
                    resourceId: 'posts',
                },
            ]
        },
        { type: 'gap' },
        { type: 'divider' },
        { type: 'heading', label: 'SYSTEM' },
        {
            label: 'Users',
            icon: 'flowbite:user-solid',
            resourceId: 'users',
        }
    ],
});
if (import.meta.url === "file://".concat(process.argv[1])) {
    // if script is executed directly e.g. node index.ts or npm start
    var app = express();
    app.use(express.json());
    var port_1 = 3500;
    // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
    await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development' });
    console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');
    // serve after you added all api
    admin.express.serve(app);
    admin.discoverDatabases().then(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, admin.resource('users').get([Filters.EQ('email', 'adminforth')])];
                case 1:
                    if (!!(_d.sent())) return [3 /*break*/, 4];
                    _b = (_a = admin.resource('users')).create;
                    _c = {
                        email: 'adminforth'
                    };
                    return [4 /*yield*/, AdminForth.Utils.generatePasswordHash('adminforth')];
                case 2: return [4 /*yield*/, _b.apply(_a, [(_c.passwordHash = _d.sent(),
                            _c.role = 'superadmin',
                            _c)])];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.listen(port_1, function () {
        console.log("\n\u26A1 AdminForth is available at http://localhost:".concat(port_1, "\n"));
    });
}
