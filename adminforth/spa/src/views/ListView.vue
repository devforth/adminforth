<template>
  <div class="relative flex flex-col max-w-full w-full">
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
        class="flex gap-1  items-center py-1 px-3 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-darkListTable dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
      >
        <IconBanOutline class="w-5 h-5 "/>

        <div id="tooltip-remove-all" role="tooltip"
             class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
          {{ $t('Remove selection') }}
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
          v-if="action.icon && !bulkActionLoadingStates[action.id]"
          :is="getIcon(action.icon)"
          class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></component>
        <div v-if="bulkActionLoadingStates[action.id]">
          <svg 
            aria-hidden="true" 
            class="w-5 h-5 animate-spin" 
            :class="{
              'text-gray-200 dark:text-gray-500 fill-gray-500 dark:fill-gray-300': action.state !== 'danger',
              'text-red-200 dark:text-red-800 fill-red-600 dark:fill-red-500': action.state === 'danger'
            }"
            viewBox="0 0 100 101" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
          <span class="sr-only">Loading...</span>
        </div>
        {{ `${action.label} (${checkboxes.length})` }}
      </button>

      <RouterLink v-if="coreStore.resource?.options?.allowedActions?.create"
        :to="{ name: 'resource-create', params: { resourceId: $route.params.resourceId } }"
        class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
      >
        <IconPlusOutline class="w-4 h-4 me-2"/>
        {{ $t('Create') }}
      </RouterLink>

      <button
        class="flex gap-1 items-center py-1 px-3 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
        @click="()=>{filtersShow = !filtersShow}"
        v-if="coreStore.resource?.options?.allowedActions?.filter"
      >
        <IconFilterOutline class="w-4 h-4 me-2"/>
        {{ $t('Filter') }}
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
      :page="page"
      @update:page="page = $event"
      @update:sort="sort = $event"
      @update:checkboxes="checkboxes = $event"
      @update:records="getList"
      :sort="sort"
      :pageSize="pageSize"
      :totalRows="totalRows"
      :checkboxes="checkboxes"
      :customActionsInjection="coreStore.resourceOptions?.pageInjections?.list?.customActionIcons"
      :tableBodyStartInjection="coreStore.resourceOptions?.pageInjections?.list?.tableBodyStart"
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

<script setup lang="ts">
import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';
import ResourceListTable from '@/components/ResourceListTable.vue';
import { useCoreStore } from '@/stores/core';
import { useFiltersStore } from '@/stores/filters';
import { callAdminForthApi, currentQuery, getIcon, setQuery } from '@/utils';
import { computed, onMounted, ref, watch, nextTick, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { showErrorTost } from '@/composables/useFrontendApi'
import { getCustomComponent, initThreeDotsDropdown } from '@/utils';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';


import {
  IconBanOutline,
  IconFilterOutline,
  IconPlusOutline
} from '@iconify-prerendered/vue-flowbite';

import Filters from '@/components/Filters.vue';
import adminforth from '@/adminforth';

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

const rows: Ref<any[]|null> = ref(null);
const totalRows = ref(0);
const checkboxes = ref([]);
const bulkActionLoadingStates = ref<{[key: string]: boolean}>({});

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
    return {error: data.error};
  }
  rows.value = data.data?.map(row => {
    if (coreStore.resource.columns.find(c => c.primaryKey).foreignResource) {
      row._primaryKeyValue = row[coreStore.resource.columns.find(c => c.primaryKey).name].pk;
    } else {
      row._primaryKeyValue = row[coreStore.resource.columns.find(c => c.primaryKey).name];
    }
    return row;
  });
  totalRows.value = data.total;
  
  // if checkboxes have items which are not in current data, remove them
  checkboxes.value = checkboxes.value.filter(pk => rows.value!.some(r => r._primaryKeyValue === pk));
  await nextTick();
  return {}
}

async function refreshExistingList(pk?: any) {
  const currentData = rows.value;
  if (!currentData) {
    throw new Error('No rows loaded yet. Silent refresh is possible only after some rows are loaded. COnsider calling getList() instead first');
  }
  if (!coreStore.resource) {
    throw new Error('Resource not loaded yet');
  }
  let pks;
  if (pk && !currentData.some(r => r._primaryKeyValue === pk)) {
    return {error: `Primary key ${pk} not found in current data`};
  }

  if (pk) {
    pks = [pk];
  } else {
    pks = currentData.map(r => r._primaryKeyValue);
  }
    
  const data = await callAdminForthApi({
    path: '/get_resource_data',
    method: 'POST',
    body: {
      source: 'list',
      resourceId: route.params.resourceId,
      limit: pks.length,
      offset: 0,
      filters: [
        {
          field: coreStore.resource!.columns.find(c => c.primaryKey)!.name,
          operator: 'in',
          value: pks
        }
      ],
      sort: sort.value,
    }
  });
  if (data.error) {
    return data;
  }
  data.data.forEach((row: any) => {
    const pkKeyName = coreStore.resource!.columns.find(c => c.primaryKey)!.name;

    const existingRow = currentData.find(r => r._primaryKeyValue === row[pkKeyName]);
    if (existingRow) {
      Object.assign(existingRow, row);
    }
  });
  return {}
}


