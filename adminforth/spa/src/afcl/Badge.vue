<template>
  <span v-bind="restAttrs" :class="rootClasses">
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { mergeClasses } from './classMerge';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  variant?: BadgeVariant;
}>(), {
  variant: 'default',
});

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-lightCardBackground text-lightListTableText border-lightCardBorder dark:bg-darkCardBackground dark:text-darkListTableText dark:border-darkCardBorder',
  success: 'bg-lightSuccessSoft text-lightSuccess border-lightSuccessBorder dark:bg-darkSuccessSoft dark:text-darkSuccess dark:border-darkSuccessBorder',
  warning: 'bg-lightWarningSoft text-lightWarning border-lightWarningBorder dark:bg-darkWarningSoft dark:text-darkWarning dark:border-darkWarningBorder',
  danger: 'bg-lightDangerSoft text-lightDanger border-lightDangerBorder dark:bg-darkDangerSoft dark:text-darkDanger dark:border-darkDangerBorder',
  accent: 'bg-lightPrimary/10 text-lightPrimary border-lightPrimary/30 dark:bg-darkPrimary/10 dark:text-darkPrimary dark:border-darkPrimary/30',
  muted: 'bg-lightSecondaryDarken text-lightInputIconColor border-transparent dark:bg-darkSecondaryLighten dark:text-darkInputIconColor',
};

const attrs = useAttrs();
const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const rootClasses = computed(() => mergeClasses(
  'afcl-badge inline-flex items-center gap-1 whitespace-nowrap px-2 h-5 rounded-full border text-xs font-medium',
  VARIANT_CLASSES[props.variant],
  attrs.class as ClassNameValue,
));
</script>
