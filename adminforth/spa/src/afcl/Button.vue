<template>
  <button 
    v-bind="$attrs"
    type="submit" 
    class="afcl-button flex items-center justify-center gap-1 border focus:ring-4 focus:outline-none focus:ring-opacity-50 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
    :class="{
      'text-lightButtonsText bg-lightButtonsBackground border-lightButtonsBorder dark:bg-darkButtonsBackground hover:bg-lightButtonsHover hover:border-lightButtonsBorderHover focus:ring-lightButtonFocusRing dark:focus:ring-darkButtonFocusRing dark:text-darkButtonsText dark:border-darkButtonsBorder dark:hover:bg-darkButtonsHover dark:hover:border-darkButtonsBorderHover': currentVariant === 'primary',
      'cursor-default opacity-50 pointer-events-none': props.disabled,
      'active brightness-200 hover:brightness-150'  : props.active,
      'text-lightSecondaryContrast/70 bg-lightSecondary border-lightSecondaryContrast/30 dark:bg-darkSecondary hover:bg-lightSecondary/60 hover:border-lightSecondaryContrast/60 focus:ring-lightSecondary dark:focus:ring-darkSecondary/40 dark:text-darkSecondaryContrast dark:border-darkSecondaryContrast/40 dark:hover:bg-darkSecondary/60 dark:hover:border-white/60': currentVariant === 'secondary',
      'text-lightAcceptModalConfirmButtonText dark:text-darkAcceptModalConfirmButtonText bg-lightAcceptModalConfirmButtonBackground dark:bg-darkAcceptModalConfirmButtonBackground hover:bg-lightAcceptModalConfirmButtonBackgroundHover dark:hover:bg-darkAcceptModalConfirmButtonBackgroundHover focus:ring-lightAcceptModalConfirmButtonFocus dark:focus:ring-darkAcceptModalConfirmButtonFocus border-transparent hover:border-transparent': currentVariant === 'danger',
    }"
  >
    <Spinner v-if="props.loader" class="w-4 h-4 text-lightButtonsText dark:text-darkButtonsText fill-lightPrimary dark:fill-darkPrimary" />
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { Spinner } from '@/afcl';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  loader?: boolean;
  disabled?: boolean;
  active?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  /** @deprecated use variant instead of mode */
  mode?: 'primary' | 'secondary' | 'danger';
}>(), {
  loader: false,
  disabled: false,
  active: false,
});

// mode is deprecated, but we still want to support it for backward compatibility,
// so we check both variant and mode props
const currentVariant = computed(() => props.variant ?? props.mode ?? 'primary');
</script>
