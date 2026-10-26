<template>
  <div class="relative flex flex-col max-w-full w-full">
    <Teleport to="body">
      <Filters
        :columns="coreStore.resource?.columns as AdminForthResourceColumnCommon[] || []"
        :columnsMinMax="columnsMinMax" 
        :show="filtersShow"
        @hide="filtersShow = false"
        :filtersStore="filtersStore"
        :resourceId="coreStore.resource?.resourceId"
      />
    </Teleport>

    <component 
      v-if="isResourceReady"
      v-for="c in coreStore?.resourceOptions?.pageInjections?.list?.beforeBreadcrumbs as AdminForthComponentDeclaration[] || []"
      :is="getCustomComponent(formatComponent(c))"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <BreadcrumbsWithButtons>
      <template v-if="isResourceReady && beforeActionButtons.length" #filters>
        <component 
          v-for="c in beforeActionButtons"
          :is="getCustomComponent(formatComponent(c))"
          :meta="(c as AdminForthComponentDeclarationFull).meta"
          :resource="coreStore.resource"
          :adminUser="coreStore.adminUser"
          :checkboxes="checkboxes"
          :clearCheckboxes="clearCheckboxes"
        />
      </template>
      <template v-if="isResourceReady">
        <LinkButton v-if="coreStore.resource?.options?.allowedActions?.create"
          :to="{ name: 'resource-create', params: { resourceId: $route.params.resourceId } }"
          class="af-create-button h-[2.125rem] px-2.5"
        >
          <IconPlus class="w-4 h-4"/>
          <span>{{ $t('Create') }}</span>
        </LinkButton>

        <Button
          class="af-filter-button h-[2.125rem] px-2 py-3 @lg/header:px-3"
          @click="()=>{filtersShow = !filtersShow}"
          v-if="coreStore.resource?.options?.allowedActions?.filter"
          variant="secondary"
        >
          <IconListFilter class="w-4 h-4"/>
          <!-- a narrow header keeps only the icon, the label stays for screen readers -->
          <span class="sr-only @lg/header:not-sr-only">{{ $t('Filter') }}</span>
          <div v-if="filtersStore.visibleFiltersCount" class="flex items-center gap-1 ms-1">
            <span class="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[11px] font-semibold tabular-nums bg-lightPrimary text-lightPrimaryContrast dark:bg-darkPrimary dark:text-darkPrimaryContrast">
                {{ filtersStore.visibleFiltersCount }}
            </span>
          
            <div 
              @click.stop="filtersStore.clearFilters()"
              class="p-0.5 rounded text-lightInputIconColor hover:text-lightInputText hover:bg-lightButtonGroupBackgroundHover dark:text-darkInputIconColor dark:hover:text-darkInputText dark:hover:bg-darkButtonGroupBackgroundHover transition-colors"
            >
              <IconX class="w-3.5 h-3.5" />
            </div>
          </div>
        </Button>

        <ThreeDotsMenu 
          :threeDotsDropdownItems="(coreStore.resourceOptions?.pageInjections?.list?.threeDotsDropdownItems as [])"
          :bulkActions="coreStore.resource?.options?.bulkActions"
          :checkboxes="checkboxes"
          @startBulkAction="startBulkActionInner"
          :updateList="getListInner"
          :clearCheckboxes="clearCheckboxes"
          ></ThreeDotsMenu>
      </template>
    </BreadcrumbsWithButtons>

    <component 
      v-if="isResourceReady"
      v-for="c in coreStore?.resourceOptions?.pageInjections?.list?.afterBreadcrumbs as AdminForthComponentDeclaration[] || []"
      :is="getCustomComponent(formatComponent(c))"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />
    <ResourceListTable
      v-if="!coreStore.resourceColumnsError"
      :resource="listResource"
      :rows="rows"
      :page="page"
      @update:page="page = $event"
      @update:sort="sort = $event"
      @update:checkboxes="checkboxes = $event"
      @update:records="getListInner"
      @update:pageSize="(newSize) => { pageSize = newSize; page = 1; }"
      :sort="sort"
      :filters="filtersStore.filters"
      :pageSizeOptions="Array.isArray(coreStore.resource?.options?.listPageSizeOptions) ? coreStore.resource?.options?.listPageSizeOptions : []"
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
      :isVirtualScrollEnabled="isVirtualScrollEnabled"
      :hidePagination="checkboxes.length > 0"
    />

    <Transition
      enter-from-class="opacity-0 translate-y-2"
      enter-active-class="transition duration-150 ease-out"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <!--
        the bar of checked rows takes the place of the pagination, which keeps its room: changing the page drops the checked rows anyway.
        So it takes no room itself and covers no rows, over a long table it sticks to the bottom of the screen.
        All actions stay in sight: on a narrow screen they wrap between the count and Clear, and the bar grows up over the last rows
      -->
      <div v-if="isResourceReady && checkboxes.length" class="af-bulk-actions-bar-container sticky bottom-4 z-30 h-0">
        <div class="absolute inset-x-0 bottom-0 flex justify-center px-4 pointer-events-none">
          <div
            role="toolbar"
            :aria-label="$t('Bulk actions')"
            class="af-bulk-actions-bar pointer-events-auto flex items-center gap-1 max-w-full p-1 ps-3.5 rounded-lg bg-lightTooltipBackground text-lightTooltipText shadow-popover dark:bg-darkTooltipBackground dark:text-darkTooltipText dark:shadow-darkPopover"
          >
            <span class="af-bulk-actions-count shrink-0 me-1.5 text-[13px] font-medium tabular-nums whitespace-nowrap">{{ $t('{count} selected', { count: checkboxes.length }) }}</span>
            <!-- dividers take the height of the wrapped actions -->
            <span class="shrink-0 self-stretch w-px my-1 mx-1 bg-lightTooltipText/20 dark:bg-darkTooltipText/20" aria-hidden="true"></span>
            <div class="flex flex-wrap items-center gap-1">
              <Button
                v-for="action in coreStore.resource?.options?.bulkActions?.filter(a => !a.showInThreeDotsDropdown)"
                :key="action.id"
                @click="startBulkActionInner(action.id!)"
                :loader="bulkActionLoadingStates[action.id!]"
                variant="ghost"
                size="sm"
                class="af-bulk-action-button"
                :class="[BULK_BAR_BUTTON_CLASSES, action.dangerous && BULK_BAR_DANGER_CLASSES, action.buttonCustomCssClass]"
              >
                <component v-if="action.icon && !bulkActionLoadingStates[action.id!]" :is="getIcon(action.icon)" class="w-4 h-4" />
                {{ action.label }}
                <span v-if="action.badge" class="inline-flex items-center h-[1.125rem] px-1.5 rounded-full text-[11px] font-semibold bg-lightPrimary text-lightPrimaryContrast dark:bg-darkPrimary dark:text-darkPrimaryContrast">
                  {{ action.badge }}
                </span>
              </Button>
              <Button
                v-for="action in coreStore.resource?.options?.actions?.filter(a => a.showIn?.bulkButton)"
                :key="action.id"
                @click="startCustomBulkActionInner(action.id!)"
                :loader="customActionLoadingStates[action.id!]"
                variant="ghost"
                size="sm"
                class="af-bulk-action-button"
                :class="[BULK_BAR_BUTTON_CLASSES, action.bulkDangerous && BULK_BAR_DANGER_CLASSES]"
              >
                <component v-if="action.icon && !customActionLoadingStates[action.id!]" :is="getIcon(action.icon)" class="w-4 h-4" />
                {{ action.name }}
              </Button>
            </div>
            <span class="shrink-0 self-stretch w-px my-1 mx-1 bg-lightTooltipText/20 dark:bg-darkTooltipText/20" aria-hidden="true"></span>
            <Button
              @click="clearCheckboxes"
              variant="ghost"
              size="sm"
              class="af-bulk-actions-clear-button shrink-0"
              :class="BULK_BAR_BUTTON_CLASSES"
            >
              <IconX class="w-4 h-4" />
              {{ $t('Clear') }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.list?.bottom as AdminForthComponentDeclaration[] || []"
      :is="getCustomComponent(formatComponent(c))"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

  </div>
</template>

<script setup lang="ts">
import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';
import ResourceListTable from '@/components/ResourceListTable.vue';
import { useCoreStore } from '@/stores/core';
import { encodeRecordId, isCompositePrimaryKey, recordIdFilters } from '@/utils/recordId';
import { useFiltersStore } from '@/stores/filters';
import { callAdminForthApi, currentQuery, getIcon, setQuery, formatComponent, executeCustomBulkAction } from '@/utils';
import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { getCustomComponent, getList, startBulkAction, lsKey } from '@/utils';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import { Button, LinkButton } from '@/afcl'
import type { AdminForthComponentDeclaration, AdminForthComponentDeclarationFull, AdminForthFilterOperators, AdminForthResourceColumnCommon } from '@/types/Common';
import { useI18n } from 'vue-i18n';

import {
  IconListFilter,
  IconPlus,
  IconX
} from '@iconify-prerendered/vue-lucide';

import Filters from '@/components/Filters.vue';
import { useAdminforth } from '@/adminforth';

const filtersShow = ref(false);
const { list, alert } = useAdminforth();
const coreStore = useCoreStore();
const filtersStore = useFiltersStore();
const { t } = useI18n();

const route = useRoute();

// previous resource stays in the store until the new one is applied, its injections must not render here
const isResourceReady = computed(() => coreStore.resource?.resourceId === route.params.resourceId);
const beforeActionButtons = computed(() => (coreStore.resourceOptions?.pageInjections?.list?.beforeActionButtons || []) as AdminForthComponentDeclaration[]);

// ghost buttons on the bar of checked rows take its text color, the bar is dark in the light theme and light in the dark one
const BULK_BAR_BUTTON_CLASSES = 'text-lightTooltipText hover:bg-lightTooltipText/10 hover:text-lightTooltipText dark:text-darkTooltipText dark:hover:bg-darkTooltipText/10 dark:hover:text-darkTooltipText';
// so a destructive action on it takes the danger color of the opposite theme
const BULK_BAR_DANGER_CLASSES = 'text-darkDanger hover:text-darkDanger dark:text-lightDanger dark:hover:text-lightDanger';

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
const customActionLoadingStates = ref<{[key: string]: boolean}>({});

const DEFAULT_PAGE_SIZE = 10;


const pageSize = ref(DEFAULT_PAGE_SIZE);

const syncPageSize = () => {
  const resourceId = route.params.resourceId;
  const savedSize = localStorage.getItem(lsKey(`pageSize_${resourceId}`));

  if (savedSize) {
    pageSize.value = parseInt(savedSize);
  } 
  else if (coreStore.resource?.options?.listPageSize) {
    pageSize.value = coreStore.resource.options.listPageSize;
  } 
  else {
    pageSize.value = DEFAULT_PAGE_SIZE;
  }
};

// store keeps previous resource until /get_resource for this route resolves, table shows skeleton meanwhile
const listResource = computed(() => coreStore.resource?.resourceId === route.params.resourceId ? coreStore.resource : null);

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
        isCompositePrimaryKey(coreStore.resource!)
          ? {
              operator: 'or',
              subFilters: pks.map((rowPk: any) => ({
                operator: 'and',
                subFilters: recordIdFilters(coreStore.resource!, rowPk),
              })),
            }
          : {
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
    const rowPk = isCompositePrimaryKey(coreStore.resource!)
      ? (row._primaryKeyValue ?? encodeRecordId(coreStore.resource!, row))
      : row[coreStore.resource!.columns.find(c => c.primaryKey)!.name];

    const existingRow = currentData.find(r => r._primaryKeyValue === rowPk);
    if (existingRow) {
      Object.assign(existingRow, row);
    }
  });
  return {}
}

