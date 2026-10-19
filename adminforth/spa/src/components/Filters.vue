<template>
  <!-- drawer component -->
  <div id="drawer-navigation" 
  
      class="af-filters-sidebar fixed right-0 z-50 p-5 overflow-y-auto transition-transform translate-x-full bg-lightFiltersBackgroung w-[22rem] max-w-full border-l border-lightUserMenuBorder dark:border-darkUserMenuBorder dark:bg-darkFiltersBackgroung shadow-popover dark:shadow-darkPopover"

      :class="show ? 'top-0 transform-none' : ''"
      tabindex="-1" aria-labelledby="drawer-navigation-label"
      :style="{ height: `calc(100dvh ` }"
  >
    <h5 id="drawer-navigation-label" class="text-base font-semibold leading-8 text-lightFiltersHeaderText dark:text-darkFiltersHeaderText">
      {{ $t('Filters') }}

      <button type="button" @click="$emit('hide')" class="text-lightFiltersCloseIcon bg-transparent hover:bg-lightFiltersCloseIconHoverBackground hover:text-lightFiltersCloseIconHover rounded-default text-sm p-1.5 absolute end-4 top-5 inline-flex items-center dark:text-darkFiltersCloseIcon dark:hover:bg-darkFiltersCloseIconHoverBackground dark:hover:text-darkFiltersCloseIconHover" >
        <IconX aria-hidden="true" class="w-4 h-4" />
        <span class="sr-only">{{ $t('Close menu') }}</span>
      </button>
    </h5>
   
    <div class="py-4 ">
      <ul class="space-y-5 text-sm">
         <li v-for="c in columnsWithFilter" :key="c.name">
            <div class="flex flex-col">
              <div class="flex justify-between items-center">
                <p class="my-1 text-[13px] font-medium text-lightFiltersHeaderText dark:text-darkFiltersHeaderText">{{ c.label }}</p>
                <Tooltip v-if="filtersStore.filters.find(f => f.field === c.name)">
                <button 
                  class=" flex items-center justify-center w-6 h-6 my-0.5 rounded-default text-lightFiltersCloseIcon hover:text-lightFiltersCloseIconHover hover:bg-lightFiltersCloseIconHoverBackground dark:text-darkFiltersCloseIcon dark:hover:text-darkFiltersCloseIconHover dark:hover:bg-darkFiltersCloseIconHoverBackground"
                  :disabled="!filtersStore.filters.find(f => f.field === c.name)"
                  @click="filtersStore.clearFilter(c.name);"
                > 
                  <IconX class="w-3.5 h-3.5" /> 
                </button>
                <template #tooltip>
                  Clear filter
                </template>
                </Tooltip> 
              </div>
              <component
                v-if="c.components?.filter"
                :is="getCustomComponent(formatComponent(c.components.filter))"
                :meta="formatComponent(c.components.filter)?.meta"
                :column="c"
                class="w-full"
                @update:modelValue="(filtersArray:FilterParams[] ) => {
                  filtersStore.filters = filtersStore.filters.filter(f => f.field !== c.name);

                  for (const f of filtersArray) {
                    filtersStore.filters.push({ ...f, field: c.name });
                  }
                  console.log('filtersStore.filters', filtersStore.filters);
                  emits('update:filters', [...filtersStore.filters]);
                }"
                :modelValue="filtersStore.filters.filter(f => f.field === c.name)"
              />
              <Select
                v-else-if="c.foreignResource"
                :multiple="c?.filterOptions?.multiselect"
                class="w-full"
                :options="columnOptions[c.name] || []"
                :searchDisabled="!c.foreignResource.searchableFields"
                @scroll-near-end="loadMoreOptions(c.name)"
                @search="(searchTerm) => {
                  if (c.foreignResource?.searchableFields && onSearchInput[c.name]) {
                    onSearchInput[c.name](searchTerm);
                  }
                }"
                @update:modelValue="onFilterInput[c.name]({ column: c, operator: c.filterOptions?.multiselect ? AFFO.IN : AFFO.EQ, value: c.filterOptions?.multiselect ? ($event.length ? $event : undefined) : $event || undefined })"
                :modelValue="filtersStore.filters.find(f => f.field === c.name && f.operator === (c.filterOptions?.multiselect ? AFFO.IN : AFFO.EQ))?.value || (c.filterOptions?.multiselect ? [] : '')"
              >
                <template #extra-item v-if="columnLoadingState[c.name]?.loading">
                  <div class="text-center text-lightDropdownButtonsPlaceholderText dark:text-darkDropdownButtonsPlaceholderText py-2 flex items-center justify-center gap-2">
                    <Spinner class="w-4 h-4" />
                    {{ $t('Loading...') }}
                  </div>
                </template>
              </Select>
              <Select
                :multiple="c.filterOptions?.multiselect"
                class="w-full"
                v-else-if="c.type === 'boolean'"
                :options="[
                  { label: $t('Yes'), value: true }, 
                  { label: $t('No'), value: false }, 
                  // if field is not required, undefined might be there, and user might want to filter by it
                  ...(c.required ? [] : [ { label: $t('Unset'), value: undefined } ])
                ]"
                @update:modelValue="onFilterInput[c.name]({ column: c, operator: c.filterOptions?.multiselect ? AFFO.IN : AFFO.EQ, value: c.filterOptions?.multiselect ? ($event.length ? $event : undefined) : $event })"
                :modelValue="filtersStore.filters.find(f => f.field === c.name && f.operator === (c.filterOptions?.multiselect ? AFFO.IN : AFFO.EQ))?.value !== undefined
                  ? filtersStore.filters.find(f => f.field === c.name && f.operator === (c.filterOptions?.multiselect ? AFFO.IN : AFFO.EQ))?.value
                  : (c.filterOptions?.multiselect ? [] : '')"
              />
              
              <Select
                :multiple="c.filterOptions?.multiselect"
                class="w-full"
                v-else-if="c.enum"
                :options="c.enum"
                @update:modelValue="onFilterInput[c.name]({ column: c, operator: c.filterOptions?.multiselect ? AFFO.IN : AFFO.EQ, value: c.filterOptions?.multiselect ? ($event.length ? $event : undefined) : $event || undefined })"
                :modelValue="filtersStore.filters.find(f => f.field === c.name && f.operator === (c.filterOptions?.multiselect ? AFFO.IN : AFFO.EQ))?.value || (c.filterOptions?.multiselect ? [] : '')"
              />

              <Input
                v-else-if="['string', 'text', 'json', 'richtext', 'unknown'].includes(c.type ?? '')"
                type="text"
                full-width
                :placeholder="$t('Search')"
                @update:modelValue="onFilterInput[c.name]({ column: c, operator: c.filterOptions?.substringSearch ? AFFO.ILIKE : AFFO.EQ, value: $event || undefined })"
                :modelValue="(getFilterItem({ column: c, operator: c.filterOptions?.substringSearch ? AFFO.ILIKE : AFFO.EQ }) as string | number)"
              />

              <CustomDateRangePicker
                v-else-if="['datetime', 'date', 'time'].includes(c.type ?? '')"
                :column="c"
                :valueStart="filtersStore.filters.find(f => f.field === c.name && f.operator === AFFO.GTE)?.value || undefined"
                @update:valueStart="onFilterInput[c.name]({ column: c, operator: AFFO.GTE, value: $event || undefined })"
                :valueEnd="filtersStore.filters.find(f => f.field === c.name && f.operator === AFFO.LTE)?.value || undefined"
                @update:valueEnd="onFilterInput[c.name]({ column: c, operator: AFFO.LTE, value: $event || undefined })"
              />

              <CustomRangePicker
                v-else-if="['integer', 'decimal', 'float'].includes(c.type ?? '') && c.allowMinMaxQuery"
                :min="getFilterMinValue(c.name)"
                :max="getFilterMaxValue(c.name)"
                :valueStart="(getFilterItem({ column: c, operator: AFFO.GTE }) as number)"
                @update:valueStart="(val) => rangeChangeHandler((val !== '' && val !== null) ? (c.type === 'decimal' ? String(val) : val) : undefined, c, AFFO.GTE)"
                :valueEnd="(getFilterItem({ column: c, operator: AFFO.LTE }) as number)"
                @update:valueEnd="(val) => rangeChangeHandler((val !== '' && val !== null) ? (c.type === 'decimal' ? String(val) : val) : undefined, c, AFFO.LTE)"
              />

              <div v-else-if="['integer', 'decimal', 'float'].includes(c.type ?? '')" class="flex gap-2">
                <Input
                  type="number"
                  aria-describedby="helper-text-explanation"
                  :placeholder="$t('From')"
                  @update:modelValue="onFilterInput[c.name]({ column: c, operator: AFFO.GTE, value: ($event !== '' && $event !== null) ? (c.type === 'decimal' ? String($event) : $event) : undefined })"
                  :modelValue="(getFilterItem({ column: c, operator: AFFO.GTE }) as number)"
                />
                <Input
                  type="number"
                  aria-describedby="helper-text-explanation"
                  :placeholder="$t('To')"
                  @update:modelValue="onFilterInput[c.name]({ column: c, operator: AFFO.LTE, value: ($event !== '' && $event !== null) ? (c.type === 'decimal' ? String($event) : $event) : undefined })"
                  :modelValue="(getFilterItem({ column: c, operator: AFFO.LTE }) as number)"
                />
              </div>
            </div>
         </li>
      </ul>
   </div>

   <div class="flex justify-end gap-2">
      <button 
        :disabled="!filtersStore.visibleFiltersCount"
        type="button" 
        class="flex gap-1.5 items-center h-[2.125rem] px-3 text-sm font-medium text-lightFiltersClearAllButtonText shadow-customLight focus:outline-none bg-lightFiltersClearAllButtonBackground rounded-default border border-lightFiltersClearAllButtonBorder hover:bg-lightFiltersClearAllButtonBackgroundHover hover:text-lightFiltersClearAllButtonTextHover focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-lightFiltersClearAllButtonFocus dark:focus-visible:ring-darkFiltersClearAllButtonFocus dark:bg-darkFiltersClearAllButtonBackground dark:text-darkFiltersClearAllButtonText dark:border-darkFiltersClearAllButtonBorder dark:hover:text-darkFiltersClearAllButtonTextHover dark:hover:bg-darkFiltersClearAllButtonBackgroundHover disabled:opacity-50 disabled:cursor-not-allowed"
        @click="clear"><IconX class="w-4 h-4"/> {{ $t('Clear all') }}</button>

   </div>
  </div>

  <div v-if="show"  class="bg-lightScrim dark:bg-darkScrim fixed inset-0  z-40"
    @click="$emit('hide')">
  </div>
