<template>
  <button 
    v-bind="$attrs"
    type="submit" 
    class="afcl-button flex items-center justify-center gap-1 text-lightButtonsText bg-lightButtonsBackground border border-lightButtonsBorder dark:bg-darkButtonsBackground hover:bg-lightButtonsHover hover:border-lightButtonsBorderHover
      focus:ring-4 focus:outline-none focus:ring-lightButtonFocusRing focus:ring-opacity-50 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-darkButtonFocusRing dark:text-darkButtonsText dark:border-darkButtonsBorder dark:hover:bg-darkButtonsHover dark:hover:border-darkButtonsBorderHover"
    :class="{
      'cursor-default opacity-50 pointer-events-none': props.disabled,
      'active brightness-200 hover:brightness-150'  : props.active,
      'text-lightSecondaryContrast/70 bg-lightSecondary border-lightSecondaryContrast/30 dark:bg-darkSecondary hover:bg-lightSecondary/60 hover:border-lightSecondaryContrast/60 focus:ring-lightSecondary dark:focus:ring-darkSecondary/40 dark:text-darkSecondaryContrast dark:border-darkSecondaryContrast/40 dark:hover:bg-darkSecondary/60 dark:hover:border-darkSecondary/60': props.mode === 'secondary',
    }"
  >
    <Spinner v-if="props.loader" class="w-4 h-4 text-lightButtonsText dark:text-darkButtonsText fill-lightButtonsBackground dark:fill-darkPrimary" />
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { Spinner } from '@/afcl';

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