import express from 'express';
import AdminForth from 'adminforth';
import usersResource from "./resources/adminuser.js";
import { fileURLToPath } from 'url';
import path from 'path';
import { Filters } from 'adminforth';
import { initApi } from './api.js';
import cars_SQLITE_resource from './resources/cars_SL.js';
import auditLogsResource from "./resources/auditLogs.js"
import { FICTIONAL_CAR_BRANDS, FICTIONAL_CAR_MODELS_BY_BRAND, ENGINE_TYPES, BODY_TYPES } from './custom/cars_data.js';
import passkeysResource from './resources/passkeys.js';
import carsDescriptionImage from './resources/cars_description_image.js';
import translations from "./resources/translations.js";

const ADMIN_BASE_URL = '';

export const admin = new AdminForth({
  baseUrl: ADMIN_BASE_URL,
  auth: {
    usersResourceId: 'adminuser',
    usernameField: 'email',
    passwordHashField: 'password_hash',
    rememberMeDuration: '30d', 
    loginBackgroundImage: 'https://images.unsplash.com/photo-1534239697798-120952b76f2b?q=80&w=3389&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    loginBackgroundPosition: '1/2',
    loginPromptHTML: async () => { 
      const adminforthUserExists = await admin.resource("adminuser").count(Filters.EQ('email', 'adminforth')) > 0;
      if (adminforthUserExists) {
        return "Please use <b>adminforth</b> as username and <b>adminforth</b> as password"
      }
    },
    avatarUrl: async (adminUser)=>{
      const plugin = admin.getPluginsByClassName('UploadPlugin').find(p => p.pluginOptions.pathColumnName === 'avatar') as any; 
      if (!plugin) {
        throw new Error('Upload plugin for avatar not found');
      }
      if (adminUser.dbUser.avatar === null || adminUser.dbUser.avatar === undefined || adminUser.dbUser.avatar === '') {
        return '';
      }
      const imageUrl = await plugin.getFileDownloadUrl(adminUser.dbUser.avatar || '', 3600);
      return imageUrl;
    },
  },
  customization: {
    brandName: "dev-demo",
    title: "dev-demo",
    favicon: '@@/assets/favicon.png',
    brandLogo: '@@/assets/logo.svg',
    datesFormat: 'DD MMM',
    timeFormat: 'HH:mm a',
    showBrandNameInSidebar: true,
    showBrandLogoInSidebar: true,
    emptyFieldPlaceholder: '-',
    styles: {
      colors: {
        light: {
          primary: '#1a56db',
          sidebar: { main: '#f9fafb', text: '#213045' },
        },
        dark: {
          primary: '#82ACFF',
          sidebar: { main: '#1f2937', text: '#9ca3af' },
        }
      }
    },
  },
  dataSources: [
    {
      id: 'sqlite',
      url: `${process.env.SQLITE_URL}`
    },
    // {
    //   id: 'mongo',
    //   url: `${process.env.MONGODB_URL}`
    // },
    // {
    //   id: 'postgres',
    //   url: `${process.env.POSTGRES_URL}`
    // },
    // {
    //   id: 'mysql',
    //   url: `${process.env.MYSQL_URL}`
    // },
    // {
    //   id: 'clickhouse',
    //   url: `${process.env.CLICKHOUSE_URL}`
    // }
  ],
  resources: [
    usersResource,
    auditLogsResource,
    cars_SQLITE_resource,
    passkeysResource,
    carsDescriptionImage,
    translations,
  ],
  menu: [
    { type: 'heading', label: 'SYSTEM' },
    {
      label: 'Cars (SQLITE)',
      resourceId: 'cars_sl',
      homepage: true,
    },
    {
    label: 'Af Components',
    icon: 'flowbite:chart-pie-solid',
    component: '@@/AfComponents.vue',
    path: '/af-components',
    },

    {
      label: 'Users',
      icon: 'flowbite:user-solid',
      resourceId: 'adminuser'
    },
    {
      label: 'Audit Logs',
      icon: 'flowbite:search-outline',
      resourceId: 'audit_logs',
    },
    {
      label: 'Translations',
      icon: 'material-symbols:translate',
      resourceId: 'translations',
    },

  ],
});

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const app = express();
  app.use(express.json());

  initApi(app, admin);

  const port = 3000;
  
  admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development' }).then(() => {
    console.log('Bundling AdminForth SPA done.');
  });

  admin.express.serve(app);

  admin.discoverDatabases().then(async () => {
    if (await admin.resource('adminuser').count() === 0) {
      await admin.resource('adminuser').create({
        email: 'adminforth',
        password_hash: await AdminForth.Utils.generatePasswordHash('adminforth'),
        role: 'superadmin',
      });
    }
    if (await admin.resource('cars_sl').count() === 0) {
      for (let i = 0; i < 100; i++) {
        const engine_type = ENGINE_TYPES[Math.floor(Math.random() * ENGINE_TYPES.length)].value;
        await admin.resource('cars_sl').create({
          id: `${i}`,
          model: `${FICTIONAL_CAR_BRANDS[Math.floor(Math.random() * FICTIONAL_CAR_BRANDS.length)]} ${FICTIONAL_CAR_MODELS_BY_BRAND[FICTIONAL_CAR_BRANDS[Math.floor(Math.random() * FICTIONAL_CAR_BRANDS.length)]][Math.floor(Math.random() * 4)]}`,
          price: (Math.random() * 10000).toFixed(2),
          engine_type: engine_type,
          engine_power: engine_type === 'electric' ? null : Math.floor(Math.random() * 400) + 100,
          production_year: Math.floor(Math.random() * 31) + 1990,
          listed: i % 2 == 0,
          mileage: `${Math.floor(Math.random() * 200000)}`,
          body_type: BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)].value,
        });
      };
    }
  });

  admin.express.listen(port, () => {
    console.log(`\n⚡ AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}\n`);
  });
}
