<template>
  <div class="relative">
    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.beforeBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="c.meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />
    <BreadcrumbsWithButtons>
      <RouterLink v-if="coreStore?.resourceOptions?.allowedActions?.edit" :to="{ name: 'resource-edit', params: { resourceId: $route.params.resourceId, primaryKey: $route.params.primaryKey } }" 
        class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-default border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconPenSolid class="w-4 h-4" />
        Edit
      </RouterLink>

      <button v-if="coreStore?.resourceOptions?.allowedActions?.delete"  @click="deleteRecord"
        class="flex items-center py-1 px-3 text-sm font-medium rounded-default text-red-600 focus:outline-none bg-white  border border-gray-300 hover:bg-gray-100 hover:text-red-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-red-500 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconTrashBinSolid class="w-4 h-4" />
        Delete
      </button>
    </BreadcrumbsWithButtons>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.afterBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="c.meta"
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
      v-else-if="coreStore.record"
      class="relative overflow-x-auto rounded-default shadow-resourseFormShadow "
    >
     <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 rounded-default">
        <thead class="text-xs text-gray-700 uppercase bg-lightFormHeading dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" class="px-6 py-3">
                    Field
                </th>
                <th scope="col" class="px-6 py-3 w-5/6">
                    Value
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="column,i in coreStore.resource?.columns.filter(c => c.showIn.includes('show'))" :key="column.name"
              class="bg-lightForm bg-darkForm odd:dark:bg-gray-900 even:dark:bg-gray-800 dark:border-gray-700"
              :class="{ 'border-b': i !== coreStore.resource.columns.filter(c => c.showIn.includes('show')).length - 1 }"
            >
              <component
                v-if="column.components?.showRow"
                  :is="getCustomComponent(column.components.showRow)"
                  :meta="column.components.showRow.meta"
                  :column="column"
                  :resource="coreStore.resource"
                  :record="coreStore.record"
              />
              <template v-else>
                <td class="px-6 py-4 whitespace-nowrap "> <!--align-top-->
                  {{ column.label }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap whitespace-pre-wrap">
                  <component
                    v-if="column?.components?.show"
                    :is="getCustomComponent(column?.components?.show)"
                    :resource="coreStore.resource"
                    :meta="column.components.show.meta"
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
    </div>

    <div v-else class="text-center text-gray-500 dark:text-gray-400 mt-10">
      Ooops. Record not found
    </div>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.bottom || []"
      :is="getCustomComponent(c)"
      :meta="c.meta"
      :column="column"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />


  </div>
</template>


<script setup>

import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';

import ValueRenderer from '@/components/ValueRenderer.vue';
import { useCoreStore } from '@/stores/core';
import { useModalStore } from '@/stores/modal';
import { getCustomComponent, checkAcessByAllowedActions } from '@/utils';
import { IconPenSolid, IconTrashBinSolid } from '@iconify-prerendered/vue-flowbite';
import { onMounted, ref } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import {callAdminForthApi} from '@/utils';
import { showSuccesTost, showErrorTost } from '@/composables/useFrontendApi';


const item = ref(null);
const route = useRoute();
const router = useRouter();
const loading = ref(true);

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
  loading.value = false;
});

async function deleteRecord(row) {
  const data = await window.adminforth.confirm({
    message: 'Are you sure you want to delete this item?',
    yes: 'Delete',
    no: 'Cancel',
  });
  if (data) {
    try {
      const res = await callAdminForthApi({
      path: '/delete_record',
      method: 'POST',
      body: {
        resourceId: route.params.resourceId,
        primaryKey: route.params.primaryKey,
      }});
      if (!res.error){
        router.push({ name: 'resource-list', params: { resourceId: route.params.resourceId } });
        showSuccesTost('Record deleted successfully')
      } else {
        showErrorTost(res.error)
      }

    } catch (e) {
      console.error(e);
      };
    }

    
}

</script>
