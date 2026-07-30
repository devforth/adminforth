import AdminForth, { AdminForthDataTypes, logger } from '../../adminforth/index.js';
import type { AdminForthResourceInput, AdminForthResource, AdminUser, AdminForthResourceColumn } from '../../adminforth/index.js';
import { randomUUID } from 'crypto';
import ForeignInlineListPlugin from '../../plugins/adminforth-foreign-inline-list/index.js';
import UploadPlugin from '../../plugins/adminforth-upload/index.js';
import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local/index.js";
import OpenSignupPlugin from '../../plugins/adminforth-open-signup/index.js';
import DashboardPlugin from '../../plugins/adminforth-dashboard/index.js';
import UserSoftDelete from '../../plugins/adminforth-user-soft-delete/index.js';
import KeyValueAdapterRam from '../../adapters/adminforth-key-value-adapter-ram/index.js';
import OAuthPlugin from './configs/oauthPluginConfig.js';
import TwoFactorsAuthPlugin from './configs/twoFactorAuthPluginConfig.js';
import EmailInvitePlugin from '../../plugins/adminforth-email-invite/index.js';
import EmailPasswordResetPlugin from '../../plugins/adminforth-email-password-reset/index.js';

async function allowedForSuperAdmin({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

const fakeEmailAdapter = {
  validate: async () => {
    // Implement validation logic if needed
  },
  sendEmail: async (from: string, to: string, text: string, html: string, subject: string) => {
    console.log('Sending email with html:', html);
    console.log('Sending email with text:', text);
    return { ok: true };
  }
};

export default {
  dataSource: 'sqlite',
  table: 'adminuser',
  resourceId: 'adminuser',
  label: 'Admin Users',
  recordLabel: (r) => `👤 ${r.email}`,
  options: {
    allowedActions: {
      edit: allowedForSuperAdmin,
      delete: allowedForSuperAdmin,
    },
  },
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      fillOnCreate: ({ initialRecord, adminUser }) => randomUUID(),
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'email',
      required: true,
      isUnique: true,
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      showIn: {
        edit: false,
        create: false,
      },
      fillOnCreate: ({ initialRecord, adminUser }) => (new Date()).toISOString(),
    },
    {
      name: 'role',
      type: AdminForthDataTypes.STRING,
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
      type: AdminForthDataTypes.STRING,
      showIn: { // to show field only on create and edit pages
        all: false,
      },
      masked: true, // to show stars in input field

      minLength: 8,
    },
    {
      name: 'password_hash',
      type: AdminForthDataTypes.STRING,
      backendOnly: true,
      showIn: { all: false }
    },
    {
      name: 'secret2fa',
      showIn: { all: false },
      backendOnly: true,
    },
    {
      name: 'responsible_person',
      type: AdminForthDataTypes.STRING,
      foreignResource: {
          resourceId: 'adminuser',
      }
    },
    {
      name: "avatar",
      type: AdminForthDataTypes.STRING,
      showIn: ["show", "edit", "create" ],
    },
    {
      name: "is_active",
      type: AdminForthDataTypes.BOOLEAN,
      label: "Is Active",
      fillOnCreate: () => true,
      filterOptions: {
          multiselect: false,
      },
      showIn: {
          list: true,
          filter: true,
          show: true,
          create: false,
          edit: true,
      },
    },
    { 
      name: 'email_confirmed', 
      type: AdminForthDataTypes.BOOLEAN 
    },
  ],
  plugins: [
    TwoFactorsAuthPlugin,
    new ForeignInlineListPlugin({
      foreignResourceId: 'cars_sl'
    }),
    new ForeignInlineListPlugin({
      foreignResourceId: 'adminuser',
    }),
    new UploadPlugin({
      pathColumnName: "avatar",
      storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
        fileSystemFolder: "./db/uploads",
        adminServeBaseUrl: "static/source",
        mode: "public", // or "private"
        signingSecret: '1241245',
      }),
      allowedFileExtensions: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webm",
        "exe",
        "webp",
      ],
      maxFileSize: 1024 * 1024 * 20, // 20MB
      filePath: ({ originalFilename, originalExtension, contentType, record }) => {
        return `user_avatars/${originalFilename}_${Date.now()}.${originalExtension}`
      },
      preview: {
        maxWidth: "200px",
      },
    }),
    new OpenSignupPlugin({
      emailField: 'email',
      passwordField: 'password',
      passwordHashField: 'password_hash',
      defaultFieldValues: {
        role: 'user',
      },
    }),
    OAuthPlugin,
    new DashboardPlugin({
      dashboardConfigsResourceId: 'dashboard_configs',
    }),
    new UserSoftDelete({
      activeFieldName: "is_active",
      //in canDeactivate we pass a function, that specify adminusers roles, which can seactivate other adminusers  
      canDeactivate: async (adminUser: AdminUser) => {
      if (adminUser.dbUser.role === "superadmin") {
          return true;
      }
      return false;
      }
    }),
    new EmailInvitePlugin({
      emailField: 'email',
      sendFrom: 'noreply@yourapp.com',
      passwordField: 'password',
      adapter: fakeEmailAdapter,
      emailConfirmedField: 'email_confirmed', // Enable email confirmation
    }),
    new EmailPasswordResetPlugin({
      emailField: 'email',
      passwordField: 'password',
      sendFrom: 'no-reply@devforth.io',
      adapter: fakeEmailAdapter,
      userResetTokensKeyValueAdapter: new KeyValueAdapterRam(),
      expectedOrigin: process.env.RESET_PASSWORD_ORIGIN || 'http://localhost:3123',
    }),
  ],
  hooks: {
    create: {
      beforeSave: async ({ record, adminUser, resource }: { record: any, adminUser: AdminUser, resource: AdminForthResource }) => {
        if (record.password) {
          record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
        }
        return { ok: true };
      }
    },
    edit: {
      beforeSave: async ({ oldRecord, updates, adminUser, resource }: { oldRecord: any, updates: any, adminUser: AdminUser, resource: AdminForthResource }) => {
        logger.info('Updating user', updates);
        if (oldRecord.id === adminUser.dbUser.id && updates.role) {
          return { ok: false, error: 'You cannot change your own role' };
        }
        if (updates.password) {
          updates.password_hash = await AdminForth.Utils.generatePasswordHash(updates.password);
        }
        return { ok: true }
      },
    },
  },
} as AdminForthResourceInput;
