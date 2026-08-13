import AdminForth, { AdminForthDataTypes, logger } from '../../adminforth/index.js';
import type { AdminForthResourceInput, AdminForthResource, AdminUser, AdminForthResourceColumn } from '../../adminforth/index.js';
import { randomUUID } from 'crypto';
import ForeignInlineListPlugin from '../../plugins/adminforth-foreign-inline-list/index.js';
import UploadPlugin from '../../plugins/adminforth-upload/index.js';
import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local/index.js";
import OpenSignupPlugin from '../../plugins/adminforth-open-signup/index.js';
import UserSoftDelete from '../../plugins/adminforth-user-soft-delete/index.js';
import KeyValueAdapterRam from '../../adapters/adminforth-key-value-adapter-ram/index.js';
import OAuthPlugin from './configs/oauthPluginConfig.js';
import TwoFactorsAuthPlugin from './configs/twoFactorAuthPluginConfig.js';
import EmailInvitePlugin from '../../plugins/adminforth-email-invite/index.js';
import EmailPasswordResetPlugin from '../../plugins/adminforth-email-password-reset/index.js';
import { crudApprovePlugin } from './crud_manual_approve.js';

async function allowedForSuperAdmin({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

/**
 * Sends the mutation to the CRUD approve queue instead of applying it right away.
 * Returns `{ ok: true }` when the change must proceed normally: either the plugin
 * itself is re-applying an already approved change, or the request was queued and
 * the caller should stop.
 */
async function sendChangeToApproval({
  resource, action, record, updates, oldRecord, recordId, adminUser, extra,
}: any) {
  // when the plugin applies an approved change it marks the call with this flag,
  // otherwise we would queue the very same change again, forever
  if (extra?.adminforth_plugin_crud_approve?.callingFromApprovalPlugin) {
    return { ok: true };
  }

  const pkColumnName = resource.columns.find((c: AdminForthResourceColumn) => c.primaryKey)?.name || 'id';
  const data = recordId ? { [pkColumnName]: recordId } : record;

  const result = await crudApprovePlugin.createApprovalRequest({
    resource,
    action,
    data,
    user: adminUser,
    record,
    oldRecord,
    updates,
    extra,
  });
  console.log('sendChangeToApproval result', result);
  if (result.error) {
    return { ok: false, error: result.error };
  }

  // stop the original mutation, it will be executed only if a reviewer approves it
  return { ok: true, error: 'Action sent for manual approval', redirectTo: '/adminuser' };
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
      expectedOrigin: process.env.RESET_PASSWORD_ORIGIN || 'http://localhost:3123',
    }),
    OAuthPlugin,
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
    // each plugin repo installs its own copy of adminforth (and of @types/express
    // through it), so their IAdminForthPlugin is a different type identity than the
    // one of the core we import from source here. Cast only the plugins array, so
    // the rest of the resource is still checked against AdminForthResourceInput
  ] as any,
  hooks: {
    create: {
      beforeSave: async (args: any) => {
        const approval = await sendChangeToApproval({ ...args, action: 'create' });
        if (approval.error) {
          return approval;
        }
        const { record }: { record: any } = args;
        if (record.password) {
          record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
        }
        return { ok: true };
      }
    },
    edit: {
      beforeSave: async (args: any) => {
        const { oldRecord, updates, adminUser }: { oldRecord: any, updates: any, adminUser: AdminUser } = args;
        logger.info('Updating user', updates);
        if (oldRecord.id === adminUser.dbUser.id && updates.role) {
          return { ok: false, error: 'You cannot change your own role' };
        }
        const approval = await sendChangeToApproval({ ...args, action: 'edit' });
        if (approval.error) {
          return approval;
        }
        if (updates.password) {
          updates.password_hash = await AdminForth.Utils.generatePasswordHash(updates.password);
        }
        return { ok: true }
      },
    },
    delete: {
      beforeSave: async (args: any) => {
        return sendChangeToApproval({ ...args, action: 'delete' });
      },
    },
  },
} as AdminForthResourceInput;
