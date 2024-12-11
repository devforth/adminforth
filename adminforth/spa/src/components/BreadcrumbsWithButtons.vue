<template>
  <div>
    <div class="flex items-center justify-between mb-3 flex-wrap gap-y-2 gap-2">
      <Breadcrumbs />
      <div class="flex items-center space-x-1 flex-wrap gap-y-1">
        <slot></slot>
      </div>
    </div>
    <div class="flex items-center justify-between mb-3 flex-wrap gap-y-2 gap-2" v-if="coreStore.resourceColumnsError">
      <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
        <span class="font-medium">{{ $t('Error!')}}</span> {{ coreStore.resourceColumnsError }}
      </div>
    </div>
  </div>

</template>

<script setup>
import Breadcrumbs from '@/components/Breadcrumbs.vue';

import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();

</script>