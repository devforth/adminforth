<template>

<div class="relative overflow-x-auto shadow-md sm:rounded-lg">
  <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" class="px-6 py-3"
            v-for="column in columns"
          >
            <slot v-if="$slots[`header:${column.fieldName}`]" :name="$slots[`header:${column.fieldName}`]" :column="column" />
            
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
            'odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800': evenHighlights,
            'border-b dark:border-gray-700': index !== dataPage.length - 1 || totalPages > 1,
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
  <nav class="flex items-center flex-column flex-wrap md:flex-row justify-between p-4" 
    v-if="totalPages > 1"
    :aria-label="$t('Table navigation')">
    <i18n-t 
      keypath="Showing {from} to {to} of {total}" tag="span" class="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0 block w-full md:inline md:w-auto"
    >
      <template #from><span class="font-semibold text-gray-900 dark:text-white">{{ Math.min((currentPage - 1) * props.pageSize + 1, props.data.length) }}</span></template>
      <template #to><span class="font-semibold text-gray-900 dark:text-white">{{ Math.min(currentPage * props.pageSize, props.data.length) }}</span></template>
      <template #total><span class="font-semibold text-gray-900 dark:text-white">{{ props.data.length }}</span></template>
    </i18n-t>

    <ul class="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
      <li v-for="page in totalPages" :key="page">
        <a href="#" 
          @click.prevent="switchPage(page)"
          :aria-current="page === page ? 'page' : undefined"
          :class='{
            "text-blue-600 bg-lightPrimary text-lightPrimaryContrast dark:bg-darkPrimary dark:text-darkPrimaryContrast hover:opacity-90": page === currentPage,
            "text-gray-500 border bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white": page !== currentPage,
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

  const props = withDefaults(
    defineProps<{
      columns: {
        label: string,
        fieldName: string,
      }[],
      data: {
        [key: string]: any,
      }[],
      evenHighlights?: boolean,
      pageSize?: number,
    }>(), {
      evenHighlights: true,
      pageSize: 10,
    }
  );

  const currentPage = ref(1);

  const totalPages = computed(() => {
    return Math.ceil(props.data.length / props.pageSize);
  });

  const dataPage = computed(() => {
    const start = (currentPage.value - 1) * props.pageSize;
    const end = start + props.pageSize;
    return props.data.slice(start, end);
  });

  function switchPage(p: number) {
    currentPage.value = p;
  }

  const emites = defineEmits([
    'update:activeTab',
  ]);
  

</script>