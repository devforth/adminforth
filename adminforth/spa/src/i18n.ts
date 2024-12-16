import { createI18n } from 'vue-i18n';
import { createApp } from 'vue';


// taken from here https://vue-i18n.intlify.dev/guide/essentials/pluralization.html#custom-pluralization
function slavicPluralRule(choice, choicesLength, orgRule) {
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


export function initI18n(app: ReturnType<typeof createApp>) {
  const i18n = createI18n({
    legacy: false,

    missingWarn: false,
    fallbackWarn: false,

    pluralRules: {
      'uk': slavicPluralRule,
      'bg': slavicPluralRule,
      'cs': slavicPluralRule,
      'hr': slavicPluralRule,
      'mk': slavicPluralRule,
      'pl': slavicPluralRule,
      'sk': slavicPluralRule,
      'sl': slavicPluralRule,
      'sr': slavicPluralRule,
      'be': slavicPluralRule,
      'ru': slavicPluralRule,
    },

    missing: (locale, key) => {
      // very very dirty hack to make work $t("a {key} b", { key: "c" }) as "a c b" when translation is missing
      // e.g. relevant for "Showing {from} to {to} of {total} entries" on list page
      return key + ' ';
    },
  })

  app.use(i18n);

}