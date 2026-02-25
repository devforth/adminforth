
import CompletionAdapterOpenAIChatGPT from "../../adapters/adminforth-completion-adapter-open-ai-chat-gpt/index.js";
import AdminForth, { AdminForthDataTypes, AdminForthResourceInput } from "../../adminforth/index.js";
import I18nPlugin from "../../plugins/adminforth-i18n/index.js";
import { randomUUID } from 'crypto';


export default {
  dataSource: "sqlite",
  table: "translations",
  resourceId: "translations",
  label: "Translations",

  recordLabel: (r: any) => `✍️ ${r.en_string}`,
  plugins: [
    new I18nPlugin({
      supportedLanguages: ['en', 'uk', 'ja', 'fr', 'pt-BR'],

      // names of the fields in the resource which will store translations
      translationFieldNames: {
        en: 'en_string',
        uk: 'uk_string',
        ja: 'ja_string',
        fr: 'fr_string',
        'pt-BR': 'ptBR_string',

      },

      // name of the field which will store the category of the string
      // this helps to categorize strings and deliver them efficiently
      categoryFieldName: 'category',

      // optional field to store the source (e.g. source file name)
      sourceFieldName: 'source',

      // optional field store list of completed translations
      // will hel to filter out incomplete translations
      completedFieldName: 'completedLangs',
      completeAdapter: new CompletionAdapterOpenAIChatGPT({
        openAiApiKey: process.env.OPENAI_API_KEY as string,
        model: 'gpt-5-mini',
      }),
      // translateLangAsBCP47Code: {sr: 'sr-Cyrl'},
    }),

  ],
  options: {
    listPageSize: 30,
  },
  columns: [
    {
      name: "id",
      fillOnCreate: ({ initialRecord, adminUser }: any) => randomUUID(),
      primaryKey: true,
      showIn: { all: false },
    },
    {
      name: "en_string",
      type: AdminForthDataTypes.STRING,
      label: 'English',
    },
    {
      name: "created_at",
      fillOnCreate: ({ initialRecord, adminUser }: any) => new Date().toISOString(),
      showIn: {
        all: false,
        show: true,
        edit: false,
      },
    },
    {
      name: "uk_string",
      type: AdminForthDataTypes.STRING,
      label: 'Ukrainian',
    },
    {
      name: "ja_string",
      type: AdminForthDataTypes.STRING,
      label: 'Japanese',
    },
    {
      name: "fr_string",
      type: AdminForthDataTypes.STRING,
      label: 'French',
    },
    { 
      name: "ptBR_string",
      type: AdminForthDataTypes.STRING,
      label: "Portuguese (BR)"
    },
    {
      name: "completedLangs",
    },
    {
      name: "source",
      showIn: {
        list: false,
        edit: false,
        create: false,
      },
      type: AdminForthDataTypes.STRING,
    },
    {
      name: "category",
      showIn: {
        edit: false,
        create: false,
      },
      type: AdminForthDataTypes.STRING,
    }
  ],
} as AdminForthResourceInput;