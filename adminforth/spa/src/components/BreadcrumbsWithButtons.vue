<template>
  <div>
    <div class="flex items-center justify-between mb-3 flex-wrap gap-y-2 gap-2">
      <Breadcrumbs />
      <div class="flex items-center space-x-1 flex-wrap gap-y-1">
        <slot></slot>
      </div>
    </div>
    <div v-if="coreStore.resourceColumnsError" >
      <PageNotFound :errorMessage="coreStore.resourceColumnsError" />
    </div>
  </div>

</template>

<script setup>
import Breadcrumbs from '@/components/Breadcrumbs.vue'; 
import PageNotFound from '@/views/PageNotFound.vue';

import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();

</script>