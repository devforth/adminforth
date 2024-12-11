import AdminForth, { AdminForthPlugin, Filters, suggestIfTypo, AdminForthDataTypes } from "adminforth";
import type { IAdminForth, IHttpServer, AdminForthComponentDeclaration, AdminForthResourceColumn, AdminForthResource, BeforeLoginConfirmationFunction } from "adminforth";
import type { PluginOptions } from './types.js';
import iso6391, { LanguageCode } from 'iso-639-1';
import path from 'path';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import { th } from "@faker-js/faker";

interface ICachingAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  clear(key: string): Promise<void>;
}

class CachingAdapterMemory implements ICachingAdapter {
  cache: Record<string, any> = {};
  async get(key: string) {
    return this.cache[key];
  }
  async set(key: string, value: any) {
    this.cache[key] = value;
  }
  async clear(key: string) {
    delete this.cache[key];
  }
}


export default class OpenSignupPlugin extends AdminForthPlugin {
  options: PluginOptions;
  emailField: AdminForthResourceColumn;
  passwordField: AdminForthResourceColumn;
  authResource: AdminForthResource;
  emailConfirmedField?: AdminForthResourceColumn;
  trFieldNames: Partial<Record<LanguageCode, string>>;
  enFieldName: string;
  cache: ICachingAdapter;

