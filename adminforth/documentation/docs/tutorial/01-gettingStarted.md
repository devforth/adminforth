
# Getting Started

## Prerequisites

AdminForth requires Node v18 or higher:

```bash
nvm install 18
nvm alias default 18
nvm use 18
```

## Installation

```bash
mkdir myadmin
cd myadmin
npm init -y
npm install adminforth
```

AdminForth does not provide own HTTP server, but can add own listeners over exisitng [Express](https://expressjs.com/) server (Fastify support is planned in future). This allows to create custom APIs for backoffice in a way you know.

```bash
npm install express@4.19.2
```

For demo purposes we will use SQLite data source. You can use Postgres, Mongo or Clickhouse as well, or create own data source by [implementing DataSource Connector interface](/docs/api/types/AdminForthConfig/interfaces/IAdminForthDataSourceConnector).


```bash
npm install better-sqlite3@10.0.0
```

You can use AdminForth in pure Node, but we recommend using TypeScript for better development experience:

```bash
npm install typescript@5.4.5 tsx@4.11.2 --save-dev
```

Also we will store secret for JWTs in .env file:

```bash
npm install dotenv --save-dev
```

## Basic Philosophy

AdminForth connects to existing databases and provides a backoffice for managing data including CRUD operations, filtering, sorting, and more.

Database should be already created by using any database management tool, ORM or migrator. AdminForth does not provide a way to create tables or columns in the database.

Once you have a database, you pass a connection string to AdminForth and define resources(tables) and columns you would like to see in backoffice. For most DBs AdminForth can "discover" column types and constraints (e.g. max-length) by connecting to DB. However you can redefine them in AdminForth configuration. Type and constraints definition are take precedence over DB schema.

Also in AdminForth you can define in "Vue" way:
* how each field will be rendered
* create own pages e.g. Dashboards
* insert injections into standard pages (e.g. add diagram to list view)


## Setting up a first demo

In the demo we will create a simple database with 2 tables: `apartments` and `users`. We will just use plain SQL to create tables and insert some fake data.

Users table will be used to store a credentials for login into backoffice itself.

Open `package.json`, set `type` to `module` and add `start` script:

```json title="./package.json"
{
  ...
//diff-add
  "type": "module",
  "scripts": {
    ...
//diff-add
    "start": "tsx watch index.ts"
  },
}
```

Create `.env` file in root directory with following content:

```bash title="./.env"
ADMINFORTH_SECRET=CHANGE_ME_IN_PRODUCTION
NODE_ENV=development 
```

> 🫨 In production:
> 1) you should set `NODE_ENV` to `production` so it will not waste extra resources on hot reload.
> 2) You should autogenerate `ADMINFORTH_SECRET`


> 🫨 If you are using Git, obviously you should make sure you will never commit `.env` file to the repository, because
it might contain your own sensitive secrets. So to follow best practices, we recommend to add `.env` into `.gitignore` and create `.env.sample` as template for other repository users.
> During deployment you should set `ADMINFORTH_SECRET` in environment variables of Docker image or in other way without using `.env` file.

Create `index.ts` file in root directory with following content:

```ts title="./index.ts"
import betterSqlite3 from 'better-sqlite3';
import express from 'express';
import AdminForth, { AdminForthDataTypes } from 'adminforth';

import dotenv from 'dotenv';
dotenv.config();


const DB_FILE = 'test.sqlite';
let db;

const ADMIN_BASE_URL = '';

export const admin = new AdminForth({
  baseUrl : ADMIN_BASE_URL,
  rootUser: {
    username: 'adminforth',  // use these as credentials to login
    password: 'adminforth',
  },
  auth: {
    resourceId: 'users',  // resource for getting user
    usernameField: 'email',
    passwordHashField: 'password_hash',
  },
  customization: {
    brandName: 'My Admin',
    datesFormat: 'D MMM YY HH:mm:ss',
    emptyFieldPlaceholder: '-',
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
      resourceId: 'aparts', // resourceId is defaulted to table name but you can change it e.g. 
                             // in case of same table names from different data sources
      label: 'Apartments',   // label is defaulted to table name but you can change it
      recordLabel: (r) => `🏡 ${r.title}`,
      columns: [
        { 
          name: 'id', 
          label: 'Identifier',  // if you wish you can redefine label
          showIn: ['filter', 'show'], // show in filter and in show page
          primaryKey: true,
          fillOnCreate: ({initialRecord, adminUser}) => Math.random().toString(36).substring(7),  // initialRecord is values user entered, adminUser object of user who creates record
        },
        { 
          name: 'title',
          required: true,
          showIn: ['list', 'create', 'edit', 'filter', 'show'],  // the default is full set
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
          allowMinMaxQuery: true,  // use better experience for filtering e.g. date range, set it only if you have index on this column or if there will be low number of rows
          editingNote: 'Price is in USD',  // you can appear note on editing or creating page
        },
        { 
          name: 'square_meter', 
          label: 'Square', 
          allowMinMaxQuery: true,
          minValue: 1,  // you can set min /max value for number fields
          maxValue: 1000,
        },
        { 
          name: 'number_of_rooms',
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
          minLength: 8,
          type: AdminForthDataTypes.STRING,
          showIn: ['create', 'edit'], // to show field only on create and edit pages
          masked: true, // to show stars in input field
        },
        { name: 'password_hash', backendOnly: true, showIn: []}
      ],
      hooks: {
        create: {
          beforeSave: async ({ record, adminUser, resource }) => {
            record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
            return { ok: true };
          }
        },
        edit: {
          beforeSave: async ({ record, adminUser, resource}) => {
            if (record.password) {
              record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
            }
            return { ok: true }
          },
        },
      }
    },
  ],
  menu: [
    {
      label: 'Core',
      icon: 'flowbite:brain-solid', // any icon from iconify supported in format <setname>:<icon>, e.g. from here https://icon-sets.iconify.design/flowbite/
      open: true,
      children: [
        {
          homepage: true,
          label: 'Appartments',
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
  await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development'});
  console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');


  // serve after you added all api
  admin.express.serve(app)
  admin.discoverDatabases();


  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.log(`\n⚡ AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}\n`)
  });
}
```

> 🫨 For simplicity we defined whole configuration in one file. Normally once configuration grows you should 
> move each resource configuration to separate file and organize them to folder and import them in `index.ts`.

Now you can run your app:

```bash
npm start
```

Open http://localhost:3500 in your browser and login with credentials `adminforth` / `adminforth`.


![alt text](localhost_3500_login.png)


After Login you should see:
![alt text](localhost_3500_resource_aparts.png)



## Possible configuration options

Check [AdminForthConfig](/docs/api/types/AdminForthConfig/type-aliases/AdminForthConfig.md) for all possible options.