import betterSqlite3 from 'better-sqlite3';
import express from 'express';
import AdminForth, { AdminForthDataTypes, Filters } from 'adminforth';
import AuditLogPlugin from '@adminforth/audit-log';
import { v4 as uuid } from 'uuid';
import ForeignInlineListPlugin from '@adminforth/foreign-inline-list';
import { AdminForthResource, AdminForthResourceColumn } from 'adminforth';
import UploadPlugin from '@adminforth/upload';
// import ChatGptPlugin from '@adminforth/chat-gpt';
import dotenv from 'dotenv';
import fs from 'fs';
import RichEditorPlugin from '@adminforth/rich-editor';
import importExport from '@adminforth/import-export';
dotenv.config();

try { fs.mkdirSync('db') } catch (e) {} 
const DB_FILE = 'db/test.sqlite';

let db;

const ADMIN_BASE_URL = '';

const blockDemoUsers = async ({ record, adminUser, resource }) => {
  if (adminUser.dbUser && adminUser.dbUser.role !== 'superadmin') {
    return { ok: false, error: "You can't do this on demo.adminforth.dev" }
  }
  return { ok: true };
}

export const admin = new AdminForth({
  baseUrl : ADMIN_BASE_URL,
  auth: {
    //loginBackgroundImage: '@@/adminforthloginimg.avif',
    resourceId: 'users',  // resource to get user during login
    usernameField: 'email',  // field where username is stored, should exist in resource
    passwordHashField: 'password_hash',
    demoCredentials: "demo@adminforth.dev:demo",  // never use it for production
    loginPromptHTML: "Use email <b>demo@adminforth.dev</b> and password <b>demo</b> to login",
  },
  customization: {
    brandName: 'My Admin',
    datesFormat: 'D MMM YY',
    timeFormat: 'HH:mm:ss',
    emptyFieldPlaceholder: '-',
    title: 'My App Admin',  // used to set HTML meta title tag
    // brandLogo: '@@/logo.svg',
    // favicon: '@@/favicon.png',
    announcementBadge: (adminUser: AdminUser) => {
      return { 
        html: `
<svg xmlns="http://www.w3.org/2000/svg" style="display:inline; margin-top: -4px" width="16" height="16" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg> 
<a href="https://github.com/devforth/adminforth" style="font-weight: bold; text-decoration: underline" target="_blank">Star us on GitHub</a> to support a project!`,
        closable: true,
        // title: 'Support us for free',
      }
    }
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
      table: 'audit_logs',
      columns: [
        { name: 'id', primaryKey: true, required: false, fillOnCreate: ({initialRecord}: any) => uuid(), showIn: ['show'] },
        { name: 'created_at', required: false },
        { name: 'resource_id', required: false },
        { name: 'user_id', required: false, 
          foreignResource: {
          resourceId: 'users',
        } },
        { name: 'action', required: false },
        { name: 'diff', required: false, type: AdminForthDataTypes.JSON, showIn: ['show'] },
        { name: 'record_id', required: false },
      ],
      options: {
        allowedActions: {
            edit: false,
            delete: false,
        }
      },
      plugins: [
        new importExport({}),
        new AuditLogPlugin({
            // if you want to exclude some resources from logging
            //excludeResourceIds: ['users'],
            resourceColumns: {
                resourceIdColumnName: 'resource_id',
                resourceActionColumnName: 'action',
                resourceDataColumnName: 'diff',
                resourceUserIdColumnName: 'user_id',
                resourceRecordIdColumnName: 'record_id',
                resourceCreatedColumnName: 'created_at'
            }
        }),
      ],
    },
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
          name: 'apartment_image',
          showIn: [], // You can set to ['list', 'show'] if you wish to show path column in list and show views
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
          label: 'Rooms number',
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
          type: AdminForthDataTypes.RICHTEXT,
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
            value: 'GB',
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
          label: 'Realtor',
          foreignResource: {
            resourceId: 'users',
          }
        }
      ],
      plugins: [
        new importExport({}),
        new RichEditorPlugin({
          htmlFieldName: 'description',
          completion: {
            provider: 'openai-chat-gpt',
            params: {
              apiKey: process.env.OPENAI_API_KEY as string,
              // model: 'gpt-4o',  gpt-4o-model is a default (cheapest one)
            },
            expert: {
              debounceTime: 250,
            }
          }
        }),
        // new ChatGptPlugin({
        //   openAiApiKey: process.env.OPENAI_API_KEY as string,
        //   fieldName: 'title',
        // }),
        new UploadPlugin({
          pathColumnName: 'apartment_image',
          s3Bucket: 'demo-static.adminforth.dev', // ❗ Your bucket name
          s3Region: 'eu-north-1', // ❗ Selected region
          s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
          s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          s3ACL: 'public-read',
          allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
          maxFileSize: 1024 * 1024 * 20, // 5MB
          s3Path: ({originalFilename, originalExtension, contentType}) => 
                `aparts/${new Date().getFullYear()}/${uuid()}-${originalFilename}.${originalExtension}`,
          // You can use next to change preview URLs (if it is image) in list and show views
          preview: {
            showInList: true,
            previewUrl: ({s3Path}) => `https://demo-static.adminforth.dev/${s3Path}`,
          }
        })
      ],
      options: {
        listPageSize: 8,
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
      plugins: [
        new importExport({}),
        new ForeignInlineListPlugin({
          foreignResourceId: 'aparts',
          modifyTableResourceConfig: (resourceConfig: AdminForthResource) => {
            // hide column 'square_meter' from both 'list' and 'filter'
            const column = resourceConfig.columns.find((c: AdminForthResourceColumn) => c.name === 'square_meter')!.showIn = [];
            resourceConfig.options!.listPageSize = 1;
            // feel free to console.log and edit resourceConfig as you need
          },
        }),
        new ForeignInlineListPlugin({
          foreignResourceId: 'audit_logs',
        }),
      ],
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
      label: 'Audit Logs',
      icon: 'flowbite:search-outline',
      resourceId: 'audit_logs',
    },
    {
        label: 'Dashboard',
        path: '/overview',
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

  const auditTableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs';`).get();
  if (!auditTableExists) {
    await db.prepare(`
      CREATE TABLE audit_logs (
        id uuid NOT NULL,  -- identifier of applied change record 
        created_at timestamp without time zone, -- timestamp of applied change
        resource_id varchar(255), -- identifier of resource where change were applied
        user_id uuid, -- identifier of user who made the changes
        "action" varchar(255), -- type of change (create, edit, delete)
        diff text, -- delta betwen before/after versions
        record_id varchar, -- identifier of record that been changed
        PRIMARY KEY(id)
      );`).run();
  }

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
         '${['US', 'DE', 'FR', 'GB', 'NL', 'IT', 'ES', 'DK', 'PL', 'UA'][Math.floor(Math.random() * 10)]}'
        )`).run();
    }
  }

  const columns = await db.prepare('PRAGMA table_info(apartments);').all();
  const columnExists = columns.some((c) => c.name === 'apartment_image');
  if (!columnExists) {
    await db.prepare('ALTER TABLE apartments ADD COLUMN apartment_image VARCHAR(255);').run();
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
  admin.discoverDatabases().then(async () => {
    if (!await admin.resource('users').get([Filters.EQ('email', 'adminforth')])) {
      await admin.resource('users').create({
        email: 'adminforth',
        password_hash: await AdminForth.Utils.generatePasswordHash('adminforth'),
        role: 'superadmin',
      });
    }
  });


  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.log(`\n⚡ AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}\n`)
  });
}
