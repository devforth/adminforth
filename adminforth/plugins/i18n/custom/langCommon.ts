
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
}