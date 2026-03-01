import express from 'express';
import AdminForth, {  Filters } from '../adminforth/index.js';
import usersResource from "./resources/adminuser.js";
import { fileURLToPath } from 'url';
import path from 'path';
import { Decimal } from 'decimal.js';
import { initApi } from './api.js';
import cars_SQLITE_resource from './resources/cars_SL.js';
import cars_MyS_resource from './resources/cars_MyS.js';
import cars_PG_resource from './resources/cars_PG.js';
import cars_Mongo_resource from './resources/cars_mongo.js';
import cars_Ch_resource from './resources/cars_Ch.js';
import background_jobs_resource from './resources/background_jobs.js';
import BackgroundJobsPlugin from '../plugins/adminforth-background-jobs/index.js';

import auditLogsResource from "./resources/auditLogs.js"
import { FICTIONAL_CAR_BRANDS, FICTIONAL_CAR_MODELS_BY_BRAND, ENGINE_TYPES, BODY_TYPES } from './custom/cars_data.js';
import passkeysResource from './resources/passkeys.js';
import carsDescriptionImage from './resources/cars_description_image.js';
import translations from "./resources/translations.js";
import { logger, afLogger } from '../adminforth/modules/logger.js';
import { UUID } from 'crypto';

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
    styles:{
      colors: {
        light: {
          // color for buttons, links, etc.
          primary: '#16537e',
          // color for sidebar and text
          sidebar: {
            main:'#232323', 
            text:'white'
          },
        },
        dark: {
          primary: '#8a158d',
          sidebar: {
            main:'#8a158d', 
            text:'white'
          },
        }
      }
    }
  },
  componentsToExplicitRegister: [
    { 
      file: '@@/JobCustomComponent.vue',
      meta: {
        label: 'Job Custom Component',
      }
    }
  ],
  dataSources: [
    {
      id: 'sqlite',
      url: `${process.env.SQLITE_URL}`
    },
    {
      id: 'mongo',
      url: 'mongodb://127.0.0.1:27028/demo?retryWrites=true&w=majority&authSource=admin',
    },
    {
      id: 'postgres',
      url: 'postgres://demo:demo@localhost:53321/dev_demo',
    },
    {
      id: 'mysql',
      url: 'mysql://demo:demo@localhost:3307/dev_demo',
    },
    {
      id: 'clickhouse',
      url: 'clickhouse://demo:demo@localhost:8124/demo',
    }
  ],
  resources: [
    usersResource,
    auditLogsResource,
    cars_SQLITE_resource,
    cars_MyS_resource,
    cars_PG_resource,
    cars_Mongo_resource,
    cars_Ch_resource,
    passkeysResource,
    carsDescriptionImage,
    translations,
    background_jobs_resource
  ],
  menu: [
    { type: 'heading', label: 'SYSTEM' },
    {
      label: 'Af Components',
      icon: 'flowbite:chart-pie-solid',
      component: '@@/AfComponents.vue',
      path: '/af-components',
    },
    {
      type: 'divider'
    },
    {
      label: 'Cars',
      icon: 'flowbite:cart-solid',
      open: true,
      children: [
        {
          label: 'Cars (SQLITE)',
          resourceId: 'cars_sl',
          homepage: true,
        },
        {
          label: 'Cars (MySQL)',
          resourceId: 'cars_mysql',
        },
        {
          label: 'Cars (PostgreSQL)',
          resourceId: 'cars_pg',
        },
        {
          label: 'Cars (MongoDB)',
          resourceId: 'cars_mongo',
        },
        {
          label: 'Cars (ClickHouse)',
          resourceId: 'cars_ch',
        }
      ],
    },
    {
      type: 'divider'
    },
    {
      type: 'gap'
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

  app.post(`${ADMIN_BASE_URL}/api/create-job/`,
    admin.express.authorize(
      async (req: any, res: any) => {
        const backgroundJobsPlugin = admin.getPluginByClassName<BackgroundJobsPlugin>('BackgroundJobsPlugin');
        if (!backgroundJobsPlugin) {
          res.status(404).json({ error: 'BackgroundJobsPlugin not found' });
          return;
        }
        backgroundJobsPlugin.startNewJob(
          'Example Job', //job name
          req.adminUser, // adminuser
          [
            { state: { step: 1 } },
            { state: { step: 2 } },
            { state: { step: 3 } },
            { state: { step: 4 } },
            { state: { step: 5 } },
            { state: { step: 6 } },
          ], //initial tasks
          'example_job_handler', //job handler name
        )
        res.json({ok: true, message: 'Job started' });
      }
    ),
  );

  initApi(app, admin);

  const port = 3000;
  
  admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development' }).then(() => {
    logger.info('Bundling AdminForth SPA done.');
  });

  admin.express.serve(app);

  const backgroundJobsPlugin = admin.getPluginByClassName<BackgroundJobsPlugin>('BackgroundJobsPlugin');

  backgroundJobsPlugin.registerTaskHandler({
    // job handler name
    jobHandlerName: 'example_job_handler',
    //handler function
    handler: async ({ setTaskStateField, getTaskStateField }) => {
      const state = await getTaskStateField();
      console.log('State of the task at the beginning of the job handler:', state);
      await new Promise(resolve => setTimeout(resolve, 3000));
      await setTaskStateField({[state.step]: `Step ${state.step} completed`});
      const updatedState = await getTaskStateField();
      console.log('State of the task after setting the new state in the job handler:', updatedState);
    },
    //limit of tasks, that are running in parallel
    parallelLimit: 1
  })
  
  backgroundJobsPlugin.registerTaskDetailsComponent({
    jobHandlerName: 'example_job_handler', // Handler name
    component: { 
      file: '@@/JobCustomComponent.vue'  //custom component for the job details
    },
  })
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
          price: Decimal(Math.random() * 10000).toFixed(2),
          engine_type: engine_type,
          engine_power: engine_type === 'electric' ? null : Math.floor(Math.random() * 400) + 100,
          production_year: Math.floor(Math.random() * 31) + 1990,
          listed: i % 2 == 0,
          mileage: Math.floor(Math.random() * 200000),
          body_type: BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)].value,
        });
      };
    }
    if (await admin.resource('cars_mongo').count() === 0) {
      for (let i = 0; i < 100; i++) {
        const engine_type = ENGINE_TYPES[Math.floor(Math.random() * ENGINE_TYPES.length)].value;
        await admin.resource('cars_mongo').create({
          _id: `_${i}`,
          model: `${FICTIONAL_CAR_BRANDS[Math.floor(Math.random() * FICTIONAL_CAR_BRANDS.length)]} ${FICTIONAL_CAR_MODELS_BY_BRAND[FICTIONAL_CAR_BRANDS[Math.floor(Math.random() * FICTIONAL_CAR_BRANDS.length)]][Math.floor(Math.random() * 4)]}`,
          price: Decimal(Math.random() * 10000).toFixed(2),
          engine_type: engine_type,
          engine_power: engine_type === 'electric' ? null : Math.floor(Math.random() * 400) + 100,
          production_year: Math.floor(Math.random() * 31) + 1990,
          listed: i % 2 == 0,
          mileage: Math.floor(Math.random() * 200000),
          body_type: BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)].value,
        });
      };
    }

    if (await admin.resource('cars_mysql').count() === 0) {
      for (let i = 0; i < 100; i++) {
        const engine_type = ENGINE_TYPES[Math.floor(Math.random() * ENGINE_TYPES.length)].value;
        await admin.resource('cars_mysql').create({
          id: `${i}`,
          model: `${FICTIONAL_CAR_BRANDS[Math.floor(Math.random() * FICTIONAL_CAR_BRANDS.length)]} ${FICTIONAL_CAR_MODELS_BY_BRAND[FICTIONAL_CAR_BRANDS[Math.floor(Math.random() * FICTIONAL_CAR_BRANDS.length)]][Math.floor(Math.random() * 4)]}`,
          price: Decimal(Math.random() * 10000).toFixed(2),
          engine_type: engine_type,
          engine_power: engine_type === 'electric' ? null : Math.floor(Math.random() * 400) + 100,
          production_year: Math.floor(Math.random() * 31) + 1990,
          listed: i % 2 == 0,
          mileage: Math.floor(Math.random() * 200000),
          body_type: BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)].value,
        });
      };
    }

    if (await admin.resource('cars_pg').count() === 0) {
      for (let i = 0; i < 100; i++) {
        const engine_type = ENGINE_TYPES[Math.floor(Math.random() * ENGINE_TYPES.length)].value;
        await admin.resource('cars_pg').create({
          id: `${i}`,
          model: `${FICTIONAL_CAR_BRANDS[Math.floor(Math.random() * FICTIONAL_CAR_BRANDS.length)]} ${FICTIONAL_CAR_MODELS_BY_BRAND[FICTIONAL_CAR_BRANDS[Math.floor(Math.random() * FICTIONAL_CAR_BRANDS.length)]][Math.floor(Math.random() * 4)]}`,
          price: Decimal(Math.random() * 10000).toFixed(2),
          engine_type: engine_type,
          engine_power: engine_type === 'electric' ? null : Math.floor(Math.random() * 400) + 100,
          production_year: Math.floor(Math.random() * 31) + 1990,
          listed: i % 2 == 0,
          mileage: Math.floor(Math.random() * 200000),
          body_type: BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)].value,
        });
      };
    }

    if (await admin.resource('cars_ch').count() === 0) {
      for (let i = 0; i < 100; i++) {
        const engine_type = ENGINE_TYPES[Math.floor(Math.random() * ENGINE_TYPES.length)].value;
        await admin.resource('cars_ch').create({
          id: `${i}`,
          model: `${FICTIONAL_CAR_BRANDS[Math.floor(Math.random() * FICTIONAL_CAR_BRANDS.length)]} ${FICTIONAL_CAR_MODELS_BY_BRAND[FICTIONAL_CAR_BRANDS[Math.floor(Math.random() * FICTIONAL_CAR_BRANDS.length)]][Math.floor(Math.random() * 4)]}`,
          price: Decimal(Math.random() * 10000).toFixed(2),
          engine_type: engine_type,
          engine_power: engine_type === 'electric' ? null : Math.floor(Math.random() * 400) + 100,
          production_year: Math.floor(Math.random() * 31) + 1990,
          listed: i % 2 == 0,
          mileage: Math.floor(Math.random() * 200000),
          body_type: BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)].value,
        });
      };
    }
  });

  admin.express.listen(port, () => {
    logger.info(`\x1b[38;5;249m ⚡ AdminForth is available at\x1b[1m\x1b[38;5;46m http://localhost:${port}${ADMIN_BASE_URL}\x1b[0m\n`);
  });
}
