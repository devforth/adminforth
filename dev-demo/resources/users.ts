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
import EmailAdapterAwsSes from "../../adapters/adminforth-email-adapter-aws-ses/index.js";

import OAuthPlugin  from "../../plugins/adminforth-oauth";
import AdminForthAdapterGoogleOauth2 from "../../adapters/adminforth-google-oauth-adapter";
import AdminForthAdapterGithubOauth2 from  "../../adapters/adminforth-github-oauth-adapter";

import AdminForthAdapterFacebookOauth2 from "../../adapters/adminforth-facebook-oauth-adapter";
import AdminForthAdapterKeycloakOauth2 from "../../adapters/adminforth-keycloak-oauth-adapter";
import AdminForthAdapterMicrosoftOauth2 from "../../adapters/adminforth-microsoft-oauth-adapter";
// import AdminForthAdapterTwitchOauth2 from "../../adapters/adminforth-twitch-oauth-adapter";
import { randomUUID } from "crypto";
import UserSoftDelete from "../../plugins/adminforth-user-soft-delete";
import UploadPlugin from "../../plugins/adminforth-upload";
import AdminForthAdapterS3Storage from "../../adapters/adminforth-storage-adapter-amazon-s3/index.js";
import { createHook } from "async_hooks";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
      GITHUB_CLIENT_ID: string;
      GITHUB_CLIENT_SECRET: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      FACEBOOK_CLIENT_ID: string;
      FACEBOOK_CLIENT_SECRET: string;
      KEYCLOAK_CLIENT_ID: string;
      KEYCLOAK_CLIENT_SECRET: string;
      KEYCLOAK_URL: string;
      KEYCLOAK_REALM: string;
      MICROSOFT_CLIENT_ID: string;
      MICROSOFT_CLIENT_SECRET: string;
      TWITCH_CLIENT_ID: string;
      TWITCH_CLIENT_SECRET: string;

    }
  }
}

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
    // new ForeignInlineListPlugin({
    //   foreignResourceId: "users",
    // }),
    new TwoFactorsAuthPlugin({
      twoFaSecretFieldName: "secret2fa",
      timeStepWindow: 1, // optional time step window for 2FA
      // optional callback to define which users should be enforced to use 2FA
      // usersFilterToApply: (adminUser: AdminUser) => {
      //   if (process.env.NODE_ENV === "development") {
      //     return false;
      //   }
      //   // return true if user should be enforced to use 2FA,
      //   // return true;
      //   return adminUser.dbUser.email !== "adminforth";
      // },
      usersFilterToAllowSkipSetup: (adminUser: AdminUser) => {
        return adminUser.dbUser.email === "adminforth";
      },
      passkeys: {
        credentialResourceID: "passkeys",
        credentialIdFieldName: "credential_id",
        credentialMetaFieldName: "meta",
        credentialUserIdFieldName: "user_id",
        continueWithButtonsOrder: 5,
        settings: {
          expectedOrigin: "http://localhost:3000",   // important, set it to your backoffice origin (starts from scheme, no slash at the end)
          // relying party config
          rp: {
              name: "New Reality",
              
              // optionaly you can set expected id explicitly if you need to:
              // id: "localhost",
            },
            user: {
                nameField: "email",
                displayNameField: "email",
            },
            authenticatorSelection: {
              // impacts a way how passkey will be created
              // - platform - using browser internal authenticator (e.g. Google Chrome passkey / Google Password Manager )
              // - cross-platform - using external authenticator (e.g. Yubikey, Google Titan etc)
              // - both - plging will show both options to the user
              // Can be "platform", "cross-platform" or "both"
                authenticatorAttachment: "both",
                requireResidentKey: true,
                userVerification: "required",
            },
        },
      } 
    }),
    new UploadPlugin({
      pathColumnName: "avatar",

      storageAdapter: new AdminForthAdapterS3Storage({
        region: "eu-central-1",
        bucket: "tmpbucket-adminforth",
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        // s3ACL: 'public-read', // ACL which will be set to uploaded file
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
      maxFileSize: 1024 * 1024 * 20, // 5MB
      // s3ACL: 'public-read', // ACL which will be set to uploaded file
      filePath: ({ originalFilename, originalExtension, contentType, record }) => {
        console.log("🔥", JSON.stringify(record));
        return `aparts/${new Date().getFullYear()}/${originalFilename}.${originalExtension}`
      },
      preview: {
        maxWidth: "200px",
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
        loginPageComponentOrder: 2,
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
      loginPageComponentOrder: 3, 
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
    new OAuthPlugin({
      userAvatarField: "avatar",
      adapters: [
        new AdminForthAdapterGithubOauth2({
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
        new AdminForthAdapterGoogleOauth2({
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          useOpenIdConnect: false,
        }),
        new AdminForthAdapterFacebookOauth2({
          clientID: process.env.FACEBOOK_CLIENT_ID,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        }),
        new AdminForthAdapterMicrosoftOauth2({
          clientID: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          useOpenIdConnect: false,
        }),
        // new AdminForthAdapterTwitchOauth2({
        //   clientID: process.env.TWITCH_CLIENT_ID,
        //   clientSecret: process.env.TWITCH_CLIENT_SECRET,
        // }),
        // new AdminForthAdapterKeycloakOauth2({
        //   name: "Keycloak",
        //   clientID: process.env.KEYCLOAK_CLIENT_ID,
        //   clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
        //   keycloakUrl: process.env.KEYCLOAK_URL,
        //   realm: process.env.KEYCLOAK_REALM,
        // }),
      ],
      emailField: 'email',
      emailConfirmedField: 'email_confirmed'
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
  ],
  options: {
    actions: [
      {
        name: 'Auto submit',  // Display name of the action
        icon: 'flowbite:play-solid',  // Icon to display (using Flowbite icons)
        
        // Control who can see/use this action
        allowed: ({ adminUser, standardAllowedActions }) => {
          return true;  // Allow everyone
        },
        
        // Handler function when action is triggered
        action: async ({ recordId, adminUser }) => {
          console.log("auto submit", recordId, adminUser);
          return { 
            ok: true, 
            successMessage: "Auto submitted" 
          };
        },

        // Configure where the action appears
        showIn: {
          showButton: true,        // Show as a button
         // showThreeDotsMenu: true, // Show in the three dots menu
          list: true,          // Show in the list view
        }
      }
    ],
  },
  columns: [
    {
      name: "id",
      primaryKey: true,
      fillOnCreate: ({ initialRecord, adminUser }: any) => randomUUID(),
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
      name: "avatar",
      type: AdminForthDataTypes.STRING,
      showIn: ["show", "edit", "create" ],
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