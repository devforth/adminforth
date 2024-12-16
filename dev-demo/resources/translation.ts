import AdminForth, {
  AdminForthDataTypes,
  AdminForthResourceInput,
} from "../../adminforth";
import CompletionAdapterOpenAIChatGPT from "../../adminforth/adapters/completion-adapter-open-ai-chat-gpt";
import I18nPlugin from "../../adminforth/plugins/i18n";
import { v1 as uuid } from "uuid";



export default {
  dataSource: "maindb",
  table: "translations",
  resourceId: "translations",
  label: "Translations",

  recordLabel: (r: any) => `👤 ${r.en_string}`,
  plugins: [
    new I18nPlugin({
      supportedLanguages: ['en', 'uk', 'ja', 'fr'],

      // names of the fields in the resource which will store translations
      translationFieldNames: {
        en: 'en_string',
        uk: 'uk_string',
        ja: 'ja_string',
        fr: 'fr_string',
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
      }),
    }),

  ],
  options: {
    allowedActions: {
    
    },
    listPageSize: 30,
  },
  columns: [
    {
      name: "id",
      fillOnCreate: ({ initialRecord, adminUser }: any) => uuid(),
      primaryKey: true,
      showIn: [],
    },
    {
      name: "en_string",
      type: AdminForthDataTypes.STRING,
    },
    {
      name: "created_at",
      fillOnCreate: ({ initialRecord, adminUser }: any) => new Date().toISOString(),
    },
    {
      name: "uk_string",
      type: AdminForthDataTypes.STRING,
    },
    {
      name: "ja_string",
      type: AdminForthDataTypes.STRING,
    },
    {
      name: "fr_string",
      type: AdminForthDataTypes.STRING,
    },
    {
      name: "completedLangs",
    },
    {
      name: "source",
      showIn: ['filter', 'show'],
      type: AdminForthDataTypes.STRING,
    },
    {
      name: "category",
      showIn: ['filter', 'show', 'list'],
      type: AdminForthDataTypes.STRING,
    }
  ],
} as AdminForthResourceInput;
