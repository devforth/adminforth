<template>
  <!-- a link without href leaves the tab order and does not navigate -->
  <a
    v-if="props.disabled"
    v-bind="restAttrs"
    aria-disabled="true"
    :class="buttonClasses"
  >
    <slot></slot>
  </a>
  <router-link
    v-else
    v-bind="restAttrs"
    :to="props.to"
    :class="buttonClasses"
  >
    <slot></slot>
  </router-link>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { getButtonClasses, type ButtonVariant, type ButtonSize } from './buttonStyles';
import type { RouteLocationAsRelativeGeneric, RouteLocationAsPathGeneric } from 'vue-router';
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const props = withDefaults(defineProps<{
  to: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
  disabled?: boolean;
  active?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  shadow?: boolean;
}>(), {
  disabled: false,
  active: false,
  variant: 'primary',
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
  'afcl-link-button',
  attrs.class as ClassNameValue,
));

</script>