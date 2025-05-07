import AdminForth, {
  AdminForthDataTypes,
  AdminForthResourceInput,
} from "../../adminforth";
import CompletionAdapterOpenAIChatGPT from "../../adapters/adminforth-completion-adapter-open-ai-chat-gpt";
import I18nPlugin from "../../plugins/adminforth-i18n";
import { randomUUID } from "crypto";


export default {
  dataSource: "maindb",
  table: "translations",
  resourceId: "translations",
  label: "Translations",

  recordLabel: (r: any) => `👤 ${r.en_string}`,
  plugins: [
    new I18nPlugin({
      // supportedLanguages: ['en', 'uk', 'ja', 'fr'],
      // supportedLanguages: ['en', 'uk'],

      supportedLanguages: ['zh', 'es', 'en', 'hi', 'bn', 'pt', 'ar', 'pa', 'ur', 'vi', 'tr', 'ko', 'fr', 'de', 'ja', 'it', 'uk', 'az'],

      // names of the fields in the resource which will store translations
      translationFieldNames: {
        en: 'en_string',
        uk: 'uk_string',
        ar: 'ar_string',
        ru: 'ru_string',
        zh: 'zh_string',
        es: 'es_string',
        hi: 'hi_string',
        bn: 'bn_string',
        pt: 'pt_string',
        ja: 'ja_string',
        de: 'de_string',
        tr: 'tr_string',
        fr: 'fr_string',
        pa: 'pa_string',
        ko: 'ko_string',
        ur: 'ur_string',
        az: 'az_string',
        vi: 'vi_string',
        it: 'it_string',
      },

      // name of the field which will store the category of the string
      // this helps to categorize strings and deliver them efficiently
      categoryFieldName: 'category',

      // optional field to store the source (e.g. source file name)
      sourceFieldName: 'source',

      // optional field store list of completed translations
      // will hel to filter out incomplete translations
      completedFieldName: 'completedLangs',

      // optional field to enable "Reviewed" checkbox for each translation string
      reviewedCheckboxesFieldName: 'reviewed',

      completeAdapter: new CompletionAdapterOpenAIChatGPT({
        openAiApiKey: process.env.OPENAI_API_KEY as string,
        model: 'gpt-4o',
        expert: {
          // for UI translation it is better to lower down the temperature from default 0.7. Less creative and more accurate
          temperature: 0.5,
        },
      }),
    }),
  ],
  options: {
    listPageSize: 100,
    allowedActions: {
      edit: true,
    }
  },
  columns: [
    {
      name: "id",
      fillOnCreate: ({ initialRecord, adminUser }: any) => randomUUID(),
      primaryKey: true,
      showIn: [],
    },
    {
      name: "en_string",
      type: AdminForthDataTypes.STRING,
      label: "English",
      required: true,
      editingNote: "This is the original string in English. It will be used as a reference for translation.",
    },
    {
      name: "created_at",
      fillOnCreate: ({ initialRecord, adminUser }: any) => new Date().toISOString(),
      showIn: {
        all: false,
        show: true,
      },
    },
    { name: "uk_string", type: AdminForthDataTypes.STRING, label: "Ukrainian" },
    { name: "ar_string", type: AdminForthDataTypes.STRING, label: "Arabic" },
    { name: "ru_string", type: AdminForthDataTypes.STRING, label: "Russian" },
    { name: "zh_string", type: AdminForthDataTypes.STRING, label: "Chinese" },
    { name: "es_string", type: AdminForthDataTypes.STRING, label: "Spanish" },
    { name: "hi_string", type: AdminForthDataTypes.STRING, label: "Hindi" },
    { name: "bn_string", type: AdminForthDataTypes.STRING, label: "Bengali" },
    { name: "pt_string", type: AdminForthDataTypes.STRING, label: "Portuguese" },
    { name: "ja_string", type: AdminForthDataTypes.STRING, label: "Japanese" },
    { name: "de_string", type: AdminForthDataTypes.STRING, label: "German" },
    { name: "tr_string", type: AdminForthDataTypes.STRING, label: "Turkish" },
    { name: "fr_string", type: AdminForthDataTypes.STRING, label: "French" },
    { name: "pa_string", type: AdminForthDataTypes.STRING, label: "Punjabi" },
    { name: "ko_string", type: AdminForthDataTypes.STRING, label: "Korean" },
    { name: "ur_string", type: AdminForthDataTypes.STRING, label: "Urdu" },
    { name: "az_string", type: AdminForthDataTypes.STRING, label: "Azerbaijani" },
    { name: "vi_string", type: AdminForthDataTypes.STRING, label: "Vietnamese" },
    { name: "it_string", type: AdminForthDataTypes.STRING, label: "Italian" },
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
    },
    {
      name: "reviewed",
      type: AdminForthDataTypes.JSON,
      showIn: {
        all: false,
      }
    }
  ],
} as AdminForthResourceInput;
