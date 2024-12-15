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
import { setLang, getCountryCodeFromLangCode, getLocalLang } from './langCommon';

import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { setLocaleMessage, locale } = useI18n();


const props = defineProps(['meta', 'resource']);

const selectedLanguage = ref('');


watch(() => selectedLanguage.value, (newVal) => {
  setLang({ setLocaleMessage, locale }, props.meta.pluginInstanceId, newVal);
});


const options = computed(() => {
  return props.meta.supportedLanguages.map((lang) => {
    return {
      value: lang.code,
      label: lang.name,
    };
  });
});


onMounted(() => {
  console.log('Language In user menu mounted', props.meta.supportedLanguages);
  selectedLanguage.value = getLocalLang(props.meta.supportedLanguages);
  setLang({ setLocaleMessage, locale }, props.meta.pluginInstanceId, selectedLanguage.value);
  // todo this mounted executed only on this component mount, f5 from another page apart login will not read it
});







</script>