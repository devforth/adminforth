import AdminForth, {
  AdminForthDataTypes,
  AdminForthResource,
  AdminForthResourceColumn,
  AdminForthResourceInput,
  AdminUser,
} from "../../adminforth";
import ForeignInlineListPlugin from "../../plugins/adminforth-foreign-inline-list";
import OpenSignupPlugin from "../../plugins/adminforth-open-signup";
import TwoFactorsAuthPlugin from "../../plugins/adminforth-two-factors-auth";
import EmailResetPasswordPlugin from "../../plugins/adminforth-email-password-reset/index.js";
import { v1 as uuid } from "uuid";
import EmailAdapterAwsSes from "../../adapters/adminforth-email-adapter-aws-ses/index.js";
import { OAuth2SSOPlugin } from "../../plugins/adminforth-sso-auth";
import { AdminForthAdapterGoogleOauth2 } from "../../adapters/adminforth-google-oauth-adapter";
import { AdminForthAdapterGithubOauth2 } from "../../adapters/adminforth-github-oauth-adapter";
export default {
  dataSource: "maindb",
  table: "users",
  resourceId: "users",
  label: "Users",

  recordLabel: (r: any) => `👤 ${r.email}`,
  plugins: [
    // new ForeignInlineListPlugin({
    //   foreignResourceId: "aparts",
    //   modifyTableResourceConfig: (resourceConfig: AdminForthResource) => {
    //     // hide column 'square_meter' from both 'list' and 'filter'
    //     resourceConfig.columns.find(
    //       (c: AdminForthResourceColumn) => c.name === "square_meter"
    //     )!.showIn = [];
    //     resourceConfig.options!.listPageSize = 3;
    //   },
    // }),
    new ForeignInlineListPlugin({
      foreignResourceId: "audit_log",
    }),
    new ForeignInlineListPlugin({
      foreignResourceId: "users",
    }),
    new TwoFactorsAuthPlugin({
      twoFaSecretFieldName: "secret2fa",
      timeStepWindow: 1, // optional time step window for 2FA
      // optional callback to define which users should be enforced to use 2FA
      usersFilterToApply: (adminUser: AdminUser) => {
        if (process.env.NODE_ENV === "development") {
          return false;
        }
        // return true if user should be enforced to use 2FA,
        // return true;
        return adminUser.dbUser.email !== "adminforth";
      },
      usersFilterToAllowSkipSetup: (adminUser: AdminUser) => {
        return adminUser.dbUser.email === "adminforth";
      },
    }),
    ...(process.env.AWS_ACCESS_KEY_ID
      ? [
        new EmailResetPasswordPlugin({
          emailField: "email",
          sendFrom: "no-reply@devforth.io",
          adapter: new EmailAdapterAwsSes({
            region: "eu-central-1",
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
          }),
          passwordField: "password",
        })]
      : []
    ),
    new OpenSignupPlugin({
      emailField: "email",
      passwordField: "password",
      passwordHashField: "password_hash",
      defaultFieldValues: {
        role: "user",
      },
      // confirmEmails: {
      //   emailConfirmedField: "email_confirmed",
      //   sendFrom: "no-reply@devforth.io",
      //   adapter: new EmailAdapterAwsSes({
      //     region: "eu-central-1",
      //     accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      //   }),
      // },
    }),
    new OAuth2SSOPlugin({
      adapters: [
        new AdminForthAdapterGithubOauth2({
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          redirectUri: 'http://localhost:3000/oauth/callback',
        }),
        new AdminForthAdapterGoogleOauth2({
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          redirectUri: 'http://localhost:3000/oauth/callback',
        })
      ],
      emailField: 'email',
      emailConfirmedField: 'email_confirmed'
    }),
  ],
  options: {
    allowedActions: {
      create: async ({
        adminUser,
        meta,
      }: {
        adminUser: AdminUser;
        meta: any;
      }) => {
        // console.log('create', adminUser, meta);
        return true;
      },
      delete: true,
    },
  },
  columns: [
    {
      name: "id",
      primaryKey: true,
      fillOnCreate: ({ initialRecord, adminUser }: any) => uuid(),
      showIn: ["list", "filter", "show"], // the default is full set
    },
    {
      name: "secret2fa",
      type: AdminForthDataTypes.STRING,
      showIn: [],
      backendOnly: true,
    },
    {
      name: "email",
      isUnique: true,
      required: true,
      enforceLowerCase: true,
      type: AdminForthDataTypes.STRING,
      validation: [AdminForth.Utils.EMAIL_VALIDATOR],
    },
    {
      name: "created_at",
      type: AdminForthDataTypes.DATETIME,
      showIn: ["list", "filter", "show"],
      fillOnCreate: ({ initialRecord, adminUser }: any) =>
        new Date().toISOString(),
    },
    {
      name: "password_hash",
      showIn: [],
      backendOnly: true, // will never go to frontend
    },
    {
      name: 'email_confirmed',
      type: AdminForthDataTypes.BOOLEAN,
      showIn: {
        list: true,
        show: true,
        edit: false,
        create: false
      }
    },
    {
      name: "role",
      enum: [
        // { value: 'superadmin', label: 'Super Admin' },
        { value: "user", label: "User" },
      ],
    },
    {
      name: "password",
      virtual: true, // field will not be persisted into db
      required: { create: true }, // to show only in create page
      editingNote: { edit: "Leave empty to keep password unchanged" },

      minLength: 8,
      validation: [AdminForth.Utils.PASSWORD_VALIDATORS.UP_LOW_NUM],
      type: AdminForthDataTypes.STRING,
      showIn: ["create", "edit"], // to show in create and edit pages
      masked: true, // to show stars in input field
    },
    {
      name: "last_login_ip",
      showIn: ["show", "list", "filter"],
    },
    {
      name: "parentUserId",
      foreignResource: {
        resourceId: "users",
      }
    }
    // {
    //   name: "email_confirmed",
    // },
  ],
  hooks: {
    create: {
      beforeSave: async ({ record, adminUser, resource }: any) => {
        record.password_hash = await AdminForth.Utils.generatePasswordHash(
          record.password
        );
        return { ok: true, error: "" };
        // if return 'error': , record will not be saved and error will be proxied
      },
    },
    edit: {
      beforeSave: async ({ record, adminUser, resource }: any) => {
        if (record.password) {
          record.password_hash = await AdminForth.Utils.generatePasswordHash(
            record.password
          );
        }
        return { ok: true, error: "" };
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
  },
} as AdminForthResourceInput;