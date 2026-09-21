<template>
  <button
    type="submit"
    v-bind="restAttrs"
    :class="buttonClasses"
  >
    <Spinner v-if="props.loader" class="w-4 h-4 text-lightButtonsText dark:text-darkButtonsText fill-lightPrimary dark:fill-darkPrimary" />
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { Spinner } from '@/afcl';
import { computed, useAttrs } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { getButtonClasses, type ButtonVariant } from './buttonStyles';


defineOptions({ inheritAttrs: false });

const attrs = useAttrs()

const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const props = withDefaults(defineProps<{
  loader?: boolean;
  disabled?: boolean;
  active?: boolean;
  variant?: ButtonVariant;
  /** @deprecated use variant instead of mode */
  mode?: ButtonVariant;
  shadow?: boolean;
}>(), {
  loader: false,
  disabled: false,
  active: false,
  shadow: true,
});

const currentVariant = computed(() => props.variant ?? props.mode ?? 'primary');

const buttonClasses = computed(() => getButtonClasses(
  {
    variant: currentVariant.value,
    shadow: props.shadow,
    active: props.active,
    disabled: props.disabled,
  },
  'afcl-button',
  attrs.class as ClassNameValue,
));

</script>