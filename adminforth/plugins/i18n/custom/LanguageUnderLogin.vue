<template>
  <p class="text-gray-500 dark:text-gray-400 font-sm text-left mt-3">
    <Select
      v-model="selectedLanguage"
      :options="options"
      :placeholder="$t('Select language')"
      @change="changeLanguage"
    >
      <template #item="{ option }">
        <span>{{ option.name }}</span>
      </template>
    </Select>
  </p>
</template>

<script setup>
import Select from '@/afcl/Select.vue';
import { computed, ref, onMounted } from 'vue';

const props = defineProps(['meta', 'resource']);

const selectedLanguage = ref('');

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