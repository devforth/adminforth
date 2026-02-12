import AdminForth, { AdminForthDataTypes, logger } from '../../adminforth/index.js';
import type { AdminForthResourceInput, AdminForthResource, AdminUser, AdminForthResourceColumn } from '../../adminforth/index.js';
import { randomUUID } from 'crypto';
import TwoFactorsAuthPlugin from '../../plugins/adminforth-two-factors-auth/index.js'
import ForeignInlineListPlugin from '../../plugins/adminforth-foreign-inline-list/index.js';
import UploadPlugin from '../../plugins/adminforth-upload/index.js';
import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local/index.js";
import AdminForthAdapterS3Storage from '../../adapters/adminforth-storage-adapter-amazon-s3/index.js';
import AdminForthAdapterGoogleOauth2 from '../../adapters/adminforth-google-oauth-adapter/index.js';
import OpenSignupPlugin from '../../plugins/adminforth-open-signup/index.js';
import OAuthPlugin from '../../plugins/adminforth-oauth/index.js';


async function allowedForSuperAdmin({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

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
        show: false,
        list: false,
        filter: false,
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
  ],
  plugins: [
    new TwoFactorsAuthPlugin (
      { 
        twoFaSecretFieldName: 'secret2fa', 
        timeStepWindow: 1,
        stepUpMfaGracePeriodSeconds: 300,
        usersFilterToAllowSkipSetup: (adminUser: AdminUser) => {
          // allow skip setup 2FA for users which email is 'adminforth' or 'adminguest'
          return (true);
        },
        passkeys: {
          credentialResourceID: "passkeys",
          credentialIdFieldName: "credential_id",
          credentialMetaFieldName: "meta",
          credentialUserIdFieldName: "user_id",
          settings: {
            expectedOrigin: "http://localhost:3000",
            rp: {
                name: "New Reality",
              },
            user: {
              nameField: "email",
              displayNameField: "email",
            },
            authenticatorSelection: {
              authenticatorAttachment: "both",
              requireResidentKey: true,
              userVerification: "required",
            },
          },
        } 
      }
    ),
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
    new OAuthPlugin({
      userAvatarField: "avatar",
      adapters: [
        new AdminForthAdapterGoogleOauth2({
          clientID: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          useOpenIdConnect: false,
        }),
      ],
      emailField: 'email',
      openSignup: {
        enabled: true,
        defaultFieldValues: { // Set default values for new users
          role: 'user',
        },
      },
    }),
  ],
  hooks: {
    create: {
      beforeSave: async ({ record, adminUser, resource }: { record: any, adminUser: AdminUser, resource: AdminForthResource }) => {
        record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
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