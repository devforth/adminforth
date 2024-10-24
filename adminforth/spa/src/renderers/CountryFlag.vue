<template>
  <span class="flex items-center">
    <span 
      :class="{[`fi-${countryIsoLow}`]: true, 'flag-icon': countryName}"
      :data-tooltip-target="shouldShowTooltip ? `tooltip-${id}`: undefined"
    ></span>

    <span v-if="meta.showCountryName" class="ms-2">{{ countryName }}</span>
    
    <div 
      v-if="shouldShowTooltip"
      :id="`tooltip-${id}`" role="tooltip"
      class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
    >
      {{ countryName }}
      <div class="tooltip-arrow" data-popper-arrow></div>
    </div>
  </span>
  
</template>

<script setup>  

import { computed, ref, onMounted } from 'vue';
import { initFlowbite } from 'flowbite';
import 'flag-icons/css/flag-icons.min.css';
import isoCountries from 'i18n-iso-countries';
import enLocal from 'i18n-iso-countries/langs/en.json';

isoCountries.registerLocale(enLocal);

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);

const id = ref();

const shouldShowTooltip = computed(() => {
  return !props.meta.showCountryName && countryName.value;
});

onMounted(async () => {
  id.value = Math.random().toString(36).substring(7);
  await new Promise(resolve => setTimeout(resolve, 0));
  initFlowbite();
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

<style scoped lang="scss">

.flag-icon {
  width: 2rem;
  height: 1.5rem;
  flex-shrink: 0;

  // border radius  for background
  border-radius: 2px;
  // add some silkiness to the flag
  box-shadow: inset -1px -1px 0.5px 0px rgba(0 0 0 / 0.2), inset 1px 1px 0.5px 0px rgba(255 255 255 / 0.2);
}

</style>