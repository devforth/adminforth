import AdminForth, {
  AdminForthDataTypes,
  AdminForthResource,
  AdminForthResourceColumn,
  AdminForthResourceInput,
  AdminUser,
} from "../../adminforth/dist";
import ForeignInlineListPlugin from "../../plugins/adminforth-foreign-inline-list";
import OpenSignupPlugin from "../../plugins/adminforth-open-signup";
import TwoFactorsAuthPlugin from "../../plugins/adminforth-two-factors-auth";
import EmailResetPasswordPlugin from "../../plugins/adminforth-email-password-reset/index.js";
import { v1 as uuid } from "uuid";
import EmailAdapterAwsSes from "../../adapters/adminforth-email-adapter-aws-ses/index.js";

import OAuthPlugin  from "../../plugins/adminforth-oauth";
import AdminForthAdapterGoogleOauth2 from "../../adapters/adminforth-google-oauth-adapter";
import AdminForthAdapterGithubOauth2 from  "../../adapters/adminforth-github-oauth-adapter";
import ListInPlaceEditPlugin from "../../plugins/adminforth-list-in-place-edit";

export default {
  dataSource: "maindb",
  table: "users",
  resourceId: "user_sub",
  label: "User Sub",

  recordLabel: (r: any) => `👤 ${r.email}`,
  plugins: [
    new ListInPlaceEditPlugin({
      columns: ["role"]
    })
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
        { value: 'superadmin', label: 'Super Admin' },
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
    },
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