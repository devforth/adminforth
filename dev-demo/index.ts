import betterSqlite3 from 'better-sqlite3';
import express from 'express';
import AdminForth, { AdminForthResource, AdminForthResourceColumn, AdminUser, AllowedActionsEnum, AdminForthDataTypes, Filters } from '../adminforth/index.js';
import { v1 as uuid } from 'uuid';

import ForeignInlineListPlugin from '../adminforth/plugins/foreign-inline-list/index.js';
import AuditLogPlugin from '../adminforth/plugins/audit-log/index.js';
import TwoFactorsAuthPlugin from '../adminforth/plugins/two-factors-auth/index.js';
import UploadPlugin from '../adminforth/plugins/upload/index.js';
import ChatGptPlugin from '../adminforth/plugins/chat-gpt/index.js';
import RichEditorPlugin from '../adminforth/plugins/rich-editor/index.js';
import EmailResetPasswordPlugin from '../adminforth/plugins/email-password-reset/index.js';
import fs from 'fs';
import ImportExportPlugin from '../adminforth/plugins/import-export/index.js';
import { generate } from "random-words";


const ADMIN_BASE_URL = '';

// create test1.db
try { fs.mkdirSync('db') } catch (e) {} 
const dbPath = 'db/test.sqlite';
const db = betterSqlite3(dbPath)

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
        user_id VARCHAR(255),
        country VARCHAR(5)
    );`).run();

  await db.prepare(`
    CREATE TABLE users (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        email VARCHAR(255) NOT NULL,
        secret2fa VARCHAR(255) ,
        password_hash VARCHAR(255) NOT NULL,
        created_at VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL
    );`).run();

  
  for (let i = 0; i < 50; i++) {
    await db.prepare(`
      INSERT INTO apartments (
        id, title, square_meter, price, number_of_rooms, description, created_at, listed, property_type
      ) VALUES ('${i}', 
        '${generate({ min: 2, max: 5, join: ' ' })}', 
        ${(Math.random() * 1000000).toFixed(1)}, ${(Math.random() * 10000).toFixed(2)}, ${Math
        .floor(Math.random() * 5) }, 
        'Next gen apartments', 
        ${Date.now() / 1000 - 60 * 60 * 24 * 7 * Math.random()},
        ${Math.random() > 0.5 ? 1 : 0},
        ${Math.random() > 0.5 ? "'house'" : "'apartment'"});
      `).run();
  }

}

const tableExistsAuditLog = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='audit_log';`).get();
if (!tableExistsAuditLog) {
  await db.prepare(`
    CREATE TABLE audit_log (
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

const tableExistsDescriptionImage = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='description_image';`).get();
if (!tableExistsDescriptionImage) {
  await db.prepare(`
    CREATE TABLE description_image (
      id uuid NOT NULL,  -- identifier of applied change record 
      created_at timestamp without time zone, -- timestamp of applied change
      resource_id varchar(255), -- identifier of resource where change were applied
      record_id varchar, -- identifier of record that been changed
      image_path varchar(255), -- path to image
      PRIMARY KEY(id)
    );`).run();
}

// check column apartment_image in aparts table
const columns = await db.prepare('PRAGMA table_info(apartments);').all();
const columnExists = columns.some((c) => c.name === 'apartment_image');
if (!columnExists) {
  await db.prepare('ALTER TABLE apartments ADD COLUMN apartment_image VARCHAR(255);').run();
}

const demoChecker = async ({ record, adminUser, resource }) => {
  if (adminUser.dbUser.role !== 'superadmin') {
    return { ok: false, error: "You can't do this on demo.adminforth.dev" }
  }
  return { ok: true };
}

export const admin = new AdminForth({
  baseUrl : ADMIN_BASE_URL,
  // deleteConfirmation: false,
  auth: {
    resourceId: 'users',  // resource for getting user
    usernameField: 'email',
    passwordHashField: 'password_hash',
    userFullNameField: 'fullName', // optional
    loginBackgroundImage: 'https://images.unsplash.com/photo-1534239697798-120952b76f2b?q=80&w=3389&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    loginBackgroundPosition: '1/2', // over, 3/4, 2/5, 3/5 (tailwind grid)
    demoCredentials: "adminforth:adminforth",  // never use it for production
    loginPromptHTML: "Use email <b>adminforth</b> and password <b>adminforth</b> to login",
    // loginBackgroundImage: '@@/pho.jpg',
    rememberMeDays: 30,
  },
  customization: {
    customComponentsDir: './custom',
    globalInjections: {
      userMenu: '@@/login2.vue',
    },
    customPages:[{
      path : '/login2',
      component: {
        file:'@@/login2.vue',
        meta: {
          customLayout: true,
      }}
    }],
   
    vueUsesFile: '@@/vueUses.ts',  // @@ is alias to custom directory,
    brandName: 'New Reality',
    showBrandNameInSidebar: true,
    // datesFormat: 'D MMM YY',
    // timeFormat: 'HH:mm:ss',
    datesFormat: 'DD MMM',
    timeFormat: 'hh:mm a',

    title: 'Devforth Admin',
    // brandLogo: '@@/df.svg',
    emptyFieldPlaceholder: '-',
    // styles:{
    //   colors: {
    //     light: {
    //       primary: '#425BB8',
    //       sidebar: {main:'#1c2a5b', text:'white'},
    //     },
    //   }
    // },

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
    },

    announcementBadge: (adminUser: AdminUser) => {
      return { 
        html: `
<svg xmlns="http://www.w3.org/2000/svg" style="display:inline; margin-top: -4px" width="16" height="16" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg> 
<a href="https://github.com/devforth/adminforth" style="font-weight: bold; text-decoration: underline" target="_blank">Star us on GitHub</a> to support a project!`,
        closable: true,
        title: 'Support us for free',
      }
    }
   },
 

  dataSources: [
    {
      id: 'maindb',
      url: `sqlite://${dbPath}`
    },
    {
      id: 'db2',
      url: 'postgres://postgres:35ozenad@test-db.c3sosskwwcnd.eu-central-1.rds.amazonaws.com:5432'
    },
    {
      id: 'db3',
      url: 'mongodb://127.0.0.1:27017/betbolt?retryWrites=true&w=majority&authSource=admin',
    },
    {
      id: 'ch',
      url: 'clickhouse://demo:demo@localhost:8124/demo',

    }
  ],
  resources: [
    {
      dataSource: 'ch', 
      table: 'clicks',
      /*
      SQL to create table run SQL in http://localhost:8123/play
      CREATE TABLE demo.clicks (
        clickid UUID PRIMARY KEY,
        element String,
        clientX Int32,
        created_at DateTime,
        aggressiveness Float32,
        click_price Decimal(10, 2)

      )

      */
      columns: [
        { 
          name: 'clickid', primaryKey: true, required: false, fillOnCreate: ({initialRecord}: any) => uuid(),
          showIn: ['list', 'filter', 'show'],
          components: {
            list: '@/renderers/CompactUUID.vue'
          }
        },
        { name: 'element', 
          type: AdminForthDataTypes.STRING,
          required: false,
          enum: [
            { value: 'button', label: 'Button' },
            { value: 'link', label: 'Link' },
            { value: 'image', label: 'Image' },
          ]
        },
        { name: 'clientX', 
          type: AdminForthDataTypes.INTEGER,
          allowMinMaxQuery: true,
          required: false },
        { name: 'created_at', 
          type: AdminForthDataTypes.DATETIME,
          required: false },
        { name: 'aggressiveness', 
          allowMinMaxQuery: true,
          type: AdminForthDataTypes.FLOAT,
          required: false,
          showIn: ['filter', 'show', 'edit'],
        },
        {
          name: 'click_price',
        }
      ],
    },
    {
        dataSource: 'maindb', table: 'audit_log',
        columns: [
            { name: 'id', primaryKey: true, required: false, fillOnCreate: ({initialRecord}: any) => uuid() },
            { name: 'created_at', required: false },
            { name: 'resource_id', required: false },
            { name: 'user_id', required: false, 
              foreignResource: {
                resourceId: 'users',
              },
            },
            { name: 'action', required: false },
            { name: 'diff', required: false, type: AdminForthDataTypes.JSON },
            { name: 'record_id', required: false },
        ],
        
        options: {
            allowedActions: {
                edit: false,
                delete: false,
            },
        },
        plugins: [
          new AuditLogPlugin({
              resourceColumns: {
                  resourceUserIdColumnName: 'user_id',
                  resourceRecordIdColumnName: 'record_id',
                  resourceActionColumnName: 'action',
                  resourceDataColumnName: 'diff',
                  resourceCreatedColumnName: 'created_at',
                  resourceIdColumnName: 'resource_id',
              },
          }),
        ],
       
    },
    {
      dataSource: 'maindb', table: 'apartments',
      resourceId: 'aparts', // resourceId is defaulted to table name but you can change it e.g. 
                             // in case of same table names from different data sources
      label: 'Apartments',   // label is defaulted to table name but you can change it
      recordLabel: (r: any) => `🏡 ${r.title}`,
      hooks: {
        delete: {
          beforeSave: demoChecker,
        },
      },
      
      columns: [
        { 
          name: 'id', 
          label: 'Identifier',  // if you wish you can redefine label
          showIn: ['filter', 'show', 'list'], // show in filter and in show page
          primaryKey: true,
          // @ts-ignore
          fillOnCreate: ({initialRecord, adminUser}) => Math.random().toString(36).substring(7),  
          // fillOnCreate: ({initialRecord}: any) => randomUUID(),
          components: {
            list: '@/renderers/CompactUUID.vue'
          }// initialRecord is values user entered, adminUser object of user who creates record
        },
        { 
            name: 'title',
            // type: AdminForthDataTypes.JSON,
            required: true,
            showIn: ['list', 'create', 'edit', 'filter', 'show'],  // the default is full set
            maxLength: 255,  // you can set max length for string fields
            minLength: 3,  // you can set min length for string fields
            components: {
                // edit: {
                //     file: '@@/IdShow.vue',
                //     meta: {
                //         title: 'Title',
                //         description: 'This is title of apartment'
                //     }
                // },
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
          name: 'country',
          components: {
            list: {
              file: '@/renderers/CountryFlag.vue',
              meta: {
                showCountryName: false,
              }
            }
          },
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
            value: 'NL',
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
          name: 'created_at',
          type: AdminForthDataTypes.DATETIME ,
          allowMinMaxQuery: true,
          showIn: ['list', 'filter', 'show', 'edit'],
          components: {
            list: '@/renderers/RelativeTime.vue'
          },
          // @ts-ignore
          fillOnCreate: ({initialRecord, adminUser}) => (new Date()).toISOString(),
        },
        {
          name: 'apartment_image',
          showIn: ['show',],
          required: false,
          editingNote: 'Upload image of apartment',
        },
        { 
          name: 'price',
          showIn: ['create', 'edit', 'filter', 'show'],
          allowMinMaxQuery: true,  // use better experience for filtering e.g. date range, set it only if you have index on this column or if there will be low number of rows
          editingNote: 'Price is in USD',  // you can appear note on editing or creating page
        },
        { 
          name: 'square_meter', 
          label: 'Square', 
          // allowMinMaxQuery: true,
          minValue: 1,  // you can set min /max value for number fields
          maxValue: 100000000,
          components: {
            list: {
              file: '@/renderers/HumanNumber.vue',
              meta: {
                showCountryName: true,
              }
            }
          }
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
          showIn: ['filter', 'show', 'create', 'edit'],
        },
        { 
          name: 'description',
          sortable: false,
          type: AdminForthDataTypes.RICHTEXT,
          showIn: ['filter', 'show', 'edit', 'create'],
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
          showIn: [ 'filter', 'show', 'edit', 'list', 'create'],
          foreignResource: {
            resourceId: 'users',
            hooks: {
              dropdownList: {
                beforeDatasourceRequest: async ({ query, adminUser }: any) => {
                  return { ok: true, error: ""}
                },
                afterDatasourceResponse: async ({ response, adminUser }: any) => {
                  return { ok: true, error: "" }
                }
              },
            }
          }
        }
      ],
      plugins: [
        ...(process.env.AWS_ACCESS_KEY_ID ? [
          new UploadPlugin({
            pathColumnName: 'apartment_image',
            s3Bucket: 'tmpbucket-adminforth',
            s3Region: 'eu-central-1',
            allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'exe', 'webp'],
            maxFileSize: 1024 * 1024 * 20, // 5MB
            s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
            // s3ACL: 'public-read', // ACL which will be set to uploaded file
            s3Path: ({originalFilename, originalExtension, contentType}) => `aparts/${new Date().getFullYear()}/${uuid()}/${originalFilename}.${originalExtension}`,
            generation: {
              provider: 'openai-dall-e',
              countToGenerate: 2,
              openAiOptions: {
                model: 'dall-e-3',
                size: '1792x1024',
                apiKey: process.env.OPENAI_API_KEY as string,
              },
              fieldsForContext: ['title'],
              rateLimit: {
                limit: '2/1m',
                errorMessage: 'For demo purposes, you can generate only 2 images per minute',
              }
            },
            preview: {
              // Used to display preview (if it is image) in list and show views
              // previewUrl: ({s3Path}) => `https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${s3Path}`,
              showInList: true,
            }
          }),
        ]: []),
        new ImportExportPlugin({}),
        // new ChatGptPlugin({
        //   openAiApiKey: process.env.OPENAI_API_KEY as string,
        //   model: 'gpt-4o',
        //   fieldName: 'title',
        //   expert: {
        //     debounceTime: 250,
        //   }
        // }),
        // new ChatGptPlugin({
        //   openAiApiKey: process.env.OPENAI_API_KEY as string,
        //   fieldName: 'description',
        //   model: 'gpt-4o',
        //   expert: {
        //     debounceTime: 250,
        //   }
        // }),
        new RichEditorPlugin({
          htmlFieldName: 'description',
          completion: {
            provider: 'openai-chat-gpt',
            params: {
              apiKey: process.env.OPENAI_API_KEY as string,
              model: 'gpt-4o',
            },
            expert: {
              debounceTime: 250,
            }
          }, 
          // requires to have table 'description_images' with upload plugin installed on attachment field
          
          ...(process.env.AWS_ACCESS_KEY_ID ? {
            attachments: {
              attachmentResource: 'description_images',
              attachmentFieldName: 'image_path',
              attachmentRecordIdFieldName: 'record_id',
              attachmentResourceIdFieldName: 'resource_id',
            },
          }: {}),
        }),
      ],

      options:{
          
        pageInjections: {
          list: {
            customActionIcons: '@@/IdShow.vue',
            // bottom: {
            //   file: '@@/TopLine.vue',
            //   meta: {
            //     thinEnoughToShrinkTable: true,
            //   }
            // }
          },
        //   show: {
        //     beforeBreadcrumbs: '@@/TopLine.vue',
        //   },
        },
        listPageSize: 25,
        // listTableClickUrl: async (record, adminUser) => null,
        createEditGroups: [
          {
            groupName: 'Main info',
            columns: ['id','title', 'description', 'country', 'apartment_image']
          },
          {
            groupName: 'Characteristics',
            columns: ['price', 'square_meter', 'number_of_rooms', "property_type", "listed"]
          }
        ],
        bulkActions: [
          {
            label: 'Mark as listed',
            // icon: 'typcn:archive',
            state:'active',
            confirm: 'Are you sure you want to mark all selected apartments as listed?',
            action: async function ({selectedIds, adminUser}: any) {
              const stmt = db.prepare(`UPDATE apartments SET listed = 1 WHERE id IN (${selectedIds.map(() => '?').join(',')})`);
              await stmt.run(...selectedIds);
              return { ok: true, successMessage: 'Marked as listed' }
            }
          }
        ],
        allowedActions:{
          edit: true,
          delete: async (p) => { return true; },
          show: true,
          filter: true,
          create: true,
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
        new ForeignInlineListPlugin({
          foreignResourceId: 'audit_log',
         
        }),
        new TwoFactorsAuthPlugin({
          twoFaSecretFieldName: 'secret2fa',
          // optional callback to define which users should be enforced to use 2FA
          usersFilterToApply: (adminUser: AdminUser) => {
            if (process.env.NODE_ENV === 'development') {
              return false;
            }
            // return true if user should be enforced to use 2FA,
            // return true;
            return adminUser.dbUser.email !== 'adminforth'
          },
        }), 
        new EmailResetPasswordPlugin({
          emailProvider: 'AWS_SES',
          emailField: 'email',
          sendFrom: 'no-reply@devforth.io',
          providerOptions: {
            AWS_SES: {
              region: 'eu-central-1',
              accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
            }
          },
          passwordField: 'password',
        }),
      ],
      options: {
        allowedActions: {
          create: async ({adminUser, meta}: {adminUser: AdminUser, meta: any}) => {
            // console.log('create', adminUser, meta);
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
          name: 'secret2fa',
          type: AdminForthDataTypes.STRING,
          showIn: [],
          backendOnly: true,
        },
        { 
          name: 'email', 
          isUnique: true,
          required: true,
          enforceLowerCase: true,
        },
        { 
          name: 'created_at', 
          type: AdminForthDataTypes.DATETIME,
          showIn: ['list', 'filter', 'show'],
          fillOnCreate: ({initialRecord, adminUser}: any) => (new Date()).toISOString(),
        },
        { 
          name: 'password_hash',
          showIn: [],
          backendOnly: true,  // will never go to frontend
        },
        {
          name: 'role',
          enum: [
            // { value: 'superadmin', label: 'Super Admin' },
            { value: 'user', label: 'User' },
          ]
        },
        {
          name: 'password',
          virtual: true,  // field will not be persisted into db
          required: { create: true }, // to show only in create page
          editingNote: { edit: 'Leave empty to keep password unchanged' },

          minLength: 8,
          validation: [
            AdminForth.Utils.PASSWORD_VALIDATORS.UP_LOW_NUM,
          ],
          type: AdminForthDataTypes.STRING,
          showIn: ['create', 'edit'], // to show in create and edit pages
          masked: true, // to show stars in input field
        }
      ],
      hooks: {
        list: {
          afterDatasourceResponse: async ({ query, adminUser }: any) => {
            response.data = response.data.map((r: any) => {
              r.role = Math.random() > 0.5 ? 'admin' : 'user';
            });
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
      dataSource: 'maindb', 
      table: 'description_image',
      resourceId: 'description_images',
      label: 'Description images',
      columns: [
        { name: 'id', primaryKey: true, required: false, fillOnCreate: ({initialRecord}: any) => uuid() },
        { name: 'created_at', required: false, fillOnCreate: ({initialRecord}: any) => (new Date()).toISOString() },
        { name: 'resource_id', required: false },
        { name: 'record_id', required: false },
        { name: 'image_path', required: false },
      ],
      plugins: [
        ...(process.env.AWS_ACCESS_KEY_ID ? [
            new UploadPlugin({
              pathColumnName: 'image_path',
              s3Bucket: 'tmpbucket-adminforth',
              s3Region: 'eu-central-1',
              allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'exe', 'webp'],
              maxFileSize: 1024 * 1024 * 20, // 5MB
              s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
              s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
              
              // rich editor plugin supports only 'public-read' ACL images for SEO purposes (instead of presigned URLs which change every time)
              s3ACL: 'public-read', // ACL which will be set to uploaded file
              
              s3Path: ({originalFilename, originalExtension, contentType}) => `description_images/${new Date().getFullYear()}/${uuid()}/${originalFilename}.${originalExtension}`,
          
              preview: {
                  // Used to display preview (if it is image) in list and show views instead of just path
                  // previewUrl: ({s3Path}) => `https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${s3Path}`,

                  // show image preview instead of path in list view
                  // showInList: false,
              }
            }),
        ]: []),
      ],
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
              type: AdminForthDataTypes.DATETIME,
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
              type: AdminForthDataTypes.STRING,
              showIn: ['create', 'edit'], // to show in create and edit pages
              masked: true, // to show stars in input field
            }
        ],
    },
    {
        dataSource: 'db3', table: 'game',
        columns: [
            { name: '_id', primaryKey: true, "type": "string", "maxLength": 255,  "required": true, "default": "" },
            { name: 'bb_enabled', "type": "boolean", "required": false, "default": false, backendOnly: true },
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
      // homepage: true,
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
          label: 'Apartments',
          icon: 'flowbite:home-solid',
          resourceId: 'aparts',
          // badge: async (adminUser) => {
          //   return '10'
          // }
        },
        {
          label: 'Description Images',
          resourceId: 'description_images',
          icon: 'flowbite:image-solid',

        },

        // {
        //   label: 'Games',
        //   icon: 'flowbite:caret-right-solid',
        //   resourceId: 'games',
        // },
        // {
        //   label: 'Games Users',
        //   icon: 'flowbite:user-solid',
        //   resourceId: 'games_users',
        //   visible:(user) => {
        //     return user.dbUser.role === 'superadmin'
        //   }
        // },
        // {
        //   label: 'Casino Games',
        //   icon: 'flowbite:caret-right-solid',
        //   resourceId: 'game',
        // },

        {
          label: 'Clicks',
          icon: 'flowbite:search-outline',
          resourceId: 'clicks',
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
      visible:(user) => {
        return user.dbUser.role === 'superadmin'
      }
    },
    {
      label: 'Logs',
      icon: 'flowbite:search-outline',
      resourceId: 'audit_log',
    },
  ],
})


const app = express()
app.use(express.json());
const port = 3000;

(async () => {

    // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
    await admin.bundleNow({ hotReload: false || process.env.NODE_ENV === 'development'});
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

app.get(`${ADMIN_BASE_URL}/api/dashboard/`,
  admin.express.authorize(
    async (req, res) => {

      admin.getPluginByClassName<AuditLogPlugin>('AuditLogPlugin').logCustomAction(
        'aparts',
        null,
        'visitedDashboard',
        { dashboard: 'main' },
        req.adminUser
      )

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