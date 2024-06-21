<template>
  <!-- table -->
  <div class="relative overflow-x-auto shadow-list-table-shadow dark:shadow-black	overflow-y-hidden rounded-default">

    <!-- skelet loader -->
    <div role="status" v-if="!resource || !resource.columns"
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

    <table v-else class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 rounded-default">
      <thead class="text-xs text-view-table-heading-text bg-list-view-table-heading dark:bg-gray-700 dark:text-gray-400">
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
      <tr v-if="!rows" class="bg-list-view-table-bg border-b dark:bg-gray-800 dark:border-gray-700">
        <td :colspan="resource?.columns.length + 2">

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
      <tr v-else-if="rows.length === 0" class="bg-list-view-table-bg border-b dark:bg-gray-800 dark:border-gray-700">
        <td :colspan="resource?.columns.length + 2">

          <div id="toast-simple"
              class=" mx-auto my-5 flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-gray-500 divide-x rtl:divide-x-reverse divide-gray-200  dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800"
              role="alert">
            <IconInboxOutline class="w-6 h-6 text-gray-500 dark:text-gray-400"/>
            <div class="ps-4 text-sm font-normal">No items here yet</div>
          </div>

        </td>
      </tr>

      <tr @click="onClick($event,row)"   v-else v-for="(row, rowI) in rows" :key="row.id"
          class="bg-list-view-table-bg border-b dark:bg-gray-800 border-list-view-border-color dark:border-gray-700 hover:bg-list-view-table-row-hover dark:hover:bg-gray-600">
        <td class="w-4 p-4">
          <div class="flex items center">
            <input
              @click="(e)=>{e.stopPropagation()}"
              id="checkbox-table-search-1"
              type="checkbox"
              :checked="checkboxesInternal.includes(row.id)"
              @change="(e)=>{addToCheckedValues(row.id)}"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
            <label for="checkbox-table-search-1" class="sr-only">checkbox</label>
          </div>
        </td>
        <td v-for="c in columnsListed" class="px-6 py-4">
          <!-- if c.name in listComponentsPerColumn, render it. If not, render ValueRenderer -->
          <component
            @click="(e)=>{e.stopPropagation()}"
            :is="c?.components?.list ? getCustomComponent(c.components.list) : ValueRenderer"
            :meta="c?.components?.list.meta"
            :column="c"
            :record="row"
            :adminUser="coreStore.adminUser"
            :resource="resource"
          />
        </td>
        <td class=" items-center px-6 py-4" @click="(e)=>{e.stopPropagation()}">
          <div class="flex">
          <RouterLink
            v-if="resource.options?.allowedActions.show"
            :to="{ 
              name: 'resource-show', 
              params: { 
                resourceId: resource.resourceId, 
                primaryKey: row._primaryKeyValue,
              }
            }"
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

          <RouterLink v-if="resource.options?.allowedActions.edit"
            :to="{
              name: 'resource-edit',
              params: { 
                resourceId: resource.resourceId,
                primaryKey: row._primaryKeyValue 
              } 
            }"
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

          <button v-if="resource.options?.allowedActions.delete"
                  class="font-medium text-red-600 dark:text-red-500 hover:underline ms-3"
                  :data-tooltip-target="`tooltip-delete-${rowI}`"
                  @click="deleteRecord(row)"
          >
            <IconTrashBinSolid class="w-5 h-5 me-2"/>
          </button>

          <div :id="`tooltip-delete-${rowI}`"
              role="tooltip"
              class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
            Delete
            <div class="tooltip-arrow" data-popper-arrow></div>
          </div>
        </div>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
  <!-- pagination -->
  <div class="flex flex-col items-center mt-4 mb-4 xs:flex-row xs:justify-between xs:items-center"
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
</template>

<script setup>


import { initFlowbite } from 'flowbite';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { callAdminForthApi, getIcon } from '@/utils';

import ValueRenderer from '@/components/ValueRenderer.vue';
import { getCustomComponent } from '@/utils';
import { useCoreStore } from '@/stores/core';
import { showSuccesTost } from '@/composables/useFrontendApi';

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
import router from '@/router';

const coreStore = useCoreStore();

const props = defineProps([
  'resource', 
  'rows',
  'totalRows',
  'pageSize',
  'checkboxes'
])

// emits, update page
const emits = defineEmits([
  'update:page',
  'update:sort',
  'update:checkboxes',
  'update:records'

]);

const checkboxesInternal = ref([]);
const page = ref(1);
const sort = ref([]);


watch(() => page.value, (newPage) => {
  emits('update:page', newPage);
});

watch(() => sort.value, (newSort) => {
  emits('update:sort', newSort);
});

watch(() => checkboxesInternal.value, (newCheckboxes) => {
  console.log('checkboxesInternal ch changed, emiting', newCheckboxes)

  emits('update:checkboxes', newCheckboxes);
});

watch(() => props.checkboxes, (newCheckboxes) => {
  console.log('Props ch changed', newCheckboxes)
  checkboxesInternal.value = newCheckboxes;
});

function addToCheckedValues(id) {
  if (checkboxesInternal.value.includes(id)) {
    checkboxesInternal.value = checkboxesInternal.value.filter((item) => item !== id);
  } else {
    checkboxesInternal.value.push(id);
  }
  checkboxesInternal.value = [ ...checkboxesInternal.value ]
}

const columnsListed = computed(() => props.resource?.columns?.filter(c => c.showIn.includes('list')));

async function selectAll(value) {
  props.rows.forEach((r) => {
    if (!checkboxesInternal.value.includes(r.id)) {
      checkboxesInternal.value.push(r.id)
    } else {
      checkboxesInternal.value = checkboxesInternal.value.filter((item) => item !== r.id)
    }
  });
  checkboxesInternal.value = [ ...checkboxesInternal.value ]
  // checkboxes.value = rows.value.map((v) => v.id);
}

const totalPages = computed(() => Math.ceil(props.totalRows / props.pageSize));




const allFromThisPageChecked = computed(() => {
  if (!props.rows) return false;
  return props.rows.every((r) => props.checkboxes.includes(r.id));
});
const ascArr = computed(() => sort.value.filter((s) => s.direction === 'asc').map((s) => s.field));
const descArr = computed(() => sort.value.filter((s) => s.direction === 'desc').map((s) => s.field));


function onSortButtonClick(field) {
  const sortIndex = sort.value.findIndex((s) => s.field === field);
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


const clickTarget = ref(null);
async function onClick(e,row) {
  console.log(e,row)
  if(clickTarget.value === e.target) return;
  clickTarget.value = e.target;
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (window.getSelection().toString()) return;
  else {router.push({
    name: 'resource-show',
    params: {
      resourceId: props.resource.resourceId,
      primaryKey: row._primaryKeyValue,
    },
  })}
}
  








async function deleteRecord(row) {
  const data = await window.adminforth.confirm({
    message: 'Are you sure you want to delete this item?',
    yes: 'Delete',
    no: 'Cancel',
  });
  if (data) {
    try {
      const res = await callAdminForthApi({
      path: '/delete_record',
      method: 'POST',
      body: {
        resourceId: props.resource.resourceId,
        primaryKey: row._primaryKeyValue,
      }});
      if (!res.error){
        emits('update:records', true)
        showSuccesTost('Record deleted successfully')
      } else {
        console.error(res.error)
      }

    } catch (e) {
      console.error(e);
      };
    }

    
}


</script>