</template>

<script setup lang="ts">
import { watch, computed, ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import CustomDateRangePicker from '@/components/CustomDateRangePicker.vue';
import { loadMoreForeignOptions, searchForeignOptions, createSearchInputHandlers, formatComponent } from '@/utils';
import { useRouter } from 'vue-router';
import CustomRangePicker from "@/components/CustomRangePicker.vue";
import { getCustomComponent } from '@/utils';
import Input from '@/afcl/Input.vue';
import Select from '@/afcl/Select.vue';
import Spinner from '@/afcl/Spinner.vue';
import debounce from 'debounce';
import { Tooltip } from '@/afcl';
import { IconX } from '@iconify-prerendered/vue-lucide';
import type { AdminforthFilterStore, AdminforthFilterStoreUnwrapped } from '@/spa_types/core';
import type { AdminForthResourceColumnCommon, FilterParams, ColumnMinMaxValue } from '@/types/Common';
import { AdminForthFilterOperators } from '@/types/Common';


const { t } = useI18n();

const AFFO = AdminForthFilterOperators;

// props: columns
// add support for v-model:filers
// const props = defineProps(['columns', 'filters', 'show', 'columnsMinMax']);
const props = defineProps<{
  columns: AdminForthResourceColumnCommon[],
  filters?: AdminforthFilterStore['filters'],
  show: Boolean,
  columnsMinMax: ColumnMinMaxValue,
  resourceId?: string,
  filtersStore: AdminforthFilterStoreUnwrapped
}>();

const emits = defineEmits(['update:filters', 'hide']);

const router = useRouter();


const columnsWithFilter = computed(
  () => props.columns?.filter(column => column.showIn?.filter) || []
);

const columnOptions = ref<{[key: string]: Record<string, any>[]}>({});
const columnLoadingState = reactive<Record<string, { loading: boolean; hasMore: boolean }>>({});
const columnOffsets = reactive<Record<string, number>>({});
const columnEmptyResultsCount = reactive<Record<string, number>>({});

watch(() => props.columns, async (newColumns) => {
  if (!newColumns) return;
  
  for (const column of newColumns) {
    if (column.foreignResource) {
      if (!columnOptions.value[column.name]) {
        columnOptions.value[column.name] = [];
        columnLoadingState[column.name] = { loading: false, hasMore: true };
        columnOffsets[column.name] = 0;
        columnEmptyResultsCount[column.name] = 0;
        
        await loadMoreOptions(column.name);
      }
    }
  }
}, { immediate: true });

// Function to load more options for a specific column
async function loadMoreOptions(columnName: string, searchTerm = '') {
  return loadMoreForeignOptions({
    columnName,
    searchTerm,
    columns: props.columns,
    resourceId: props.resourceId ?? router.currentRoute.value.params.resourceId as string,
    columnOptions,
    columnLoadingState,
    columnOffsets,
    columnEmptyResultsCount
  });
}

async function searchOptions(columnName: string, searchTerm: string) {
  return searchForeignOptions({
    columnName,
    searchTerm,
    columns: props.columns,
    resourceId: router.currentRoute.value.params.resourceId as string,
    columnOptions,
    columnLoadingState,
    columnOffsets,
    columnEmptyResultsCount
  });
}


// sync 'body' class 'overflow-hidden' with show prop show
watch(() => props.show, (show) => {
  if (show) {
    document.body.classList.add('overflow-hidden');
  } else {
    document.body.classList.remove('overflow-hidden');
  }
});

// filters is a array of objects
// {
//   field: 'name',
//   value: 'John',
//   operator: 'like'
// }

const onFilterInput = computed(() => {
  if (!props.columns) return {} as Record<string, any>;

  return props.columns.reduce<Record<string, (item: Parameters<typeof setFilterItem>[0]) => void>>((acc, c) => {
    // a debounce per operator: both ends of a date range set within the debounce time must not drop the first one
    const byOperator: Partial<Record<AdminForthFilterOperators, ReturnType<typeof debounce>>> = {};
    return {
      ...acc,
      [c.name]: (item: Parameters<typeof setFilterItem>[0]) => {
        byOperator[item.operator] ??= debounce(setFilterItem, c.filterOptions?.debounceTimeMs || 10);
        byOperator[item.operator]!(item);
      },
    };
  }, {});
});

// rangeState is used for cutom range picker, because if we change two values very quickly
// in filters writes only the last one, because of debounce
const rangeState = reactive<Record<string, { gte: number | null; lte: number | null }>>({});

const updateRange = (column: AdminForthResourceColumnCommon) => {
  debounce(() => {
    const { gte, lte } = rangeState[column.name];

    setFilterItem({ column, operator: AFFO.GTE, value: gte });
    setFilterItem({ column, operator: AFFO.LTE, value: lte });
  }, column?.filterOptions?.debounceTimeMs || 10)();
}

function rangeChangeHandler(value: number | null, column: AdminForthResourceColumnCommon, operator: 'gte' | 'lte') {
  if (!rangeState[column.name]) {
    rangeState[column.name] = { gte: null, lte: null };
  }
  rangeState[column.name][operator] = value;
  updateRange(column);
}

const onSearchInput = computed(() => {
  return createSearchInputHandlers(
    props.columns,
    searchOptions,
    (column) => column.filterOptions?.debounceTimeMs || 300
  );
});

function setFilterItem({ column, operator, value }: { column: AdminForthResourceColumnCommon; operator: AdminForthFilterOperators; value: any }) {

  const index = props.filtersStore.filters.findIndex(f => f.field === column.name && f.operator === operator);
  if (value === undefined || value === '' || value === null) {
    if (index !== -1) {
      props.filtersStore.filters.splice(index, 1);
    }
  } else {
    if (index === -1) {
      props.filtersStore.setFilter({ field: column.name, value, operator });
    } else {
      props.filtersStore.setFilters([...props.filtersStore.filters.slice(0, index), { field: column.name, value, operator }, ...props.filtersStore.filters.slice(index + 1)])
    }
  }
  emits('update:filters', [...props.filtersStore.filters]);
}

function getFilterItem({ column, operator }: { column: AdminForthResourceColumnCommon; operator: AdminForthFilterOperators }) {
  const filterValue = props.filtersStore.filters.find(f => f.field === column.name && f.operator === operator)?.value;
  return filterValue !== undefined ? filterValue : '';
}

async function clear() {
  props.filtersStore.filters = [...props.filtersStore.filters.filter(f => props.filtersStore.shouldFilterBeHidden(f.field))];
  emits('update:filters', [...props.filtersStore.filters]);
}

function getFilterMinValue(columnName: string) {
  if(props.columnsMinMax && props.columnsMinMax[columnName]) {
    return props.columnsMinMax[columnName]?.min
  }
}

function getFilterMaxValue(columnName: string) {
  if(props.columnsMinMax && props.columnsMinMax[columnName]) {
    return props.columnsMinMax[columnName]?.max
  }
}
</script>