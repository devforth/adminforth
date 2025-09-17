<template>

<div class="afcl-table-container relative overflow-x-auto shadow-md sm:rounded-lg">
  <table class="afcl-table w-full text-sm text-left rtl:text-right text-lightTableText dark:text-darkTableText">
      <thead class="afcl-table-thread text-xs text-lightTableHeadingText uppercase bg-lightTableHeadingBackground dark:bg-darkTableHeadingBackground dark:text-darkTableHeadingText">
        <tr>
          <th scope="col" class="px-6 py-3"
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
          v-if="isLoading" 
          :rows="pageSize" 
          :columns="columns.length" 
          :row-heights="rowHeights"
          :column-widths="columnWidths"
        />
        <tr
          v-else="!isLoading"
          v-for="(item, index) in dataPage"
          :class="{
            'afcl-table-body odd:bg-lightTableOddBackground odd:dark:bg-darkTableOddBackground even:bg-lightTableEvenBackground even:dark:bg-darkTableEvenBackground': evenHighlights,
            'border-b border-lightTableBorder dark:border-darkTableBorder': index !== dataPage.length - 1 || totalPages > 1,
          }"
        >
          <td class="px-6 py-4" 
            v-for="column in props.columns"
          >
            <slot v-if="$slots[`cell:${column.fieldName}`]" 
              :name="`cell:${column.fieldName}`" 
              :item="item" :column="column"
            >
            </slot>
            <span v-else-if="!isLoading" >
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
  import { ref, type Ref, computed, useTemplateRef, watch } from 'vue';
  import { asyncComputed } from '@vueuse/core';
  import SkeleteLoader from '@/components/SkeleteLoader.vue';

  const props = withDefaults(
    defineProps<{
      columns: {
        label: string,
        fieldName: string,
      }[],
      data: {
        [key: string]: any,
      }[] | ((offset: number, limit: number) => Promise<{data: {[key: string]: any}[], total: number}>),
      evenHighlights?: boolean,
      pageSize?: number,
    }>(), {
      evenHighlights: true,
      pageSize: 10,
    }
  );

  const currentPage = ref(1);
  const isLoading = ref(false);
  const pageInput = ref('1');
  const rowRefs = useTemplateRef<HTMLElement[]>('rowRefs');
  const headerRefs = useTemplateRef<HTMLElement[]>('headerRefs');
  const rowHeights = ref<number[]>([]);
  const columnWidths = ref<number[]>([]);
  watch(() => props.pageSize, (newRows) => {
  // rows are set to null when new records are loading
  rowHeights.value = newRows || !rowRefs.value ? [] : rowRefs.value.map((el: HTMLElement) => el.offsetHeight);
  columnWidths.value = newRows || !headerRefs.value ? [] : [48, ...headerRefs.value.map((el: HTMLElement) => el.offsetWidth)];
});

  const dataResult = asyncComputed( async() => {
    if (typeof props.data === 'function') {
      isLoading.value = true;
      const result = await props.data(currentPage.value, props.pageSize);
      isLoading.value = false;
      return result;
    }
    const start = (currentPage.value - 1) * props.pageSize;
    const end = start + props.pageSize;
    return { data: props.data.slice(start, end), total: props.data.length };
  });

  const totalPages = computed(() => {
    return dataResult.value?.total ? Math.ceil(dataResult.value.total / props.pageSize) : 1;
  });

  const dataPage = asyncComputed( async() => {
    return dataResult.value.data;
  });

  function switchPage(p: number) {
    currentPage.value = p;
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

</script>