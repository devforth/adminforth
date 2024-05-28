<template>
  <div class="relative">

    <BreadcrumbsWithButtons>
      <!-- save and cancle -->
      <RouterLink :to="{ name: 'resource-show', params: { resourceId: $route.params.resourceId, primaryKey: $route.params.primaryKey } }"
        class="flex items-center py-1 px-3 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        Cancel
      </RouterLink>

      <button  @click="saveRecord"
        class="flex items-center py-1 px-3 mb-2 text-sm font-medium text-red-600 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-red-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-red-500 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconFloppyDiskSolid class="w-4 h-4" />
        Save
      </button>

    </BreadcrumbsWithButtons>

    <ResourceForm 
      :loading="loading"
      :record="coreStore.record"
      :resourceColumns="coreStore.resourceColumns"
    >
    </ResourceForm>
  </div>
</template>


<script setup>

import { ref, computed, onMounted } from 'vue';  
import { useRoute } from 'vue-router';
import { useCoreStore } from '@/stores/core';
import ResourceForm from '@/components/ResourceForm.vue';
import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';
import { IconFloppyDiskSolid } from '@iconify-prerendered/vue-flowbite';

const coreStore = useCoreStore();

const item = ref(null);
const route = useRoute();

const loading = ref(false);

onMounted(async () => {
  loading.value = true;

  await coreStore.fetchColumns({
    resourceId: route.params.resourceId
  });
  await coreStore.fetchRecord({
    resourceId: route.params.resourceId, 
    primaryKey: route.params.primaryKey,
  });

  loading.value = false;
});

</script>