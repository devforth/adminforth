import AdminForth, { AdminForthDataTypes, AdminForthResourceColumn } from 'adminforth';
import ForeignInlineListPlugin from '@adminforth/foreign-inline-list';
import { randomUUID } from 'crypto';
import CaptchaAdapterCloudflare from '../../../adapters/adminforth-login-captcha-adapter-cloudflare/index.js';
import CaptchaPlugin from '../../../plugins/adminforth-login-captcha/index.js';

const blockDemoUsers = async ({ record, adminUser, resource }) => {
  if (adminUser.dbUser && adminUser.dbUser.role !== 'superadmin') {
    return { ok: false, error: "You can't do this on demo.adminforth.dev" }
  }
  return { ok: true };
} 
export default { 
  dataSource: 'maindb', 
  table: 'users',
  resourceId: 'users',
  label: 'Users',  
  recordLabel: (r) => `👤 ${r.email}`,
  plugins: [
    new ForeignInlineListPlugin({
      foreignResourceId: 'aparts',
      modifyTableResourceConfig: (resourceConfig: AdminForthResource) => {
        // hide column 'square_meter' from both 'list' and 'filter'
        const column = resourceConfig.columns.find((c: AdminForthResourceColumn) => c.name === 'square_meter')!.showIn = [];
        // feel free to console.log and edit resourceConfig as you need
      },
    }),
    new ForeignInlineListPlugin({
      foreignResourceId: 'audit_logs',
    }),
    new CaptchaPlugin({ 
        captchaAdapter: new CaptchaAdapterCloudflare({
        siteKey: "0x4AAAAAACy5qrUGxw0KU3KI", // Replace with your site key
        secretKey: "0x4AAAAAACy5qvlONDC41YGD9XCwRl9xHD0", // Replace with your secret key
      }),
    }),
  ],
  columns: [
    { 
      name: 'id', 
      label: 'Identifier',
      primaryKey: true,
      fillOnCreate: ({ initialRecord, adminUser }: any) => randomUUID(),
      showIn: ['list', 'filter', 'show'],
    },
    { 
      name: 'email', 
      type: AdminForthDataTypes.STRING,
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
}