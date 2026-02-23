<template>
  <div class="relative flex flex-col max-w-full w-full">
    <Teleport to="body">
      <Filters
        :columns="coreStore.resource?.columns"
        :columnsMinMax="columnsMinMax" 
        :show="filtersShow"
        @hide="filtersShow = false"
      />
    </Teleport>

    <component 
      v-if="!coreStore.isResourceFetching && !initInProcess"
      v-for="c in coreStore?.resourceOptions?.pageInjections?.list?.beforeBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <BreadcrumbsWithButtons>
      <component 
        v-if="!coreStore.isResourceFetching && !initInProcess"
        v-for="c in coreStore?.resourceOptions?.pageInjections?.list?.beforeActionButtons || []"
        :is="getCustomComponent(c)"
        :meta="(c as AdminForthComponentDeclarationFull).meta"
        :resource="coreStore.resource"
        :adminUser="coreStore.adminUser"
        :checkboxes="checkboxes"
        :clearCheckboxes="clearCheckboxes"
      />
      <button
        @click="()=>{checkboxes = []}"
        v-if="checkboxes.length"
        data-tooltip-target="tooltip-remove-all"
        class="flex gap-1  items-center py-1 px-3 me-2 text-sm font-medium text-lightListViewButtonText focus:outline-none bg-lightListViewButtonBackground rounded border border-lightListViewButtonBorder hover:bg-lightListViewButtonBackgroundHover hover:text-lightListViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightListViewButtonFocusRing dark:focus:ring-darkListViewButtonFocusRing dark:bg-darkListViewButtonBackground dark:text-darkListViewButtonText dark:border-darkListViewButtonBorder dark:hover:text-darkListViewButtonTextHover dark:hover:bg-darkListViewButtonBackgroundHover rounded-default"
      >
          <Tooltip>
            <IconBanOutline class="w-5 h-5 "/>
              <template #tooltip >
                  Remove selection
              </template>
          </Tooltip>
      </button>

           <div 
        v-if="checkboxes.length"
        v-for="(action,i) in coreStore.resource?.options?.bulkActions" 
      >
        <button
          v-if="!action.showInThreeDotsDropdown"
          :key="action.id"
          @click="startBulkActionInner(action.id!)"
          class="flex gap-1 items-center py-1 px-3 text-sm font-medium text-lightListViewButtonText focus:outline-none bg-lightListViewButtonBackground rounded-default border border-lightListViewButtonBorder hover:bg-lightListViewButtonBackgroundHover hover:text-lightListViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightListViewButtonFocusRing dark:focus:ring-darkListViewButtonFocusRing dark:bg-darkListViewButtonBackground dark:text-darkListViewButtonText dark:border-darkListViewButtonBorder dark:hover:text-darkListViewButtonTextHover dark:hover:bg-darkListViewButtonBackgroundHover"
          :class="action.buttonCustomCssClass || ''"
        >
          <component
            v-if="action.icon && !bulkActionLoadingStates[action.id!]"
            :is="getIcon(action.icon)"
            class="w-5 h-5 transition duration-75 group-hover:text-gray-900 dark:group-hover:text-white"></component>
          <div v-if="bulkActionLoadingStates[action.id!]">
            <svg 
              aria-hidden="true" 
              class="w-5 h-5 animate-spin text-gray-200 dark:text-gray-500 fill-gray-500 dark:fill-gray-300" 
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
          <div v-if="action.badge" class="text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 
            font-medium rounded-sm text-xs px-1 ml-1 text-center ">
            {{ action.badge }}            
          </div>
        </button>
      </div>

      <RouterLink v-if="coreStore.resource?.options?.allowedActions?.create"
        :to="{ name: 'resource-create', params: { resourceId: $route.params.resourceId } }"
        class="af-create-button flex items-center py-1 px-3 text-sm font-medium text-lightListViewButtonText focus:outline-none bg-lightListViewButtonBackground rounded border border-lightListViewButtonBorder hover:bg-lightListViewButtonBackgroundHover hover:text-lightListViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightListViewButtonFocusRing dark:focus:ring-darkListViewButtonFocusRing dark:bg-darkListViewButtonBackground dark:text-darkListViewButtonText dark:border-darkListViewButtonBorder dark:hover:text-darkListViewButtonTextHover dark:hover:bg-darkListViewButtonBackgroundHover rounded-default gap-1"
      >
        <IconPlusOutline class="w-4 h-4"/>
        {{ $t('Create') }}
      </RouterLink>

      <button
        class="af-filter-button flex gap-1 items-center py-1 px-3 me-2 text-sm font-medium text-lightListViewButtonText focus:outline-none bg-lightListViewButtonBackground rounded border border-lightListViewButtonBorder hover:bg-lightListViewButtonBackgroundHover hover:text-lightListViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightListViewButtonFocusRing dark:focus:ring-darkListViewButtonFocusRing dark:bg-darkListViewButtonBackground dark:text-darkListViewButtonText dark:border-darkListViewButtonBorder dark:hover:text-darkListViewButtonTextHover dark:hover:bg-darkListViewButtonBackgroundHover rounded-default"
        @click="()=>{filtersShow = !filtersShow}"
        v-if="coreStore.resource?.options?.allowedActions?.filter"
      >
        <IconFilterOutline class="w-4 h-4"/>
        {{ $t('Filter') }}
        <span
          class="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400"
          v-if="filtersStore.visibleFiltersCount">
            {{ filtersStore.visibleFiltersCount }}
        </span>
      </button>

      <ThreeDotsMenu 
        v-if="!coreStore.isResourceFetching"
        :threeDotsDropdownItems="(coreStore.resourceOptions?.pageInjections?.list?.threeDotsDropdownItems as [])"
        :bulkActions="coreStore.resource?.options?.bulkActions"
        :checkboxes="checkboxes"
        @startBulkAction="startBulkActionInner"
        :updateList="getListInner"
        :clearCheckboxes="clearCheckboxes"
        ></ThreeDotsMenu>
    </BreadcrumbsWithButtons>

    <component 
      v-if="!coreStore.isResourceFetching && !initInProcess"
      v-for="c in coreStore?.resourceOptions?.pageInjections?.list?.afterBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />
    <ResourceListTableVirtual
      v-if="isVirtualScrollEnabled && !coreStore.isResourceFetching"
      :resource="coreStore.resource"
      :rows="rows"
      :page="page"
      @update:page="page = $event"
      @update:sort="sort = $event"
      @update:checkboxes="checkboxes = $event"
      @update:records="getListInner"
      :sort="sort"
      :pageSize="pageSize"
      :totalRows="totalRows"
      :checkboxes="checkboxes"
      :customActionsInjection="Array.isArray(coreStore.resourceOptions?.pageInjections?.list?.customActionIcons)
        ? coreStore.resourceOptions.pageInjections.list.customActionIcons
        : coreStore.resourceOptions?.pageInjections?.list?.customActionIcons
          ? [coreStore.resourceOptions.pageInjections.list.customActionIcons]
          : []
      "
      :tableBodyStartInjection="Array.isArray(coreStore.resourceOptions?.pageInjections?.list?.tableBodyStart)
        ? coreStore.resourceOptions.pageInjections.list.tableBodyStart
        : coreStore.resourceOptions?.pageInjections?.list?.tableBodyStart
          ? [coreStore.resourceOptions.pageInjections.list.tableBodyStart]
          : []
      "
      :customActionIconsThreeDotsMenuItems="Array.isArray(coreStore.resourceOptions?.pageInjections?.list?.customActionIconsThreeDotsMenuItems) 
        ? coreStore.resourceOptions.pageInjections.list.customActionIconsThreeDotsMenuItems 
        : coreStore.resourceOptions?.pageInjections?.list?.customActionIconsThreeDotsMenuItems
          ? [coreStore.resourceOptions.pageInjections.list.customActionIconsThreeDotsMenuItems]
          : []"
      :tableRowReplaceInjection="Array.isArray(coreStore.resourceOptions?.pageInjections?.list?.tableRowReplace)
        ? coreStore.resourceOptions.pageInjections.list.tableRowReplace[0]
        : coreStore.resourceOptions?.pageInjections?.list?.tableRowReplace || undefined"
      :container-height="1100"
      :item-height="52.5"
      :buffer-size="listBufferSize"
    />

    <ResourceListTable
      v-else-if="!coreStore.isResourceFetching"
      :resource="coreStore.resource"
      :rows="rows"
      :page="page"
      @update:page="page = $event"
      @update:sort="sort = $event"
      @update:checkboxes="checkboxes = $event"
      @update:records="getListInner"
      :sort="sort"
      :pageSize="pageSize"
      :totalRows="totalRows"
      :checkboxes="checkboxes"
      :customActionsInjection="Array.isArray(coreStore.resourceOptions?.pageInjections?.list?.customActionIcons)
        ? coreStore.resourceOptions.pageInjections.list.customActionIcons
        : coreStore.resourceOptions?.pageInjections?.list?.customActionIcons
          ? [coreStore.resourceOptions.pageInjections.list.customActionIcons]
          : []
      "
      :tableBodyStartInjection="Array.isArray(coreStore.resourceOptions?.pageInjections?.list?.tableBodyStart)
        ? coreStore.resourceOptions.pageInjections.list.tableBodyStart
        : coreStore.resourceOptions?.pageInjections?.list?.tableBodyStart
          ? [coreStore.resourceOptions.pageInjections.list.tableBodyStart]
          : []
      "
      :customActionIconsThreeDotsMenuItems="Array.isArray(coreStore.resourceOptions?.pageInjections?.list?.customActionIconsThreeDotsMenuItems) 
        ? coreStore.resourceOptions.pageInjections.list.customActionIconsThreeDotsMenuItems 
        : coreStore.resourceOptions?.pageInjections?.list?.customActionIconsThreeDotsMenuItems
          ? [coreStore.resourceOptions.pageInjections.list.customActionIconsThreeDotsMenuItems]
          : []"
      :tableRowReplaceInjection="Array.isArray(coreStore.resourceOptions?.pageInjections?.list?.tableRowReplace)
        ? coreStore.resourceOptions.pageInjections.list.tableRowReplace[0]
        : coreStore.resourceOptions?.pageInjections?.list?.tableRowReplace || undefined"
    />

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.list?.bottom || []"
      :is="getCustomComponent(c)"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

  </div>
