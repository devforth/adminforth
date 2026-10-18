<template>
  <div class="aspect-[4/3] w-8 h-6 flex items-center justify-center">
    <img v-if="flagUrl" :src="flagUrl" :alt="countryCode" class="flag-icon h-full object-contain rounded-sm"/>
    <span v-else-if="getFlagUrl && countryCode">{{ countryCode }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue';

const props = defineProps(['countryCode']);

// the map of flag URLs is loaded when a flag is shown for the first time
const getFlagUrl = shallowRef<(countryCode: string) => string | undefined>();
import('./countryFlagUrls').then((module) => {
  getFlagUrl.value = module.default;
});

const flagUrl = computed(() => props.countryCode && getFlagUrl.value?.(props.countryCode));
</script>

<style scoped>
    .flag-icon {
        box-shadow: inset -0.3px -0.3px 0.3px 0px rgba(0 0 0 / 0.2),
            inset 0.3px 0.3px 0.3px 0px rgba(255 255 255 / 0.2),
            0px 0px 3px #00000030;
        width: auto;
    }
</style>
