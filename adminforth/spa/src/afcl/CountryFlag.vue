<template>
  <div class="aspect-[4/3] w-8 h-6 flex items-center justify-center">
    <component v-if="flagComponent" :is="flagComponent" class="flag-icon  h-full object-contain rounded-sm"/>
    <span v-else-if="flagIcons && countryCode">{{ countryCode }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef, type Component } from 'vue';

const props = defineProps(['countryCode']);

// the flag set takes megabytes, so it is loaded when a flag is shown for the first time
const flagIcons = shallowRef<Record<string, Component>>();
import('@iconify-prerendered/vue-flag').then((icons) => {
  flagIcons.value = icons;
});

const flagComponent = computed(() => {
  if (!props.countryCode || !flagIcons.value) {
    return null;
  }
  const normalizedCode = props.countryCode.charAt(0).toUpperCase() + props.countryCode.slice(1).toLowerCase();
  return flagIcons.value[`Icon${normalizedCode}4x3`] || null; // 4:3 aspect ratio flags
});
</script>

<style scoped>
    .flag-icon {
        box-shadow: inset -0.3px -0.3px 0.3px 0px rgba(0 0 0 / 0.2), 
            inset 0.3px 0.3px 0.3px 0px rgba(255 255 255 / 0.2),
            0px 0px 3px #00000030;
        width: auto;
    }
</style>