  adminforth: IAdminForth;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
    this.cache = new CachingAdapterMemory();
    this.trFieldNames = {};
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);

    // check each supported language is valid ISO 639-1 code
    this.options.supportedLanguages.forEach((lang) => {
      if (!iso6391.validate(lang)) {
        throw new Error(`Invalid language code ${lang}, please define valid ISO 639-1 language code (2 lowercase letters)`);
      }
    });


    // parse trFieldNames
    for (const lang of this.options.supportedLanguages) {
      if (lang === 'en') {
        continue;
      }
      if (this.options.translationFieldNames?.[lang]) {
        this.trFieldNames[lang] = this.options.translationFieldNames[lang];
      } else {
        this.trFieldNames[lang] = lang + '_string';
      }
      // find column by name
      const column = resourceConfig.columns.find(c => c.name === this.trFieldNames[lang]);
      if (!column) {
        throw new Error(`Field ${this.trFieldNames[lang]} not found for storing translation for language ${lang}
           in resource ${resourceConfig.resourceId}, consider adding it to columns or change trFieldNames option to remap it to existing column`);
      }
    }

    this.enFieldName = this.trFieldNames['en'] || 'en_string';

    // if not enFieldName column is not found, throw error
    const enColumn = resourceConfig.columns.find(c => c.name === this.enFieldName);
    if (!enColumn) {
      throw new Error(`Field ${this.enFieldName} not found column to store english original string in resource ${resourceConfig.resourceId}`);
    }
    // for faster performance it should be a primary key
    if (!enColumn.primaryKey) {
      throw new Error(`Field ${this.enFieldName} should be primary key in resource ${resourceConfig.resourceId}`);
    }

    // if sourceFieldName defined, check it exists
    if (this.options.sourceFieldName) {
      if (!resourceConfig.columns.find(c => c.name === this.options.sourceFieldName)) {
        throw new Error(`Field ${this.options.sourceFieldName} not found in resource ${resourceConfig.resourceId}`);
      }
    }

    // add underLogin component
    (adminforth.config.customization.loginPageInjections.underInputs as AdminForthComponentDeclaration[]).push({ 
      file: this.componentPath('LanguageUnderLogin.vue'),
      meta: { 
        brandSlug: adminforth.config.customization.brandNameSlug,
        pluginInstanceId: this.pluginInstanceId,
        supportedLanguages: this.options.supportedLanguages.map(lang => (
          {
            code: lang,
            // lang name on on language native name
            name: iso6391.getNativeName(lang),
          }
        ))
      }
    });

    // disable create allowedActions for translations
    resourceConfig.options.allowedActions.create = false;


    // add hook on edit of any translation
    // resourceConfig.hooks.edit.afterSave.push(async ({ record }: { record: any }) => {
    //   for (const lang of this.options.supportedLanguages) {
    //     if (lang === 'en') {
    //       continue;
    //     }
    //     this.cache.clear(`${resourceConfig.resourceId}:${lang}`);
    //   }
    // });


    // options: {
    //   bulkActions: [
    //       {
    //           label: 'Translate selected',
    //           icon: 'flowbite:language-outline',
    //           // if optional `confirm` is provided, user will be asked to confirm action
    //           confirm: 'Are you sure you want to translate selected items?',
    //           state: 'selected',
    //           action: async function ({ selectedIds }) {
    //               const data = await callBackofficeApi(
    //                   'bulk_translate_with_openai',
    //                   { en_strings: selectedIds }
    //               );

    //               return { ok: true, error: undefined, successMessage: `Translated ${selectedIds.length} items` };
    //           },
    //       }
    //   ]
    // },

    // add bulk action
    if (!resourceConfig.options.bulkActions) {
      resourceConfig.options.bulkActions = [];
    }
    
    if (this.options.completeAdapter) {
      resourceConfig.options.bulkActions.push(
        {
          label: 'Translate selected',
          icon: 'flowbite:language-outline',
          // if optional `confirm` is provided, user will be asked to confirm action
          confirm: 'Are you sure you want to translate selected items?',
          state: 'selected',
          action: async ({ selectedIds }) => {
            const data = await this.bulkTranslate({ selectedIds });
            return { ok: true, error: undefined, successMessage: `Translated ${selectedIds.length} items` };
          },
        }
      );  
    };


  }

  async bulkTranslate({ selectedIds }: { selectedIds: string[] }) {

    const needToTranslateByLang : Partial<Record<LanguageCode, Record<string, string>>> = {};

    const translations = await this.adminforth.resource(this.resourceConfig.resourceId).list(Filters.IN(this.enFieldName, selectedIds));

    for (const lang of this.options.supportedLanguages) {
      if (lang === 'en') {
        // all strings are in English, no need to translate
        continue;
      }
      for (const translation of translations) {
        if (!translation[this.trFieldNames[lang]]) {
          if (!needToTranslateByLang[lang]) {
            needToTranslateByLang[lang] = {};
          }
          needToTranslateByLang[lang][translation[this.enFieldName]] = "";
        }
      }
    }

    const transDiff = {};
    const maxKeysInOneReq = 10;


    const translateToLang = async (langIsoCode: LanguageCode, obj: Record<string, string>) => {
      if (Object.keys(obj).length > maxKeysInOneReq) {
        for (let i = 0; i < Object.keys(obj).length; i += maxKeysInOneReq) {
          const slicedObj = Object.fromEntries(Object.entries(obj).slice(i, i + maxKeysInOneReq));
          await translateToLang(langIsoCode, slicedObj);
        }
        return;
      }
      const lang = langIsoCode;
      const prompt = `
I need to translate strings in JSON to ${lang} language from English for my casino website.
Keep keys, as is, write translation into values! Here are the strings:

\`\`\`json
${JSON.stringify(obj)}
\`\`\`
`;
      // call OpenAI
      const resp = await this.options.completeAdapter.complete(
        prompt,
        [],
        300,
      );

      console.log('🪲resp', resp);

      // parse response like
      // Here are the translations for the strings you provided:
      // ```json
      // [{"live": "canlı"}, {"Table Games": "Masa Oyunları"}]
      // ```
      let res;
      try {
        res = resp.content.split("```json")[1].split("```")[0];
      } catch (e) {
        console.error('error in parsing OpenAI', resp);
        return;
      }
      res = JSON.parse(res);

      for (const [enStr, translatedStr] of Object.entries(res)) {
        const translation = translations.find(t => t[this.enFieldName] === enStr);
        translation[this.trFieldNames[lang]] = translatedStr;
        process.env.HEAVY_DEBUG && console.log(`🪲translated to ${lang} ${translation.en_string}, ${translatedStr}`)
        this.adminforth.resource(this.resourceConfig.resourceId).update(translation.en_string, {
          [this.trFieldNames[lang]]: translatedStr,
        });

        if (!transDiff[enStr]) {
          transDiff[enStr] = {};
        }
      }

    }
    const langsInvolved = new Set(Object.keys(needToTranslateByLang));

    await Promise.all(Object.entries(needToTranslateByLang).map(async ([lang, obj]: [LanguageCode, Record<string, string>]) => {
      await translateToLang(lang, obj);
    }));    

    for (const lang of langsInvolved) {
      this.cache.clear(`${this.resourceConfig.resourceId}:${lang}`);
    }

    return {
      ok: true,
      error: undefined,
      successMessage: `Translated ${selectedIds.length} items`,

    }

  }

  async processExtractedMessages(adminforth: IAdminForth, filePath: string) {
    // messages file is in i18n-messages.json
    let messages;
    try {
      messages = await fs.readJson(filePath);
      process.env.HEAVY_DEBUG && console.info('🐛 Messages file found');

    } catch (e) {
      process.env.HEAVY_DEBUG && console.error('🐛 Messages file not yet exists, probably npm run i18n:extract not finished/started yet, might be ok');
      return;
    }
    console.log('🪲messages', messages);
    // loop over missingKeys[i].path and add them to database if not exists
    await Promise.all(messages.missingKeys.map(async (missingKey: any) => {
      const key = missingKey.path;
      const file = missingKey.file;
      const source = 'frontend';
      const exists = await adminforth.resource(this.resourceConfig.resourceId).count(Filters.EQ(this.enFieldName, key));
      console.log('🪲exists', exists);
      if (exists) {
        return;
      }
      const record = {
        [this.enFieldName]: key,
        ...(this.options.sourceFieldName ? { [this.options.sourceFieldName]: `${source}:${file}` } : {}),
      };
      try {
        await adminforth.resource(this.resourceConfig.resourceId).create(record);
      } catch (e) {
        console.error('🐛 Error creating record', e);
      }
    }))


  }


  async tryProcessAndWatch(adminforth: IAdminForth) {
    const spaDir = adminforth.codeInjector.spaTmpPath();
    // messages file is in i18n-messages.json
    const messagesFile = path.join(spaDir, '..', 'spa_tmp', 'i18n-messages.json');
    console.log('🪲messagesFile', messagesFile);
    this.processExtractedMessages(adminforth, messagesFile);
    // we use watcher because file can't be yet created when we start - bundleNow can be done in build time or can be done now
    // that is why we make attempt to process it now and then watch for changes
    const w = chokidar.watch(messagesFile, { persistent: true });
    w.on('change', () => {
      this.processExtractedMessages(adminforth, messagesFile);
    });
    w.on('add', () => {
      this.processExtractedMessages(adminforth, messagesFile);
    });

  }
  
  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    // optional method where you can safely check field types after database discovery was performed
    // ensure each trFieldName (apart from enFieldName) is nullable column of type string
    for (const lang of this.options.supportedLanguages) {
      if (lang === 'en') {
        continue;
      }
      const column = resourceConfig.columns.find(c => c.name === this.trFieldNames[lang]);
      if (!column) {
        throw new Error(`Field ${this.trFieldNames[lang]} not found for storing translation for language ${lang}
           in resource ${resourceConfig.resourceId}, consider adding it to columns or change trFieldNames option to remap it to existing column`);
      }
      if (column.required.create || column.required.edit) {
        throw new Error(`Field ${this.trFieldNames[lang]} should be not required in resource ${resourceConfig.resourceId}`);
      }
    }
    
    // in this plugin we will use plugin to fill the database with missing language messages
    this.tryProcessAndWatch(adminforth);

  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    // optional method to return unique string representation of plugin instance. 
    // Needed if plugin can have multiple instances on one resource 
    return `single`;
  }


  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'GET',
      path: `/plugin/${this.pluginInstanceId}/frontend_messages`,
      noAuth: true,
      handler: async ({ query }) => {
        const lang = query.lang;
        
        // form map of translations
        const resource = this.adminforth.resource(this.resourceConfig.resourceId);
        const cacheKey = `${this.resourceConfig.resourceId}:${lang}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return cached;
        }
        const translations = {};
        const allTranslations = await resource.list([]);
        for (const tr of allTranslations) {
          translations[tr[this.enFieldName]] = tr[this.trFieldNames[lang]];
        }
        await this.cache.set(cacheKey, translations);
        return translations;

      }
    });

  }

}