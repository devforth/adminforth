<template>
  <p class="text-gray-500 dark:text-gray-400 font-sm text-left mt-3 flex items-center justify-center">
    <Select
      v-model="selectedLanguage"
      :options="options"
      :placeholder="$t('Select language')"
      @change="changeLanguage"
    >
      <template #item="{ option }">
        <span class="mr-1">
          <span class="flag-icon"
            :class="`flag-icon-${getCountryCodeFromLangCode(option.value)}`"
          ></span> 

        </span>
        <span>{{ option.label }}</span>
      </template>

      <template #selected-item="{option}">
        <span class="mr-1">
          <span class="flag-icon"
            :class="`flag-icon-${getCountryCodeFromLangCode(option.value)}`"
          ></span>
        </span>
        <span>{{ option.label }}</span>
      </template>
    </Select>
  </p>
</template>

<script setup>
import Select from '@/afcl/Select.vue';
import 'flag-icon-css/css/flag-icons.min.css';
import { setLang } from './langCommon';

import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { setLocaleMessage, locale } = useI18n();


const props = defineProps(['meta', 'resource']);

const selectedLanguage = ref('');



watch(() => selectedLanguage.value, (newVal) => {
  localStorage.setItem(LS_LANG_KEY, newVal);
  
 

  setLang({ setLocaleMessage, locale }, props.meta.pluginInstanceId, newVal);
});


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
};

function getCountryCodeFromLangCode(langCode) {
    return countryISO31661ByLangISO6391[langCode] || langCode;
}
  

const options = computed(() => {
  return props.meta.supportedLanguages.map((lang) => {
    return {
      value: lang.code,
      label: lang.name,
    };
  });
});

const LS_LANG_KEY = `${props.meta.brandSlug}-lang`;

onMounted(() => {
  console.log('LanguageUnderLogin mounted', props.meta.supportedLanguages);
  selectedLanguage.value = localStorage.getItem(LS_LANG_KEY) || props.meta.supportedLanguages[0].code;
});

</script>