<template>
  <button 
    v-bind="$attrs"
    type="submit" 
    :class="button({ disabled: props.disabled, active: props.active, mode: props.mode })"
  >
    <Spinner v-if="props.loader" class="w-4 h-4 text-lightButtonsText dark:text-darkButtonsText fill-lightButtonsBackground dark:fill-darkPrimary" />
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { Spinner } from '@/afcl';
import { tv } from 'tailwind-variants';
import theme from '@/theme/button'
import styleOverrides from '@/custom/theme.config'

const button = tv({
  extend: tv(theme({})),
  ...(styleOverrides?.ui?.button || {})
}) as ReturnType<typeof tv>;

const props = withDefaults(defineProps<{
  loader?: boolean;
  disabled?: boolean;
  active?: boolean;
  mode?: 'primary' | 'secondary';
}>(), {
  loader: false,
  disabled: false,
  active: false,
  mode: 'primary'
});

</script>