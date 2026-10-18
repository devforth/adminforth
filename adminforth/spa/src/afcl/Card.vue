<template>
  <div v-bind="restAttrs" :class="rootClasses">
    <div v-if="title || description" class="afcl-card-header" :class="{ 'mb-4': $slots.default }">
      <h3 v-if="title" class="afcl-card-title font-semibold tracking-tight text-lightCardTitle dark:text-darkCardTitle" :class="TITLE_SIZES[size]">{{ title }}</h3>
      <p v-if="description" class="afcl-card-description mt-1 text-lightCardDescription dark:text-darkCardDescription" :class="DESCRIPTION_SIZES[size]">{{ description }}</p>
    </div>
    <slot></slot>
  </div>
</template>


<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { mergeClasses } from './classMerge';

type CardSize = 'sm' | 'md' | 'lg';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  title?: string;
  description?: string;
  size?: CardSize;
  hideBorder?: boolean;
}>(), {
  size: 'lg',
});

const PADDINGS: Record<CardSize, string> = { sm: 'p-3', md: 'p-4', lg: 'p-6' };
const TITLE_SIZES: Record<CardSize, string> = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
const DESCRIPTION_SIZES: Record<CardSize, string> = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

const attrs = useAttrs();
const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const rootClasses = computed(() => mergeClasses(
  'afcl-card rounded-lg bg-lightCardBackground dark:bg-darkCardBackground',
  !props.hideBorder && 'border border-lightCardBorder dark:border-darkCardBorder',
  PADDINGS[props.size],
  attrs.class as ClassNameValue,
));
</script>