</template>

<script setup lang="ts">
import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';
import ResourceListTableVirtual from '@/components/ResourceListTableVirtual.vue';
import ResourceListTable from '@/components/ResourceListTable.vue';
import { useCoreStore } from '@/stores/core';
import { useFiltersStore } from '@/stores/filters';
import { callAdminForthApi, currentQuery, getIcon, setQuery } from '@/utils';
import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { getCustomComponent, initThreeDotsDropdown, getList, startBulkAction } from '@/utils';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import { Tooltip } from '@/afcl'
import type { AdminForthComponentDeclarationFull } from '@/types/Common';


import {
  IconBanOutline,
  IconFilterOutline,
  IconPlusOutline
} from '@iconify-prerendered/vue-flowbite';

import Filters from '@/components/Filters.vue';
import { useAdminforth } from '@/adminforth';

const filtersShow = ref(false);
const { list } = useAdminforth();
const coreStore = useCoreStore();
const filtersStore = useFiltersStore();

const route = useRoute();

const page = ref(1);
const columnsMinMax = ref({});
const sort = ref();

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
const isVirtualScrollEnabled = computed(() => coreStore.resource?.options?.listVirtualScrollEnabled || false);
const listBufferSize = computed(() => coreStore.resource?.options?.listBufferSize || 30);

