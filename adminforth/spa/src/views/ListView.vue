<template>
  <div>
    <Filters/>
    <div class="flex items-center justify-between mb-3">
      <Breadcrumbs />
      <div class="flex items-center space-x-1">
        <Button :to="{ name: 'resource-create', params: { resourceId: $route.params.resourceId } }" 
          class="flex items-center py-1 px-3 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
        >
          <IconPlusOutline class="w-4 h-4 me-2" />
            Create
        </Button>
        <Button 
          class="flex items-center py-1 px-3 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
          data-drawer-target="drawer-navigation" data-drawer-show="drawer-navigation" aria-controls="drawer-navigation"  
        >
          <IconFilterOutline class="w-4 h-4 me-2" />
            Filter
        </Button>
      </div>
    </div>

    <!-- table -->
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg">

      <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert"
        v-if="error">
        <span class="font-medium">Error!</span> {{ error }}
      </div>

      <!-- skelet loader -->
      <div v-if="!columns" role="status"
        class="max-w p-4 space-y-4 divide-y divide-gray-200 rounded shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>
        <span class="sr-only">Loading...</span>
      </div>

      <table v-else class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="p-4">
              <div class="flex items-center">
                <input id="checkbox-all-search" type="checkbox" @change="selectAll($event.target.checked)"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                <label for="checkbox-all-search" class="sr-only">checkbox</label>
              </div>
            </th>


            <th v-for="c in columnsListed" scope="col" class="px-6 py-3">
              <div class="flex items-center">
                {{ c.label }}
                <a href="#"><svg class="w-3 h-3 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                  </svg></a>
              </div>
            </th>

            <th scope="col" class="px-6 py-3">
              Actions
            </th>

          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
            <td :colspan="columns.length + 2" class="p-4 text-center">

              <div role="status"
                class="max-w p-4 space-y-4 divide-y divide-gray-200 rounded shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
                    <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  </div>
                  <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
                </div>
                <div class="flex items-center justify-between pt-4">
                  <div>
                    <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
                    <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  </div>
                  <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
                </div>
                <div class="flex items-center justify-between pt-4">
                  <div>
                    <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
                    <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  </div>
                  <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
                </div>
                <div class="flex items-center justify-between pt-4">
                  <div>
                    <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
                    <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  </div>
                  <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
                </div>
                <div class="flex items-center justify-between pt-4">
                  <div>
                    <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
                    <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  </div>
                  <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
                </div>
                <span class="sr-only">Loading...</span>
              </div>
            </td>
          </tr>

          <tr v-else v-for="(row, rowI) in rows" :key="row.id" 
            class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <td class="w-4 p-4">
              <div class="flex items center">
                <input id="checkbox-table-search-1" type="checkbox" v-model="checkboxes[rowI]"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                <label for="checkbox-table-search-1" class="sr-only">checkbox</label>
              </div>
            </td>
            <td v-for="c in columnsListed" class="px-6 py-4">
              {{ row[c.name] }}
            </td>
            <td class="flex items-center px-6 py-4">
              <a href="#" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
              <a href="#" class="font-medium text-red-600 dark:text-red-500 hover:underline ms-3">Remove</a>
            </td>
          </tr>

          <!-- <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td class="w-4 p-4">
                    <div class="flex items-center">
                        <input id="checkbox-table-search-1" type="checkbox" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                        <label for="checkbox-table-search-1" class="sr-only">checkbox</label>
                    </div>
                </td>
                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    Apple MacBook Pro 17"
                </th>
                <td class="px-6 py-4">
                    Silver
                </td>
                <td class="px-6 py-4">
                    Laptop
                </td>
                <td class="px-6 py-4">
                    Yes
                </td>
                <td class="px-6 py-4">
                    Yes
                </td>
                <td class="px-6 py-4">
                    $2999
                </td>
                <td class="px-6 py-4">
                    3.0 lb.
                </td>
                <td class="flex items-center px-6 py-4">
                    <a href="#" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
                    <a href="#" class="font-medium text-red-600 dark:text-red-500 hover:underline ms-3">Remove</a>
                </td>
            </tr> -->

        </tbody>
      </table>

      
        
    </div>

    <!-- pagination -->
    <div class="flex flex-col items-center mt-4 xs:flex-row xs:justify-between xs:items-center">
        <!-- Help text -->
        <span class="text-sm text-gray-700 dark:text-gray-400">
            Showing <span class="font-semibold text-gray-900 dark:text-white">
              {{ (page - 1) * pageSize + 1 }}
            </span> to <span class="font-semibold text-gray-900 dark:text-white">
              {{ Math.min(page * pageSize, totalRows) }}
            </span> of <span class="font-semibold text-gray-900 dark:text-white">{{
              totalRows
            }}</span> Entries
        </span>
        <div class="inline-flex mt-2 xs:mt-0">
          <!-- Buttons -->
          <button 
              class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white border-r-0 rounded-s border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50"
            @click="page--" :disabled="page <= 1">
              <svg class="w-3.5 h-3.5 me-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5H1m0 0 4 4M1 5l4-4"/>
              </svg>
              Prev
          </button>
          <input type="text" class="w-10 py-1.5  px-3 text-sm text-center text-gray-700 border border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:bg-gray-800 z-10" 
            v-model="page" />
          <button 
              class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white border-l-0 rounded-e border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50"

            @click="page++" :disabled="page >= totalPages">
              Next
              <svg class="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { callAdminForthApi } from '@/utils';
import { useRoute } from 'vue-router';
import { useCoreStore } from '@/stores/core';
import Breadcrumbs from '@/components/Breadcrumbs.vue';

import { IconPlusOutline } from '@iconify-prerendered/vue-flowbite';
import { IconFilterOutline } from '@iconify-prerendered/vue-flowbite';
import Filters from '@/components/Filters.vue';


const coreStore = useCoreStore();

const route = useRoute();
const columns = ref(null);
const error = ref(null);
const checkboxes = ref([]);

const page = ref(1);
const filters = ref([]);
const sort = ref([]);

const rows = ref(null);
const totalRows = ref(0);

const DEFAULT_PAGE_SIZE = 10;

const columnsListed = computed(() => columns.value?.filter(c => c.showIn.includes('L')));

async function selectAll(value) {
  console.log('select all');
  checkboxes.value = rows.value.map(() => value);
}

const pageSize = computed(() => coreStore.resourceById[route.params.resourceId]?.pageSize || DEFAULT_PAGE_SIZE);
const totalPages = computed(() => Math.ceil(totalRows.value / pageSize.value));

watch([page, filters, sort], () => {
  getList();
});

async function getList() {
  rows.value = null;
  const data = await callAdminForthApi({
    path: '/get_resource_data',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId,
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
      filters: filters.value,
      sort: sort.value,
    }
  });
  rows.value = data.data;
  totalRows.value = data.total;
}


async function init() {
  const res = await callAdminForthApi({
    path: '/get_resource_columns',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId
    }
  }
  );
  if (!res.discoverInProgress) {
    columns.value = res.resource.columns;
  }
  if (res.error) {
    error.value = res.error;
  }
  const items = await getList();
  console.log(3213, items);
}
onMounted(async () => {
  await init();
});

// on route param change 
watch(() => route.params.resourceId, async () => {
  columns.value = null;
  error.value = null;
  await init();
});

</script>