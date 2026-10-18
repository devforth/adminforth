<template>
  <span v-bind="restAttrs" :class="rootClasses">
    <!-- a hairline edge keeps white stripes visible on a white page -->
    <img
      v-if="flagUrl"
      :src="flagUrl"
      :alt="countryCode"
      class="block w-full h-full object-cover ring-1 ring-black/10 dark:ring-white/10"
      :class="IMAGE_RADIUS[size]"
    />
    <span v-else-if="getFlagUrl && countryCode">{{ countryCode }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, shallowRef, useAttrs } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { mergeClasses } from './classMerge';

type CountryFlagSize = 'sm' | 'md';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  countryCode?: string,
  // sm is 16×12 for menus, lists and selects, md is 32×24
  size?: CountryFlagSize,
}>(), {
  size: 'md',
});

const SIZES: Record<CountryFlagSize, string> = { sm: 'w-4 h-3', md: 'w-8 h-6' };
const IMAGE_RADIUS: Record<CountryFlagSize, string> = { sm: 'rounded-[2px]', md: 'rounded-[3px]' };

const attrs = useAttrs();
const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const rootClasses = computed(() => mergeClasses(
  'afcl-country-flag inline-flex shrink-0 items-center justify-center',
  SIZES[props.size],
  attrs.class as ClassNameValue,
));

// the map of flag URLs is loaded when a flag is shown for the first time
const getFlagUrl = shallowRef<(countryCode: string) => string | undefined>();
import('./countryFlagUrls').then((module) => {
  getFlagUrl.value = module.default;
});

const flagUrl = computed(() => props.countryCode && getFlagUrl.value?.(props.countryCode));
</script>
