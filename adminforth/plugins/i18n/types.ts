import { EmailAdapter } from 'adminforth';
import isoCountries from 'i18n-iso-countries';

type Lang = keyof typeof isoCountries.langs();

export interface PluginOptions {

  supportedLanguages: Lang[]
  fieldNames: {
    [key: string]: string;
  }

}