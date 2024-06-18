<template>
  <div class="relative">
    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.edit?.beforeBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="c.meta"
      :record="editableRecord"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <BreadcrumbsWithButtons>
      <!-- save and cancle -->
      <button @click="$router.back()"
        class="flex items-center py-1 px-3 me-2 text-sm font-medium text-gray-900  rounded-default focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        Cancel
      </button>

      <button  @click="saveRecord"
        class="flex items-center py-1 px-3 text-sm font-medium  rounded-default text-red-600 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-red-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-red-500 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
        :disabled="saving || (validating && !isValid)"
      >
        <IconFloppyDiskSolid class="w-4 h-4" />
        Save
      </button>

    </BreadcrumbsWithButtons>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.edit?.afterBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="c.meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <SingleSkeletLoader v-if="loading"></SingleSkeletLoader>

    <ResourceForm 
      v-else
      :record="editableRecord"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
      @update:record="onUpdateRecord"
      @update:isValid="isValid = $event"
      :validating="validating"
      :customComponentsPerColumn="editComponentsPerColumn"
    >
    </ResourceForm>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.edit?.bottom || []"
      :is="getCustomComponent(c)"
      :meta="c.meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

  </div>
</template>


<script setup>

import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';
import ResourceForm from '@/components/ResourceForm.vue';
import SingleSkeletLoader from '@/components/SingleSkeletLoader.vue';
import { useCoreStore } from '@/stores/core';
import { callAdminForthApi, getCustomComponent,checkAcessByAllowedActions } from '@/utils';
import { IconFloppyDiskSolid } from '@iconify-prerendered/vue-flowbite';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const coreStore = useCoreStore();

const isValid = ref(false);
const validating = ref(false);

const route = useRoute();
const router = useRouter();

const loading = ref(false);

const saving = ref(false);

const record = ref({});
let editComponentsPerColumn = {};

async function onUpdateRecord(newRecord) {
  record.value = newRecord;
}

const editableRecord = computed(() => {
  const newRecord = { ...coreStore.record };
  if (!coreStore.resourceColumns) {
    return {};
  }
  coreStore.resourceColumns.forEach(column => {
    if (column.foreignResource) {
      newRecord[column.name] = newRecord[column.name]?.pk
    }
  });
  return newRecord;
})

onMounted(async () => {

  loading.value = true;

  await coreStore.fetchResourceFull({
    resourceId: route.params.resourceId
  });
  await coreStore.fetchRecord({
    resourceId: route.params.resourceId, 
    primaryKey: route.params.primaryKey,
  });
  checkAcessByAllowedActions(coreStore.resourceOptions.allowedActions,'edit');

  editComponentsPerColumn = coreStore.resourceColumns.reduce((acc, column) => {
      if (column.components?.edit) {
          acc[column.name] = getCustomComponent(column.components.edit);
      }
      return acc;
    }, {});
  loading.value = false;
});

async function saveRecord() {
  if (!isValid.value) {
    validating.value = true;
    return;
  } else {
    validating.value = false;
  }

  saving.value = true;

  const updates = {};
  for (const key in record.value) {
    if (record.value[key] !== coreStore.record[key]) {
      updates[key] = record.value[key];
    }
  }

  await callAdminForthApi({
    method: 'POST',
    path: `/update_record`,
    body: {
      resourceId: route.params.resourceId,
      recordId: route.params.primaryKey,
      record: updates,
    },
  });
  saving.value = false;
  router.push({ name: 'resource-show', params: { resourceId: route.params.resourceId, primaryKey: coreStore.record[coreStore.primaryKey] } });
}

</script>