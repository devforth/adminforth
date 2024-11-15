<template>
    <AfTooltip>
      {{ formattedValue }} 
      <template #tooltip v-if="formattedValue">
        {{ formattedTooltipValue }}
      </template>
    </AfTooltip>
  </template>
  
  <script setup>
  import { computed, ref, onMounted, nextTick } from 'vue';
  import AfTooltip from '@/components/AfTooltip.vue';
  
  const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);

  const id = ref();
  const userLocale = ref(navigator.language || 'en-US'); 

  const formattedValue = computed(() => {
    const val = props.record[props.column.name];
    if (typeof val === 'number') {
      return formatNumber(val, userLocale.value);
    }
    return val;
  });
  
  const formattedTooltipValue = computed(() => {
    const val = props.record[props.column.name];
    if (typeof val === 'number') {
      return formatNumberUsingIntl(val, userLocale.value); 
    }
    return val;
  });

  function formatNumber(num, locale) {
  if (typeof num !== 'number') {
    return num.toString(); 
  }

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }

  // If it's less than 1000, format using locale
  return new Intl.NumberFormat(locale).format(num);
}

  function formatNumberUsingIntl(num, locale) {
      return new Intl.NumberFormat(locale).format(num);
  }

  onMounted(async () => {
    id.value = Math.random().toString(36).substring(7);
    await nextTick();
  });
</script>