async function startBulkActionInner(actionId: string) {
  await startBulkAction(actionId, coreStore.resource!, checkboxes, bulkActionLoadingStates, getListInner, t);
}

async function startCustomBulkActionInner(actionId: string | number) {
  const action = coreStore.resource?.options?.actions?.find(a => a.id === actionId);
  
  await executeCustomBulkAction({
    actionId,
    resourceId: route.params.resourceId as string,
    recordIds: checkboxes.value,
    confirmMessage: action?.bulkConfirmationMessage,
    confirmDangerous: action?.bulkDangerous ?? false,
    resource: coreStore.resource!,
    setLoadingState: (loading: boolean) => {
      customActionLoadingStates.value[actionId] = loading;
    },
    onSuccess: async (results: any[]) => {
      checkboxes.value = [];
      await getListInner();

      const successResults = results.filter(r => r?.successMessage);
      if (successResults.length > 0) {
        alert({
          message: action?.bulkSuccessMessage ? action.bulkSuccessMessage : action?.bulkHandler ? successResults[0].successMessage : `${successResults.length} out of ${results.length} items processed successfully`,
          variant: 'success'
        });
      }
    },
    onError: (error: string) => {
      alert({
        message: error,
        variant: 'danger'
      });
    }
  });
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

  syncPageSize();

  isPageLoaded.value = true;
  // !!! clear filters should be in same tick with sort assignment so that watch can catch it as one change

  // try to init filters from query params
  const filters = Object.keys(route.query).filter(k => k.startsWith('filter__')).map(k => {
    const [_, field, operator] = k.split('__');
    return {
      field,
      operator: operator as AdminForthFilterOperators,
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

watch([page, sort, pageSize, () => filtersStore.filters], async () => {
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