const isPageLoaded = ref(false);

function clearCheckboxes() {
  checkboxes.value = [];
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

async function startBulkActionInner(actionId: string) {
  await startBulkAction(actionId, coreStore.resource!, checkboxes, bulkActionLoadingStates, getListInner);
}

async function getListInner() {
  rows.value = null; // to show loading state
  const result = await getList(coreStore.resource!, isPageLoaded.value, page.value, pageSize.value, sort.value, checkboxes, filtersStore.filters);
  if (!result) {
    return { error: 'No result returned from getList' };
  }
  rows.value = result.rows;
  totalRows.value = result.totalRows ?? 0;
  return result.error ? { error: result.error } : {};
}

class SortQuerySerializer {
    static serialize(sort: {field: string, direction: 'asc' | 'desc'}[]) {
        return sort.map(s => `${s.field}__${s.direction}`).join(',');
    }
    static deserialize(str: string) {
        return str.split(',').map(s => {
            const [field, direction] = s.split('__');
            return { field, direction };
        });
    }
}

let listAutorefresher: any = null;

function clearAutoRefresher() {
  if (listAutorefresher) {
    clearInterval(listAutorefresher);
    listAutorefresher = null;
  }
}

async function init() {
  
  await coreStore.fetchResourceFull({
    resourceId: route.params.resourceId as string
  });
  isPageLoaded.value = true;
  // !!! clear filters should be in same tick with sort assignment so that watch can catch it as one change

  // try to init filters from query params
  const filters = Object.keys(route.query).filter(k => k.startsWith('filter__')).map(k => {
    const [_, field, operator] = k.split('__');
    return {
      field,
      operator,
      value: JSON.parse((route.query[k] as string))
    }
  });
  if (filters.length) {
    filtersStore.setFilters(filters);
  } else {
    filtersStore.clearFilters();
  }

  if (route.query.sort) {
    sort.value = SortQuerySerializer.deserialize(route.query.sort as string);
  } else if (coreStore?.resource?.options?.defaultSort) {
    sort.value = [{
        field: coreStore.resource.options.defaultSort.columnName,
        direction: coreStore.resource.options.defaultSort.direction
    }];
  } else {
    sort.value = [];
  }
  // page init should be also in same tick 
  if (route.query.page) {
    page.value = parseInt(route.query.page as string);
  }

  // getList(); - Not needed here, watch will trigger it
  columnsMinMax.value = await callAdminForthApi({
    path: '/get_min_max_for_columns',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId
    }
  });

  clearAutoRefresher();
  if (coreStore.resource!.options?.listRowsAutoRefreshSeconds) {
    listAutorefresher = setInterval(async () => {
      await list.silentRefresh();
    }, coreStore.resource!.options.listRowsAutoRefreshSeconds * 1000);
  }
}

watch([page, sort, () => filtersStore.filters], async () => {
  // console.log('🔄️ page/sort/filter change fired, page:', page.value);
  await getListInner();
}, { deep: true });

list.refresh = async () => {
  const result = await getListInner();
  if (!result) {
    return {};
  }

  if ('error' in result && result.error != null) {
    return { error: String(result.error) };
  }

  return {};
};

list.silentRefresh = async () => {
  return await refreshExistingList();
}

list.silentRefreshRow = async (pk: any) => {
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
  const query:  Record<string, string | undefined> = {};
  const currentQ = currentQuery();
  filtersStore.filters.forEach(f => {
    if (f.value !== undefined && f.value !== null && f.value !== '') {
      query[`filter__${f.field}__${f.operator}`] = (JSON.stringify(f.value));
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

onUnmounted(() => {
  clearAutoRefresher();
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