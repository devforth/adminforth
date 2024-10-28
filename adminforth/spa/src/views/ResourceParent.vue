<template>
  <div :key="`${$route?.params.resourceId}---${$route?.params.primaryKey}`" class="p-4 flex" 
    :class="limitHeightToPage ? 'h-[calc(100vh-3.5rem)]': undefined"
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
  if (!coreStore.resource?.options?.pageInjections?.list) {
    return true;
  }
  const listPageInjects = coreStore.resource.options.pageInjections.list;
  console.log('asdcoreStore.resource', JSON.stringify(listPageInjects, null, 2))
  
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
