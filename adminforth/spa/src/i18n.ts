import { createI18n } from 'vue-i18n';
import { createApp } from 'vue';


export function initI18n(app: ReturnType<typeof createApp>) {
  const i18n = createI18n({
    missing: (locale, key) => {
      // very very dirty hack to make work $t("a {key} b", { key: "c" }) as "a c b" when translation is missing
      // e.g. relevant for "Showing {from} to {to} of {total} entries" on list page
      return key + ' ';
    },
  })

  app.use(i18n);

}