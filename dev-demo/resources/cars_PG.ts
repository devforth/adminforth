import { AdminForthDataTypes, AdminForthResourceColumn, AdminForthResourceInput, AdminUser, Filters } from '../../adminforth/index.js';
import { ENGINE_TYPES, BODY_TYPES } from '../custom/cars_data.js';

import UploadPlugin from '../../plugins/adminforth-upload/index.js';
import TwoFactorsAuthPlugin from '../../plugins/adminforth-two-factors-auth/index.js';
import AuditLogPlugin from '../../plugins/adminforth-audit-log/index.js';
import RichEditorPlugin from '../../plugins/adminforth-rich-editor/index.js';
import TextCompletePlugin from '../../plugins/adminforth-text-complete/index.js';
import importExport from '../../plugins/adminforth-import-export/index.js';
import InlineCreatePlugin from '../../plugins/adminforth-inline-create/index.js';
import ListInPlaceEditPlugin from "../../plugins/adminforth-list-in-place-edit/index.js";
import BulkAiFlowPlugin from '../../plugins/adminforth-bulk-ai-flow/index.js';


import CompletionAdapterOpenAIChatGPT from '../../adapters/adminforth-completion-adapter-open-ai-chat-gpt/index.js';
import ImageGenerationAdapterOpenAI from '../../adapters/adminforth-image-generation-adapter-openai/index.js';
import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local/index.js";
import AdminForthAdapterS3Storage from '../../adapters/adminforth-storage-adapter-amazon-s3/index.js';
import AdminForthImageVisionAdapterOpenAi from '../../adapters/adminforth-image-vision-adapter-openai/index.js';

