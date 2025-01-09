import AdminForth, { AdminForthPlugin, Filters, suggestIfTypo, AdminForthDataTypes } from "adminforth";
import type { IAdminForth, IHttpServer, AdminForthComponentDeclaration, AdminForthResourceColumn, AdminForthResource, BeforeLoginConfirmationFunction, AdminForthConfigMenuItem } from "adminforth";
import type { PluginOptions } from './types.js';
import iso6391, { LanguageCode } from 'iso-639-1';
import path from 'path';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import  { AsyncQueue } from '@sapphire/async-queue';
console.log = (...args) => {
  process.stdout.write(args.join(" ") + "\n");
};

const processFrontendMessagesQueue = new AsyncQueue();

const SLAVIC_PLURAL_EXAMPLES = {
  uk: 'яблук | Яблуко | Яблука | Яблук', // zero | singular | 2-4 | 5+
  bg: 'ябълки | ябълка | ябълки | ябълки', // zero | singular | 2-4 | 5+
  cs: 'jablek | jablko | jablka | jablek', // zero | singular | 2-4 | 5+
  hr: 'jabuka | jabuka | jabuke | jabuka', // zero | singular | 2-4 | 5+
  mk: 'јаболка | јаболко | јаболка | јаболка', // zero | singular | 2-4 | 5+
  pl: 'jabłek | jabłko | jabłka | jabłek', // zero | singular | 2-4 | 5+
  sk: 'jabĺk | jablko | jablká | jabĺk', // zero | singular | 2-4 | 5+
  sl: 'jabolk | jabolko | jabolka | jabolk', // zero | singular | 2-4 | 5+
  sr: 'јабука | јабука | јабуке | јабука', // zero | singular | 2-4 | 5+
  be: 'яблыкаў | яблык | яблыкі | яблыкаў', // zero | singular | 2-4 | 5+
  ru: 'яблок | яблоко | яблока | яблок', // zero | singular | 2-4 | 5+
};

const countryISO31661ByLangISO6391 = {
  en: 'us', // English → United States
  zh: 'cn', // Chinese → China
  hi: 'in', // Hindi → India
  ar: 'sa', // Arabic → Saudi Arabia
  ko: 'kr', // Korean → South Korea
  ja: 'jp', // Japanese → Japan
  uk: 'ua', // Ukrainian → Ukraine
  ur: 'pk', // Urdu → Pakistan
};

function getCountryCodeFromLangCode(langCode) {
  return countryISO31661ByLangISO6391[langCode] || langCode;
}


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

function ensureTemplateHasAllParams(template, newTemplate) {
  // string ensureTemplateHasAllParams("a {b} c {d}", "я {b} і {d} в") // true
  // string ensureTemplateHasAllParams("a {b} c {d}", "я і {d} в") // false
  // string ensureTemplateHasAllParams("a {b} c {d}", "я {bb} і {d} в") // false
  const existingParams = template.match(/{[^}]+}/g);
  const newParams = newTemplate.match(/{[^}]+}/g);
  const existingParamsSet = new Set(existingParams);
  const newParamsSet = new Set(newParams);
  return existingParamsSet.size === newParamsSet.size && [...existingParamsSet].every(p => newParamsSet.has(p));
}

class AiTranslateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiTranslateError';
  }
}
export default class I18nPlugin extends AdminForthPlugin {
  options: PluginOptions;
  emailField: AdminForthResourceColumn;
  passwordField: AdminForthResourceColumn;
  authResource: AdminForthResource;
  emailConfirmedField?: AdminForthResourceColumn;
  trFieldNames: Partial<Record<LanguageCode, string>>;
  enFieldName: string;
  cache: ICachingAdapter;
  primaryKeyFieldName: string;
  menuItemWithBadgeId: string;

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

