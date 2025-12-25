import { AdminForthDataTypes, AdminForthResourceInput } from 'adminforth';
import UploadPlugin from '../../plugins/adminforth-upload/index.js';
import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local/index.js";
import { ENGINE_TYPES, BODY_TYPES } from '../custom/cars_data.js';
import TwoFactorsAuthPlugin from '../../plugins/adminforth-two-factors-auth/index.js';
import AuditLogPlugin from '../../plugins/adminforth-audit-log/index.js';

export default {
  dataSource: 'sqlite',
  table: 'cars',
  resourceId: 'cars_sl',
  label: 'Cars',
  recordLabel: (r) => `🚘 ${r.model} 🚗`,
  columns: [
    {
      name: 'id',
      type: AdminForthDataTypes.STRING,
      label: 'Identifier',
      showIn: {
        list: false,
        edit: false,
        create: false,
      },
      primaryKey: true,
      fillOnCreate: ({ initialRecord, adminUser }) => Math.random().toString(36).substring(7),
    },
    {
      name: 'model',
      required: true,
      showIn: { all: true },
      type: AdminForthDataTypes.STRING,
      maxLength: 255,
      minLength: 3,
    },
    {
      name: 'price',
      inputSuffix: 'USD',
      allowMinMaxQuery: true,
      editingNote: 'Price is in USD',
      type: AdminForthDataTypes.FLOAT,
      required: true,
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      allowMinMaxQuery: true,
      showIn: { create: false, edit: false },
      fillOnCreate: ({ initialRecord, adminUser }) => (new Date()).toISOString(),
    },
    {
      name: 'engine_type',
      type: AdminForthDataTypes.STRING,
      label: 'Engine Type',
      allowMinMaxQuery: true,
      enum: ENGINE_TYPES,
    },
    {
      name: 'engine_power',
      allowMinMaxQuery: true,
      type: AdminForthDataTypes.INTEGER,
      inputSuffix: 'HP',
      showIf: { engine_type: { $not: 'electric' } },
      required: true,
    },
    {
      name: 'production_year',
      type: AdminForthDataTypes.INTEGER,
      minValue: 1900,
      maxValue: new Date().getFullYear(),
    },
    {
      name: 'description',
      type: AdminForthDataTypes.TEXT,
      sortable: false,
      showIn: { list: false },
    },
    {
      name: 'listed',
      required: true,
      type: AdminForthDataTypes.BOOLEAN,
    },
    {
      name: 'mileage',
      allowMinMaxQuery: true,
      type: AdminForthDataTypes.FLOAT,
    },
    {
      name: 'color',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'body_type',
      label: 'Body Type',
      enum: BODY_TYPES,
    },
    {
      name: 'photos',
      type: AdminForthDataTypes.JSON,
      label: 'Photos',
      isArray: {
        enabled: true,
        itemType: AdminForthDataTypes.STRING,
      },
      showIn: { 
        list: false 
      },
    },
    {
      name: 'seller_id',
      type: AdminForthDataTypes.STRING,
      foreignResource: {
        resourceId: 'adminuser',
        searchableFields: ["id", "email"],
      }
    }
  ],
  plugins: [
    new UploadPlugin({
      storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
        fileSystemFolder: "./sqlite/car_images",
        adminServeBaseUrl: "static/source",
        mode: "public",
        signingSecret: "TOP_SECRET",
      }),
      pathColumnName: 'photos',
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
      maxFileSize: 1024 * 1024 * 20, // 20 MB
      filePath: ({originalFilename, originalExtension, contentType}) => 
            `cars/${originalFilename}.${originalExtension}`,
      preview: {
        maxShowWidth: "300px",
        previewUrl: ({filePath}) => `/static/source/${filePath}`,
      },
    })
  ],
  options: {
    listPageSize: 12,
    allowedActions: {
      edit: true,
      delete: true,
      show: true,
      filter: true,
    },
    actions: [
      {
        name: 'Approve Listing',
        icon: 'flowbite:check-outline',
        action: async ({ recordId, adminUser, adminforth, extra, cookies }) => {
          // console.log('Approve Listing action called with extra:', extra, cookies);
          // const verificationResult = extra?.verificationResult
          // if (!verificationResult) {
          //   return { ok: false, error: 'No verification result provided' };
          // }
          // const t2fa = adminforth.getPluginByClassName<TwoFactorsAuthPlugin>('TwoFactorsAuthPlugin');
          // const result = await t2fa.verify(verificationResult, {
          //   adminUser: adminUser,
          //   userPk: adminUser.pk,
          //   cookies: cookies
          // });


          // if (!result?.ok) {
          //   return { ok: false, error: result?.error ?? 'Provided 2fa verification data is invalid' };
          // }
          // await adminforth
          //   .getPluginByClassName<AuditLogPlugin>('AuditLogPlugin')
          //   .logCustomAction({
          //     resourceId: 'cars_sl',
          //     recordId: null,
          //     actionId: 'visitedDashboard',
          //     oldData: null,
          //     data: { dashboard: 'main' },
          //     user: adminUser,
          //   });



          // await adminforth.resource('cars_sl').update(recordId, { listed: true });
          return { 
            ok: true, 
            successMessage: "Listed" 
          };
        },
        showIn: {
          list: true,
          showButton: true,
          showThreeDotsMenu: true,
        },
        customComponent: {
          file: '@@/RequireTwoFaGate.vue'
        },
      }
    ],
  },
} as AdminForthResourceInput;