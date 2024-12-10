import AdminForth, {
  AdminForthDataTypes,
  AdminForthResource,
  AdminForthResourceColumn,
  AdminForthResourceInput,
  AdminUser,
} from "../../adminforth";
import I18nPlugin from "../../adminforth/plugins/i18n";
import { v1 as uuid } from "uuid";


// model translations {
//   en_string   @id
//   created_at  DateTime
//   uk_string   String
//   jp_string   String
//   fr_string   String
// }
export default {
  dataSource: "maindb",
  table: "translations",
  resourceId: "translations",
  label: "Translations",

  recordLabel: (r: any) => `👤 ${r.email}`,
  plugins: [
    new I18nPlugin({
      supportedLanguages: ['en', 'uk', 'ja', 'fr'],
      translationFieldNames: {
        en: 'en_string',
        uk: 'uk_string',
        ja: 'ja_string',
        fr: 'fr_string',
      },
      sourceFieldName: 'source',
    }),

  ],
  options: {
    allowedActions: {
    
    },
  },
  columns: [
    {
      name: "en_string",
      primaryKey: true,
    },
    {
      name: "created_at",
      fillOnCreate: ({ initialRecord, adminUser }: any) => new Date().toISOString(),
    },
    {
      name: "uk_string",
    },
    {
      name: "ja_string",
    },
    {
      name: "fr_string",
    },
    {
      name: "source",
    }


  ],
  hooks: {
    
  },
} as AdminForthResourceInput;
