<template>
  <div class="relative">

    <BreadcrumbsWithButtons>
      <!-- save and cancle -->
      <button @click="$router.back()"
        class="flex items-center py-1 px-3 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        Cancel
      </button>

      <button  @click="saveRecord"
        class="flex items-center py-1 px-3 mb-2 text-sm font-medium text-red-600 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-red-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-red-500 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconFloppyDiskSolid class="w-4 h-4" />
        Save
      </button>

    </BreadcrumbsWithButtons>

    <SingleSkeletLoader v-if="loading"></SingleSkeletLoader>

    <ResourceForm 
      v-else
      :record="coreStore.record"
      :resourceColumns="coreStore.resourceColumns"
      @update:record="onUpdateRecord"
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
import SingleSkeletLoader from '@/components/SingleSkeletLoader.vue';
import { callAdminForthApi } from '@/utils';

const coreStore = useCoreStore();

const route = useRoute();

const loading = ref(false);

const saving = ref(false);

const record = ref({});

async function onUpdateRecord(newRecord) {
  record.value = newRecord;
}


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

async function saveRecord() {
  saving.value = true;
  await callAdminForthApi({
    method: 'POST',
    path: `/update_record`,
    body: {
      resourceId: route.params.resourceId,
      recordId: route.params.primaryKey,
      record: record.value,
    },
  });
  saving.value = false;
  router.push({ name: 'resource.show', params: { resourceId: route.params.resourceId, primaryKey: coreStore.record[coreStore.primaryKey] } });
}

</script>