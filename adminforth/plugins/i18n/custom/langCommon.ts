
import { callAdminForthApi } from '@/utils';


const messagesCache: Record<
    string,
    {
        ts: number;
        messages: Record<string, string>;
    }
> = {};

// cleanup messages after a 2 minutes (cache for instant switching)
setInterval(() => {
    const now = Date.now();
    for (const lang in messagesCache) {
        if (now - messagesCache[lang].ts > 10 * 60 * 1000) {
            delete messagesCache[lang];
        }
    }
}, 60 * 1000);

// i18n is vue-i18n instance
export async function setLang({ setLocaleMessage, locale }: any, pluginInstanceId: string, langIso: string) {

    if (!messagesCache[langIso]) {
        const messages = await callAdminForthApi({
            path: `/plugin/${pluginInstanceId}/frontend_messages?lang=${langIso}`,
            method: 'GET',
        });
        messagesCache[langIso] = {
            ts: Date.now(),
            messages: messages
        };
    }
    
    // set locale and locale message
    setLocaleMessage(langIso, messagesCache[langIso].messages);

    // set the language
    locale.value = langIso;

    document.querySelector('html').setAttribute('lang', langIso);
    setLocalLang(langIso);
}

// only remap the country code for the languages where language code is different from the country code
// don't include es: es, fr: fr, etc, only include the ones where language code is different from the country code
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

export function getCountryCodeFromLangCode(langCode) {
    return countryISO31661ByLangISO6391[langCode] || langCode;
}


const LS_LANG_KEY = `afLanguage`;

export function getLocalLang(supportedLanguages: {code}[]): string {
    let lsLang = localStorage.getItem(LS_LANG_KEY);
    // if someone screwed up the local storage or we stopped language support, lets check if it is in supported languages
    if (lsLang && !supportedLanguages.find((l) => l.code == lsLang)) {
        lsLang = null;
    }
    if (lsLang) {
        return lsLang;
    }
    // read lang from navigator and try find what we have in supported languages
    const lang = navigator.language.split('-')[0];
    const foundLang = supportedLanguages.find((l) => l.code == lang);
    if (foundLang) {
        return foundLang.code;
    }
    return supportedLanguages[0].code;
}

export function setLocalLang(lang: string) {
    localStorage.setItem(LS_LANG_KEY, lang);
}

  
