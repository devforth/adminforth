<template>
  <div class="relative w-full">
    <component 
      v-if="!loading"
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.beforeBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="c.meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />
    <BreadcrumbsWithButtons>
      <RouterLink v-if="coreStore.resource?.options?.allowedActions?.create"
        :to="{ name: 'resource-create', params: { resourceId: $route.params.resourceId } }"
        class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
      >
        <IconPlusOutline class="w-4 h-4 me-2"/>
        {{ $t('Add new') }}
      </RouterLink>

      <RouterLink v-if="coreStore?.resourceOptions?.allowedActions?.edit" :to="{ name: 'resource-edit', params: { resourceId: $route.params.resourceId, primaryKey: $route.params.primaryKey } }" 
        class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-default border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconPenSolid class="w-4 h-4" />
        {{ $t('Edit') }}
      </RouterLink>

      <button v-if="coreStore?.resourceOptions?.allowedActions?.delete"  @click="deleteRecord"
        class="flex items-center py-1 px-3 text-sm font-medium rounded-default text-red-600 focus:outline-none bg-white  border border-gray-300 hover:bg-gray-100 hover:text-red-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-red-500 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconTrashBinSolid class="w-4 h-4" />
        {{ $t('Delete') }}
      </button>

      <ThreeDotsMenu 
        :threeDotsDropdownItems="coreStore.resourceOptions?.pageInjections?.show?.threeDotsDropdownItems"
      ></ThreeDotsMenu>
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
        <span class="sr-only">{{ $t('Loading...') }}</span>
    </div>
    <div 
      v-else-if="coreStore.record"
      class="relative w-full flex flex-col gap-4"
    >
    <div v-if="!groups.length && allColumns.length">
      <ShowTable
        :columns="allColumns"
        :resource="coreStore.resource"
        :record="coreStore.record"
      />
    </div>
    <template v-else>
      <template v-for="group in groups" :key="group.groupName">
        <ShowTable
          :columns="group.columns"
          :groupName="group.groupName"
          :resource="coreStore.resource"
          :record="coreStore.record"
        />
      </template>
      <template v-if="otherColumns.length > 0">
        <ShowTable
          :columns="otherColumns"
          groupName="Other Fields"
          :resource="coreStore.resource"
          :record="coreStore.record"
        />
      </template>
    </template>
    </div>

    <div v-else class="text-center text-gray-500 dark:text-gray-400 mt-10">
      {{ $t('Ooops. Record not found') }}
    </div>

    <component 
      v-if="!loading"
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


<script setup lang="ts">

import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';

import { useCoreStore } from '@/stores/core';
import { getCustomComponent, checkAcessByAllowedActions, initThreeDotsDropdown } from '@/utils';
import { IconPenSolid, IconTrashBinSolid, IconPlusOutline } from '@iconify-prerendered/vue-flowbite';
import { onMounted, ref, computed } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import {callAdminForthApi} from '@/utils';
import { showSuccesTost, showErrorTost } from '@/composables/useFrontendApi';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import ShowTable from '@/components/ShowTable.vue';
import adminforth from "@/adminforth";
import { useI18n } from 'vue-i18n';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const { t } = useI18n();
const coreStore = useCoreStore();

onMounted(async () => {
  loading.value = true;
  await coreStore.fetchResourceFull({
    resourceId: route.params.resourceId
  });
  initThreeDotsDropdown();
  await coreStore.fetchRecord({
    resourceId: route.params.resourceId, 
    primaryKey: route.params.primaryKey,
    source: 'show',
  });
  checkAcessByAllowedActions(coreStore.resourceOptions.allowedActions,'show');
  loading.value = false;
});

const groups = computed(() => {
  let fieldGroupType;
  if (coreStore.resource.options?.showFieldGroups) {
    fieldGroupType = coreStore.resource.options.showFieldGroups;
  } else if (coreStore.resource.options?.showFieldGroups === null) {
    fieldGroupType = [];
  } else {
    fieldGroupType = coreStore.resource.options?.fieldGroups;
  }

  const activeGroups = fieldGroupType ?? [];

  return activeGroups.map(group => ({
    ...group,
    columns: coreStore.resource.columns.filter(
      col => group.columns.includes(col.name) && col.showIn.show
    ),
  }));
});

const allColumns = computed(() => {
  return coreStore.resource.columns.filter(col => col.showIn.show);
});

const otherColumns = computed(() => {
  const groupedColumnNames = new Set(
    groups.value.flatMap(group => group.columns.map(col => col.name))
  );

  return coreStore.resource.columns.filter(
    col => !groupedColumnNames.has(col.name) && col.showIn.show
  );
});

async function deleteRecord(row) {
  const data = await adminforth.confirm({
    message: t('Are you sure you want to delete this item?'),
    yes: t('Delete'),
    no: t('Cancel'),
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
        showSuccesTost(t('Record deleted successfully'))
      } else {
        showErrorTost(res.error)
      }

    } catch (e) {
      console.error(e);
    };
  }
    
}

</script>
