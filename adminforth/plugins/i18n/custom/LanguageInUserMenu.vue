<template>
  <div class="min-w-40">
    <div class="cursor-pointer flex items-center gap-1 block px-4 py-2 text-sm text-black 
      hover:bg-html dark:text-darkSidebarTextHover dark:hover:bg-darkSidebarItemHover dark:hover:text-darkSidebarTextActive 
      w-full select-none	"
      :class="{ 'bg-black bg-opacity-10	': showDropdown }"
      @click="showDropdown = !showDropdown"
    >
      <span class="mr-1">
        <span class="flag-icon"
          :class="`flag-icon-${getCountryCodeFromLangCode(selectedOption.value)}`"
        ></span>
      </span>
      <span>{{ selectedOption.label }}</span>

      <IconCaretDownSolid class="h-5 w-5 text-lightPrimary dark:text-gray-400 opacity-50 transition duration-150 ease-in"
          :class="{ 'transform rotate-180': showDropdown }"
      />
    </div>

    <div v-if="showDropdown" >
      
      <div class="cursor-pointer flex items-center gap-1 block px-4 py-1 text-sm 
        text-black dark:text-darkSidebarTextHover
        bg-black bg-opacity-10	
        hover:brightness-110
        hover:text-lightPrimary dark:hover:text-darkPrimary
        hover:bg-lightPrimaryContrast dark:hover:bg-darkPrimaryContrast
        w-full text-select-none pl-5 select-none"
        v-for="option in options.filter((opt) => opt.value !== selectedOption.value)"
        @click="doChangeLang(option.value)"
      >
        <span class="mr-1">
          <span class="flag-icon"
            :class="`flag-icon-${getCountryCodeFromLangCode(option.value)}`"
          ></span>
        </span>
        <span>{{ option.label }}</span>
      
      </div>
    </div>

   
  </div>
</template>

<script setup>
import 'flag-icon-css/css/flag-icons.min.css';
import { IconCaretDownSolid } from '@iconify-prerendered/vue-flowbite';

import { setLang, getCountryCodeFromLangCode, getLocalLang, setLocalLang } from './langCommon';

import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { setLocaleMessage, locale } = useI18n();

const showDropdown = ref(false);
const props = defineProps(['meta', 'resource']);

const selectedLanguage = ref('');

function doChangeLang(lang) {
  setLocalLang(lang);
  // unfortunately, we need this to recall all APIs
  document.location.reload();

}


const options = computed(() => {
  return props.meta.supportedLanguages.map((lang) => {
    return {
      value: lang.code,
      label: lang.name,
    };
  });
});

const selectedOption = computed(() => {
  const val = options.value.find((option) => option.value === selectedLanguage.value);
  if (val) {
    return val;
  }
  return options.value[0];
});


onMounted(() => {
  console.log('Language In user menu mounted', props.meta.supportedLanguages);
  selectedLanguage.value = getLocalLang(props.meta.supportedLanguages);
  setLang({ setLocaleMessage, locale }, props.meta.pluginInstanceId, selectedLanguage.value);
  // todo this mounted executed only on this component mount, f5 from another page apart login will not read it
});







</script>