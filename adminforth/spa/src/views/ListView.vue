<template>
  <div class="relative">
    <Teleport to="body">
      <Filters
        :columns="coreStore.resourceColumns"
        v-model:filters="filters"
        :columnsMinMax="columnsMinMax" :show="filtersShow"
        @hide="filtersShow = false"
      />
    </Teleport>

    <BreadcrumbsWithButtons>
      <button
        @click="()=>{checkboxes = []}"
        v-if="checkboxes.length"
        data-tooltip-target="tooltip-remove-all"
        data-tooltip-placement="bottom"
        class="flex gap-1  items-center py-1 px-3 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconBanOutline class="w-5 h-5 "/>

        <div id="tooltip-remove-all" role="tooltip"
             class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
          Remove selection
          <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
      </button>

      <button
        v-if="checkboxes.length" v-for="(action,i) in allCheckedActions" :key="action.id"
        @click="startBulkAction(action.id)"
        class="flex gap-1 items-center py-1 px-3  mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
        :class="{'bg-red-100 text-red-800 border-red-400 dark:bg-red-700 dark:text-red-400 dark:border-red-400':action.state==='danger', 'bg-green-100 text-green-800 border-green-400 dark:bg-green-700 dark:text-green-400 dark:border-green-400':action.state==='success',
        'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-700 dark:text-blue-400 dark:border-blue-400':action.state==='active',
        }"
      >
        <component
          v-if="action.icon"
          :is="getIcon(action.icon)"
          class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></component>

        {{ `${action.label} (${checkboxes.length})` }}
      </button>

      <RouterLink v-if="allowedActions.create"
        :to="{ name: 'resource-create', params: { resourceId: $route.params.resourceId } }"
        class="flex items-center py-1 px-3  mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconPlusOutline class="w-4 h-4 me-2"/>
        Create
      </RouterLink>

      <button
        class="flex gap-1 items-center py-1 px-3 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
        @click="()=>{filtersShow = !filtersShow}"
      >
        <IconFilterOutline class="w-4 h-4 me-2"/>
        Filter
        <span
          class="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400"
          v-if="filters.length">
            {{ filters.length }}
          </span>
      </button>
    </BreadcrumbsWithButtons>

    <!-- table -->
    <div class="relative overflow-x-auto shadow-md dark:shadow-black	 sm:rounded-lg dark:s">


      <!-- skelet loader -->
      <div role="status" v-if="!coreStore.resourceColumns"
           class="max-w p-4 space-y-4 divide-y divide-gray-200 rounded shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700">
        <div class="flex items-center justify-between h-16">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>

        <div class="flex items-center justify-between  h-16 pt-4" v-for="i in new Array(10)">
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
            <div v-if="rows && rows.length" class="flex items-center">
              <input id="checkbox-all-search" type="checkbox" :checked="allFromThisPageChecked" @change="selectAll()"
                     class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
              <label for="checkbox-all-search" class="sr-only">checkbox</label>
            </div>
          </th>

          <th v-for="c in columnsListed" scope="col" class="px-6 py-3">
            <div @click="() => c.sortable && onSortButtonClick(c.name)" class="flex items-center " :class="{'cursor-pointer':c.sortable}">
              {{ c.label }}

              <div v-if="c.sortable"
                   :style="{ 'color':ascArr.includes(c.name)?'green':descArr.includes(c.name)?'red':'currentColor'}">
                <svg v-if="ascArr.includes(c.name) || descArr.includes(c.name)" class="w-3 h-3 ms-1.5"
                     :class="{'rotate-180':descArr.includes(c.name)}" viewBox="0 0 24 24">
                  <path
                    d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847"/>
                </svg>
                <svg v-else class="w-3 h-3 ms-1.5 opacity-30" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                     fill='currentColor'
                     viewBox="0 0 24 24">
                  <path
                    d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z"/>
                </svg>
              </div>
            </div>
          </th>

          <th scope="col" class="px-6 py-3">
            Actions
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="!rows" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
          <td :colspan="coreStore.resourceColumns.length + 2">

            <div role="status"
                 class="max-w p-4 space-y-4 divide-y divide-gray-200 rounded animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700">
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
        <tr v-else-if="rows.length === 0" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
          <td :colspan="coreStore.resourceColumns.length + 2">

            <div id="toast-simple"
                 class=" mx-auto my-5 flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-gray-500 bg-white divide-x rtl:divide-x-reverse divide-gray-200  dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800"
                 role="alert">
              <IconInboxOutline class="w-6 h-6 text-gray-500 dark:text-gray-400"/>
              <div class="ps-4 text-sm font-normal">No items here yet</div>
            </div>

          </td>
        </tr>

        <tr v-else v-for="(row, rowI) in rows" :key="row.id"
            class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
          <td class="w-4 p-4">
            <div class="flex items center">
              <input
                id="checkbox-table-search-1"
                type="checkbox"
                :checked="checkboxes.includes(row.id)"
                @change="(e)=>{addToCheckedValues(row.id)}"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
              <label for="checkbox-table-search-1" class="sr-only">checkbox</label>
            </div>
          </td>
          <td v-for="c in columnsListed" class="px-6 py-4">
            <!-- if c.name in listComponentsPerColumn, render it. If not, render ValueRenderer -->
            <component
              :is="listComponentsPerColumn[c.name] || ValueRenderer"
              :column="c"
              :row="row"
            />
          </td>
          <td class="flex items-center px-6 py-4">

            <RouterLink
              :to="{ name: 'resource-show', params: { resourceId: $route.params.resourceId, primaryKey: row._primaryKeyValue } }"
              class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
              :data-tooltip-target="`tooltip-show-${rowI}`"
            >
              <IconEyeSolid class="w-5 h-5 me-2"/>
            </RouterLink>

            <div :id="`tooltip-show-${rowI}`"
                 role="tooltip"
                 class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
              Show item
              <div class="tooltip-arrow" data-popper-arrow></div>
            </div>

            <RouterLink v-if="allowedActions.edit"
              :to="{ name: 'resource-edit', params: { resourceId: $route.params.resourceId, primaryKey: row._primaryKeyValue } }"
              class="font-medium text-blue-600 dark:text-blue-500 hover:underline ms-3"
              :data-tooltip-target="`tooltip-edit-${rowI}`"
            >
              <IconPenSolid class="w-5 h-5 me-2"/>
            </RouterLink>

            <div :id="`tooltip-edit-${rowI}`"
                 role="tooltip"
                 class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
              Edit
              <div class="tooltip-arrow" data-popper-arrow></div>
            </div>

            <button v-if="allowedActions.delete"
                    class="font-medium text-red-600 dark:text-red-500 hover:underline ms-3"
                    :data-tooltip-target="`tooltip-delete-${rowI}`"
                    @click="showDeleteModal(row)"
            >
              <IconTrashBinSolid class="w-5 h-5 me-2"/>
            </button>

            <div :id="`tooltip-delete-${rowI}`"
                 role="tooltip"
                 class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
              Delete
              <div class="tooltip-arrow" data-popper-arrow></div>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <!-- pagination -->
    <div class="flex flex-col items-center mt-4 xs:flex-row xs:justify-between xs:items-center"
         v-if="rows && totalRows >= pageSize && totalRows > 0"
    >
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
          <svg class="w-3.5 h-3.5 me-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
               viewBox="0 0 14 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 5H1m0 0 4 4M1 5l4-4"/>
          </svg>
          Prev
        </button>
        <button
          class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white border-r-0  border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50"
          @click="page = 1" :disabled="page <= 1">
          <!-- <IconChevronDoubleLeftOutline class="w-4 h-4" /> -->
          1
        </button>
        <input type="text"
               class="w-10 py-1.5  px-3 text-sm text-center text-gray-700 border border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:bg-gray-800 z-10"
               v-model="page"/>

        <button
          class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white border-l-0  border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50"
          @click="page = totalPages" :disabled="page >= totalPages">
          {{ totalPages }}
          <!-- <IconChevronDoubleRightOutline class="w-4 h-4" /> -->
        </button>
        <button
          class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white border-l-0 rounded-e border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50"

          @click="page++" :disabled="page >= totalPages">
          Next
          <svg class="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
               viewBox="0 0 14 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M1 5h12m0 0L9 1m4 4L9 9"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';
