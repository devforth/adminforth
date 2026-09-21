<template>
  <router-link
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
import { getButtonClasses, type ButtonVariant } from './buttonStyles';
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
    shadow: props.shadow,
    active: props.active,
    disabled: props.disabled,
  },
  'afcl-link-button',
  attrs.class as ClassNameValue,
));

</script>