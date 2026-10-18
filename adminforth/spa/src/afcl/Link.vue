<template>
  <a 
    v-if="isExternal"
    v-bind="$attrs"
    :href="to"
    :target="target"
    rel="noopener noreferrer"
    :class="linkClasses"
  >
    <slot></slot>
  </a>

  <router-link 
    v-else
    v-bind="$attrs"
    :to="to"
    :target="target"
    :class="linkClasses"
  >
    <slot></slot>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  to: string,
  target?: 'blank' | 'self' | 'parent' | 'top'
}>();

// any URL with a scheme leaves the SPA: http(s), mailto:, tel:, otpauth:
const URL_SCHEME_RE = /^[a-z][a-z\d+.-]*:/i;

const isExternal = computed(() => {
  return typeof props.to === 'string' && URL_SCHEME_RE.test(props.to);
});

const linkClasses = "afcl-link font-medium text-lightPrimary underline decoration-lightPrimary/30 underline-offset-[3px] hover:decoration-lightPrimary dark:text-darkPrimary dark:decoration-darkPrimary/40 dark:hover:decoration-darkPrimary cursor-pointer transition-colors";
</script>