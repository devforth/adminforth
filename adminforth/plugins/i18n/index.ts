import AdminForth, { AdminForthPlugin, Filters, suggestIfTypo, AdminForthDataTypes } from "adminforth";
import type { IAdminForth, IHttpServer, AdminForthComponentDeclaration, AdminForthResourceColumn, AdminForthResource, BeforeLoginConfirmationFunction } from "adminforth";
import type { PluginOptions } from './types.js';
import iso6391, { LanguageCode } from 'iso-639-1';
import path from 'path';
import fs from 'fs-extra';
import chokidar from 'chokidar';

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
    if (this.cache[key]) {
      delete this.cache[key];
    }
  }
}

class AiTranslateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiTranslateError';
  }
}
export default class I18N extends AdminForthPlugin {
  options: PluginOptions;
  emailField: AdminForthResourceColumn;
  passwordField: AdminForthResourceColumn;
  authResource: AdminForthResource;
  emailConfirmedField?: AdminForthResourceColumn;
  trFieldNames: Partial<Record<LanguageCode, string>>;
  enFieldName: string;
  cache: ICachingAdapter;
  primaryKeyFieldName: string;

  adminforth: IAdminForth;

  // sorted by name list of all supported languages, without en e.g. 'al|ro|uk'
  fullCompleatedFieldValue: string;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
    this.cache = new CachingAdapterMemory();
    this.trFieldNames = {};
  }

  async computeCompletedFieldValue(record: any) {
    return this.options.supportedLanguages.reduce((acc: string, lang: LanguageCode): string => {
      if (lang === 'en') {
        return acc;
      }
      if (record[this.trFieldNames[lang]]) {
        if (acc !== '') {
          acc += '|';
        }
        acc += (lang as string);
      }
      return acc;
    }, '');
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);

    // check each supported language is valid ISO 639-1 code
    this.options.supportedLanguages.forEach((lang) => {
      if (!iso6391.validate(lang)) {
        throw new Error(`Invalid language code ${lang}, please define valid ISO 639-1 language code (2 lowercase letters)`);
      }
    });

    

    // find primary key field
    this.primaryKeyFieldName = resourceConfig.columns.find(c => c.primaryKey)?.name;

    if (!this.primaryKeyFieldName) {
      throw new Error(`Primary key field not found in resource ${resourceConfig.resourceId}`);
    }


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

    this.fullCompleatedFieldValue = this.options.supportedLanguages.reduce((acc: string, lang: LanguageCode) => {
      if (lang === 'en') {
        return acc;
      }
      if (acc !== '') {
        acc += '|';
      }
      acc += lang as string;
      return acc;
    }, '');

    // if not enFieldName column is not found, throw error
    const enColumn = resourceConfig.columns.find(c => c.name === this.enFieldName);
    if (!enColumn) {
      throw new Error(`Field ${this.enFieldName} not found column to store english original string in resource ${resourceConfig.resourceId}`);
    }

    // if sourceFieldName defined, check it exists
    if (this.options.sourceFieldName) {
      if (!resourceConfig.columns.find(c => c.name === this.options.sourceFieldName)) {
        throw new Error(`Field ${this.options.sourceFieldName} not found in resource ${resourceConfig.resourceId}`);
      }
    }

    // if completedFieldName defined, check it exists and should be string
    if (this.options.completedFieldName) {
      const column = resourceConfig.columns.find(c => c.name === this.options.completedFieldName);
      if (!column) {
        const similar = suggestIfTypo(resourceConfig.columns.map((col) => col.name), this.options.completedFieldName);
        throw new Error(`Field ${this.options.completedFieldName} not found in resource ${resourceConfig.resourceId}${similar ? `Did you mean '${similar}'?` : ''}`);
      }

      // if showIn is not defined, add it as empty
      column.showIn = [];

      // add virtual field for incomplete
      resourceConfig.columns.push({
        name: 'fully_translated',
        label: 'Fully translated',
        virtual: true,
        showIn: ['list', 'show', 'filter'],
        type: AdminForthDataTypes.BOOLEAN,
      });
    }

    const compMeta = { 
      brandSlug: adminforth.config.customization.brandNameSlug,
      pluginInstanceId: this.pluginInstanceId,
      supportedLanguages: this.options.supportedLanguages.map(lang => (
        {
          code: lang,
          // lang name on on language native name
          name: iso6391.getNativeName(lang),
        }
      ))
    };
    // add underLogin component
    (adminforth.config.customization.loginPageInjections.underInputs).push({ 
      file: this.componentPath('LanguageUnderLogin.vue'),
      meta: compMeta
    });

    (adminforth.config.customization.globalInjections.userMenu).push({
      file: this.componentPath('LanguageInUserMenu.vue'),
      meta: compMeta
    });

    // disable create allowedActions for translations
    resourceConfig.options.allowedActions.create = false;


    // add hook on edit of any translation
    resourceConfig.hooks.edit.afterSave.push(async ({ record, oldRecord }: { record: any, oldRecord?: any }): Promise<{ ok: boolean, error?: string }> => {
      if (oldRecord) {
        // find lang which changed
        let langsChanged: LanguageCode[] = [];
        for (const lang of this.options.supportedLanguages) {
          if (lang === 'en') {
            continue;
          }
          if (record[this.trFieldNames[lang]] !== oldRecord[this.trFieldNames[lang]]) {
            langsChanged.push(lang);
          }
        }

        // clear frontend cache for all langsChanged
        for (const lang of langsChanged) {
          this.cache.clear(`${this.resourceConfig.resourceId}:frontend:${lang}`);
        }


      }
      // clear frontend cache for all lan

      return { ok: true };
    });

    if (this.options.completedFieldName) {
      // on show and list add a list hook which will add incomplete field to record if translation is missing for at least one language
      const addIncompleteField = (record: any) => {
        // form list of all langs, sorted by alphabet, without en, to get 'al|ro|uk'
        
      
        record.fully_translated = this.fullCompleatedFieldValue === record[this.options.completedFieldName];
      }
      resourceConfig.hooks.list.afterDatasourceResponse.push(async ({ response }: { response: any[] }): Promise<{  ok: boolean, error?: string }> => {
        response.forEach(addIncompleteField);
        return { ok: true }
      });
      resourceConfig.hooks.show.afterDatasourceResponse.push(async ({ response }: { response: any }): Promise<{  ok: boolean, error?: string }> => {
        addIncompleteField(response.length && response[0]);
        return { ok: true }
      });

      // also add edit hook beforeSave to update completedFieldName
      resourceConfig.hooks.edit.beforeSave.push(async ({ record, oldRecord }: { record: any, oldRecord: any }): Promise<{ ok: boolean, error?: string }> => {
        const futureRecord = { ...oldRecord, ...record };
        
        const futureCompletedFieldValue = await this.computeCompletedFieldValue(futureRecord);
    
        record[this.options.completedFieldName] = futureCompletedFieldValue;
        return { ok: true };
      });

      // add list hook to support filtering by fully_translated virtual field
      resourceConfig.hooks.list.beforeDatasourceRequest.push(async ({ query }: { query: any }): Promise<{ ok: boolean, error?: string }> => {
        if (!query.filters || query.filters.length === 0) {
          query.filters = [];
        }

        // get fully_translated field from filter if it is there
        const fullyTranslatedFilter = query.filters.find((f: any) => f.field === 'fully_translated');
        if (fullyTranslatedFilter) {
          // remove it from filters because it is virtual field
          query.filters = query.filters.filter((f: any) => f.field !== 'fully_translated');
          if (fullyTranslatedFilter.value[0]) {
            query.filters.push({
              field: this.options.completedFieldName,
              value: this.fullCompleatedFieldValue,
              operator: 'eq',
            });
          } else {
            query.filters.push({
              field: this.options.completedFieldName,
              value: this.fullCompleatedFieldValue,
              operator: 'ne',
            });
          }
        }

        return { ok: true };
      });
    }

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
          action: async ({ selectedIds, tr }) => {
            try {
              await this.bulkTranslate({ selectedIds });
            } catch (e) {
              if (e instanceof AiTranslateError) {
                return { ok: false, error: e.message };
              }
            }
            return { 
              ok: true, error: undefined, 
              successMessage: await tr(`Translated {count} items`, 'frontend', {count: selectedIds.length}),
            };
          }
        }
      );  
    };
  }

  async bulkTranslate({ selectedIds }: { selectedIds: string[] }) {

    const needToTranslateByLang : Partial<
      Record<
        LanguageCode,
        {
          en_string: string;
          category: string;
        }[]
      >
    > = {};

    const translations = await this.adminforth.resource(this.resourceConfig.resourceId).list(Filters.IN(this.primaryKeyFieldName, selectedIds));

    for (const lang of this.options.supportedLanguages) {
      if (lang === 'en') {
        // all strings are in English, no need to translate
        continue;
      }
      for (const translation of translations) {
        if (!translation[this.trFieldNames[lang]]) {
          if (!needToTranslateByLang[lang]) {
            needToTranslateByLang[lang] = [];
          }
          needToTranslateByLang[lang].push({
            'en_string': translation[this.enFieldName],
            category: translation[this.options.categoryFieldName],
          })
        }
      }
    }

    const maxKeysInOneReq = 10;

    const updateStrings: Record<string, { 
      updates: any, category: string, strId: string
     }> = {};

    const translateToLang = async (langIsoCode: LanguageCode, strings: { en_string: string, category: string }[]) => {


      if (strings.length > maxKeysInOneReq) {
        for (let i = 0; i < strings.length; i += maxKeysInOneReq) {
          const slicedStrings = strings.slice(i, i + maxKeysInOneReq);
          await translateToLang(langIsoCode, slicedStrings);
        }
        return;
      }
      const lang = langIsoCode;
      const prompt = `
I need to translate strings in JSON to ${lang} language from English for my web app.
Keep keys, as is, write translation into values! Here are the strings:

\`\`\`json
${
  JSON.stringify(strings.reduce((acc: object, s: { en_string: string }): object => {
    acc[s.en_string] = '';
    return acc;
  }, {}), null, 2)
}
\`\`\`
`;
      // call OpenAI
      const resp = await this.options.completeAdapter.complete(
        prompt,
        [],
        300,
      );

      if (resp.error) {
        throw new AiTranslateError(resp.error);
      }

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
        const translationsTargeted = translations.filter(t => t[this.enFieldName] === enStr);
        // might be several with same en_string
        for (const translation of translationsTargeted) {
          translation[this.trFieldNames[lang]] = translatedStr;
          // process.env.HEAVY_DEBUG && console.log(`🪲translated to ${lang} ${translation.en_string}, ${translatedStr}`)
          if (!updateStrings[enStr]) {
            updateStrings[enStr] = {
              updates: {},
              category: translation[this.options.categoryFieldName],
              strId: translation[this.primaryKeyFieldName],
            };
          }
          updateStrings[enStr].updates[this.trFieldNames[lang]] = translatedStr;
        }
      }

    }

    const langsInvolved = new Set(Object.keys(needToTranslateByLang));

    await Promise.all(Object.entries(needToTranslateByLang).map(async ([lang, strings]: [LanguageCode, { en_string: string, category: string }[]]) => {
      await translateToLang(lang, strings);
    }));    

    await Promise.all(
      Object.entries(updateStrings).map(
        async ([_, { updates, strId }]: [string, { updates: any, category: string, strId: string }]) => {
          // because this will translate all languages, we can set completedLangs to all languages
          const futureCompletedFieldValue = this.fullCompleatedFieldValue; 

          await this.adminforth.resource(this.resourceConfig.resourceId).update(strId, {
            ...updates,
            [this.options.completedFieldName]: futureCompletedFieldValue,
          });
        }
      )
    );

    for (const lang of langsInvolved) {
      this.cache.clear(`${this.resourceConfig.resourceId}:frontend:${lang}`);
      for (const [enStr, { category }] of Object.entries(updateStrings)) {
        this.cache.clear(`${this.resourceConfig.resourceId}:${category}:${lang}:${enStr}`);
      }
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
    // loop over missingKeys[i].path and add them to database if not exists
    await Promise.all(messages.missingKeys.map(async (missingKey: any) => {
      const key = missingKey.path;
      const file = missingKey.file;
      const category = 'frontend';
      const exists = await adminforth.resource(this.resourceConfig.resourceId).count(Filters.EQ(this.enFieldName, key));
      if (exists) {
        return;
      }
      const record = {
        [this.enFieldName]: key,
        [this.options.categoryFieldName]: category,
        ...(this.options.sourceFieldName ? { [this.options.sourceFieldName]: file } : {}),
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

    // ensure categoryFieldName defined and is string
    if (!this.options.categoryFieldName) {
      throw new Error(`categoryFieldName option is not defined. It is used to categorize translations and return only specific category e.g. to frontend`);
    }
    const categoryColumn = resourceConfig.columns.find(c => c.name === this.options.categoryFieldName);
    if (!categoryColumn) {
      throw new Error(`Field ${this.options.categoryFieldName} not found in resource ${resourceConfig.resourceId}`);
    }
    if (categoryColumn.type !== AdminForthDataTypes.STRING && categoryColumn.type !== AdminForthDataTypes.TEXT) {
      throw new Error(`Field ${this.options.categoryFieldName} should be of type string in resource ${resourceConfig.resourceId}, but it is ${categoryColumn.type}`);
    }

    // in this plugin we will use plugin to fill the database with missing language messages
    this.tryProcessAndWatch(adminforth);

    adminforth.tr = async (msg: string, category: string, lang: string, params): Promise<string> => {
      // console.log('🪲tr', msg, category, lang);

      // if lang is not supported , throw
      if (!this.options.supportedLanguages.includes(lang as LanguageCode)) {
        throw new Error(`Language ${lang} is not entered to be supported by requested by browser in request headers accept-language`);
      }

      let result;
      // try to get translation from cache
      const cacheKey = `${resourceConfig.resourceId}:${category}:${lang}:${msg}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        result = cached;
      }
      if (!result) {
        const resource = adminforth.resource(resourceConfig.resourceId);
        const translation = await resource.get([Filters.EQ(this.enFieldName, msg), Filters.EQ(this.options.categoryFieldName, category)]);
        if (!translation) {
          await resource.create({
            [this.enFieldName]: msg,
            [this.options.categoryFieldName]: category,
          });
        }

        // do this check here, to faster register missing translations
        // also not cache it - no sense to cache english strings
        if (lang === 'en') {
          // set to cache to return faster next time
          result = msg;
        } else {
          result = translation?.[this.trFieldNames[lang]];
          if (!result) {
            // return english
            result = msg;
          }
        }
        // cache so even if key does not exist, we will not hit database
        await this.cache.set(cacheKey, result);
      }
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          result = result.replace(`{${key}}`, value);
        }
      }
      return result;
    }
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
        const cacheKey = `${this.resourceConfig.resourceId}:frontend:${lang}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return cached;
        }
        const translations = {};
        const allTranslations = await resource.list([Filters.EQ(this.options.categoryFieldName, 'frontend')]);
        for (const tr of allTranslations) {
          translations[tr[this.enFieldName]] = tr[this.trFieldNames[lang]];
        }
        await this.cache.set(cacheKey, translations);
        return translations;

      }
    });

  }

}