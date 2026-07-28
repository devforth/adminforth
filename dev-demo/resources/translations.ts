
import CompletionAdapterOpenAIResponses from "../../adapters/adminforth-completion-adapter-openai-responses/index.js";
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
      supportedLanguages: [
        'en', 'uk', 'ja', 'fr', 'es', 'pt-BR',
        'de', 'it', 'pt', 'nl', 'pl', 'tr', 'cs', 'sv', 'da', 'fi',
        'ro', 'hu', 'el', 'bg', 'zh', 'ko', 'ar', 'he', 'hi', 'vi',
      ],

      // names of the fields in the resource which will store translations
      translationFieldNames: {
        en: 'en_string',
        uk: 'uk_string',
        ja: 'ja_string',
        fr: 'fr_string',
        es: 'es_string',
        'pt-BR': 'ptBR_string',
        de: 'de_string',
        it: 'it_string',
        pt: 'pt_string',
        nl: 'nl_string',
        pl: 'pl_string',
        tr: 'tr_string',
        cs: 'cs_string',
        sv: 'sv_string',
        da: 'da_string',
        fi: 'fi_string',
        ro: 'ro_string',
        hu: 'hu_string',
        el: 'el_string',
        bg: 'bg_string',
        zh: 'zh_string',
        ko: 'ko_string',
        ar: 'ar_string',
        he: 'he_string',
        hi: 'hi_string',
        vi: 'vi_string',
      },

      // name of the field which will store the category of the string
      // this helps to categorize strings and deliver them efficiently
      categoryFieldName: 'category',

      // optional field to store the source (e.g. source file name)
      sourceFieldName: 'source',

      // optional field store list of completed translations
      // will hel to filter out incomplete translations
      completedFieldName: 'completedLangs',
      ...(process.env.OPENAI_API_KEY ? 
        { 
        completeAdapter: new CompletionAdapterOpenAIResponses({
          openAiApiKey: process.env.OPENAI_API_KEY as string,
          model: 'gpt-5-mini',
        }),
        // translateLangAsBCP47Code: {sr: 'sr-Cyrl'},
        parallelTranslationLimit: 1 
       } 
      : {}),
      // translateLangAsBCP47Code: {sr: 'sr-Cyrl'},
      parallelTranslationLimit: 1
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
      name: "es_string",
      type: AdminForthDataTypes.STRING,
      label: 'Spanish',
    },
    {
      name: "ptBR_string",
      type: AdminForthDataTypes.STRING,
      label: "Portuguese (BR)"
    },

    // rest of the languages are hidden from the list to keep it readable,
    // they are still editable on show/edit pages and translatable by the plugin
    {
      name: "de_string",
      type: AdminForthDataTypes.STRING,
      label: 'German',
      showIn: { list: true },
    },
    {
      name: "it_string",
      type: AdminForthDataTypes.STRING,
      label: 'Italian',
      showIn: { list: true },
    },
    {
      name: "pt_string",
      type: AdminForthDataTypes.STRING,
      label: 'Portuguese',
      showIn: { list: true },
    },
    {
      name: "nl_string",
      type: AdminForthDataTypes.STRING,
      label: 'Dutch',
      showIn: { list: true },
    },
    {
      name: "pl_string",
      type: AdminForthDataTypes.STRING,
      label: 'Polish',
      showIn: { list: true },
    },
    {
      name: "tr_string",
      type: AdminForthDataTypes.STRING,
      label: 'Turkish',
      showIn: { list: true },
    },
    {
      name: "cs_string",
      type: AdminForthDataTypes.STRING,
      label: 'Czech',
      showIn: { list: true },
    },
    {
      name: "sv_string",
      type: AdminForthDataTypes.STRING,
      label: 'Swedish',
      showIn: { list: true },
    },
    {
      name: "da_string",
      type: AdminForthDataTypes.STRING,
      label: 'Danish',
      showIn: { list: true },
    },
    {
      name: "fi_string",
      type: AdminForthDataTypes.STRING,
      label: 'Finnish',
      showIn: { list: true },
    },
    {
      name: "ro_string",
      type: AdminForthDataTypes.STRING,
      label: 'Romanian',
      showIn: { list: true },
    },
    {
      name: "hu_string",
      type: AdminForthDataTypes.STRING,
      label: 'Hungarian',
      showIn: { list: true },
    },
    {
      name: "el_string",
      type: AdminForthDataTypes.STRING,
      label: 'Greek',
      showIn: { list: true },
    },
    {
      name: "bg_string",
      type: AdminForthDataTypes.STRING,
      label: 'Bulgarian',
      showIn: { list: true },
    },
    {
      name: "zh_string",
      type: AdminForthDataTypes.STRING,
      label: 'Chinese',
      showIn: { list: true },
    },
    {
      name: "ko_string",
      type: AdminForthDataTypes.STRING,
      label: 'Korean',
      showIn: { list: true },
    },
    {
      name: "ar_string",
      type: AdminForthDataTypes.STRING,
      label: 'Arabic',
      showIn: { list: true },
    },
    {
      name: "he_string",
      type: AdminForthDataTypes.STRING,
      label: 'Hebrew',
      showIn: { list: true },
    },
    {
      name: "hi_string",
      type: AdminForthDataTypes.STRING,
      label: 'Hindi',
      showIn: { list: true },
    },
    {
      name: "vi_string",
      type: AdminForthDataTypes.STRING,
      label: 'Vietnamese',
      showIn: { list: true },
    },

    {
      name: "completedLangs",
    },
    {
      name: "source",
      showIn: {
        list: true,
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