async function startBulkAction(actionId) {
  const action = coreStore.resource.options.bulkActions.find(a => a.id === actionId);
  if (action.confirm) {
    const confirmed = await adminforth.confirm({
      message: action.confirm,
    });
    if (!confirmed) {
      return;
    }
  }
  bulkActionLoadingStates.value[actionId] = true;

  const data = await callAdminForthApi({
    path: '/start_bulk_action',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId,
      actionId: actionId,
      recordIds: checkboxes.value

    }
  });
  bulkActionLoadingStates.value[actionId] = false;
  if (data?.ok) {
    checkboxes.value = [];
    await getList();

    if (data.successMessage) {
      adminforth.alert({
        message: data.successMessage,
        variant: 'success'
      });
    }

  }
  if (data?.error) {
    showErrorTost(data.error);
  }
}


class SortQuerySerializer {
    static serialize(sort) {
        return sort.map(s => `${s.field}__${s.direction}`).join(',');
    }
    static deserialize(str) {
        return str.split(',').map(s => {
            const [field, direction] = s.split('__');
            return { field, direction };
        });
    }
}

let listAutorefresher: any = null;

async function init() {
  
  await coreStore.fetchResourceFull({
    resourceId: route.params.resourceId
  });

  // !!! clear filters should be in same tick with sort assignment so that watch can catch it as one change

  // try to init filters from query params
  const filters = Object.keys(route.query).filter(k => k.startsWith('filter__')).map(k => {
    const [_, field, operator] = k.split('__');
    return {
      field,
      operator,
      value: JSON.parse(decodeURIComponent(route.query[k]))
    }
  });
  if (filters.length) {
    filtersStore.setFilters(filters);
  } else {
    filtersStore.clearFilters();
  }

  if (route.query.sort) {
    sort.value = SortQuerySerializer.deserialize(route.query.sort);
  } else if (coreStore.resource.options?.defaultSort) {
    sort.value = [{
        field: coreStore.resource.options.defaultSort.columnName,
        direction: coreStore.resource.options.defaultSort.direction
    }];
  } else {
    sort.value = [];
  }
  // page init should be also in same tick 
  if (route.query.page) {
    page.value = parseInt(route.query.page);
  }

  // getList(); - Not needed here, watch will trigger it
  columnsMinMax.value = await callAdminForthApi({
    path: '/get_min_max_for_columns',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId
    }
  });

  if (listAutorefresher) {
    clearInterval(listAutorefresher);
    listAutorefresher = null;
  }
  if (coreStore.resource!.options?.listRowsAutoRefreshSeconds) {
    listAutorefresher = setInterval(async () => {
      await adminforth.list.silentRefresh();
    }, coreStore.resource!.options.listRowsAutoRefreshSeconds * 1000);
  }
}

watch([page, sort, () => filtersStore.filters], async () => {
  // console.log('🔄️ page/sort/filter change fired, page:', page.value);
  await getList();
}, { deep: true });

adminforth.list.refresh = async () => {
  return await getList();
}

adminforth.list.silentRefresh = async () => {
  return await refreshExistingList();
}

adminforth.list.silentRefreshRow = async (pk: any) => {
  return await refreshExistingList(pk);
}

let initInProcess = false;

watch(() => filtersStore.filters, async (to, from) => {
  if (initInProcess) {
    return;
  }
  console.log('🔄️ filters changed', JSON.stringify(to))
  page.value = 1;
  checkboxes.value = []; // TODO: not sure absolutely needed here
  // update query param for each filter as filter_<column_name>=value
  const query = {};
  const currentQ = currentQuery();
  filtersStore.filters.forEach(f => {
    if (f.value) {
      query[`filter__${f.field}__${f.operator}`] = encodeURIComponent(JSON.stringify(f.value));
    }
  });
  // set every key in currentQ which starts with filter_ to undefined if it is not in query
  Object.keys(currentQ).forEach(k => {
    if (k.startsWith('filter_') && !query[k]) {
      query[k] = undefined;
    }
  });
  setQuery(query);
}, {deep: true});

onMounted(async () => {
  initInProcess = true;
  await init();
  initThreeDotsDropdown();
  initInProcess = false;
});

watch([page], async () => {
  setQuery({ page: page.value });
});




watch([sort], async () => {
  if (!sort.value.length) {
    setQuery({ sort: undefined });
    return;
  }
  setQuery({ sort: SortQuerySerializer.serialize(sort.value) });
});


</script>