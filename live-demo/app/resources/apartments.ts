import { AdminForthDataTypes, AdminForthResourceInput } from 'adminforth';
import importExport from '@adminforth/import-export';
import RichEditorPlugin from '@adminforth/rich-editor';
import ChatGptPlugin from '@adminforth/chat-gpt';
import UploadPlugin from '@adminforth/upload';





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
      showIn: ['filter', 'show'], // show column in filter and in show page
      primaryKey: true,
      fillOnCreate: ({initialRecord, adminUser}) => Math.random().toString(36).substring(7),  // called during creation to generate content of field, initialRecord is values user entered, adminUser object of user who creates record
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
        all: false,
        create: true,
        edit: true,
        show: true,
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
    new ChatGptPlugin({
      openAiApiKey: process.env.OPENAI_API_KEY as string,
      fieldName: 'title',
    }),
    new UploadPlugin({
      pathColumnName: 'apartment_image',
      s3Bucket: 'demo-static.adminforth.dev', // ❗ Your bucket name
      s3Region: 'eu-north-1', // ❗ Selected region
      s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      s3ACL: 'public-read',
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
      maxFileSize: 1024 * 1024 * 20, // 5MB
      s3Path: ({originalFilename, originalExtension, contentType}) => 
            `aparts/${new Date().getFullYear()}/${uuid()}-${originalFilename}.${originalExtension}`,
      // You can use next to change preview URLs (if it is image) in list and show views
      preview: {
        showInList: true,
        previewUrl: ({s3Path}) => `https://demo-static.adminforth.dev/${s3Path}`,
      }
    })
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