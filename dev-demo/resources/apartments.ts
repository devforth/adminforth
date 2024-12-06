import {
  ActionCheckSource,
  AdminForthDataTypes,
  AdminUser,
  Filters,
} from "../../adminforth";
import TextCompletePlugin from "../../adminforth/plugins/text-complete";
import UploadPlugin from "../../adminforth/plugins/upload";
import ImportExportPlugin from "../../adminforth/plugins/import-export/index.js";
import { v1 as uuid } from "uuid";
import RichEditorPlugin from "../../adminforth/plugins/rich-editor";
import { AdminForthResourceInput } from "../../adminforth";
import CompletionAdapterOpenAIChatGPT from "../../adminforth/adapters/completion-adapter-open-ai-chat-gpt/index.js";

const demoChecker = async ({ record, adminUser, resource }) => {
  if (adminUser.dbUser.role !== "superadmin") {
    return { ok: false, error: "You can't do this on demo.adminforth.dev" };
  }
  return { ok: true };
};

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
          // random country
          const countries = [
            "US",
            "DE",
            "FR",
            "GB",
            "NL",
            "IT",
            "ES",
            "DK",
            "PL",
            "UA",
            "CA",
            "AU",
            "BR",
            "JP",
            "CN",
            "IN",
            "KR",
            "TR",
            "MX",
            "ID",
            "NG",
            "SA",
            "EG",
            "ZA",
            "AR",
            "SE",
            "CH",
            "AT",
            "BE",
            "FI",
            "NO",
            "PT",
            "GR",
            "HU",
            "IE",
            "IL",
            "LU",
            "SK",
            "SI",
            "LT",
            "LV",
            "EE",
            "HR",
            "CZ",
            "BG",
            "RO",
            "RS",
            "IS",
            "MT",
            "CY",
            "AL",
            "MK",
            "ME",
            "BA",
            "XK",
            "MD",
            "LI",
            "AD",
            "MC",
            "SM",
            "VA",
            "UA",
            "BY",
          ];
          r.country = countries[Math.floor(Math.random() * countries.length)];
        });
        return { ok: true, error: "" };
      },
    },
  },
  columns: [
    {
      name: "id",
      label: "Identifier", // if you wish you can redefine label
      showIn: ["filter", "show", "list"], // show in filter and in show page
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
      showIn: ["list", "create", "edit", "filter", "show"], // the default is full set
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
      components: {
        list: {
          file: "@/renderers/CountryFlag.vue",
          meta: {
            showCountryName: false,
          },
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
      showIn: ["list", "filter", "show", "edit"],
      components: {
        list: "@/renderers/RelativeTime.vue",
      },
      // @ts-ignore
      fillOnCreate: ({ initialRecord, adminUser }) => new Date().toISOString(),
    },
    {
      name: "apartment_image",
      showIn: ["show"],
      required: false,
      editingNote: "Upload image of apartment",
    },
    {
      name: "price",
      showIn: ["create", "edit", "filter", "show"],
      allowMinMaxQuery: true, // use better experience for filtering e.g. date range, set it only if you have index on this column or if there will be low number of rows
      editingNote: "Price is in USD", // you can appear note on editing or creating page
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
      showIn: ["filter", "show", "create", "edit"],
    },
    {
      name: "description",
      sortable: false,
      type: AdminForthDataTypes.RICHTEXT,
      showIn: ["filter", "show", "edit", "create"],
    },
    {
      name: "property_type",
      enum: [
        {
          value: "house",
          label: "House",
        },
        {
          value: "apartment",
          label: "Apartment",
        },
        {
          value: null,
          label: "Not defined",
        },
      ],
      // allowCustomValue: true,
    },
    {
      name: "listed",
      required: true, // will be required on create/edit
    },
    {
      name: "user_id",
      showIn: ["filter", "show", "edit", "list", "create"],
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
          new UploadPlugin({
            pathColumnName: "apartment_image",
            s3Bucket: "tmpbucket-adminforth",
            s3Region: "eu-central-1",
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
            s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
            // s3ACL: 'public-read', // ACL which will be set to uploaded file
            s3Path: ({ originalFilename, originalExtension, contentType }) =>
              `aparts/${new Date().getFullYear()}/${uuid()}/${originalFilename}.${originalExtension}`,
            generation: {
              provider: "openai-dall-e",
              countToGenerate: 2,
              openAiOptions: {
                model: "dall-e-3",
                size: "1792x1024",
                apiKey: process.env.OPENAI_API_KEY as string,
              },
              fieldsForContext: ["title"],
              rateLimit: {
                limit: "2/1m",
                errorMessage:
                  "For demo purposes, you can generate only 2 images per minute",
              },
            },
            preview: {
              // Used to display preview (if it is image) in list and show views
              // previewUrl: ({s3Path}) => `https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${s3Path}`,
              showInList: true,
              maxWidth: "200px",
            },
          }),
        ]
      : []),
    new ImportExportPlugin({}),
    new TextCompletePlugin({
      fieldName: "title",
      expert: {
        debounceTime: 250,
      },
      adapter: new CompletionAdapterOpenAIChatGPT({
        openAiApiKey: process.env.OPENAI_API_KEY as string,
      }),
    }),
    // new TextCompletePlugin({
    //   openAiApiKey: process.env.OPENAI_API_KEY as string,
    //   fieldName: 'description',
    //   expert: {
    //     debounceTime: 250,
    //   }
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
        customActionIcons: "@@/IdShow.vue",
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
          "property_type",
          "listed",
        ],
      },
    ],
    bulkActions: [
      {
        label: "Mark as listed",
        // icon: 'typcn:archive',
        state: "active",
        confirm:
          "Are you sure you want to mark all selected apartments as listed?",
        action: async function ({ selectedIds, adminUser }: any) {
          const stmt = db.prepare(
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
        console.log("edit aa check 🔒", meta, source, adminUser);
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
        console.log("show aa check 🔒", meta);
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
