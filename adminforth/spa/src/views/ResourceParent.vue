<template>
  <div :key="`${$route?.params.resourceId}---${$route?.params.primaryKey}`" class="af-resource-parent p-4 flex" 
    :class="limitHeightToPage ? 'h-[calc(100dvh-3.5rem)]': undefined"
  >
    <RouterView/>
  </div>
</template>

<style>
</style>

<script setup>

import { useCoreStore } from '@/stores/core';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const coreStore = useCoreStore()

const limitHeightToPage = computed(() => {
  if (route.name !== 'resource-list' ) {
    return false;
  }
  // for mobile phones disable shrinking table at all because of the issues with HEADER and general UX
  // use navigator.userAgent to detect mobile phones
  if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    return false;
  }

  if (!coreStore.resource?.options?.pageInjections?.list) {
    return true;
  }
  const listPageInjects = coreStore.resource.options.pageInjections.list;
  
  for (const pi of [listPageInjects.beforeBreadcrumbs, listPageInjects.afterBreadcrumbs, listPageInjects.bottom]) {
    if (pi) {
      for (const piItem of pi) {
        if (!piItem.meta?.thinEnoughToShrinkTable) {
          return false;
        }
      }
    }
  }

  return true;

})

</script>
