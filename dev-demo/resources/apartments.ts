import {
  ActionCheckSource,
  AdminForthDataTypes,
  AdminForthResource,
  AdminForthResourcePages,
  AdminUser,
  Filters,
} from "../../adminforth";
import TextCompletePlugin from "../../plugins/adminforth-text-complete";
import UploadPlugin from "../../plugins/adminforth-upload";
import ImportExportPlugin from "../../plugins/adminforth-import-export/index.js";
import { v1 as uuid } from "uuid";
import { admin } from '../index.js';
import RichEditorPlugin from "../../plugins/adminforth-rich-editor";
import { AdminForthResourceInput } from "../../adminforth";
import CompletionAdapterOpenAIChatGPT from "../../adapters/adminforth-completion-adapter-open-ai-chat-gpt/index.js";
import ImageGenerationAdapterOpenAI from "../../adapters/adminforth-image-generation-adapter-openai/index.js";
import AdminForthAdapterS3Storage from "../../adapters/adminforth-storage-adapter-amazon-s3/index.js";
import AdminForthAdapterLocal from "../../adapters/adminforth-storage-adapter-local/index.js";
import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local/index.js";
import AdminForth from "../../adminforth";
import BulkAiFlowPlugin from "../../plugins/adminforth-bulk-ai-flow/index.js";
import AdminForthImageVisionAdapterOpenAi from "../../adapters/adminforth-image-vision-adapter-openai/index.js";
import { StorageAdapter } from "../../adminforth";


const demoChecker = async ({ record, adminUser, resource }) => {
  if (adminUser.dbUser.role !== "superadmin") {
    return { ok: false, error: "You can't do this on demo.adminforth.dev" };
  }
  return { ok: true };
};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
      AWS_REGION: string;
      AWS_BUCKET: string;
      ADMINFORTH_SECRET: string;
      OPENAI_API_KEY: string;
    }
  }
}

let sourcesAdapter: StorageAdapter;

