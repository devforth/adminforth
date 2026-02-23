import { AdminForthDataTypes } from 'adminforth';
import importExport from '@adminforth/import-export';
import RichEditorPlugin from '@adminforth/rich-editor';
import TextCompletePlugin from '@adminforth/text-complete';
import UploadPlugin from '@adminforth/upload';
import { randomUUID } from 'crypto';
import CompletionAdapterOpenAIChatGPT from "@adminforth/completion-adapter-open-ai-chat-gpt";
import AdminForthAdapterS3Storage from '@adminforth/storage-adapter-amazon-s3'
import ImageGenerationAdapterOpenAI from '@adminforth/image-generation-adapter-openai';
import BulkAiFlowPlugin  from '@adminforth/bulk-ai-flow';
import AdminForthImageVisionAdapterOpenAi from '@adminforth/image-vision-adapter-openai';
import CloneRow from "@adminforth/clone-row";

const blockDemoUsers = async ({ record, adminUser, resource }) => {
  if (adminUser.dbUser && adminUser.dbUser.role !== 'superadmin') {
    return { ok: false, error: "You can't do this on demo.adminforth.dev" }
  }
  return { ok: true };
}

export default {
  dataSource: 'maindb', 
  table: 'apartments',
  resourceId: 'aparts', // resourceId is defaulted to table name but you can redefine it like this e.g. 
                        // in case of same table names from different data sources
  label: 'Apartments',   // label is defaulted to table name but you can change it
  recordLabel: (r) => `🏡 ${r.title}`,
  hooks: {
    delete: {
      beforeSave: blockDemoUsers,
    },
    edit: {
      beforeSave: blockDemoUsers,
    },
    create: {
      beforeSave: blockDemoUsers,
    },
  },
  columns: [
    { 
      name: 'id', 
      label: 'Identifier',  // if you wish you can redefine label, defaulted to uppercased name
      showIn: {all: false, show: true, filter: true}, // show column in filter and in show page
      primaryKey: true,
      fillOnCreate: ({initialRecord, adminUser}) => randomUUID(),  // called during creation to generate content of field, initialRecord is values user entered, adminUser object of user who creates record
    },
    { 
      name: 'title',
      required: true,
      showIn: ['list', 'create', 'edit', 'filter', 'show'],  // all available options
      maxLength: 255,  // you can set max length for string fields
      minLength: 3,  // you can set min length for string fields
    },
    {
      name: 'country',
      components: {
        list: '@/renderers/CountryFlag.vue'
      },
      enum: [{
        value: 'US',
        label: 'United States'
      }, {
        value: 'DE',
        label: 'Germany'
      }, {
        value: 'FR',
        label: 'France'
      }, {
        value: 'GB',
        label: 'United Kingdom'
      }, {
        value:'NL',
        label: 'Netherlands'
      }, {
        value: 'IT',
        label: 'Italy'
      }, {
        value: 'ES',
        label: 'Spain'
      }, {
        value: 'DK',
        label: 'Denmark'
      }, {
        value: 'PL',
        label: 'Poland'
      }, {
        value: 'UA',
        label: 'Ukraine'
      }, {
        value: null,
        label: 'Not defined'
      }],
    }, 
    {
      name: 'apartment_image',
      showIn: {
        list: false, 
        show: true, 
        edit: true, 
        create: true
      }, // You can set to ['list', 'show'] if you wish to show path column in list and show views
    },
    {
      name: 'processed_image',
      showIn: {
        list: false, 
        show: true, 
        edit: false, 
        create: false
      }, // You can set to ['list', 'show'] if you wish to show path column in list and show views
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME ,
      allowMinMaxQuery: true,
      showIn: ['list', 'filter', 'show', 'edit'],
      fillOnCreate: ({initialRecord, adminUser}) => (new Date()).toISOString(),
    },
    { 
      name: 'price',
      allowMinMaxQuery: true,  // use better experience for filtering e.g. date range, set it only if you have index on this column or if you sure there will be low number of rows
      editingNote: 'Price is in USD',  // you can put a note near field on editing or creating page
    },
    { 
      name: 'square_meter', 
      label: 'Square', 
      allowMinMaxQuery: true,
      minValue: 1,  // you can set min /max value for number columns so users will not be able to enter more/less
      maxValue: 1000,
    },
    { 
      label: 'Rooms number',
      name: 'number_of_rooms',
      allowMinMaxQuery: true,
      enum: [
        { value: 1, label: '1 room' },
        { value: 2, label: '2 rooms' },
        { value: 3, label: '3 rooms' },
        { value: 4, label: '4 rooms' },
        { value: 5, label: '5 rooms' },
      ],
    },
    { 
      name: 'description',
      type: AdminForthDataTypes.RICHTEXT,
      sortable: false,
      showIn: ['show', 'edit', 'create', 'filter'],
        components: {
        list: "@/renderers/RichText.vue",
        show: "@/renderers/RichText.vue",
      }
    },
    {
      name: 'listed',
      required: true,  // will be required on create/edit
    },
    {
      name: 'realtor_id',
      label: 'Realtor',
      foreignResource: {
        resourceId: 'users',
      }
    }
  ],
  plugins: [
    new importExport({}),
    new RichEditorPlugin({
      htmlFieldName: 'description',
      completion: {
        adapter: new CompletionAdapterOpenAIChatGPT({
          openAiApiKey: process.env.OPENAI_API_KEY as string,
          model: 'gpt-4o', // default "gpt-4o-mini"
          expert: {
              temperature: 0.7 //Model temperature, default 0.7
          }
        }),
        provider: 'openai-chat-gpt',
        params: {
          apiKey: process.env.OPENAI_API_KEY as string,
          // model: 'gpt-4o',  gpt-4o-model is a default (cheapest one)
        },
        expert: {
          debounceTime: 250,
        }
      }
    }),
    new TextCompletePlugin({
      fieldName: 'title',
      adapter: new CompletionAdapterOpenAIChatGPT({
        openAiApiKey: process.env.OPENAI_API_KEY as string,
      }),
      // expert: {
        // maxTokens: 50, // token limit to generate for each completion. 50 is default
        // promptInputLimit: 500, // Limit in characters of edited field to be passed to Model. 500 is default value
        // debounceTime: 300, // Debounce time in milliseconds. 300 is default value
      // }
    }),
    new UploadPlugin({
      pathColumnName: 'apartment_image',
      storageAdapter: new AdminForthAdapterS3Storage({
        bucket: 'demo-static.adminforth.dev', // ❗ Your bucket name
        region: 'eu-north-1', // ❗ Selected region
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        s3ACL: 'public-read',
      }),
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
      maxFileSize: 1024 * 1024 * 20, // 5MB
      filePath: ({originalFilename, originalExtension, contentType}) => 
            `aparts/${new Date().getFullYear()}/${randomUUID()}-${originalFilename}.${originalExtension}`,
      // You can use next to change preview URLs (if it is image) in list and show views
      generation: {
        countToGenerate: 2,
        adapter: new ImageGenerationAdapterOpenAI({
          openAiApiKey: process.env.OPENAI_API_KEY as string,
          model: "dall-e-3",
        }),
        outputSize: "1792x1024",
        fieldsForContext: ["title"],
        rateLimit: {
          limit: "2/1m",
          errorMessage:
            "For demo purposes, you can generate only 2 images per minute",
        },
      },
      preview: {
        maxShowWidth: "480px",
        previewUrl: ({filePath}) => `https://demo-static.adminforth.dev/${filePath}`, 
      }
    }),
    new UploadPlugin({
      pathColumnName: 'processed_image',
      storageAdapter: new AdminForthAdapterS3Storage({
        bucket: 'demo-static.adminforth.dev', // ❗ Your bucket name
        region: 'eu-north-1', // ❗ Selected region
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        s3ACL: 'public-read',
      }),
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
      maxFileSize: 1024 * 1024 * 20, // 5MB
      filePath: ({originalFilename, originalExtension, contentType}) => 
            `processed_aparts/${new Date().getFullYear()}/${randomUUID()}-${originalFilename}.${originalExtension}`,
      // You can use next to change preview URLs (if it is image) in list and show views
      preview: {
        maxShowWidth: "480px",
        previewUrl: ({filePath}) => `https://demo-static.adminforth.dev/${filePath}`, 
      }
    }),
    new BulkAiFlowPlugin({
      actionName: 'Process with AI',
      attachFiles: async ({ record }: { record: any }) => {
        if (!record.apartment_image) {
          return [];
        }
        return [`https://demo-static.adminforth.dev/${record.apartment_image}`];
      },
      visionAdapter: new AdminForthImageVisionAdapterOpenAi(
        {
          openAiApiKey:  process.env.OPENAI_API_KEY as string,
          model: 'gpt-4.1-mini',
        }
      ),
      imageGenerationAdapter: new ImageGenerationAdapterOpenAI({
        openAiApiKey: process.env.OPENAI_API_KEY as string,
        model: 'gpt-image-1',
      }),
      fillFieldsFromImages: { 
        'description': 'Describe what is in the image, also take into account that price is {{price}} and title is {{title}}', 
        'square_meter': 'Try to guess what is the typical square of the apartment in square meters? If you do not know, just guess',
      },
      generateImages: {
        processed_image: {
          prompt: "Turn this image into a ghibli cartoon style",
          outputSize: "1536x1024",
          countToGenerate: 1,
          rateLimit: '1/1m'
        }
      },
      rateLimits:{
        fillFieldsFromImages: "3/2m",
        generateImages: "3/2m",
        fillPlainFields: "3/2m",
      },
      isAllowedToSave: blockDemoUsers,
    }),
    new CloneRow({}),
  ],
  options: {
    listPageSize: 8,
    allowedActions:{
      edit: true,
      delete: true,
      show: true,
      filter: true,
    },
  },
}