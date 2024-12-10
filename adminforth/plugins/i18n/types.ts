import { EmailAdapter } from 'adminforth';
import type { LanguageCode } from 'iso-639-1';


export interface PluginOptions {

  /* List of ISO 639-1 language codes which you want to tsupport*/
  supportedLanguages: LanguageCode[];

  /**
   * Each translation string will be stored in a separate field, you can remap it to existing columns  using this option
   * By default it will assume field are named like `${lang_code}_string` (e.g. 'en_string', 'uk_string', 'ja_string', 'fr_string')
   */
  translationFieldNames: Partial<Record<LanguageCode, string>>;

  /**
   * Optional field name for storing source language file name
   */
  sourceFieldName?: string;

}