import { useCoreStore } from '@/stores/core';
import { useModalStore } from '@/stores/modal';
import { callAdminForthApi, getIcon } from '@/utils';
import { initFlowbite } from 'flowbite';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import ValueRenderer from '@/components/ValueRenderer.vue';

import {
IconInboxOutline,
IconPlusOutline
} from '@iconify-prerendered/vue-flowbite';

import {
IconBanOutline,
IconEyeSolid,
IconFilterOutline,
IconPenSolid,
IconTrashBinSolid
} from '@iconify-prerendered/vue-flowbite';

import Filters from '@/components/Filters.vue';

const filtersShow = ref(false);


const coreStore = useCoreStore();
const modalStore = useModalStore();

const route = useRoute();
const checkboxes = ref([]);

const page = ref(1);
const filters = ref([]);
const columnsMinMax = ref({});
const sort = ref([]);
const fetchStatus = ref({pending: false, error: null, success: false});

const rows = ref(null);
const totalRows = ref(0);
const allCheckedActions = ref([]);
const allowedActions = ref({});

onMounted(() => {
  console.log('LISTVIEW mounted⌛⌛⌛⌛⌛⌛🔻🔻🔻');
});

const DEFAULT_PAGE_SIZE = 10;

const columnsListed = computed(() => coreStore.resourceColumns?.filter(c => c.showIn.includes('list')));

