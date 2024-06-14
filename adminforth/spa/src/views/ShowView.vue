<template>
  <div class="relative">
    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.beforeBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />
    <BreadcrumbsWithButtons>
      <RouterLink v-if="coreStore?.resourceOptions?.allowedActions?.edit" :to="{ name: 'resource-edit', params: { resourceId: $route.params.resourceId, primaryKey: $route.params.primaryKey } }" 
        class="flex items-center py-1 px-3 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconPenSolid class="w-4 h-4" />
        Edit
      </RouterLink>

      <button v-if="coreStore?.resourceOptions?.allowedActions?.delete"  @click="showDeleteModal"
        class="flex items-center py-1 px-3 mb-2 text-sm font-medium rounded-default text-red-600 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-red-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-red-500 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconTrashBinSolid class="w-4 h-4" />
        Delete
      </button>
    </BreadcrumbsWithButtons>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.afterBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

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
      class="relative overflow-x-auto shadow-resourse-form-shadow "
    >
     <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 rounded-default">
        <thead class="text-xs text-gray-700 uppercase bg-form-view-heading dark:bg-gray-700 dark:text-gray-400">
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
                class="bg-form-view-bg odd:dark:bg-gray-900  even:dark:bg-gray-800 border-b  dark:border-gray-700"
            >
              <component
                v-if="showRowComponentsPerColumn[column.name]"
                  :is="showRowComponentsPerColumn[column.name]"
                  :column="column"
                  :resource="coreStore.resource"
                  :record="coreStore.record"
              />
              <template v-else>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ column.label }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap whitespace-pre-wrap">
                  <component
                    v-if="showComponentsPerColumn[column.name]"
                    :is="showComponentsPerColumn[column.name]"
                    :resource="coreStore.resource"
                    :column="column"
                    :record="coreStore.record"
                  />
                  <ValueRenderer v-else 
                    :column="column" 
                    :record="coreStore.record"
                  />
                </td>
              </template>
            </tr>
        </tbody>
    </table>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.bottom || []"
      :is="getCustomComponent(c)"
      :column="column"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />
</div>


  </div>
</template>


<script setup>

import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';

import ValueRenderer from '@/components/ValueRenderer.vue';
import { useCoreStore } from '@/stores/core';
import { useModalStore } from '@/stores/modal';
import { getCustomComponent,checkAcessByAllowedActions } from '@/utils';
import { IconPenSolid, IconTrashBinSolid } from '@iconify-prerendered/vue-flowbite';
import { onMounted, ref } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import {callAdminForthApi} from '@/utils';


const item = ref(null);
const route = useRoute();
const router = useRouter();
const loading = ref(false);
let showComponentsPerColumn = {};
let showRowComponentsPerColumn = {};

console.log(route.params,'showWiev');


const coreStore = useCoreStore();
const modalStore = useModalStore();

onMounted(async () => {
  loading.value = true;
  await coreStore.fetchResourceFull({
    resourceId: route.params.resourceId
  });
  await coreStore.fetchRecord({
    resourceId: route.params.resourceId, 
    primaryKey: route.params.primaryKey,
  });
  checkAcessByAllowedActions(coreStore.resourceOptions.allowedActions,'show');

  showComponentsPerColumn = coreStore.resourceColumns.reduce((acc, column) => {
      if (column.component?.show) {
          acc[column.name] = getCustomComponent(column.component.show);
      }
      return acc;
  }, {});
  showRowComponentsPerColumn = coreStore.resourceColumns.reduce((acc, column) => {
      if (column.component?.showRow) {
          acc[column.name] = getCustomComponent(column.component.showRow);
      }
      return acc;
  }, {});

  loading.value = false;
});

function showDeleteModal(row) {
  if (!coreStore.config?.deleteConfirmation) {
    return deleteRecord(row);
  }
  modalStore.setModalContent({
    content: 'Are you sure you want to delete this item?',
    acceptText: 'Delete',
    cancelText: 'Cancel',
  });
  modalStore.setOnAcceptFunction(() => {
    return deleteRecord(row)
  })
  modalStore.togleModal();
  

}

async function deleteRecord(row) {
  try{
    await callAdminForthApi({
      path: '/delete_record',
      method: 'POST',
      body: {
        resourceId: route.params.resourceId,
        primaryKey: route.params.primaryKey,
        recordId: route.params.primaryKey
      }
    });
    router.push({ name: 'resource-list', params: { resourceId: route.params.resourceId } });
  } catch (error) {
    console.log(error);
  }

  modalStore.resetmodalState()
}

</script>