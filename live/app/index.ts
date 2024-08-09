import betterSqlite3 from 'better-sqlite3';
import express from 'express';
import AdminForth, { AdminForthDataTypes } from 'adminforth';
import { AdminForthDataTypes, AdminForthResourcePages } from 'adminforth';

import dotenv from 'dotenv';
dotenv.config();


const DB_FILE = 'test.sqlite';
let db;

const ADMIN_BASE_URL = '';

const blockDemoUsers = async ({ record, adminUser, resource }) => {
    record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
    return { ok: true };
}

export const admin = new AdminForth({
  baseUrl : ADMIN_BASE_URL,
  rootUser: {
    username: 'adminforth',  // use these as credentials for first login
    password: 'adminforth',
  },
  auth: {
    resourceId: 'users',  // resource to get user during login
    usernameField: 'email',  // field where username is stored, should exist in resource
    passwordHashField: 'password_hash',
    demoCredentials: "demo@adminforth.dev:demo",  // never use it for production
    loginPromptHTML: "Use email <b>demo@adminforth.dev</b> and password <b>demo</b> to login",
  },
  customization: {
    brandName: 'My Admin',
    datesFormat: 'D MMM YY HH:mm:ss',
    emptyFieldPlaceholder: '-',
    title: 'My App Admin',  // used to set HTML meta title tag
    // brandLogo: '@@/logo.svg',
    // favicon: '@@/favicon.png',
  },

  dataSources: [
    {
      id: 'maindb',
      url: `sqlite://${DB_FILE}`
    },
  ],
  resources: [
    {
      dataSource: 'maindb', 
      table: 'apartments',
      resourceId: 'aparts', // resourceId is defaulted to table name but you can redefine it like this e.g. 
                            // in case of same table names from different data sources
      label: 'Apartments',   // label is defaulted to table name but you can change it
      recordLabel: (r) => `🏡 ${r.title}`,
      hooks: {
        delete: {
          beforeSave: blockDemoUsers,
        },
        edit: {
          beforeSave: blockDemoUsers,
        },
        create: {
          beforeSave: blockDemoUsers,
        },
      },
      columns: [
        {
            name: 'Country Flag',
            label: 'Country Flag',
            type: AdminForthDataTypes.STRING,
            virtual: true,
            showIn: [AdminForthResourcePages.show, AdminForthResourcePages.list],
            components: {
              show: '@@/CountryFlag.vue',
              list: '@@/CountryFlag.vue',
            },
          },
        { 
          name: 'id', 
          label: 'Identifier',  // if you wish you can redefine label, defaulted to uppercased name
          showIn: ['filter', 'show'], // show column in filter and in show page
          primaryKey: true,
          fillOnCreate: ({initialRecord, adminUser}) => Math.random().toString(36).substring(7),  // called during creation to generate content of field, initialRecord is values user entered, adminUser object of user who creates record
        },
        { 
          name: 'title',
          required: true,
          showIn: ['list', 'create', 'edit', 'filter', 'show'],  // all available options
          maxLength: 255,  // you can set max length for string fields
          minLength: 3,  // you can set min length for string fields
        }, 
        {
          name: 'created_at',
          type: AdminForthDataTypes.DATETIME ,
          allowMinMaxQuery: true,
          showIn: ['list', 'filter', 'show', 'edit'],
          fillOnCreate: ({initialRecord, adminUser}) => (new Date()).toISOString(),
        },
        { 
          name: 'price',
          allowMinMaxQuery: true,  // use better experience for filtering e.g. date range, set it only if you have index on this column or if you sure there will be low number of rows
          editingNote: 'Price is in USD',  // you can put a note near field on editing or creating page
        },
        { 
          name: 'square_meter', 
          label: 'Square', 
          allowMinMaxQuery: true,
          minValue: 1,  // you can set min /max value for number columns so users will not be able to enter more/less
          maxValue: 1000,
        },
        { 
          name: 'number_of_rooms',
          components: {
            show: '@@/RoomsCell.vue',
            list: '@@/RoomsCell.vue',
          },
          allowMinMaxQuery: true,
          enum: [
            { value: 1, label: '1 room' },
            { value: 2, label: '2 rooms' },
            { value: 3, label: '3 rooms' },
            { value: 4, label: '4 rooms' },
            { value: 5, label: '5 rooms' },
          ],
        },
        { 
          name: 'description',
          sortable: false,
          showIn: ['show', 'edit', 'create', 'filter'],
        },
        {
          name: 'country',
          enum: [{
            value: 'US',
            label: 'United States'
          }, {
            value: 'DE',
            label: 'Germany'
          }, {
            value: 'FR',
            label: 'France'
          }, {
            value: 'UK',
            label: 'United Kingdom'
          }, {
            value:'NL',
            label: 'Netherlands'
          }, {
            value: 'IT',
            label: 'Italy'
          }, {
            value: 'ES',
            label: 'Spain'
          }, {
            value: 'DK',
            label: 'Denmark'
          }, {
            value: 'PL',
            label: 'Poland'
          }, {
            value: 'UA',
            label: 'Ukraine'
          }, {
            value: null,
            label: 'Not defined'
          }],
        },
        {
          name: 'listed',
          required: true,  // will be required on create/edit
        },
        {
          name: 'realtor_id',
          foreignResource: {
            resourceId: 'users',
          }
        }
      ],
      options: {
        listPageSize: 12,
        allowedActions:{
          edit: true,
          delete: true,
          show: true,
          filter: true,
        },
      },
    },
    { 
      dataSource: 'maindb', 
      table: 'users',
      resourceId: 'users',
      label: 'Users',  
      recordLabel: (r) => `👤 ${r.email}`,
      columns: [
        { 
          name: 'id', 
          primaryKey: true,
          fillOnCreate: ({initialRecord, adminUser}) => Math.random().toString(36).substring(7),
          showIn: ['list', 'filter', 'show'],
        },
        { 
          name: 'email', 
          required: true,
          isUnique: true,
          validation: [
            {
              regExp: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              message: 'Email is not valid, must be in format example@test.com'
            },
          ]
        },
        { 
          name: 'created_at', 
          type: AdminForthDataTypes.DATETIME,
          showIn: ['list', 'filter', 'show'],
          fillOnCreate: ({initialRecord, adminUser}) => (new Date()).toISOString(),
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
          virtual: true,  // field will not be persisted into db
          required: { create: true }, // make required only on create page
          editingNote: { edit: 'Leave empty to keep password unchanged' },
          minLength: 4,
          type: AdminForthDataTypes.STRING,
          showIn: ['create', 'edit'], // to show field only on create and edit pages
          masked: true, // to show stars in input field
        },
        { name: 'password_hash', backendOnly: true, showIn: []}
      ],
      hooks: {
        create: {
          beforeSave: [
            blockDemoUsers,
            async ({ record, adminUser, resource }) => {
                record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
                return { ok: true };
            }
          ],
        },
        edit: {
          beforeSave: [
            blockDemoUsers,
            async ({ record, adminUser, resource}) => {
                if (record.password) {
                    record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
                }
                return { ok: true }
            },
          ]
        },
        delete: {
            beforeSave: blockDemoUsers,
        },
      }
    },
  ],
  menu: [
    {
        label: 'Dashboard',
        path: '/ovrerwiew',
        homepage: true,
        icon: 'flowbite:chart-pie-solid',
        component: '@@/Dashboard.vue',
      },
    {
      label: 'Core',
      icon: 'flowbite:brain-solid', // any icon from iconify supported in format <setname>:<icon>, e.g. from here https://icon-sets.iconify.design/flowbite/
      open: true,
      children: [
        {
          label: 'Apartments',
          icon: 'flowbite:home-solid',
          resourceId: 'aparts',
        },
      ]
    },
    {
      type: 'gap'
    },
    {
      type: 'divider'
    },
    {
      type: 'heading',
      label: 'SYSTEM',
    },
    {
      label: 'Users',
      icon: 'flowbite:user-solid',
      resourceId: 'users',
    }
  ],
});


