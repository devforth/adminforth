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

const isExternal = computed(() => {
  return typeof props.to === 'string' && props.to.startsWith('http');
});

const linkClasses = "afcl-link text-lightPrimary underline dark:text-darkPrimary hover:no-underline hover:brightness-110 cursor-pointer";
</script>