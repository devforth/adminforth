
import AdminForth, { AdminForthDataTypes, AdminForthResourceInput } from "adminforth";
import CompletionAdapterOpenAIChatGPT from "@adminforth/completion-adapter-open-ai-chat-gpt";
import I18nPlugin from "@adminforth/i18n";
import { v1 as uuid } from "uuid";

const blockDemoUsers = async ({ record, adminUser, resource }) => {
  if (adminUser.dbUser && adminUser.dbUser.role !== 'superadmin') {
    return { ok: false, error: "You can't do this on demo.adminforth.dev" }
  }
  return { ok: true };
}

const isAdmin = ({ adminUser }) => {
  return adminUser.dbUser && adminUser.dbUser.role === 'superadmin';
}

export default {
  dataSource: "maindb",
  table: "translations",
  resourceId: "translations",
  label: "Translations",

  recordLabel: (r: any) => `✍️ ${r.en_string}`,
  hooks: {
    delete: {
      beforeSave: blockDemoUsers,
    },
    edit: {
      beforeSave: blockDemoUsers,
    },
  },
  plugins: [
    new I18nPlugin({
      supportedLanguages: ['en', 'uk', 'ja', 'fr', 'de'],      // names of the fields in the resource which will store translations
      translationFieldNames: {
        en: 'en_string',
        uk: 'uk_string',
        ja: 'ja_string',
        fr: 'fr_string',
        de: 'de_string',
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
        model: 'gpt-4o-mini',
        expert: {
          // for UI translation it is better to lower down the temperature from default 0.7. Less creative and more accurate
          temperature: 0.5,
        },
      }),
    }),

  ],
  options: {
    listPageSize: 30,
    allowedActions: {
      create: false,
      edit: isAdmin,
    },
  },
  columns: [
    {
      name: "id",
      fillOnCreate: ({ initialRecord, adminUser }: any) => uuid(),
      primaryKey: true,
      showIn: { all: false }
    },
    {
      name: "en_string",
      type: AdminForthDataTypes.STRING,
      label: 'English',
    },
    {
      name: "created_at",
      fillOnCreate: ({ initialRecord, adminUser }: any) => new Date().toISOString(),
      showIn: { create: false }
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
      name: "de_string",
      type: AdminForthDataTypes.STRING,
      label: 'German',
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