async function initDataBase() {
  db = betterSqlite3(DB_FILE);

  const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='apartments';`).get();
  if (!tableExists) {
    // if no table - create couple of tables and fill them with some mock data
    await db.prepare(`
      CREATE TABLE apartments (
          id VARCHAR(20) PRIMARY KEY NOT NULL,
          title VARCHAR(255) NOT NULL,
          square_meter REAL,
          price DECIMAL(10, 2) NOT NULL,
          number_of_rooms INT,
          description TEXT,
          country VARCHAR(2),
          listed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP,
          realtor_id VARCHAR(255)
      );`).run();

    await db.prepare(`
      CREATE TABLE users (
          id VARCHAR(255) PRIMARY KEY NOT NULL,
          email VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at VARCHAR(255) NOT NULL,
          role VARCHAR(255) NOT NULL
      );`).run();

    for (let i = 0; i < 100; i++) {
      await db.prepare(`
        INSERT INTO apartments (
          id, title, square_meter, price, 
          number_of_rooms, description, 
          created_at, listed, 
          country
        ) VALUES (
         '${i}', 'Apartment ${i}', ${(Math.random() * 100).toFixed(1)}, ${(Math.random() * 10000).toFixed(2)}, 
         ${ Math.floor(Math.random() * 5) }, 'Next gen apartments', 
         ${ Date.now() / 1000 - Math.random() * 14 * 60 * 60 * 24 }, ${i % 2 == 0}, 
         '${['US', 'DE', 'FR', 'UK', 'NL', 'IT', 'ES', 'DK', 'PL', 'UA'][Math.floor(Math.random() * 10)]}'
        )`).run();
    }
  }
}


if (import.meta.url === `file://${process.argv[1]}`) {
  // if script is executed directly e.g. node index.ts or npm start

  await initDataBase();

  const app = express()
  app.use(express.json());
  const port = 3500;

  // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
  if (process.env.NODE_ENV === 'development') {
    await admin.bundleNow({ hotReload: true});
    console.log('Bundling AdminForth done');
  }

  app.get(`${ADMIN_BASE_URL}/api/dashboard/`,
    admin.express.authorize(
      async (req, res) => {
        const days = req.body.days || 7;
        const apartsByDays = await db.prepare(
          `SELECT 
            strftime('%Y-%m-%d', created_at, 'unixepoch') as day, 
            COUNT(*) as count 
          FROM apartments 
          GROUP BY day 
          ORDER BY day DESC
          LIMIT ?;
          `
        ).all(days);
  
        const totalAparts = apartsByDays.reduce((acc, { count }) => acc + count, 0);
  
        // add listed, unlisted, listedPrice, unlistedPrice
        const listedVsUnlistedByDays = await db.prepare(
          `SELECT 
            strftime('%Y-%m-%d', created_at, 'unixepoch') as day, 
            SUM(listed) as listed, 
            COUNT(*) - SUM(listed) as unlisted,
            SUM(listed * price) as listedPrice,
            SUM((1 - listed) * price) as unlistedPrice
          FROM apartments
          GROUP BY day
          ORDER BY day DESC
          LIMIT ?;
          `
        ).all(days);
  
        const listedVsUnlistedPriceByDays = await db.prepare(
          `SELECT 
            strftime('%Y-%m-%d', created_at, 'unixepoch') as day, 
            SUM(listed * price) as listedPrice,
            SUM((1 - listed) * price) as unlistedPrice
          FROM apartments
          GROUP BY day
          ORDER BY day DESC
          LIMIT ?;
          `
        ).all(days);
          
        const totalListedPrice = Math.round(listedVsUnlistedByDays.reduce((acc, { listedPrice }) => acc + listedPrice, 0));
        const totalUnlistedPrice = Math.round(listedVsUnlistedByDays.reduce((acc, { unlistedPrice }) => acc + unlistedPrice, 0));
  
        res.json({ 
          apartsByDays,
          totalAparts,
          listedVsUnlistedByDays,
          totalListedPrice,
          totalUnlistedPrice,
          listedVsUnlistedPriceByDays,
        });
      }
    )
  );
  

  // serve after you added all api
  admin.express.serve(app)
  admin.discoverDatabases();


  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.log(`\n⚡ AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}\n`)
  });
}