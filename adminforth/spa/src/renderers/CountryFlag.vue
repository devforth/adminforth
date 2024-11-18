<template>
    <Tooltip>
      <span class="flex items-center">
        <span 
          :class="{[`fi-${countryIsoLow}`]: true, 'flag-icon': countryName}"
        ></span>
        <span v-if="meta.showCountryName" class="ms-2">{{ countryName }}</span>
      </span>
      
      <template v-if="shouldShowTooltip" #tooltip>
        {{ countryName }}
      </template>
    </Tooltip>
</template>

<script setup>  

import { computed, ref, onMounted } from 'vue';
import 'flag-icons/css/flag-icons.min.css';
import isoCountries from 'i18n-iso-countries';
import enLocal from 'i18n-iso-countries/langs/en.json';
import Tooltip from '@/afcl/Tooltip.vue';

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

<style scoped lang="scss">

.flag-icon {
  width: 1.8rem;
  height: 1.35rem;
  flex-shrink: 0;

  // border radius  for background
  border-radius: 2px;
  box-shadow: inset -0.3px -0.3px 0.3px 0px rgba(0 0 0 / 0.2), inset 0.3px 0.3px 0.3px 0px rgba(255 255 255 / 0.2);
}

</style>