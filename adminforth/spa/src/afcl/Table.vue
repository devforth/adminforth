<template>
  <div class="afcl-table-container relative overflow-x-auto overflow-y-auto shadow-md rounded-lg">
      <table class="afcl-table w-full text-sm text-left rtl:text-right text-lightTableText dark:text-darkTableText overflow-x-auto">
          <thead class="afcl-table-thread z-40 text-xs text-lightTableHeadingText uppercase bg-lightTableHeadingBackground dark:bg-darkTableHeadingBackground dark:text-darkTableHeadingText" :class="makeHeaderSticky ? 'sticky top-0' : ''">
            <tr>
              <th
                scope="col"
                class="px-6 py-3"
                ref="headerRefs"
                :key="`header-${column.fieldName}`"
                v-for="column in columns"
                :aria-sort="getAriaSort(column)"
                :class="{ 'cursor-pointer select-none afcl-table-header-sortable': isColumnSortable(column) }"
                @click="onHeaderClick(column)"
              >
                <slot v-if="$slots[`header:${column.fieldName}`]" :name="`header:${column.fieldName}`" :column="column" />

                <span v-else class="inline-flex items-center">
                  {{ column.label }}
                  <span v-if="isColumnSortable(column)" class="text-lightTableHeadingText dark:text-darkTableHeadingText">
                    <!-- Unsorted -->
                    <svg v-if="currentSortField !== column.fieldName" class="w-3 h-3 ms-1.5 opacity-30" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z"/></svg>

                    <!-- Sorted ascending -->
                    <svg v-else-if="currentSortDirection === 'asc'" class="w-3 h-3 ms-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 0z"/></svg>

                    <!-- Sorted descending -->
                    <svg v-else class="w-3 h-3 ms-1.5 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 0z"/></svg>
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <SkeleteLoader 
              v-if="isLoading || props.isLoading" 
              :rows="pageSize" 
              :columns="columns.length" 
              :row-heights="rowHeights"
              :column-widths="columnWidths"
            />
            <tr v-else-if="!isLoading && !props.isLoading && dataPage.length === 0" class="afcl-table-empty-body">
              <td :colspan="columns.length" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center justify-center text-lightTableText dark:text-darkTableText">
                  <IconTableRowOutline class="w-10 h-10 mb-4 text-gray-400 dark:text-gray-500" />
                  <p class="text-md">{{ $t('No data available') }}</p>
                </div>
              </td>
            </tr>
            <tr
              v-else="!isLoading && !props.isLoading"
              v-for="(item, index) in dataPage"
              :key="`row-${index}`"
              ref="rowRefs"
              :class="{
                'afcl-table-body odd:bg-lightTableOddBackground odd:dark:bg-darkTableOddBackground even:bg-lightTableEvenBackground even:dark:bg-darkTableEvenBackground': evenHighlights,
                'border-b border-lightTableBorder dark:border-darkTableBorder': index !== dataPage.length - 1 || totalPages > 1,
              }"
              @click="tableRowClick(item)"
            >
              <td class="px-6 py-4" :key="`cell-${index}-${column.fieldName}`"
                v-for="column in props.columns"
              >
                <slot v-if="$slots[`cell:${column.fieldName}`]" 
                  :name="`cell:${column.fieldName}`" 
                  :item="item" :column="column"
                >
                </slot>
                <span v-else-if="!isLoading || props.isLoading" >
                  {{ item[column.fieldName] }}
                </span>
                <div v-else>
                  <div class=" w-full">
                    <Skeleton class="h-4" />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
      </table>
    <nav class="afcl-table-pagination-container bg-lightTableBackground dark:bg-darkTableBackground pt-2 flex flex-col gap-2 items-center sm:flex-row justify-center sm:justify-between px-4 pb-4" 
      v-if="totalPages > 1"
      :aria-label="$t('Table navigation')"
      :class="makePaginationSticky ? 'sticky bottom-0 pt-4' : ''"
    >
    <i18n-t 
      keypath="Showing {from} to {to} of {total}" tag="span" class="afcl-table-pagination-text text-sm font-normal text-center text-lightTablePaginationText dark:text-darkTablePaginationText sm:mb-4 md:mb-0 block w-full md:inline md:w-auto"
    >
      <template #from><span class="font-semibold text-lightTablePaginationNumeration dark:text-darkTablePaginationNumeration">{{ Math.min((currentPage - 1) * props.pageSize + 1, dataResult.total) }}</span></template>
      <template #to><span class="font-semibold text-lightTablePaginationNumeration dark:text-darkTablePaginationNumeration">{{ Math.min(currentPage * props.pageSize, dataResult.total) }}</span></template>
      <template #total><span class="font-semibold text-lightTablePaginationNumeration dark:text-darkTablePaginationNumeration">{{ dataResult.total }}</span></template>
    </i18n-t>
    <div class="af-pagination-container flex flex-row items-center xs:flex-row xs:justify-between xs:items-center gap-3">
      <div class="inline-flex" :class="isLoading || props.isLoading ? 'pointer-events-none select-none opacity-50' : ''">
          <!-- Buttons -->
          <button
            class="flex items-center py-1 px-3 gap-1 text-sm font-medium text-lightActivePaginationButtonText bg-lightActivePaginationButtonBackground border-r-0 rounded-s hover:opacity-90 dark:bg-darkActivePaginationButtonBackground dark:text-darkActivePaginationButtonText disabled:opacity-50"
            @click="currentPage--; pageInput = currentPage.toString();" 
            :disabled="currentPage <= 1 || isLoading || props.isLoading">
            <svg class="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 5H1m0 0 4 4M1 5l4-4"/>
            </svg>
          </button>
          <button
            class="flex items-center py-1 px-3 text-sm font-medium text-lightUnactivePaginationButtonText focus:outline-none bg-lightUnactivePaginationButtonBackground border-r-0  border border-lightUnactivePaginationButtonBorder hover:bg-lightUnactivePaginationButtonHoverBackground hover:text-lightUnactivePaginationButtonHoverText dark:bg-darkUnactivePaginationButtonBackground dark:text-darkUnactivePaginationButtonText dark:border-darkUnactivePaginationButtonBorder dark:hover:text-darkUnactivePaginationButtonHoverText dark:hover:bg-darkUnactivePaginationButtonHoverBackground disabled:opacity-50"
            @click="switchPage(1); pageInput = currentPage.toString();" 
            :disabled="currentPage <= 1 || isLoading || props.isLoading">
            <!-- <IconChevronDoubleLeftOutline class="w-4 h-4" /> -->
            1
          </button>
          <input
            type="text"
            v-model="pageInput"
            :style="{ width: `${Math.max(1, pageInput.length+4)}ch` }"
            class="min-w-10 outline-none inline-block w-auto py-1.5 px-3 text-sm text-center text-lightTablePaginationInputText border border-lightTablePaginationInputBorder bg-lightTablePaginationInputBackground dark:border-darkTablePaginationInputBorder dark:text-darkTablePaginationInputText dark:bg-darkTablePaginationInputBackground z-10"
            @keydown="onPageKeydown($event)"
            @blur="validatePageInput()"
          >
          </input>

          <button
            class="flex items-center py-1 px-3 text-sm font-medium text-lightUnactivePaginationButtonText focus:outline-none bg-lightUnactivePaginationButtonBackground border-l-0  border border-lightUnactivePaginationButtonBorder hover:bg-lightUnactivePaginationButtonHoverBackground hover:text-lightUnactivePaginationButtonHoverText dark:bg-darkUnactivePaginationButtonBackground dark:text-darkUnactivePaginationButtonText dark:border-darkUnactivePaginationButtonBorder dark:hover:text-darkUnactivePaginationButtonHoverText dark:hover:bg-darkUnactivePaginationButtonHoverBackground disabled:opacity-50"
            @click="currentPage = totalPages; pageInput = currentPage.toString();" 
            :disabled="currentPage >= totalPages || isLoading || props.isLoading"
          >
            {{ totalPages }}

          </button>
          <button
            class="flex items-center py-1 px-3 gap-1 text-sm font-medium text-lightActivePaginationButtonText focus:outline-none bg-lightActivePaginationButtonBackground border-l-0 rounded-e hover:opacity-90 dark:bg-darkActivePaginationButtonBackground dark:text-darkActivePaginationButtonText disabled:opacity-50"
            @click="currentPage++; pageInput = currentPage.toString();" 
            :disabled="currentPage >= totalPages || isLoading || props.isLoading"
          >
            <svg class="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, useTemplateRef, watch, onMounted } from 'vue';
  import SkeleteLoader from '@/components/SkeleteLoader.vue';
  import { IconTableRowOutline } from '@iconify-prerendered/vue-flowbite';

  defineExpose({
    refreshTable
  })

  const props = withDefaults(
    defineProps<{
      columns: {
        label: string,
        fieldName: string,
        sortable?: boolean,
      }[],
      data: {
        [key: string]: any,
      }[] | ((params: { offset: number, limit: number, sortField?: string, sortDirection?: 'asc' | 'desc' }) => Promise<{data: {[key: string]: any}[], total: number}>),
      evenHighlights?: boolean,
      pageSize?: number,
      isLoading?: boolean,
      defaultSortField?: string,
      defaultSortDirection?: 'asc' | 'desc',
      makeHeaderSticky?: boolean,
      makePaginationSticky?: boolean,
    }>(), {
      evenHighlights: true,
      pageSize: 5,
    }
  );

  const pageInput = ref('1');
  const rowRefs = useTemplateRef<HTMLElement[]>('rowRefs');
  const headerRefs = useTemplateRef<HTMLElement[]>('headerRefs');
  const rowHeights = ref<number[]>([]);
  const columnWidths = ref<number[]>([]);
  const currentPage = ref(1);
  const isLoading = ref(false);
  const dataResult = ref<{data: {[key: string]: any}[], total: number}>({data: [], total: 0});
  const isAtLeastOneLoading = ref<boolean[]>([false]);
  const currentSortField = ref<string | undefined>(props.defaultSortField);
  const currentSortDirection = ref<'asc' | 'desc'>(props.defaultSortDirection ?? 'asc');

  onMounted(() => {
    // If defaultSortField points to a non-sortable column, ignore it
    if (currentSortField.value) {
      const col = props.columns?.find(c => c.fieldName === currentSortField.value);
      if (!col || !isColumnSortable(col)) {
        currentSortField.value = undefined;
      }
    }
    refresh();
  });

  watch([currentPage, () => props.data], async () => {
    refresh();
  });

  watch(() => currentPage.value, () => {
    rowHeights.value = !rowRefs.value ? [] : rowRefs.value.map((el: HTMLElement) => el.offsetHeight);
    columnWidths.value = !headerRefs.value ? [] : headerRefs.value.map((el: HTMLElement) => el.offsetWidth);
  });

  watch([isLoading, () => props.isLoading], () => {
    emit('update:tableLoading', isLoading.value || props.isLoading);
  });

  watch([() => currentSortField.value, () => currentSortDirection.value], () => {
    const needsPageReset = currentPage.value !== 1;
    if (needsPageReset) {
      currentPage.value = 1;
    } else {
      refresh();
    }
    emit('update:sortField', currentSortField.value);
    emit('update:sortDirection', currentSortField.value ? currentSortDirection.value : undefined);
    const field = currentSortField.value ?? null;
    const direction = currentSortField.value ? currentSortDirection.value : null;
    emit('sort-change', { field, direction });
  }, { immediate: false });

  const totalPages = computed(() => {
    return dataResult.value?.total ? Math.ceil(dataResult.value.total / props.pageSize) : 1;
  });

  const dataPage = computed(() => {
    return dataResult.value?.data;
  });

  function switchPage(p: number) {
    currentPage.value = p;
    pageInput.value = p.toString();
  }

  const emit = defineEmits([
    'update:tableLoading',
    'update:sortField',
    'update:sortDirection',
    'sort-change',
    'clickTableRow'
  ]);

  function validatePageInput() {
    const newPage = parseInt(pageInput.value) || 1;
    const validPage = Math.max(1, Math.min(newPage, totalPages.value));
    currentPage.value = validPage;
    pageInput.value = validPage.toString();
  }

  watch(() => currentPage.value, (newPage) => {
    pageInput.value = newPage.toString();
  });

  async function onPageKeydown(event: any) {
    // page input should accept only numbers, arrow keys and backspace
    if (['Enter', 'Space'].includes(event.code) ||
      (!['Backspace', 'ArrowRight', 'ArrowLeft'].includes(event.code)
      && isNaN(Number(String.fromCharCode(event.keyCode || 0))))) {
      event.preventDefault();
      if (event.code === 'Enter') {
        validatePageInput();
        event.target.blur();
      }
    }
  }

  async function refresh() {
    if (typeof props.data === 'function') {
      isLoading.value = true;
      const currentLoadingIndex = currentPage.value;
      isAtLeastOneLoading.value[currentLoadingIndex] = true;
      const result = await props.data({
        offset: (currentLoadingIndex - 1) * props.pageSize,
        limit: props.pageSize,
        sortField: currentSortField.value,
        ...(currentSortField.value ? { sortDirection: currentSortDirection.value } : {}),
      });
      isAtLeastOneLoading.value[currentLoadingIndex] = false;
      if (isAtLeastOneLoading.value.every(v => v === false)) {
        isLoading.value = false;
      }
      dataResult.value = result;
    } else if (typeof props.data === 'object' && Array.isArray(props.data)) {
      const start = (currentPage.value - 1) * props.pageSize;
      const end = start + props.pageSize;
      const total = props.data.length;
      const sorted = sortArrayData(props.data, currentSortField.value, currentSortDirection.value);
      dataResult.value = { data: sorted.slice(start, end), total };
    }
  }

  function refreshTable() {
    if ( currentPage.value !== 1 ) {
      currentPage.value = 1;
    } else {
      refresh();
    }
  }

