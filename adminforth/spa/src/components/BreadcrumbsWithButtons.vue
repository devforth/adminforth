<template>
  <div>
    <div class="flex items-center justify-between mb-4 flex-wrap gap-y-2 gap-2">
      <Breadcrumbs />
      <div class="flex items-center gap-2 flex-wrap gap-y-1">
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