<template>
  <div class="relative">
    <Teleport to="body">
      <Filters
        :columns="coreStore.resource?.columns"
        :columnsMinMax="columnsMinMax" :show="filtersShow"
        @hide="filtersShow = false"
      />
    </Teleport>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.list?.beforeBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="c.meta"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <BreadcrumbsWithButtons>
      <button
        @click="()=>{checkboxes = []}"
        v-if="checkboxes.length"
        data-tooltip-target="tooltip-remove-all"
        data-tooltip-placement="bottom"
        class="flex gap-1  items-center py-1 px-3 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-darkListTable dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
      >
        <IconBanOutline class="w-5 h-5 "/>

        <div id="tooltip-remove-all" role="tooltip"
             class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
          Remove selection
          <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
      </button>

      <button
        v-if="checkboxes.length" 
        v-for="(action,i) in coreStore.resource?.options?.bulkActions" 
        :key="action.id"
        @click="startBulkAction(action.id)"
        class="flex gap-1 items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-default border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
        :class="{'bg-red-100 text-red-800 border-red-400 dark:bg-red-700 dark:text-red-400 dark:border-red-400':action.state==='danger', 'bg-green-100 text-green-800 border-green-400 dark:bg-green-700 dark:text-green-400 dark:border-green-400':action.state==='success',
        'bg-lightPrimaryOpacity text-lightPrimary border-blue-400 dark:bg-blue-700 dark:text-blue-400 dark:border-blue-400':action.state==='active',
        }"
      >
        <component
          v-if="action.icon"
          :is="getIcon(action.icon)"
          class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></component>

        {{ `${action.label} (${checkboxes.length})` }}
      </button>

      <RouterLink v-if="coreStore.resource?.options?.allowedActions?.create"
        :to="{ name: 'resource-create', params: { resourceId: $route.params.resourceId } }"
        class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
      >
        <IconPlusOutline class="w-4 h-4 me-2"/>
        Create
      </RouterLink>

      <button
        class="flex gap-1 items-center py-1 px-3 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
        @click="()=>{filtersShow = !filtersShow}"
        v-if="coreStore.resource?.options?.allowedActions?.filter"
      >
        <IconFilterOutline class="w-4 h-4 me-2"/>
        Filter
        <span
          class="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400"
          v-if="filtersStore.filters.length">
            {{ filtersStore.filters.length }}
        </span>
      </button>

      <ThreeDotsMenu 
        :threeDotsDropdownItems="coreStore.resourceOptions?.pageInjections?.list?.threeDotsDropdownItems"
      ></ThreeDotsMenu>
    </BreadcrumbsWithButtons>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.list?.afterBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="c.meta"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <ResourceListTable
      :resource="coreStore.resource"
      :rows="rows"
      @update:page="page = $event"
      @update:sort="sort = $event"
      @update:checkboxes="checkboxes = $event"
      @update:records="getList"
      :sort="sort"
      :pageSize="pageSize"
      :totalRows="totalRows"
      :checkboxes="checkboxes"
    />

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.list?.bottom || []"
      :is="getCustomComponent(c)"
      :meta="c.meta"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

  </div>
</template>

<script setup>
import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';
import ResourceListTable from '@/components/ResourceListTable.vue';
import { useCoreStore } from '@/stores/core';
import { useFiltersStore } from '@/stores/filters';
import { callAdminForthApi, getIcon } from '@/utils';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { showErrorTost } from '@/composables/useFrontendApi'
import { getCustomComponent, initThreeDotsDropdown } from '@/utils';
import { initFlowbite } from 'flowbite';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';


import {
  IconBanOutline,
  IconFilterOutline,
  IconPlusOutline
} from '@iconify-prerendered/vue-flowbite';

import Filters from '@/components/Filters.vue';

const filtersShow = ref(false);

const coreStore = useCoreStore();
const filtersStore = useFiltersStore();

const route = useRoute();

const page = ref(1);
const columnsMinMax = ref({});
const sort = ref([]);

watch(() => sort, async (to, from) => {
  // in store sort might be needed for plugins
  filtersStore.setSort(sort.value);
}, {deep: true});

const rows = ref(null);
const totalRows = ref(0);
const checkboxes = ref([]);

const DEFAULT_PAGE_SIZE = 10;


const pageSize = computed(() => coreStore.resource?.options?.listPageSize || DEFAULT_PAGE_SIZE);


async function getList() {
  rows.value = null;
  const data = await callAdminForthApi({
    path: '/get_resource_data',
    method: 'POST',
    body: {
      source: 'list',
      resourceId: route.params.resourceId,
      limit: pageSize.value,
      offset: ((page.value || 1) - 1) * pageSize.value,
      filters: filtersStore.filters,
      sort: sort.value,
    }
  });
  if (data.error) {
    showErrorTost(data.error);
    rows.value = [];
    totalRows.value = 0;
    return;
  }
  rows.value = data.data?.map(row => {
    row._primaryKeyValue = row[coreStore.resource.columns.find(c => c.primaryKey).name];
    return row;
  });
  totalRows.value = data.total;
  await new Promise(resolve => setTimeout(resolve, 0));
  initFlowbite(); // for tooltips in table

}

async function startBulkAction(actionId) {
  const action = coreStore.resource.options.bulkActions.find(a => a.id === actionId);
  if (action.confirm) {
    const confirmed = await window.adminforth.confirm({
      message: action.confirm,
    });
    if (!confirmed) {
      return;
    }
  }

  const data = await callAdminForthApi({
    path: '/start_bulk_action',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId,
      actionId: actionId,
      recordIds: checkboxes.value

    }
  });
  if (data?.ok) {
    checkboxes.value = [];
    await getList();

    if (data.successMessage) {
      window.adminforth.alert({
        message: data.successMessage,
        variant: 'success'
      });
    }

  }
  if (data?.error) {
    showErrorTost(data.error);
  }
}



async function init() {
  
  await coreStore.fetchResourceFull({
    resourceId: route.params.resourceId
  });

  initFlowbite();

  // !!! clear filters should be in same tick with sort assignment so that watch can catch it
  filtersStore.clearFilters();
  if (coreStore.resource.options?.defaultSort) {
    sort.value = [{
        field: coreStore.resource.options.defaultSort.columnName,
        direction: coreStore.resource.options.defaultSort.direction
    }];
  } else {
    sort.value = [];
  }
  // await getList(); - Not needed here, watch will trigger it
  columnsMinMax.value = await callAdminForthApi({
    path: '/get_min_max_for_columns',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId
    }
  });
}

watch([page, sort, () => filtersStore.filters], async () => {
  await getList();
}, { deep: true });

window.adminforth.list.refresh = async () => {
  await getList();
}

watch(() => filtersStore.filters, async (to, from) => {
  page.value = 1;
  checkboxes.value = [];
}, {deep: true});

onMounted(async () => {
  await init();
  initThreeDotsDropdown();
});



</script>