export default {
  dataSource: 'postgres',
  table: 'cars',
  resourceId: 'cars_pg',
  label: 'Cars',
  recordLabel: (r) => `🚘 ${r.model} 🚗`,

  /*********************************************************************************
   

                                      Columns


  *********************************************************************************/
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
      type: AdminForthDataTypes.DECIMAL,
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
      name: 'promo_picture',
      type: AdminForthDataTypes.STRING,
      label: 'Promo Picture',
    },
    {
      name: 'generated_promo_picture',
      type: AdminForthDataTypes.STRING,
      label: 'Generated Promo Picture',
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

  /*********************************************************************************
   

                                      Plugins


  *********************************************************************************/
    new UploadPlugin({
      // storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
      //   fileSystemFolder: "./images",
      //   adminServeBaseUrl: "static/source",
      //   mode: "public",
      //   signingSecret: "TOP_SECRET",
      // }),
      storageAdapter: new AdminForthAdapterS3Storage({
        bucket: process.env.AWS_BUCKET_NAME as string,
        region: process.env.AWS_REGION as string,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      }),
      pathColumnName: 'photos',
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
      maxFileSize: 1024 * 1024 * 20, // 20 MB
      filePath: ({originalFilename, originalExtension, contentType}) => 
            `sqlite/car_images/cars/${originalFilename}.${originalExtension}`,
      preview: {
        maxShowWidth: "300px",
        previewUrl: ({filePath}) => `/static/source/${filePath}`,
      },
    }),
    new UploadPlugin({
      // storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
      //   fileSystemFolder: "./images",
      //   adminServeBaseUrl: "static/source",
      //   mode: "public",
      //   signingSecret: "TOP_SECRET",
      // }),
      storageAdapter: new AdminForthAdapterS3Storage({
        bucket: process.env.AWS_BUCKET_NAME as string,
        region: process.env.AWS_REGION as string,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      }),
      pathColumnName: 'promo_picture',
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
      maxFileSize: 1024 * 1024 * 20, // 20 MB
      filePath: ({originalFilename, originalExtension, contentType}) => 
            `sqlite/car_images/cars_promo_images/${originalFilename}_${Date.now()}.${originalExtension}`,
      preview: {
        maxShowWidth: "300px",
        previewUrl: ({filePath}) => `/static/source/${filePath}`,
      },
    }),
    new RichEditorPlugin({
      htmlFieldName: 'description',
      attachments: {
        attachmentResource: "cars_description_images",
        attachmentFieldName: "image_path",
        attachmentRecordIdFieldName: "record_id",
        attachmentResourceIdFieldName: "resource_id",
      },
      ...(process.env.OPENAI_API_KEY ? {
        completion: {
          adapter: new CompletionAdapterOpenAIChatGPT({
            openAiApiKey: process.env.OPENAI_API_KEY as string,
            model: 'gpt-4o',
            expert: {
              temperature: 0.7
            }
          }),
          expert: {
            debounceTime: 250,
          }
        }
      } : {}),
    }),
    new importExport({}),
    // new InlineCreatePlugin({}),
    new ListInPlaceEditPlugin({
      columns: ["model", "engine_type", "price"],
    }),

  /*********************************************************************************
   
                                      AI Plugins

  *********************************************************************************/
    ...(process.env.OPENAI_API_KEY ? 
      [
        new UploadPlugin({
          // storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
          //   fileSystemFolder: "./images",
          //   adminServeBaseUrl: "static/source",
          //   mode: "public",
          //   signingSecret: "TOP_SECRET",
          // }),
          storageAdapter: new AdminForthAdapterS3Storage({
            bucket: process.env.AWS_BUCKET_NAME as string,
            region: process.env.AWS_REGION as string,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
          }),
          pathColumnName: 'generated_promo_picture',
          allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
          maxFileSize: 1024 * 1024 * 20, // 20 MB
          filePath: ({originalFilename, originalExtension, contentType}) => 
                `sqlite/car_images/cars_promo_images_generated/${originalFilename}.${originalExtension}`,
          preview: {
            maxShowWidth: "300px",
            previewUrl: ({filePath}) => `/static/source/${filePath}`,
          },
          generation: {
            countToGenerate: 2,  // how much images generate in one shot
            adapter: new ImageGenerationAdapterOpenAI({
              openAiApiKey: process.env.OPENAI_API_KEY as string,
              model: 'gpt-image-1', 
            }),
            fieldsForContext: ['description', 'model', 'color', 'body_type', 'engine_type'],
            outputSize: '1536x1024' // size of generated image   
          }   
      }),
      new TextCompletePlugin({
        fieldName: 'model',
        adapter: new CompletionAdapterOpenAIChatGPT({
          openAiApiKey: process.env.OPENAI_API_KEY as string,
          model: 'gpt-4o', // default "gpt-4o-mini"
          expert: {
              temperature: 0.7 //Model temperature, default 0.7
          }
        }),
      }),
      new BulkAiFlowPlugin({
        actionName: 'Analyze',
        attachFiles: async ({ record }: { record: any }) => {
        if (!record.promo_picture) {
          return [];
        }
          console.log('Attaching file for analysis:', `http://localhost:3000/static/source/cars_promo_images/${record.promo_picture}`);
          return [`http://localhost:3000/static/source/${record.promo_picture}`];
        },
        visionAdapter: new AdminForthImageVisionAdapterOpenAi(
          {
            openAiApiKey:  process.env.OPENAI_API_KEY as string,
            model: 'gpt-4.1-mini',
            convertImageToBase64: true,
          }
        ),
        imageGenerationAdapter: new ImageGenerationAdapterOpenAI({
          openAiApiKey: process.env.OPENAI_API_KEY as string,
          model: 'gpt-image-1',
        }),
        fillFieldsFromImages: { 
          color: "Which color is the car in the image?",
          body_type: "What is the body type of the car in the image?",
          production_year: "What is the production year of the car in the image?",
        },
        // generateImages: {
        //   generated_promo_picture: {
        //     prompt: 'Transform this photo into a cartoon-style car picture. Imagine that we are in 90s japan and this car was tuned for the drifting competitions.',
        //     outputSize: '1024x1024',
        //     countToGenerate: 2,
        //     rateLimit: '3/1h'
        //   },
        // },
      }),
    ] : []),
  ],






  /*********************************************************************************
   

                                      Options


  *********************************************************************************/

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
        action: async ({ recordId, adminUser, adminforth, extra }) => {
          //@ts-ignore
          const verificationResult = extra?.verificationResult
          if (!verificationResult) {
            return { ok: false, error: 'No verification result provided' };
          }
          const t2fa = adminforth.getPluginByClassName<TwoFactorsAuthPlugin>('TwoFactorsAuthPlugin');
          const result = await t2fa.verify(verificationResult, {
            adminUser: adminUser,
            userPk: adminUser.pk as string,
            cookies: extra.cookies
          });


          if (!result || 'error' in result) {
            return { ok: false, error: result?.error ?? 'Provided 2fa verification data is invalid' };
          }
          await adminforth
            .getPluginByClassName<AuditLogPlugin>('AuditLogPlugin')
            .logCustomAction({
              resourceId: 'cars_sl',
              recordId: null,
              actionId: 'visitedDashboard',
              oldData: null,
              data: { dashboard: 'main' },
              user: adminUser,
            });



          await adminforth.resource('cars_sl').update(recordId, { listed: true });
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