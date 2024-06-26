import betterSqlite3 from 'better-sqlite3';
import express from 'express';
import AdminForth from '../adminforth/index.ts';
import { v1 as uuid } from 'uuid';
import type { AdminForthResource, AdminForthResourceColumn, AdminUser, AllowedActionsEnum } from '../adminforth/types/AdminForthConfig.js';

import ForeignInlineListPlugin from '../adminforth/plugins/ForeignInlineListPlugin/index.ts';
import AuditLogPlugin from '../adminforth/plugins/AuditLogPlugin/index.ts';

const ADMIN_BASE_URL = '';


// create test1.db

const db = betterSqlite3('test1.sqlite')
  
const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='apartments';`).get();
if (!tableExists) {
  await db.prepare(`
    CREATE TABLE apartments (
        id VARCHAR(20) PRIMARY KEY NOT NULL,
        title VARCHAR(255) NOT NULL,
        square_meter REAL,
        price DECIMAL(10, 2) NOT NULL,
        number_of_rooms INT,
        description TEXT,
        property_type VARCHAR(255) DEFAULT 'apartment',
        listed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP,
        user_id VARCHAR(255)
    );`).run();

  await db.prepare(`
    CREATE TABLE users (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL
    );`).run();

  
  await db.prepare(`
    INSERT INTO apartments (id, title, square_meter, price, number_of_rooms, description) VALUES ('123', 'Zhashkiv high residense', 50.8, 10000.12, 2, 'Nice apartment at the city center');
  `).run();

  for (let i = 0; i < 50; i++) {
    await db.prepare(`
      INSERT INTO apartments (
        id, title, square_meter, price, number_of_rooms, description, created_at, listed, property_type
      ) VALUES ('${i}', 'Apartment ${i}', ${Math.random() * 100}, ${Math.random() * 10000}, ${Math
        .floor(Math.random() * 5) }, 'Next gen appartments', ${Date.now() / 1000 - i * 60 * 60 * 24}, ${i % 2 == 0}, ${i % 2 == 0 ? "'house'" : "'apartment'"});
      `).run();
  }
}

const admin = new AdminForth({
  baseUrl : ADMIN_BASE_URL,
  // For changing favicon put your favicon.ico in public folder
  // deleteConfirmation: true,
  rootUser: {
    username: 'adminforth',
    password: 'adminforth',
  },
  
  auth: {
    resourceId: 'users',  // resource for getting user
    usernameField: 'email',
    passwordHashField: 'password_hash',
    userFullNameField: 'fullName', // optional
    // loginBackgroundImage: 'https://images.unsplash.com/photo-1502214380024-fec72aa40e76?q=80&w=3072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    loginBackgroundImage: '@@/pho.jpg',
  },
  customization: {
    customComponentsDir: './custom',
    vueUsesFile: '@@/vueUses.ts',  // @@ is alias to custom directory,
    brandName: 'My App',
    datesFormat: 'D MMM YY HH:mm:ss',
    title: 'My App Admin',
    brandLogo: '@@/logo.svg',
    emptyFieldPlaceholder: '-',
    styles:{
      colors: {
        light: {
          sidebar: {main:'#571e58', text:'white'},
        },
      }
    } 

    
  // },
  },
 

  dataSources: [
    {
      id: 'maindb',
      url: 'sqlite://test1.sqlite'
    },
    {
      id: 'db2',
      url: 'postgres://postgres:35ozenad@test-db.c3sosskwwcnd.eu-central-1.rds.amazonaws.com:5432'
    },
    {
      id: 'db3',
      url: 'mongodb://127.0.0.1:27017/betbolt?retryWrites=true&w=majority&authSource=admin',
    }
  ],
  resources: [
    {
        dataSource: 'db2', table: 'audit_logs',
        columns: [
            { name: 'id', primaryKey: true, required: false, fillOnCreate: ({initialRecord}: any) => uuid() },
            { name: 'created_at', required: false },
            { name: 'resource_id', required: false },
            { name: 'user_id', required: false },
            { name: 'action', required: false },
            { name: 'diff', required: false },
            { name: 'record_id', required: false },
        ],
        options: {
            allowedActions: {
                edit: false,
                delete: false,
            }
        },
        plugins: [
            new AuditLogPlugin({
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
      dataSource: 'maindb', table: 'apartments',
      resourceId: 'aparts', // resourceId is defaulted to table name but you can change it e.g. 
                             // in case of same table names from different data sources
      label: 'Apartments',   // label is defaulted to table name but you can change it
      recordLabel: (r: any) => `🏡 ${r.title}`,
      columns: [
        { 
          name: 'id', 
          label: 'Identifier',  // if you wish you can redefine label
          showIn: ['filter', 'show'], // show in filter and in show page
          primaryKey: true,
          // @ts-ignore
          fillOnCreate: ({initialRecord, adminUser}) => Math.random().toString(36).substring(7),  // initialRecord is values user entered, adminUser object of user who creates record
        },
        { 
            name: 'title',
            required: true,
            showIn: ['list', 'create', 'edit', 'filter', 'show'],  // the default is full set
            maxLength: 255,  // you can set max length for string fields
            minLength: 3,  // you can set min length for string fields
            components: {
                edit: {
                    file: '@@/IdShow.vue',
                    meta: {
                        title: 'Title',
                        description: 'This is title of apartment'
                    }
                },
                // show: '@@/IdShow.vue',
                // create: {
                //     file: '@@/IdShow.vue',
                //     meta: {
                //         title: 'Title',
                //         description: 'This is title of apartment'
                //     }
                // }
                // list: '@@/IdShow.vue',
            },
        }, 
        {
          name: 'created_at',
          type: AdminForth.Types.DATETIME ,
          allowMinMaxQuery: true,
          showIn: ['list', 'filter', 'show', 'edit'],

          // @ts-ignore
          fillOnCreate: ({initialRecord, adminUser}) => (new Date()).toISOString(),
        },
        { 
          name: 'price',
          min: 10,
          max: 10000.12,
          allowMinMaxQuery: true,  // use better experience for filtering e.g. date range, set it only if you have index on this column or if there will be low number of rows
          editingNote: 'Price is in USD',  // you can appear note on editing or creating page
        },
        { 
          name: 'square_meter', 
          label: 'Square', 
          // allowMinMaxQuery: true,
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
        },
        {
          name: 'property_type',
          enum: [{
            value: 'house',
            label: 'House'
          }, {
            value: 'apartment',
            label: 'Apartment'
          }, {
            value: null,
            label: 'Not defined'
          }],
          // allowCustomValue: true,
        },
        {
          name: 'listed',
          required: true,  // will be required on create/edit
        },
        {
          name: 'user_id',
          foreignResource: {
            resourceId: 'users',
            hooks: {
              dropdownList: {
                beforeDatasourceRequest: async ({ query, adminUser }: any) => {
                  console.log('beforeDatasourceRequest', query, adminUser)
                  return { ok: true, error: ""}
                },
                afterDatasourceResponse: async ({ response, adminUser }: any) => {
                  console.log('beforeDatasourceRequest', response, adminUser)

                  return { ok: true, error: "" }
                }
              },
            }
          }
        }
      ],
      options:{
        pageInjections: {
          show: {
            beforeBreadcrumbs: '@@/TopLine.vue',
          },
          list: {
            bottom: '@@/TopLine.vue',
          }
        },
        listPageSize: 5,
        bulkActions: [{
          label: 'Mark as listed',
          // icon: 'typcn:archive',
          state:'active',
          confirm: 'Are you sure you want to mark all selected apartments as listed?',
          action: function ({selectedIds, adminUser}: any) {
            const stmt = db.prepare(`UPDATE apartments SET listed = 1 WHERE id IN (${selectedIds.map(() => '?').join(',')})`);
            stmt.run(...selectedIds);
            return { ok: true, error: false, message: 'Marked as listed' }
          }
        }
        ],
        allowedActions:{
          edit: true,
          delete: false,
          show: true,
          filter: true,
          create: false,
        },
      }

    },
    { 
      dataSource: 'maindb', 
      table: 'users',
      resourceId: 'users',
      label: 'Users',  
      recordLabel: (r: any) => `👤 ${r.email}`,
      plugins: [
        new ForeignInlineListPlugin({
          foreignResourceId: 'aparts',
          modifyTableResourceConfig: (resourceConfig: AdminForthResource) => {
            // hide column 'square_meter' from both 'list' and 'filter'
            resourceConfig.columns.find((c: AdminForthResourceColumn) => c.name === 'square_meter')!.showIn = [];
            resourceConfig.options!.listPageSize = 3;
          },
        }),
      ],
      options: {
        allowedActions: {
          create: async ({adminUser, meta}: {adminUser: AdminUser, meta: any}) => {
            console.log('create', adminUser, meta);
            return true;
          },
          delete: true,
        },
      },
      columns: [
        { 
          name: 'id', 
          primaryKey: true,
          fillOnCreate: ({initialRecord, adminUser}: any) => uuid(),
          showIn: ['list', 'filter', 'show'],  // the default is full set
        },
        { 
          name: 'email', 
          isUnique: true,
          required:false,
          validation: [
            {
              regExp:  '^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
              message: 'Email is not valid, must be in format example@test.com'
            },
          ]
        },
        { 
          name: 'created_at', 
          type: AdminForth.Types.DATETIME,
          showIn: ['list', 'filter', 'show'],
          fillOnCreate: ({initialRecord, adminUser}: any) => (new Date()).toISOString(),
        },
        // { 
        //   name: 'password_hash',
        //   type: AdminForth.Types.STRING,
        //   showIn: [],
        //   backendOnly: true,  // will never go to frontend
        // },
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
          required: { create: true }, // to show only in create page
          editingNote: { edit: 'Leave empty to keep password unchanged' },

          minLength: 8,
          type: AdminForth.Types.STRING,
          showIn: ['create', 'edit'], // to show in create and edit pages
          masked: true, // to show stars in input field
        }
      ],
      hooks: {
        list: {
          afterDatasourceResponse: async ({ query, adminUser }: any) => {
            return { ok: true, error: "" }
          }
        },
        create: {
          beforeSave: async ({ record, adminUser, resource }: any) => {
            record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
            return { ok:true, error: "" };
            // if return 'error': , record will not be saved and error will be proxied
          }
        },
        edit: {
          beforeSave: async ({ record, adminUser, resource}: any) => {
            if (record.password) {
              record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
            }
            return { ok: true, error: "" }
          },
          // beforeDatasourceRequest: async ({ query, adminUser, resource }) => {
          //   return { ok: true, error: false }
          // },
          // afterDatasourceResponse: async ({ response, adminUser }) => {
          //   return { ok: true, error: false }
          // }
        },
        // list: {
        //   beforeDatasourceRequest: async ({ query, adminUser }) => {
        //     return { ok: true, error: false }
        //   },
        //   afterDatasourceResponse: async ({ response, adminUser }) => {
        //     return { ok: true, error: false }
        //   }
        // },
        // show: {
        //   beforeDatasourceRequest: async ({ query, adminUser, resource }) => {
        //     return { ok: true, error: false }
        //   },
        //   afterDatasourceResponse: async ({ response, adminUser, resource }) => {
        //     return { ok: true, error: false }
        //   }
        // },
        
      }
    },
    {
        dataSource: 'db2', table: 'games',
        resourceId: 'games',
        label: 'Games',
        columns: [
            {
                name: 'id', 
                readOnly: true, required: false, 
                label: 'Identifier', fillOnCreate: ({initialRecord}: any) => uuid(),
                showIn: ['list', 'filter', 'show'],  // the default is full set
            },
            { name: 'name', required: true, isUnique: true },
            { name: 'created_by', required: true,
                enum: [
                    { value: 'CD Projekt Red', label: 'CD Projekt Red' },
                    { value: 'Rockstar Studios', label: 'Rockstar' },
                    { value: 'Bethesda Game Studios', label: 'Bethesda' },
                    
                ]
            },
            { name: 'release_date', fillOnCreate: ({initialRecord}: any) => (new Date()).toISOString() },
            { name: 'release_date2' },
            { name: 'description' },
            { name: 'price' },
            { name: 'enabled' },
        ],
        options: {
          listPageSize: 10,
        },
      },
      {
        dataSource: 'db2', table: 'users',
        resourceId: 'games_users',
        label: 'Games users',
        columns: [
            { 
              name: 'id', 
              primaryKey: true,
              fillOnCreate: ({initialRecord, adminUser}: any) => uuid(),
              showIn: ['list', 'filter', 'show'],  // the default is full set
            },
            { 
              name: 'email', 
              required: true,
              isUnique: true,
              sortable: false,
            },
            { 
              name: 'created_at', 
              type: AdminForth.Types.DATETIME,
              showIn: ['list', 'filter', 'show'],
              fillOnCreate: ({initialRecord, adminUser}: any) => (new Date()).toISOString(),
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
              required: { create: true }, // to show only in create page
              editingNote: { edit: 'Leave empty to keep password unchanged' },
    
              minLength: 8,
              type: AdminForth.Types.STRING,
              showIn: ['create', 'edit'], // to show in create and edit pages
              masked: true, // to show stars in input field
            }
        ],
    },
    {
        dataSource: 'db3', table: 'game',
        columns: [
            { name: '_id', primaryKey: true, "type": "string", "maxLength": 255,  "required": true, "default": "" },
            { name: 'bb_enabled', "type": "boolean", "required": false, "default": false },
            { name: 'bb_rank', "type": "integer", "required": false, "default": 0 },
            {
                name: 'blocked_countries',
                "type": "string", "maxLength": 255, "required": false, "default": "",
                enum: [
                    { value: 'TR', label: 'Turkey' },
                    { value: 'DE', label: 'Germany' },
                    { value: 'RU', label: 'Russia' },
                    { value: 'US', label: 'United States' },
                    { value: 'GB', label: 'United Kingdom' },
                    { value: 'FR', label: 'France' },
                    { value: 'IT', label: 'Italy' },
                    { value: 'ES', label: 'Spain' },
                    { value: 'BR', label: 'Brazil' },
                    { value: 'CA', label: 'Canada' },
                    { value: 'AU', label: 'Australia' },
                    { value: 'NL', label: 'Netherlands' },
                    { value: 'SE', label: 'Sweden' },
                    { value: 'NO', label: 'Norway' },
                    { value: 'FI', label: 'Finland' },
                    { value: 'DK', label: 'Denmark' },
                    { value: 'PL', label: 'Poland' },
                    { value: 'CZ', label: 'Czechia' },
                    { value: 'SK', label: 'Slovakia' },
                    { value: 'HU', label: 'Hungary' },
                    { value: 'RO', label: 'Romania' },
                    { value: 'BG', label: 'Bulgaria' },
                    { value: 'GR', label: 'Greece' },
                    { value: 'TR', label: 'Turkey' }
                ]
            },
            { name: 'release_date', "type": "datetime", "required": false, "default": "" },
        ]
    }
  ],
  menu: [
    {
      label: 'Dashboard',
      icon: 'flowbite:chart-pie-solid',
      component: '@@/Dash.vue',
      path: '/dashboard',
      homepage: true,
      isStaticRoute:false,
      meta:{
        title: 'Dashboard',
      }
    },
    {
      label: 'Core',
      icon: 'flowbite:brain-solid', //from here https://icon-sets.iconify.design/flowbite/
      open: true,
      children: [
        {
          label: 'Appartments',
          icon: 'flowbite:home-solid',
          resourceId: 'aparts',
        },
        {
          label: 'Games',
          icon: 'flowbite:caret-right-solid',
          resourceId: 'games',
        },
        {
          label: 'Games Users',
          icon: 'flowbite:user-solid',
          resourceId: 'games_users',
          visible:(user) => {
            return user.isRoot || user.dbUser.role === 'superadmin'
          }
        },
        {
          label: 'Casino Games',
          icon: 'flowbite:caret-right-solid',
          resourceId: 'game',
        },
        {
          label: 'Logs',
          icon: 'flowbite:search-outline',
          resourceId: 'audit_logs',
        }
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
      visible:(user) => {
        return user.isRoot || user.dbUser.role === 'superadmin'
      }
    }
  ],
})


const app = express()
app.use(express.json());
const port = 3000;

(async () => {

    // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
    await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development', verbose: true});
    console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');

})();


// add api before .serve
app.get(
  '/api/testtest/', 
  admin.express.authorize(
    async (req, res, next) => {
        res.json({ ok: true, data: [1,2,3], adminUser: req.adminUser });
    }
  )
)

// serve after you added all api
admin.express.serve(app)
admin.discoverDatabases();



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
  console.log(`\n⚡ AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}\n`)
});