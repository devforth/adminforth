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
import ForeignInlineShowPlugin from '../../plugins/adminforth-foreign-inline-show/index.js';


import CompletionAdapterOpenAIChatGPT from '../../adapters/adminforth-completion-adapter-open-ai-chat-gpt/index.js';
import CompletionAdapterGoogleGemini from '../../adapters/adminforth-completion-adapter-google-gemini/index.js';
import ImageGenerationAdapterOpenAI from '../../adapters/adminforth-image-generation-adapter-openai/index.js';
import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local/index.js";
import AdminForthAdapterS3Storage from '../../adapters/adminforth-storage-adapter-amazon-s3/index.js';
import AdminForthImageVisionAdapterOpenAi from '../../adapters/adminforth-image-vision-adapter-openai/index.js';
import { logger } from '../../adminforth/modules/logger.js';
import { afLogger } from '../../adminforth/modules/logger.js';

export default function carsResourseTemplate(resourceId: string, dataSource: string, pkFileldName: string) {
  return {
    dataSource: dataSource,
    table: 'cars',
    resourceId: resourceId,
    label: 'Cars',
    recordLabel: (r) => `🚘 ${r.model} 🚗`,

    /*********************************************************************************
     

                                        Columns


    *********************************************************************************/
    columns: [
      {
        name: pkFileldName,
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
        enum: ENGINE_TYPES,
      },
      {
        name: 'engine_power',
        type: AdminForthDataTypes.INTEGER,
        inputSuffix: 'HP',
        showIf: { engine_type: { $not: 'electric' } },
        required: true,
      },
      {
        name: 'production_year',
        type: AdminForthDataTypes.INTEGER,
        allowMinMaxQuery: true,
        minValue: 1900,
        maxValue: new Date().getFullYear(),
      },
      {
        name: 'description',
        type: AdminForthDataTypes.TEXT,
        sortable: false,
        showIn: { list: false },
        components: {
          show: "@/renderers/RichText.vue",
          list: "@/renderers/RichText.vue",
        },
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
        type: AdminForthDataTypes.STRING,
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
        storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
          fileSystemFolder: "./db/uploads",
          mode: "public", // or "private"
          signingSecret: '1241245',
        }),
        pathColumnName: 'photos',
        allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
        maxFileSize: 1024 * 1024 * 20, // 20 MB
        filePath: ({originalFilename, originalExtension, contentType}) => 
              `${dataSource}/car_images/cars/${originalFilename}_${Date.now()}.${originalExtension}`,
        preview: {
          maxShowWidth: "300px",
        },
      }),
      new UploadPlugin({
        storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
          fileSystemFolder: "./db/uploads_promo",
          mode: "public", // or "private"
          signingSecret: '1241245',
        }),
        pathColumnName: 'promo_picture',
        allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
        maxFileSize: 1024 * 1024 * 20, // 20 MB
        filePath: ({originalFilename, originalExtension, contentType}) => 
              `${dataSource}/car_images/cars_promo_images/${originalFilename}_${Date.now()}.${originalExtension}`,
        preview: {
          maxShowWidth: "300px",
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
              model: 'gpt-5-mini',
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
      new ForeignInlineShowPlugin({
        foreignResourceId: 'adminuser',
      }),
    /*********************************************************************************
     
                                        AI Plugins

    *********************************************************************************/
      ...(process.env.OPENAI_API_KEY ? 
        [
          new UploadPlugin({
            storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
              fileSystemFolder: "./db/uploads_promo_generated",
              mode: "public", // or "private"
              signingSecret: '1241245',
            }),
            pathColumnName: 'generated_promo_picture',
            allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
            maxFileSize: 1024 * 1024 * 20, // 20 MB
            filePath: ({originalFilename, originalExtension, contentType}) => 
                  `${dataSource}/car_images/cars_promo_images_generated/${originalFilename}_${Date.now()}.${originalExtension}`,
            preview: {
              maxShowWidth: "300px",
              previewUrl({ filePath }) {
                return `https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${filePath}`;
              },
            },
            generation: {
              countToGenerate: 2,
              adapter: new ImageGenerationAdapterOpenAI({
                openAiApiKey: process.env.OPENAI_API_KEY as string,
                model: 'gpt-image-1', 
              }),
              attachFiles: async ({ record }) => {
                return [`https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${record.promo_picture}`];
              },
              generationPrompt: "Generate a high-quality promotional image for a car with model {{model}} and color {{color}}. The car is a {{body_type}} type. The image should be vibrant and eye-catching, suitable for advertising purposes.",
              outputSize: '1536x1024'
            }   
        }),
        new TextCompletePlugin({
          fieldName: 'model',
          adapter: new CompletionAdapterOpenAIChatGPT({
            openAiApiKey: process.env.OPENAI_API_KEY as string,
            model: 'gpt-5-nano',
            extraRequestBodyParameters: {
                temperature: 1
            }
          }),
        }),
        new BulkAiFlowPlugin({
          actionName: 'Generate description and Price',
          askConfirmationBeforeGenerating: true,
          textCompleteAdapter: new CompletionAdapterOpenAIChatGPT({
            openAiApiKey: process.env.OPENAI_API_KEY as string,
            model: "gpt-5.2",
            extraRequestBodyParameters: {
              temperature: 1,
            },
          }),
          fillPlainFields: {
            description: "Create a desription for the car with name {{model}} and engine type {{engine_type}}. Desription should be HTML formatted.",
            price: "Based on the car model {{model}} and engine type {{engine_type}}, suggest a competitive market price in USD. Return only the numeric value.",
          }
        }),
        new BulkAiFlowPlugin({
          actionName: 'Analyze image',
          askConfirmationBeforeGenerating: true,
          visionAdapter: new AdminForthImageVisionAdapterOpenAi({
            openAiApiKey: process.env.OPENAI_API_KEY as string,
            model: 'gpt-5-mini',
          }),
          fillFieldsFromImages: {
            body_type: "What is the body type of the car shown in the image?",
            color: "What is the color of the car shown in the image?",
            mileage: "Estimate the mileage of the car shown in the image in kilometers.",
          },
          attachFiles: async ({ record }) => {
            if (!record.promo_picture) {
              return [];
            }
            return [`https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${record.promo_picture}`];
          },
        }),
        new BulkAiFlowPlugin({
          actionName: 'Generate promo image',
          askConfirmationBeforeGenerating: true,
          imageGenerationAdapter: new ImageGenerationAdapterOpenAI({
            openAiApiKey: process.env.OPENAI_API_KEY as string,
            model: 'gpt-image-1',
          }),
          generateImages: {
            generated_promo_picture: {
              countToGenerate: 1,
              outputSize: '1536x1024',
              prompt: "Create a high-quality promotional image for a {{color}} car shown on attached image. Generated image should be in anime style",
            }
          },
          
          attachFiles: async ({ record }) => {
            if (!record.promo_picture) {
              return [];
            }
            return [`https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${record.promo_picture}`];
          },
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
          action: async ({ recordId, adminUser, adminforth, extra, response }) => {
            logger.info(`Admin User is approving listing for record ${recordId} in resource ${resourceId}`);
            //@ts-ignore
            const verificationResult = extra?.verificationResult
            if (!verificationResult) {
              return { ok: false, error: 'No verification result provided' };
            }
            const t2fa = adminforth.getPluginByClassName<TwoFactorsAuthPlugin>('TwoFactorsAuthPlugin');
            const result = await t2fa.verify(verificationResult, {
              adminUser: adminUser,
              userPk: adminUser.pk as string,
              cookies: extra.cookies,
              response: response,
              extra: extra,
            });


            if (!result || 'error' in result) {
              return { ok: false, error: result?.error ?? 'Provided 2fa verification data is invalid' };
            }
            await adminforth
              // .getPluginByClassName<AuditLogPlugin>('AuditLogPlugin')
              .getPluginById<AuditLogPlugin>('AuditLogPlugin')
              .logCustomAction({
                resourceId: resourceId,
                recordId: null,
                actionId: 'visitedDashboard',
                oldData: null,
                data: { dashboard: 'main' },
                user: adminUser,
              });



            await adminforth.resource(resourceId).update(recordId, { listed: true });
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
}