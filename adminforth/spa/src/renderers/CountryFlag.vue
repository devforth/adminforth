<template>
    <Tooltip>
      <span class="flex items-center">
        <CountryFlag class="w-[1.6rem] h-[1.2rem]" :countryCode="countryIsoLow" />
        <span v-if="meta.showCountryName" class="ms-2">{{ countryName }}</span>
      </span>
      
      <template v-if="shouldShowTooltip" #tooltip>
        {{ countryName }}
      </template>
    </Tooltip>
</template>

<script setup>  

import { computed, ref, onMounted } from 'vue';
import isoCountries from 'i18n-iso-countries';
import enLocal from 'i18n-iso-countries/langs/en.json';
import Tooltip from '@/afcl/Tooltip.vue';
import CountryFlag from '@/afcl/CountryFlag.vue';

isoCountries.registerLocale(enLocal);

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);

const id = ref();

const shouldShowTooltip = computed(() => {
  return !props.meta.showCountryName && countryName.value;
});

onMounted(async () => {
  id.value = Math.random().toString(36).substring(7);
});

const countryIsoLow = computed(() => {
  return props.record[props.column.name]?.toLowerCase();
});

const countryName = computed(() => {
  if (!countryIsoLow.value) {
    return '';
  }
  return isoCountries.getName(countryIsoLow.value, 'en');
});

</script>
