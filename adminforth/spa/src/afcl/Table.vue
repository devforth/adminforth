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
        <tr
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
            <span v-else>
              {{ item[column.fieldName] }}
            </span>
          </td>
        </tr>
      </tbody>
  </table>
  <nav class="afcl-table-pagination-container bg-lightTableBackground dark:bg-darkTableBackground flex items-center flex-column flex-wrap md:flex-row justify-between p-4" 
    v-if="totalPages > 1"
    :aria-label="$t('Table navigation')">
    <i18n-t 
      keypath="Showing {from} to {to} of {total}" tag="span" class="afcl-table-pagination-text text-sm font-normal text-lightTablePaginationText dark:text-darkTablePaginationText mb-4 md:mb-0 block w-full md:inline md:w-auto"
    >
      <template #from><span class="font-semibold text-lightTablePaginationNumeration dark:text-darkTablePaginationNumeration">{{ Math.min((currentPage - 1) * props.pageSize + 1, props.data.length) }}</span></template>
      <template #to><span class="font-semibold text-lightTablePaginationNumeration dark:text-darkTablePaginationNumeration">{{ Math.min(currentPage * props.pageSize, props.data.length) }}</span></template>
      <template #total><span class="font-semibold text-lightTablePaginationNumeration dark:text-darkTablePaginationNumeration">{{ props.data.length }}</span></template>
    </i18n-t>

    <ul class="afcl-table-pagination-list inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
      <li v-for="page in totalPages" :key="page">
        <a href="#" 
          @click.prevent="switchPage(page)"
          :aria-current="page === page ? 'page' : undefined"
          :class='{
            "afcl-table-pagination-button text-blue-600 bg-lightActivePaginationButtonBackground text-lightActivePaginationButtonText dark:bg-darkActivePaginationButtonBackground dark:text-darkActivePaginationButtonText hover:opacity-90": page === currentPage,
            "text-lightUnactivePaginationButtonText border bg-lightUnactivePaginationButtonBackground border-lightUnactivePaginationButtonBorder hover:bg-lightUnactivePaginationButtonHoverBackground hover:text-lightUnactivePaginationButtonHoverText dark:bg-darkUnactivePaginationButtonBackground dark:border-darkUnactivePaginationButtonBorder dark:text-darkUnactivePaginationButtonText dark:hover:bg-darkUnactivePaginationButtonHoverBackground dark:hover:text-darkUnactivePaginationButtonHoverText": page !== currentPage,
            "rounded-s-lg ms-0": page === 1,
            "rounded-e-lg": page === totalPages,
          }'
          class="flex items-center justify-center px-3 h-8 leading-tight ">
          {{ page }}
        </a>
      </li>
    </ul>
  </nav>
</div>


  
</template>

<script setup lang="ts">
  import { ref, type Ref, computed } from 'vue';
  import { asyncComputed } from '@vueuse/core';
  import { IconArrowRightOutline, IconArrowLeftOutline } from '@iconify-prerendered/vue-flowbite';

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
  const recievedTotalPages = ref(1);

  const totalPages = computed(() => {
    if (typeof props.data === 'function') {
      return recievedTotalPages.value;
    };
    return Math.ceil(props.data.length / props.pageSize);
  });

  const dataPage = asyncComputed( async() => {
    const start = (currentPage.value - 1) * props.pageSize;
    const end = start + props.pageSize;
    if (typeof props.data === 'function') {
      const res = await props.data(currentPage.value, props.pageSize);
      recievedTotalPages.value = res.total;
      return res.data;
    }
    return props.data.slice(start, end);
  });

  function switchPage(p: number) {
    currentPage.value = p;
  }

  const emites = defineEmits([
    'update:activeTab',
  ]);
  

</script>