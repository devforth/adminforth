import express from 'express';
import AdminForth from 'adminforth';
import usersResource from "./resources/adminuser.js";
import { fileURLToPath } from 'url';
import path from 'path';
import { Filters } from 'adminforth';
import cars_SQLITE_resource from './resources/cars_sl_allow_create.js';

import cars_sl_dont_allow_create from './resources/cars_sl_dont_allow_create.js';
import cars_sl_dont_allow_create_by_hook from './resources/cars_sl_dont_allow_create_by_hook.js';

import cars_sl_dont_allow_edit from './resources/cars_sl_dont_allow_edit.js';
import cars_sl_dont_allow_edit_by_hook from './resources/cars_sl_dont_allow_edit_by_hook.js';

import cars_sl_dont_allow_show from './resources/cars_sl_dont_allow_show.js';
import cars_sl_dont_allow_show_by_hook from './resources/cars_sl_dont_allow_show_by_hook.js';

import cars_sl_dont_allow_delete from './resources/cars_sl_dont_allow_delete.js';
import cars_sl_dont_allow_delete_by_hook from './resources/cars_sl_dont_allow_delete_by_hook.js';

import carsDescriptionImage from '../../dev-demo/resources/cars_description_image.js';
import passkeysResource from '../../dev-demo/resources/passkeys.js';
import polymorphicCarRefs from './resources/polymorphic_car_refs.js';

const ADMIN_BASE_URL = '';
const appFilePath = fileURLToPath(import.meta.url);
const appDir = path.dirname(appFilePath);
const sqliteDbPath = path.join(appDir, '.db.sqlite');
const customComponentsDir = path.join(appDir, 'custom');

process.env.ADMINFORTH_SECRET ??= '123';
process.env.NODE_ENV ??= 'test';
process.env.SQLITE_URL ??= `sqlite://${sqliteDbPath}`;
process.env.SQLITE_FILE_URL ??= `file:${sqliteDbPath}`;

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
  },
  customization: {
    customComponentsDir,
    brandName: "application",
    title: "application",
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
  ],
  resources: [
    usersResource,
    cars_SQLITE_resource,

    cars_sl_dont_allow_create,
    cars_sl_dont_allow_create_by_hook,

    cars_sl_dont_allow_edit,
    cars_sl_dont_allow_edit_by_hook,

    cars_sl_dont_allow_show,
    cars_sl_dont_allow_show_by_hook,

    cars_sl_dont_allow_delete,
    cars_sl_dont_allow_delete_by_hook,

    carsDescriptionImage,
    polymorphicCarRefs,
    passkeysResource
  ],
  menu: [
    { type: 'heading', label: 'SYSTEM' },
    {
      label: 'Users',
      icon: 'flowbite:user-solid',
      resourceId: 'adminuser'
    }
  ],
});

const app = express();
app.use(express.json());

const port = 3333;

admin.express.serve(app);

const appReady = admin.discoverDatabases().then(async () => {
  if (await admin.resource('adminuser').count() === 0) {
    await admin.resource('adminuser').create({
      email: 'adminforth',
      password_hash: await AdminForth.Utils.generatePasswordHash('adminforth'),
      role: 'superadmin',
    });
  }
});

async function closeApplication() {
  await Promise.all(Object.values(admin.connectors).map(async (connector: any) => {
    if (typeof connector?.close === 'function') {
      await connector.close();
    }
  }));

  if (admin.express.server?.listening) {
    await new Promise<void>((resolve, reject) => {
      admin.express.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

const isMainModule = process.argv[1] ? path.resolve(process.argv[1]) === appFilePath : false;

if (isMainModule) {
  appReady.then(() => {
    admin.express.listen(port, () => {});
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { app, appReady, closeApplication };
