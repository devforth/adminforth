<template>
  <div class="relative">
    <BreadcrumbsWithButtons>
      <RouterLink :to="{ name: 'resource-edit', params: { resourceId: $route.params.resourceId, primaryKey: $route.params.primaryKey } }" 
        class="flex items-center py-1 px-3 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconPenSolid class="w-4 h-4" />
        Edit
      </RouterLink>

      <button  @click="deleteRecord"
        class="flex items-center py-1 px-3 mb-2 text-sm font-medium text-red-600 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-red-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-red-500 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconTrashBinSolid class="w-4 h-4" />
        Delete
      </button>
    </BreadcrumbsWithButtons>

    <div v-if="loading" role="status" class="max-w-sm animate-pulse">
        <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
        <span class="sr-only">Loading...</span>
    </div>
    <div 
      v-else
      class="relative overflow-x-auto shadow-md sm:rounded-lg"
    >
     <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" class="px-6 py-3">
                    Field
                </th>
                <th scope="col" class="px-6 py-3 w-4/6">
                    Value
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="column in coreStore.resourceColumns?.filter(c => c.showIn.includes('show'))" :key="column.name"
                class="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700"
            >
                <td class="px-6 py-4 whitespace-nowrap">
                    {{ column.label }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap whitespace-pre-wrap">
                    <component
                        :is="showComponentsPerColumn[column.name] || ValueRenderer"
                        :column="column"
                        :row="coreStore.record"
                    />
                </td>
            </tr>
            
        </tbody>
    </table>
</div>


  </div>
</template>


<script setup>

import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';
import ValueRenderer from '@/components/ValueRenderer.vue';
import { useCoreStore } from '@/stores/core';
import { getCustomComponent } from '@/utils';
import { IconPenSolid, IconTrashBinSolid } from '@iconify-prerendered/vue-flowbite';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';


const item = ref(null);
const route = useRoute();
const loading = ref(false);
let showComponentsPerColumn = {};

const coreStore = useCoreStore();

onMounted(async () => {
  loading.value = true;
  await coreStore.fetchColumns({
    resourceId: route.params.resourceId
  });
  await coreStore.fetchRecord({
    resourceId: route.params.resourceId, 
    primaryKey: route.params.primaryKey,
  });
  showComponentsPerColumn = coreStore.resourceColumns.reduce((acc, column) => {
      if (column.component?.show) {
          acc[column.name] = getCustomComponent(column.component.show);
      }
      return acc;
    }, {});
  loading.value = false;
});

</script>