function isColumnSortable(col:{fieldName:string; sortable?:boolean}) {
  // Sorting is controlled per column; default is NOT sortable. Enable with `sortable: true`.
  return col.sortable === true;
}

function onHeaderClick(col:{fieldName:string; sortable?:boolean}) {
  if (!isColumnSortable(col)) return;
  if (currentSortField.value !== col.fieldName) {
    currentSortField.value = col.fieldName;
    currentSortDirection.value = props.defaultSortDirection ?? 'asc';
  } else {
    currentSortDirection.value =
      currentSortDirection.value === 'asc' ? 'desc' :
      currentSortField.value ? (currentSortField.value = undefined, props.defaultSortDirection ?? 'asc') :
      'asc';
  }
}

function getAriaSort(col:{fieldName:string; sortable?:boolean}) {
  if (!isColumnSortable(col)) return undefined;
  if (currentSortField.value !== col.fieldName) return 'none';
  return currentSortDirection.value === 'asc' ? 'ascending' : 'descending';
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function sortArrayData(data:any[], sortField?:string, dir:'asc'|'desc'='asc') {
  if (!sortField) return data;
  // Helper function to get nested properties by path
  const getByPath = (o:any, p:string) => p.split('.').reduce((a:any,k)=>a?.[k], o);
  return [...data].sort((a,b) => {
    const av = getByPath(a, sortField), bv = getByPath(b, sortField);
    // Handle null/undefined values
    if (av == null && bv == null) return 0;
    // Handle null/undefined values
    if (av == null) return 1; if (bv == null) return -1;
    // Data types
    if (av instanceof Date && bv instanceof Date) return dir === 'asc' ? av.getTime() - bv.getTime() : bv.getTime() - av.getTime();
    // Strings and numbers
    if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
    const cmp = collator.compare(String(av), String(bv));
    return dir === 'asc' ? cmp : -cmp;
  });
}

function tableRowClick(row) {
  emit("clickTableRow", row)
}
</script>