async function selectAll(value) {
  console.log('select all');
  rows.value.forEach((r) => {
    if (!checkboxes.value.includes(r.id)) {
      checkboxes.value.push(r.id)
    } else {
      checkboxes.value = checkboxes.value.filter((item) => item !== r.id)
    }
  });
  // checkboxes.value = rows.value.map((v) => v.id);
}

const pageSize = computed(() => coreStore.resourceById[route.params.resourceId]?.pageSize || DEFAULT_PAGE_SIZE);
const totalPages = computed(() => Math.ceil(totalRows.value / pageSize.value));
let listComponentsPerColumn = {};
const allFromThisPageChecked = computed(() => {
  if (!rows.value) return false;
  return rows.value.every((r) => checkboxes.value.includes(r.id));
});
const ascArr = computed(() => sort.value.filter((s) => s.direction === 'asc').map((s) => s.field));
const descArr = computed(() => sort.value.filter((s) => s.direction === 'desc').map((s) => s.field));

watch([page], async () => {
  await init();
});

watch([filters], async () => {
  page.value = 1;
  await getList();
}, {deep: true});

watch([sort], async () => {
  await init();
}, {deep: true});

function onSortButtonClick(field) {
  if (fetchStatus.value.pending) return;
  const sortIndex = sort.value.findIndex((s) => s.field === field);
  console.log('sortIndex', sortIndex);
  if (sortIndex === -1) {
    sort.value = [{field, direction: 'asc'}, ...sort.value];
  } else {
    const sortField = sort.value[sortIndex];
    if (sortField.direction === 'asc') {
      sort.value[sortIndex].direction = 'desc';
    } else {
      sort.value.splice(sortIndex, 1);
    }
  }
}

async function getList() {
  rows.value = null;
  fetchStatus.value.pending = true;
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
  listComponentsPerColumn = coreStore.resourceColumns.reduce((acc, column) => {
      if (column.component?.list) {
        const path = column.component.list.replace('@@', '../custom');
        let component = defineAsyncComponent(() => import(`${path}`))
        acc[column.name] = component;
    }
    return acc;
  }, {});

fetchStatus.value.pending = false;
  rows.value = data.data?.map(row => {
    row._primaryKeyValue = row[coreStore.resourceColumns.find(c => c.primaryKey).name];
    return row;
  });
  totalRows.value = data.total;
  allCheckedActions.value = data.options?.bulkActions || [];
  allowedActions.value = data.options?.allowedActions;
  

  setTimeout(() => {
    initFlowbite();
    console.log('initFlowbite');
  });
}


function showDeleteModal(row) {
  if (!coreStore.config?.deleteConfirmation) {
    return deleteRecord(row);
  }
  modalStore.setModalContent({
    content: 'Are you sure you want to delete this item?',
    acceptText: 'Delete',
    cancelText: 'Cancel',
  });
  modalStore.setOnAcceptFunction(() => {
    return deleteRecord(row)
  })
  console.log('row', row);
  modalStore.togleModal();

}

async function deleteRecord(row) {
  await callAdminForthApi({
    path: '/delete_record',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId,
      primaryKey: row._primaryKeyValue,
      recordId: row.id
    }
  });
  await getList();
  modalStore.resetmodalState()
}

async function startBulkAction(actionId) {
  const data = await callAdminForthApi({
    path: '/start_bulk_action',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId,
      actionId: actionId,
      recordIds: checkboxes.value

    }
  });
  if (data?.status === 'success') {
    checkboxes.value = [];
  }
  await getList();
}

function addToCheckedValues(id) {
  if (checkboxes.value.includes(id)) {
    checkboxes.value = checkboxes.value.filter((item) => item !== id);
  } else {
    checkboxes.value.push(id);
  }
}

async function init() {
  await coreStore.fetchColumns({
    resourceId: route.params.resourceId
  });

  await getList();
  columnsMinMax.value = await callAdminForthApi({
    path: '/get_min_max_for_columns',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId
    }
  });
}

onMounted(async () => {
  await init();
});

// on route param change 
watch(() => route.params.resourceId, async () => {
  filters.value = [];
  checkboxes.value = [];
  sort.value = [];
  await init();
});

</script>