export default {
  dataSource: "maindb",
  table: "apartments",
  resourceId: "aparts", // resourceId is defaulted to table name but you can change it e.g.
  // in case of same table names from different data sources
  label: "Apartments", // label is defaulted to table name but you can change it
  recordLabel: (r: any) => `🏡 ${r.title}`,
  hooks: {
    edit: {
      afterSave: async ({ record, adminUser, resource, adminforth }) => {
        //  if realtor id is set, recalculate total cost of all apartments
        if (record.user_id) {
          const totalCost = (
            await adminforth
              .resource("aparts")
              .list(Filters.EQ("user_id", record.user_id))
          )
            .map((r) => r.price)
            .reduce((a, b) => a + b, 0);
          adminforth.websocket.publish(`/property-cost/${record.user_id}`, {
            type: "message",
            totalCost,
          });
        }
        return { ok: true };
      },
    },
    delete: {
      beforeSave: demoChecker,
    },
    list: {
      afterDatasourceResponse: async ({ response }: { response: any }) => {
        response.forEach((r: any) => {
         
        });
        return { ok: true, error: "" };
      },
      beforeDatasourceRequest: async ({
        query, adminUser, resource,
      }: {
        query: any; adminUser: AdminUser; resource: AdminForthResource;
      }) => {
        if (adminUser.dbUser.role === "superadmin") {
          return { ok: true };
        }

        // this function will skip existing realtor_id filter if it supplied already from UI or previous hook, and will add new one for realtor_id
        query.filtersTools.replaceOrAddTopFilter(Filters.EQ('realtor_id', adminUser.dbUser.id));
       
        return { ok: true };
      },
    },
  },
  columns: [
    {
      name: "id",
      label: "Identifier", // if you wish you can redefine label
      showIn: {filter: true, show: true, list: true, create: false, edit: false}, // show in filter and in show page
      primaryKey: true,
      // @ts-ignore
      fillOnCreate: ({ initialRecord, adminUser }) =>
        Math.random().toString(36).substring(7),
      // fillOnCreate: ({initialRecord}: any) => randomUUID(),
      components: {
        list: "@/renderers/CompactUUID.vue",
      }, // initialRecord is values user entered, adminUser object of user who creates record
    },
    {
      name: "title",
      // type: AdminForthDataTypes.JSON,
      required: true,
      showIn: {list: true, create: true, edit: true, filter: true, show: true}, // the default is full set
      maxLength: 255, // you can set max length for string fields
      minLength: 3, // you can set min length for string fields
      components: {
        // edit: {
        //     file: '@@/IdShow.vue',
        //     meta: {
        //         title: 'Title',
        //         description: 'This is title of apartment'
        //     }
        // },
        // show: '@@/IdShow.vue',
        // create: {
        //     file: '@@/IdShow.vue',
        //     meta: {
        //         title: 'Title',
        //         description: 'This is title of apartment'
        //     }
        // }
        // list: '@@/IdShow.vue',
      },
    },
    {
      name: "country",
      listSticky: true,
      components: {
        list: {
          file: "@/renderers/CountryFlag.vue",
          meta: {
            showCountryName: false,
          },
        },
        edit: {
          file: "@@/CountryDropdown.vue",
        },
        create: {
          file: "@@/CountryDropdown.vue",
        },
      },
      enum: [
        {
          value: "US",
          label: "United States",
        },
        {
          value: "DE",
          label: "Germany",
        },
        {
          value: "FR",
          label: "France",
        },
        {
          value: "GB",
          label: "United Kingdom",
        },
        {
          value: "NL",
          label: "Netherlands",
        },
        {
          value: "IT",
          label: "Italy",
        },
        {
          value: "ES",
          label: "Spain",
        },
        {
          value: "DK",
          label: "Denmark",
        },
        {
          value: "PL",
          label: "Poland",
        },
        {
          value: "UA",
          label: "Ukraine",
        },
        {
          value: null,
          label: "Not defined",
        },
      ],
    },
    {
      name: "created_at",
      type: AdminForthDataTypes.DATETIME,
      allowMinMaxQuery: true,
      showIn: {
        [AdminForthResourcePages.create]: false,
      },
      components: {
        list: "@/renderers/RelativeTime.vue",
      },
      // @ts-ignore
      fillOnCreate: ({ initialRecord, adminUser }) => new Date().toISOString(),
    },
    {
      name: "apartment_image",
      showIn: {
        all: true,
        show: () => true,
        filter: false,
      },
      required: false,
      editingNote: "Upload image of apartment",
    },
    {
      name: "apartment_source",
      showIn: {
        all: true,
        show: () => true,
        filter: false,
      },
      required: false,
      editingNote: "Upload image of apartment",
    },
    {
      name: "price",
      showIn: {create: true, edit: true, filter: true, show: true},
      allowMinMaxQuery: true, // use better experience for filtering e.g. date range, set it only if you have index on this column or if there will be low number of rows
      editingNote: "Price is in USD", // you can appear note on editing or creating page
      editReadonly: true, // you can set field to be readonly on edit page
      required: true,
    },
    {
      name: "square_meter",
      label: "Square",
      // allowMinMaxQuery: true,
      minValue: 1, // you can set min /max value for number fields
      maxValue: 100000000,
      components: {
        list: {
          file: "@/renderers/HumanNumber.vue",
          meta: {
            showCountryName: true,
          },
        },
        filter: "@@/CustomSqueareMetersFilter.vue",
      },
    },
    {
      name: "number_of_rooms",
      allowMinMaxQuery: true,
      enum: [
        { value: 1, label: "1 room" },
        { value: 2, label: "2 rooms" },
        { value: 3, label: "3 rooms" },
        { value: 4, label: "4 rooms" },
        { value: 5, label: "5 rooms" },
      ],
      showIn: {filter: true, show: true, create: true, edit: true},
    },
    {
      name: "room_sizes",
      type: AdminForthDataTypes.JSON,
      isArray: {
        enabled: true,
        itemType: AdminForthDataTypes.FLOAT,
      },
    },
    {
      name: "description",
      sortable: false,
      type: AdminForthDataTypes.TEXT,
      showIn: {filter: true, show: true, edit: true, create: true},
      components: {
        list: "@/renderers/RichText.vue",
        show: "@/renderers/ZeroStylesRichText.vue",
      }
    },
    {
      name: "listed",
      required: true, // will be required on create/edit
    },
    {
      name: 'realtor_id',
      showIn: {filter: true, show: true, edit: true, list: true, create: true},
      foreignResource: {
        resourceId: 'users',
        hooks: {
          dropdownList: {
            beforeDatasourceRequest: async ({ adminUser, query }: { adminUser: AdminUser, query: any }) => {
              if (adminUser.dbUser.role !== "superadmin") {
                query.filtersTools.replaceOrAddTopFilter(Filters.EQ("id", adminUser.dbUser.id));
              };
              return {
                "ok": true,
              };
            }
          },
        }
      }
    },
    {
      name: "user_id",
      showIn: {filter: true, show: true, edit: true, list: true, create: true},
      foreignResource: {
        resourceId: "users",
        hooks: {
          dropdownList: {
            beforeDatasourceRequest: async ({ query, adminUser }: any) => {
              return { ok: true, error: "" };
            },
            afterDatasourceResponse: async ({ response, adminUser }: any) => {
              return { ok: true, error: "" };
            },
          },
        },
      },
    },
  ],
  plugins: [
    ...(process.env.AWS_ACCESS_KEY_ID
      ? [
          new BulkAiFlowPlugin({
            // askConfirmationBeforeGenerating: true,
            actionName: 'Analyze',
            attachFiles: async ({ record }: { record: any }) => {
            if (!record.apartment_image) {
              return [];
            }
              return [`https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${record.apartment_image}`];
            },
            visionAdapter: new AdminForthImageVisionAdapterOpenAi(
              {
                openAiApiKey:  process.env.OPENAI_API_KEY as string,
                model: 'gpt-4.1-mini',
              }
            ),
            fillFieldsFromImages: { 
              'description': 'describe what is in the image, also take into account that price is {{price}}', 
              'country': 'In which country it can be located?', 
              'number_of_rooms': 'How many rooms are in the apartment? Just try to guess what is a typical one. If you do not know, just guess',
              'square_meter': 'Try to guess what is the typical square of the apartment in square meters? If you do not know, just guess',
              'listed': 'Is the apartment should be listed for sale? If you do not know, just guess, return boolean value',
            },
          }),
          new UploadPlugin({
            pathColumnName: "apartment_image",

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
              return `aparts/${new Date().getFullYear()}/${uuid()}/${originalFilename}.${originalExtension}`
            },
            generation: {
              adapter: new ImageGenerationAdapterOpenAI({
                openAiApiKey: process.env.OPENAI_API_KEY as string,
              }),
              
              attachFiles: async ({ record, adminUser }: { record: any; adminUser: AdminUser }) => {
                // attach apartment source image to generation, image should be public
                return [
                  await sourcesAdapter.getKeyAsDataURL(record.apartment_source)
                ];
                    
                // return [`https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${record.apartment_source}`];
              },
              generationPrompt: "Add a 10 kittyies to the appartment look, it should be foto-realistic, they should be different colors, sitting all around the appartment",
              countToGenerate: 1,
              outputSize: '1024x1024',
              // rateLimit: {
              //   limit: "2/1m",
              //   errorMessage:
              //     "For demo purposes, you can generate only 2 images per minute",
              // },
            },
            preview: {
              // Used to display preview (if it is image) in list and show views
              // previewUrl: ({s3Path}) => `https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${s3Path}`,
              maxWidth: "200px",
            },
          }),
          new UploadPlugin({
            pathColumnName: "apartment_source",
            
            storageAdapter: (sourcesAdapter = new AdminForthAdapterS3Storage({
              region: "eu-central-1",
              bucket: "tmpbucket-adminforth",
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              s3ACL: 'public-read', // ACL which will be set to uploaded file
            }), sourcesAdapter),

            // storageAdapter: (sourcesAdapter = new AdminForthStorageAdapterLocalFilesystem({
            //   fileSystemFolder: "./db/uploads", // folder where files will be stored on disk
            //   adminServeBaseUrl: "static/source", // the adapter not only stores files, but also serves them for HTTP requests
            //      // this optional path allows to set the base URL for the files. Should be unique for each adapter if set.
            //   mode: "public", // public if all files should be accessible from the web, private only if could be accesed by temporary presigned links
            //   signingSecret: process.env.ADMINFORTH_SECRET, // secret used to generate presigned URLs
            // }), sourcesAdapter),

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
            filePath: ({ originalFilename, originalExtension, contentType, record }) => {
              console.log("🔥", JSON.stringify(record));
              return `aparts2/${new Date().getFullYear()}/${uuid()}/${originalFilename}.${originalExtension}`
            },
            preview: {
              // Used to display preview (if it is image) in list and show views
              // previewUrl: ({s3Path}) => `https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${s3Path}`,
              maxWidth: "200px",
            },
          }),
        ]
      : []),
    new ImportExportPlugin({}),
    // new TextCompletePlugin({
    //   fieldName: "title",
    //   expert: {
    //     debounceTime: 250,
    //   },
    //   adapter: new CompletionAdapterOpenAIChatGPT({
    //     openAiApiKey: process.env.OPENAI_API_KEY as string,
    //   }),
    // }),
    new RichEditorPlugin({
      htmlFieldName: "description",
      completion: {
        adapter: new CompletionAdapterOpenAIChatGPT({
          openAiApiKey: process.env.OPENAI_API_KEY as string,
        }),
        expert: {
          debounceTime: 250,
        },
      },
      // requires to have table 'description_images' with upload plugin installed on attachment field

      ...(process.env.AWS_ACCESS_KEY_ID
        ? {
            attachments: {
              attachmentResource: "description_images",
              attachmentFieldName: "image_path",
              attachmentRecordIdFieldName: "record_id",
              attachmentResourceIdFieldName: "resource_id",
            },
          }
        : {}),
    }),
  ],

  options: {
    listRowsAutoRefreshSeconds: 100,
    pageInjections: {
      list: {
        // customActionIcons: "@@/IdShow.vue",
        // bottom: {
        //   file: '@@/TopLine.vue',
        //   meta: {
        //     thinEnoughToShrinkTable: true,
        //   }
        // }
      },
      //   show: {
      //     beforeBreadcrumbs: '@@/TopLine.vue',
      //   },
    },
    listPageSize: 25,
    // listTableClickUrl: async (record, adminUser) => null,
    fieldGroups: [
      {
        groupName: "Main info",
        columns: ["id", "title", "description", "country", "apartment_image"],
      },
      {
        groupName: "Characteristics",
        columns: [
          "price",
          "square_meter",
          "number_of_rooms",
          "room_sizes",
          "listed",
        ],
      },
    ],
    bulkActions: [
      {
        label: "Mark as listed",
        // icon: 'typcn:archive',
        confirm:
          "Are you sure you want to mark all selected apartments as listed?",
        action: async function ({ selectedIds, adminUser }: any) {
          const stmt = admin.resource('aparts').dataConnector.client.prepare(
            `UPDATE apartments SET listed = 1 WHERE id IN (${selectedIds
              .map(() => "?")
              .join(",")})`
          );
          await stmt.run(...selectedIds);
          return { ok: true, successMessage: "Marked as listed" };
        },
      },
    ],
    allowedActions: {
      edit: async ({
        adminUser,
        source,
        meta,
      }: {
        adminUser: AdminUser;
        meta: any;
        source: ActionCheckSource;
      }): Promise<boolean | string> => {
        return adminUser.dbUser.role === "superadmin";
        // return true;
        // if (source === ActionCheckSource.DisplayButtons) {
        //   // if check is done for displaying button - we show button to everyone
        //   return true;
        // }
        // const { oldRecord, newRecord } = meta;
        // if (oldRecord.realtor_id !== adminUser.dbUser.id) {
        //   return "You are not assigned to this apartment and can't edit it";
        // }
        // if (newRecord.realtor_id !== oldRecord.realtor_id) {
        //   return "You can't change the owner of the apartment";
        // }
        // return true;
      },
      delete: async (p) => {
        return true;
      },
      show: async ({ adminUser, meta, source, adminforth }: any) => {
        // if (source === 'showRequest' || source === 'editLoadRequest') {
        //   const record = await adminforth.resource('aparts').get(Filters.EQ('id', meta.pk));
        //   return record.user_id === adminUser.dbUser.id;
        // }
        return true;
      },
      filter: true,
      create: true,
    },
  },
} as AdminForthResourceInput;