  async updateUntranslatedMenuBadge() {
    if (this.menuItemWithBadgeId) {
      const resource = this.adminforth.resource(this.resourceConfig.resourceId);
      const count = await resource.count([Filters.NEQ(this.options.completedFieldName, this.fullCompleatedFieldValue)]);

      this.adminforth.websocket.publish(`/opentopic/update-menu-badge/${this.menuItemWithBadgeId}`, {
        badge: count || null
      });
    }
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

    enColumn.editReadonly = true;

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
      resourceConfig.columns.unshift({
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

    // add hook to validate user did not screw up with template params
    resourceConfig.hooks.edit.beforeSave.push(async ({ updates, oldRecord }: { updates: any, oldRecord?: any }): Promise<{ ok: boolean, error?: string }> => {
      for (const lang of this.options.supportedLanguages) {
        if (lang === 'en') {
          continue;
        }
        if (updates[this.trFieldNames[lang]]) {  // if user set '', it will have '' in updates, then it is fine, we shoudl nto check it
          if (!ensureTemplateHasAllParams(oldRecord[this.enFieldName], updates[this.trFieldNames[lang]])) {
            return { ok: false, error: `Template params mismatch for ${updates[this.enFieldName]}. Template param names should be the same as in original string. E. g. 'Hello {name}', should be 'Hola {name}' and not 'Hola {nombre}'!` };
          }
        }
      }
      return { ok: true };
    });

    // add hook on edit of any translation
    resourceConfig.hooks.edit.afterSave.push(async ({ updates, oldRecord }: { updates: any, oldRecord?: any }): Promise<{ ok: boolean, error?: string }> => {
      if (oldRecord) {
        // find lang which changed
        let langsChanged: LanguageCode[] = [];
        for (const lang of this.options.supportedLanguages) {
          if (lang === 'en') {
            continue;
          }
          if (updates[this.trFieldNames[lang]] !== undefined) {
            langsChanged.push(lang);
          }
        }
        
        // clear frontend cache for all langsChanged
        for (const lang of langsChanged) {
          this.cache.clear(`${this.resourceConfig.resourceId}:${oldRecord[this.options.categoryFieldName]}:${lang}`);
          this.cache.clear(`${this.resourceConfig.resourceId}:${oldRecord[this.options.categoryFieldName]}:${lang}:${oldRecord[this.enFieldName]}`);
        }
        this.updateUntranslatedMenuBadge();
      }
      // clear frontend cache for all lan
      return { ok: true };
    });

    // add hook on delete of any translation to reset cache
    resourceConfig.hooks.delete.afterSave.push(async ({ record }: { record: any }): Promise<{ ok: boolean, error?: string }> => {
      for (const lang of this.options.supportedLanguages) {
        // if frontend, clear frontend cache
        this.cache.clear(`${this.resourceConfig.resourceId}:${record[this.options.categoryFieldName]}:${lang}`);
        this.cache.clear(`${this.resourceConfig.resourceId}:${record[this.options.categoryFieldName]}:${lang}:${record[this.enFieldName]}`);
      }
      this.updateUntranslatedMenuBadge();
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
          id: 'translate_all',
          label: 'Translate selected',
          icon: 'flowbite:language-outline',
          // if optional `confirm` is provided, user will be asked to confirm action
          confirm: 'Are you sure you want to translate selected items?',
          state: 'selected',
          allowed: async ({ resource, adminUser, selectedIds, allowedActions }) => {
            console.log('allowedActions', JSON.stringify(allowedActions));
            return allowedActions.edit;
          },
          action: async ({ selectedIds, tr }) => {
            let translatedCount = 0;
            try {
              translatedCount = await this.bulkTranslate({ selectedIds });
            } catch (e) {
              process.env.HEAVY_DEBUG && console.error('🪲⛔ bulkTranslate error', e);
              if (e instanceof AiTranslateError) {
                return { ok: false, error: e.message };
              } 
              throw e;
            }
            this.updateUntranslatedMenuBadge();
            return { 
              ok: true, 
              error: undefined, 
              successMessage: await tr(`Translated {count} items`, 'backend', {
                count: translatedCount,
              }),
            };
          }
        }
      );  
    };

    // if there is menu item with resourceId, add .badge function showing number of untranslated strings
    const addBadgeCountToMenuItem = (menuItem: AdminForthConfigMenuItem) => {
      this.menuItemWithBadgeId = menuItem.itemId;
      menuItem.badge = async () => {
        const resource = adminforth.resource(menuItem.resourceId);
        const count = await resource.count([Filters.NEQ(this.options.completedFieldName, this.fullCompleatedFieldValue)]);
        return count ? `${count}` : null;
      };
      menuItem.badgeTooltip = 'Untranslated count';
    }
    adminforth.config.menu.forEach((menuItem) => {
      if (menuItem.resourceId === resourceConfig.resourceId) {
        addBadgeCountToMenuItem(menuItem);
      }
      if (menuItem.children) {
        menuItem.children.forEach((child) => {
          if (child.resourceId === resourceConfig.resourceId) {
            addBadgeCountToMenuItem(child);
          }
        });
      }
    });
  }

  async translateToLang (
      langIsoCode: LanguageCode, 
      strings: { en_string: string, category: string }[], 
      plurals=false,
      translations: any[],
      updateStrings: Record<string, { updates: any, category: string, strId: string, enStr: string, translatedStr: string }> = {}
  ): Promise<string[]> {
    const maxKeysInOneReq = 10;
    if (strings.length === 0) {
      return [];
    }

    if (strings.length > maxKeysInOneReq) {
      let totalTranslated = [];
      for (let i = 0; i < strings.length; i += maxKeysInOneReq) {
        const slicedStrings = strings.slice(i, i + maxKeysInOneReq);
        process.env.HEAVY_DEBUG && console.log('🪲🔪slicedStrings len', slicedStrings.length);
        const madeKeys = await this.translateToLang(langIsoCode, slicedStrings, plurals, translations, updateStrings);
        totalTranslated = totalTranslated.concat(madeKeys);
      }
      return totalTranslated;
    }
    const lang = langIsoCode;
    const langName = iso6391.getName(lang);
    const requestSlavicPlurals = Object.keys(SLAVIC_PLURAL_EXAMPLES).includes(lang) && plurals;

    const prompt = `
I need to translate strings in JSON to ${lang} (${langName}) language from English for my web app.
${requestSlavicPlurals ? `You should provide 4 slavic forms (in format "zero count | singular count | 2-4 | 5+") e.g. "apple | apples" should become "${SLAVIC_PLURAL_EXAMPLES[lang]}"` : ''}
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
      console.error(`Error in parsing LLM resp: ${resp}\n Prompt was: ${prompt}\n Resp was: ${JSON.stringify(resp)}`, );
      return [];
    }

    try {
      res = JSON.parse(res);
    } catch (e) {
      console.error(`Error in parsing LLM resp json: ${resp}\n Prompt was: ${prompt}\n Resp was: ${JSON.stringify(resp)}`, );
      return [];
    }


    for (const [enStr, translatedStr] of Object.entries(res) as [string, string][]) {
      const translationsTargeted = translations.filter(t => t[this.enFieldName] === enStr);
      // might be several with same en_string
      for (const translation of translationsTargeted) {
        //translation[this.trFieldNames[lang]] = translatedStr;
        // process.env.HEAVY_DEBUG && console.log(`🪲translated to ${lang} ${translation.en_string}, ${translatedStr}`)
        if (!updateStrings[translation[this.primaryKeyFieldName]]) {

          updateStrings[translation[this.primaryKeyFieldName]] = {
            updates: {},
            translatedStr,
            enStr,
            category: translation[this.options.categoryFieldName],
            strId: translation[this.primaryKeyFieldName],
          };
        }
        // make sure LLM did not screw up with template params
        if (translation[this.enFieldName].includes('{') && !ensureTemplateHasAllParams(translation[this.enFieldName], translatedStr)) {
          console.warn(`LLM Screwed up with template params mismatch for "${translation[this.enFieldName]}"on language ${lang}, it returned "${translatedStr}"`);
          continue;
        }
        updateStrings[
          translation[this.primaryKeyFieldName]
        ].updates[this.trFieldNames[lang]] = translatedStr;
      }
    }

    return Object.keys(updateStrings);
  }

  // returns translated count
  async bulkTranslate({ selectedIds }: { selectedIds: string[] }): Promise<number> {

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

    const updateStrings: Record<string, { 
      updates: any, 
      category: string,
      strId: string,
      enStr: string,
      translatedStr: string
    }> = {};


    const langsInvolved = new Set(Object.keys(needToTranslateByLang));

    let totalTranslated = [];

    await Promise.all(
      Object.entries(needToTranslateByLang).map(
        async ([lang, strings]: [LanguageCode, { en_string: string, category: string }[]]) => {
          // first translate without plurals
          const stringsWithoutPlurals = strings.filter(s => !s.en_string.includes('|'));
          const noPluralKeys = await this.translateToLang(lang, stringsWithoutPlurals, false, translations, updateStrings);


          const stringsWithPlurals = strings.filter(s => s.en_string.includes('|'));

          const pluralKeys = await this.translateToLang(lang, stringsWithPlurals, true, translations, updateStrings);

          totalTranslated = totalTranslated.concat(noPluralKeys, pluralKeys);
        }
      )
    );

    await Promise.all(
      Object.entries(updateStrings).map(
        async ([_, { updates, strId }]: [string, { updates: any, category: string, strId: string }]) => {
          // get old full record
          const oldRecord = await this.adminforth.resource(this.resourceConfig.resourceId).get([Filters.EQ(this.primaryKeyFieldName, strId)]);

          // because this will translate all languages, we can set completedLangs to all languages
          const futureCompletedFieldValue = await this.computeCompletedFieldValue({ ...oldRecord, ...updates });

          await this.adminforth.resource(this.resourceConfig.resourceId).update(strId, {
            ...updates,
            [this.options.completedFieldName]: futureCompletedFieldValue,
          });
        }
      )
    );

    for (const lang of langsInvolved) {
      await this.cache.clear(`${this.resourceConfig.resourceId}:frontend:${lang}`);
      for (const { enStr, category } of Object.values(updateStrings)) {
        await this.cache.clear(`${this.resourceConfig.resourceId}:${category}:${lang}:${enStr}`);
      }
    }

    return new Set(totalTranslated).size;

  }

  async processExtractedMessages(adminforth: IAdminForth, filePath: string) {
    await processFrontendMessagesQueue.wait();
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
    const messagesForFeed = messages.missingKeys.map((mk) => {
      return {
        en_string: mk.path,
        source: mk.file,
      };
    });

    await this.feedCategoryTranslations(messagesForFeed, 'frontend')
    
    
  }


  async tryProcessAndWatch(adminforth: IAdminForth) {
    const serveDir = adminforth.codeInjector.getServeDir();
    // messages file is in i18n-messages.json
    const messagesFile = path.join(serveDir, 'i18n-messages.json');
    process.env.HEAVY_DEBUG && console.log('🪲🔔messagesFile read started', messagesFile);
    this.processExtractedMessages(adminforth, messagesFile);
    // we use watcher because file can't be yet created when we start - bundleNow can be done in build time or can be done now
    // that is why we make attempt to process it now and then watch for changes
    const w = chokidar.watch(messagesFile, { 
      persistent: true,
      ignoreInitial: true, // don't trigger 'add' event for existing file on start
    });
    w.on('change', () => {
      process.env.HEAVY_DEBUG && console.log('🪲🔔messagesFile change', messagesFile);
      this.processExtractedMessages(adminforth, messagesFile);
    });
    w.on('add', () => {
      process.env.HEAVY_DEBUG && console.log('🪲🔔messagesFile add', messagesFile);
      this.processExtractedMessages(adminforth, messagesFile);
    });

  }
  
  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    // optional method where you can safely check field types after database discovery was performed
    // ensure each trFieldName (apart from enFieldName) is nullable column of type string
    if (this.options.completeAdapter) {
      this.options.completeAdapter.validate();
    }

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

    adminforth.tr = async (msg: string | null | undefined, category: string, lang: string, params, pluralizationNumber: number): Promise<string> => {
      if (!msg) {
        return msg;
      }

      if (category === 'frontend') {
        throw new Error(`Category 'frontend' is reserved for frontend messages, use any other category for backend messages`);
      }
      // console.log('🪲tr', msg, category, lang);

      // if lang is not supported , throw
      if (!this.options.supportedLanguages.includes(lang as LanguageCode)) {
        lang = 'en'; // for now simply fallback to english

        // throwing like line below might be too strict, e.g. for custom apis made with fetch which don't pass accept-language
        // throw new Error(`Language ${lang} is not entered to be supported by requested by browser in request headers accept-language`);
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
          this.updateUntranslatedMenuBadge();
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
      // if msg has '|' in it, then we need to aplly pluralization
      if (msg.includes('|')) {
        result = this.applyPluralization(result, pluralizationNumber, lang);
      }

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          result = result.replace(`{${key}}`, value);
        }
      }
      return result;
    }
  }

  applyPluralization(str: string, number: number, lang: string): string {
    const choices = str.split('|');
    const choicesLength = choices.length;

    if (choicesLength > 2) {
      // this is slavic pluralization
      return choices[this.slavicPluralRule(number, choicesLength)];
    } else {
      return number === 1 ? choices[0] : choices[1];
    }
  }
  
    // taken from here https://vue-i18n.intlify.dev/guide/essentials/pluralization.html#custom-pluralization
  slavicPluralRule(choice, choicesLength) {
    if (choice === 0) {
      return 0
    }

    const teen = choice > 10 && choice < 20
    const endsWithOne = choice % 10 === 1

    if (!teen && endsWithOne) {
      return 1
    }
    if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
      return 2
    }

    return choicesLength < 4 ? 2 : 3
  }
  instanceUniqueRepresentation(pluginOptions: any) : string {
    // optional method to return unique string representation of plugin instance. 
    // Needed if plugin can have multiple instances on one resource 
    return `single`;
  }

  async getCategoryTranslations(category: string, lang: string): Promise<Record<string, string>> {
    const resource = this.adminforth.resource(this.resourceConfig.resourceId);
    const cacheKey = `${this.resourceConfig.resourceId}:${category}:${lang}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const translations = {};
    const allTranslations = await resource.list([Filters.EQ(this.options.categoryFieldName, category)]);
    for (const tr of allTranslations) {
      translations[tr[this.enFieldName]] = tr[this.trFieldNames[lang]];
    }
    await this.cache.set(cacheKey, translations);
    return translations;
  }

  async languagesList(): Promise<{
    code: LanguageCode;
    nameOnNative: string;
    nameEnglish: string;
    emojiFlag: string;
  }[]> {
    return this.options.supportedLanguages.map((lang) => {
      return {
        code: lang as LanguageCode,
        nameOnNative: iso6391.getNativeName(lang),
        nameEnglish: iso6391.getName(lang),
        emojiFlag: getCountryCodeFromLangCode(lang).toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397)),
      };
    });
  }

  async feedCategoryTranslations(messages: {
    en_string: string;
    source: string;
  }[], category: string): Promise<void> {
    const adminforth = this.adminforth;
    const missingKeysDeduplicated = messages.reduce((acc: any[], missingKey: any) => {
      if (!acc.find((a) => a.en_string === missingKey.en_string)) {
        acc.push(missingKey);
      }
      return acc;
    }, []);

    await Promise.all(missingKeysDeduplicated.map(async (missingKey: any) => {
      const key = missingKey.en_string;
      const source = missingKey.source;
      const exists = await adminforth.resource(this.resourceConfig.resourceId).count([
        Filters.EQ(this.enFieldName, key), Filters.EQ(this.options.categoryFieldName, category)
      ]);
      if (exists) {
        return;
      }
      if (!key) {
        console.error(`Faced an empty key in feeding ${category} messages, source ${source}`);
      }
      const record = {
        [this.enFieldName]: key,
        [this.options.categoryFieldName]: category,
        ...(this.options.sourceFieldName ? { [this.options.sourceFieldName]: source } : {}),
      };
      try {
        await adminforth.resource(this.resourceConfig.resourceId).create(record);
      } catch (e) {
        console.error('🐛 Error creating record', e);
      }
    }));

    // updateBadge
    this.updateUntranslatedMenuBadge();
  }


  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'GET',
      path: `/plugin/${this.pluginInstanceId}/frontend_messages`,
      noAuth: true,
      handler: async ({ query }) => {
        const lang = query.lang;
        
        // form map of translations
        const translations = await this.getCategoryTranslations('frontend', lang);
        return translations;

      }
    });

  }

}