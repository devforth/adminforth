import express from 'express';
import AdminForth from 'adminforth';
import usersResource from "./resources/adminuser.js";
import { fileURLToPath } from 'url';
import path from 'path';
import { Filters } from 'adminforth';
import { initApi } from './api.js';
import cars_SQLITE_resource from './resources/cars_SL.js';


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
    cars_SQLITE_resource
  ],
  menu: [
    { type: 'heading', label: 'SYSTEM' },


    {
      label: 'Users',
      icon: 'flowbite:user-solid',
      resourceId: 'adminuser'
    },
    {
      label: 'Cars (SQLITE)',
      resourceId: 'cars_sl'
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
  });

  admin.express.listen(port, () => {
    console.log(`\n⚡ AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}\n`);
  });
}
