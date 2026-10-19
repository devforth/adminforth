<template>
  <button
    type="submit"
    v-bind="restAttrs"
    :disabled="props.disabled"
    :class="buttonClasses"
  >
    <Spinner v-if="props.loader" class="w-4 h-4 text-lightButtonsText dark:text-darkButtonsText fill-lightPrimary dark:fill-darkPrimary" />
    <!-- the spinner takes the place of the icon in a square button -->
    <slot v-if="!(props.iconOnly && props.loader)"></slot>
  </button>
</template>

<script setup lang="ts">
import Spinner from './Spinner.vue';
import { computed, useAttrs } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { getButtonClasses, type ButtonVariant, type ButtonSize } from './buttonStyles';


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
  size?: ButtonSize;
  iconOnly?: boolean;
  shadow?: boolean;
}>(), {
  variant: 'primary',
  loader: false,
  disabled: false,
  active: false,
  shadow: true,
});

const buttonClasses = computed(() => getButtonClasses(
  {
    variant: props.variant,
    size: props.size,
    iconOnly: props.iconOnly,
    shadow: props.shadow,
    active: props.active,
    disabled: props.disabled,
  },
  'afcl-button',
  attrs.class as ClassNameValue,
));

</script>