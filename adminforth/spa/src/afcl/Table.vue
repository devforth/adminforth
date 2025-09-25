<template>
  <div class="afcl-table-container relative overflow-x-auto shadow-md sm:rounded-lg">
    <div class="overflow-x-auto w-full">
      <table class="afcl-table w-full text-sm text-left rtl:text-right text-lightTableText dark:text-darkTableText overflow-x-auto">
          <thead class="afcl-table-thread text-xs text-lightTableHeadingText uppercase bg-lightTableHeadingBackground dark:bg-darkTableHeadingBackground dark:text-darkTableHeadingText">
            <tr>
              <th scope="col" class="px-6 py-3" ref="headerRefs" :key="`header-${column.fieldName}`"
                v-for="column in columns"
              >
                <slot v-if="$slots[`header:${column.fieldName}`]" :name="`header:${column.fieldName}`" :column="column" />
                
                <span v-else>
                  {{ column.label }}
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
    </div>
    <nav class="afcl-table-pagination-container bg-lightTableBackground dark:bg-darkTableBackground mt-2 flex flex-col gap-2 items-center sm:flex-row justify-center sm:justify-between px-4 pb-4" 
      v-if="totalPages > 1"
      :aria-label="$t('Table navigation')">
    <i18n-t 
      keypath="Showing {from} to {to} of {total}" tag="span" class="afcl-table-pagination-text text-sm font-normal text-center text-lightTablePaginationText dark:text-darkTablePaginationText sm:mb-4 md:mb-0 block w-full md:inline md:w-auto"
    >
      <template #from><span class="font-semibold text-lightTablePaginationNumeration dark:text-darkTablePaginationNumeration">{{ Math.min((currentPage - 1) * props.pageSize + 1, dataResult.total) }}</span></template>
      <template #to><span class="font-semibold text-lightTablePaginationNumeration dark:text-darkTablePaginationNumeration">{{ Math.min(currentPage * props.pageSize, dataResult.total) }}</span></template>
      <template #total><span class="font-semibold text-lightTablePaginationNumeration dark:text-darkTablePaginationNumeration">{{ dataResult.total }}</span></template>
    </i18n-t>
    <div class="af-pagination-container flex flex-row items-center xs:flex-row xs:justify-between xs:items-center gap-3">
      <div class="inline-flex">
          <!-- Buttons -->
          <button
            class="flex items-center py-1 px-3 gap-1 text-sm font-medium text-lightActivePaginationButtonText bg-lightActivePaginationButtonBackground border-r-0 rounded-s hover:opacity-90 dark:bg-darkActivePaginationButtonBackground dark:text-darkActivePaginationButtonText disabled:opacity-50"
            @click="currentPage--; pageInput = currentPage.toString();" :disabled="currentPage <= 1">
            <svg class="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 5H1m0 0 4 4M1 5l4-4"/>
            </svg>
          </button>
          <button
            class="flex items-center py-1 px-3 text-sm font-medium text-lightUnactivePaginationButtonText focus:outline-none bg-lightUnactivePaginationButtonBackground border-r-0  border border-lightUnactivePaginationButtonBorder hover:bg-lightUnactivePaginationButtonHoverBackground hover:text-lightUnactivePaginationButtonHoverText dark:bg-darkUnactivePaginationButtonBackground dark:text-darkUnactivePaginationButtonText dark:border-darkUnactivePaginationButtonBorder dark:hover:text-darkUnactivePaginationButtonHoverText dark:hover:bg-darkUnactivePaginationButtonHoverBackground disabled:opacity-50"
            @click="switchPage(1); pageInput = currentPage.toString();" :disabled="currentPage <= 1">
            <!-- <IconChevronDoubleLeftOutline class="w-4 h-4" /> -->
            1
          </button>
          <div
            contenteditable="true" 
            class="min-w-10 outline-none inline-block w-auto py-1.5 px-3 text-sm text-center text-lightTablePaginationInputText border border-lightTablePaginationInputBorder bg-lightTablePaginationInputBackground dark:border-darkTablePaginationInputBorder dark:text-darkTablePaginationInputText dark:bg-darkTablePaginationInputBackground z-10"
            @keydown="onPageKeydown($event)"
            @input="onPageInput($event)"
            @blur="validatePageInput()"
          >
            {{ pageInput }}
          </div>

          <button
            class="flex items-center py-1 px-3 text-sm font-medium text-lightUnactivePaginationButtonText focus:outline-none bg-lightUnactivePaginationButtonBackground border-l-0  border border-lightUnactivePaginationButtonBorder hover:bg-lightUnactivePaginationButtonHoverBackground hover:text-lightUnactivePaginationButtonHoverText dark:bg-darkUnactivePaginationButtonBackground dark:text-darkUnactivePaginationButtonText dark:border-darkUnactivePaginationButtonBorder dark:hover:text-darkUnactivePaginationButtonHoverText dark:hover:bg-darkUnactivePaginationButtonHoverBackground disabled:opacity-50"
            @click="currentPage = totalPages; pageInput = currentPage.toString();" :disabled="currentPage >= totalPages">
            {{ totalPages }}

            <!-- <IconChevronDoubleRightOutline class="w-4 h-4" /> -->
          </button>
          <button
            class="flex items-center py-1 px-3 gap-1 text-sm font-medium text-lightActivePaginationButtonText focus:outline-none bg-lightActivePaginationButtonBackground border-l-0 rounded-e hover:opacity-90 dark:bg-darkActivePaginationButtonBackground dark:text-darkActivePaginationButtonText disabled:opacity-50"
            @click="currentPage++; pageInput = currentPage.toString();" :disabled="currentPage >= totalPages">
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
      }[],
      data: {
        [key: string]: any,
      }[] | ((params: { offset: number, limit: number }) => Promise<{data: {[key: string]: any}[], total: number}>),
      evenHighlights?: boolean,
      pageSize?: number,
      isLoading?: boolean,
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

  onMounted(() => {
    refresh();
  });

  watch([currentPage, () => props.data], async () => {
    refresh();
  });

  watch(() => currentPage.value, () => {
    rowHeights.value = !rowRefs.value ? [] : rowRefs.value.map((el: HTMLElement) => el.offsetHeight);
    columnWidths.value = !headerRefs.value ? [] : headerRefs.value.map((el: HTMLElement) => el.offsetWidth);
  });

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

  const emites = defineEmits([
    'update:activeTab',
  ]);
  
  function onPageInput(event: any) {
    pageInput.value = event.target.innerText;
  }

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
      const result = await props.data({ offset: (currentLoadingIndex - 1) * props.pageSize, limit: props.pageSize });
      isAtLeastOneLoading.value[currentLoadingIndex] = false;
      if (isAtLeastOneLoading.value.every(v => v === false)) {
        isLoading.value = false;
      }
      dataResult.value = result;
    } else {
      const start = (currentPage.value - 1) * props.pageSize;
      const end = start + props.pageSize;
      dataResult.value = { data: props.data.slice(start, end), total: props.data.length };
    }
  }

  function refreshTable() {
    if ( currentPage.value !== 1 ) {
      currentPage.value = 1;
    } else {
      refresh();
    }
  }

</script>