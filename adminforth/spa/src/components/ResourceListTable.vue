<template>
  <!-- table -->
  <div class="relative shadow-listTableShadow dark:shadow-darkListTableShadow	overflow-auto "
    :class="{'rounded-default': !noRoundings}"
  >
    <!-- skelet loader -->
    <div role="status" v-if="!resource || !resource.columns"
        class="max-w p-4 space-y-4 divide-y divide-gray-200 rounded shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700">

        <div role="status" class="max-w-sm animate-pulse">
            <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
        </div>      
    </div>
    <table v-else class=" w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 rounded-default">

      <tbody>
        <!-- table header -->
        <tr class="t-header sticky z-10 top-0 text-xs  bg-lightListTableHeading dark:bg-darkListTableHeading dark:text-gray-400">
          <td scope="col" class="p-4">
            <div class="flex items-center">
              <input id="checkbox-all-search" type="checkbox" :checked="allFromThisPageChecked" @change="selectAll()" 
                    :disabled="!rows || !rows.length"
                    class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded
                    focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
              <label for="checkbox-all-search" class="sr-only">{{ $t('checkbox') }}</label>
            </div>
          </td>

          <td v-for="c in columnsListed" ref="headerRefs" scope="col" class="px-2 md:px-3 lg:px-6 py-3">
          
            <div @click="(evt) => c.sortable && onSortButtonClick(evt, c.name)" 
                class="flex items-center " :class="{'cursor-pointer':c.sortable}">
              {{ c.label }}

              <div v-if="c.sortable">
                <svg v-if="ascArr.includes(c.name) || descArr.includes(c.name)" class="w-3 h-3 ms-1.5"
                    fill='currentColor'
                    :class="{'rotate-180':descArr.includes(c.name)}" viewBox="0 0 24 24">
                  <path
                    d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 0z"/>
                </svg>
                <svg v-else class="w-3 h-3 ms-1.5 opacity-30" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                    fill='currentColor'
                    viewBox="0 0 24 24">
                  <path
                    d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z"/>
                </svg>
              </div>
              <span
                class="bg-red-100 text-red-800 text-xs font-medium me-1 px-1 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400"
                v-if="sort.findIndex((s) => s.field === c.name) !== -1 && sort?.length > 1">
                {{ sort.findIndex((s) => s.field === c.name) + 1 }}
              </span>

            </div>
          </td>

          <td scope="col" class="px-6 py-3">
            {{ $t('Actions') }}
          </td>
        </tr>
        <tr v-for="c in tableBodyStartInjection" :key="c.id" class="align-top border-b border-lightListBorder dark:border-darkListTableBorder">
          <component :is="getCustomComponent(c)" :meta="c.meta" :resource="resource" :adminUser="coreStore.adminUser" />
        </tr>
        <!-- table header end -->
        <SkeleteLoader 
          v-if="!rows" 
          :columns="resource?.columns.filter(c => c.showIn.list).length + 2"
          :rows="rowHeights.length || 3"
          :row-heights="rowHeights"
          :column-widths="columnWidths"
        />
        
        <tr v-else-if="rows.length === 0" class="bg-lightListTable dark:bg-darkListTable dark:border-darkListTableBorder">
          <td :colspan="resource?.columns.length + 2">

            <div id="toast-simple"
                class=" mx-auto my-5 flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-gray-500 divide-x rtl:divide-x-reverse divide-gray-200  dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800"
                role="alert">
              <IconInboxOutline class="w-6 h-6 text-gray-500 dark:text-gray-400"/>
              <div class="ps-4 text-sm font-normal">{{ $t('No items here yet') }}</div>
            </div>

          </td>
        </tr>

        <tr @click="onClick($event,row)" 
          v-else v-for="(row, rowI) in rows" :key="`row_${row._primaryKeyValue}`"
          ref="rowRefs"
          class="bg-lightListTable dark:bg-darkListTable border-lightListBorder dark:border-gray-700 hover:bg-lightListTableRowHover dark:hover:bg-darkListTableRowHover"

          :class="{'border-b': rowI !== rows.length - 1, 'cursor-pointer': row._clickUrl !== null}"
        >
          <td class="w-4 p-4 cursor-default" @click="(e)=>{e.stopPropagation()}">
            <div class="flex items center ">
              <input
                @click="(e)=>{e.stopPropagation()}"
                id="checkbox-table-search-1"
                type="checkbox"
                :checked="checkboxesInternal.includes(row._primaryKeyValue)"
                @change="(e)=>{addToCheckedValues(row._primaryKeyValue)}"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer">
              <label for="checkbox-table-search-1" class="sr-only">{{ $t('checkbox') }}</label>
            </div>
          </td>
          <td v-for="c in columnsListed" class="px-2 md:px-3 lg:px-6 py-4">
            <!-- if c.name in listComponentsPerColumn, render it. If not, render ValueRenderer -->
            <component
              :is="c?.components?.list ? getCustomComponent(c.components.list) : ValueRenderer"
              :meta="c?.components?.list?.meta"
              :column="c"
              :record="row"
              :adminUser="coreStore.adminUser"
              :resource="resource"
            />
          </td>
          <td class=" items-center px-2 md:px-3 lg:px-6 py-4 cursor-default" @click="(e)=>{e.stopPropagation()}">
            <div class="flex text-lightPrimary dark:text-darkPrimary items-center">
              <Tooltip>
                <RouterLink
                  v-if="resource.options?.allowedActions.show"
                  :to="{ 
                    name: 'resource-show', 
                    params: { 
                      resourceId: resource.resourceId, 
                      primaryKey: row._primaryKeyValue,
                    }
                  }"

                >
                  <IconEyeSolid class="w-5 h-5 me-2"/>
                </RouterLink>

                <template v-slot:tooltip>
                  {{ $t('Show item') }}
                </template>
              </Tooltip>

              <Tooltip>
                <RouterLink
                  v-if="resource.options?.allowedActions.edit"
                  :to="{ 
                    name: 'resource-edit', 
                    params: { 
                      resourceId: resource.resourceId, 
                      primaryKey: row._primaryKeyValue,
                    }
                  }"
                >
                  <IconPenSolid class="w-5 h-5 me-2"/>
                </RouterLink>
                <template v-slot:tooltip>
                  {{ $t('Edit item') }}
                </template>
              </Tooltip>

              <Tooltip>
                <button
                  v-if="resource.options?.allowedActions.delete"
                  @click="deleteRecord(row)"
                >
                  <IconTrashBinSolid class="w-5 h-5 me-2"/>
                </button>

                <template v-slot:tooltip>
                  {{ $t('Delete item') }}
                </template>
              </Tooltip>
                
              <template v-if="customActionsInjection">
                <component 
                  v-for="c in customActionsInjection"
                  :is="getCustomComponent(c)" 
                  :meta="c.meta"
                  :resource="coreStore.resource" 
                  :adminUser="coreStore.adminUser"
                  :record="row"
                />
              </template>

              <template v-if="resource.options?.actions">
                <Tooltip v-for="action in resource.options.actions.filter(a => a.showIn?.list)" :key="action.id">
                  <button
                    @click="startCustomAction(action.id, row)"
                  >
                    <component v-if="action.icon" :is="getIcon(action.icon)" class="w-5 h-5 mr-2 text-lightPrimary dark:text-darkPrimary"></component>
                  </button>
                  <template v-slot:tooltip>
                    {{ action.name }}
                  </template>
                </Tooltip>
              </template>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <!-- pagination
  totalRows in v-if is used to not hide page input during loading when user puts cursor into it and edit directly (rows gets null there during edit)
  -->
  <div class="flex flex-row items-center mt-4 xs:flex-row xs:justify-between xs:items-center gap-3"
    v-if="(rows || totalRows) && totalRows >= pageSize && totalRows > 0"
  >
    
    <div class="inline-flex ">
        <!-- Buttons -->
        <button
          class="flex items-center py-1 px-3 gap-1 text-sm font-medium text-gray-900 focus:outline-none bg-white border-r-0 rounded-s border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50"
          @click="page--; pageInput = page.toString();" :disabled="page <= 1">
          <svg class="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 14 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 5H1m0 0 4 4M1 5l4-4"/>
          </svg>
          <span class="hidden sm:inline">
            {{ $t('Prev') }}
          </span>
        </button>
        <button
          class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white border-r-0  border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50"
          @click="page = 1; pageInput = page.toString();" :disabled="page <= 1">
          <!-- <IconChevronDoubleLeftOutline class="w-4 h-4" /> -->
          1
        </button>
        <div
          contenteditable="true" 
          class="min-w-10 outline-none inline-block w-auto min-w-10 py-1.5 px-3 text-sm text-center text-gray-700 border border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:bg-gray-800 z-10"
          @keydown="onPageKeydown($event)"
          @input="onPageInput($event)"
          @blur="validatePageInput()"
        >
          {{ pageInput }}
        </div>

        <button
          class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white border-l-0  border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50"
          @click="page = totalPages; pageInput = page.toString();" :disabled="page >= totalPages">
          {{ totalPages }}

          <!-- <IconChevronDoubleRightOutline class="w-4 h-4" /> -->
        </button>
        <button
          class="flex items-center py-1 px-3 gap-1 text-sm font-medium text-gray-900 focus:outline-none bg-white border-l-0 rounded-e border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50"
          @click="page++; pageInput = page.toString();" :disabled="page >= totalPages">
          <span class="hidden sm:inline">{{ $t('Next') }}</span>
          <svg class="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 14 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M1 5h12m0 0L9 1m4 4L9 9"/>
          </svg>
        </button>
    </div>

    <!-- Help text -->
    <span class="text-sm text-gray-700 dark:text-gray-400">
        <span v-if="((page || 1) - 1) * pageSize + 1 > totalRows">{{ $t('Wrong Page') }} </span>
        <template v-else>
          
          <span class="hidden sm:inline">
            <i18n-t keypath="Showing {from} to {to} of {total} Entries" tag="p"  >
              <template v-slot:from>
                <strong>{{ from }}</strong>
              </template>
              <template v-slot:to>
                <strong>{{ to }}</strong>
              </template>
              <template v-slot:total>
                <strong>{{ totalRows }}</strong>
              </template>
            </i18n-t>
          </span>
          <span class="sm:hidden">
            <i18n-t keypath="{from} - {to} of {total}" tag="p"  >
              <template v-slot:from>
                <strong>{{ from }}</strong>
              </template>
              <template v-slot:to>
                <strong>{{ to }}</strong>
              </template>
              <template v-slot:total>
                <strong>{{ totalRows }}</strong>
              </template>
            </i18n-t>
          </span> 
        </template>
    </span>
  </div>
</template>

<script setup lang="ts">


import { computed, onMounted, ref, watch, useTemplateRef, nextTick, type Ref } from 'vue';
import { callAdminForthApi } from '@/utils';
import { useI18n } from 'vue-i18n';
import ValueRenderer from '@/components/ValueRenderer.vue';
import { getCustomComponent } from '@/utils';
import { useCoreStore } from '@/stores/core';
import { showSuccesTost, showErrorTost } from '@/composables/useFrontendApi';
import SkeleteLoader from '@/components/SkeleteLoader.vue';
import { getIcon } from '@/utils';
import {
  IconInboxOutline,
} from '@iconify-prerendered/vue-flowbite';

import {
  IconEyeSolid,
  IconPenSolid,
  IconTrashBinSolid
} from '@iconify-prerendered/vue-flowbite';
import router from '@/router';
import { Tooltip } from '@/afcl';
import type { AdminForthResourceCommon } from '@/types/Common';
import adminforth from '@/adminforth';

const coreStore = useCoreStore();
const { t } = useI18n();
const props = defineProps<{
  page: number,
  resource: AdminForthResourceCommon | null,
  rows: any[] | null,
  totalRows: number,
  pageSize: number,
  checkboxes: any[],
  sort: any[],
  noRoundings?: boolean,
  customActionsInjection?: any[],
  tableBodyStartInjection?: any[],
}>();

// emits, update page
const emits = defineEmits([
  'update:page',
  'update:sort',
  'update:checkboxes',
  'update:records'

]);

const checkboxesInternal: Ref<any[]> = ref([]);
const pageInput = ref('1');
const page = ref(1);
const sort = ref([]);


const from = computed(() => ((page.value || 1) - 1) * props.pageSize + 1);
const to = computed(() => Math.min((page.value || 1) * props.pageSize, props.totalRows));

watch(() => page.value, (newPage) => {
  emits('update:page', newPage);
});
async function onPageKeydown(event) {
  // page input should accept only numbers, arrow keys and backspace
  if (['Enter', 'Space'].includes(event.code) ||
    (!['Backspace', 'ArrowRight', 'ArrowLeft'].includes(event.code)
    && isNaN(String.fromCharCode(event.keyCode)))) {
    event.preventDefault();
    if (event.code === 'Enter') {
      validatePageInput();
      event.target.blur();
    }
  }
}

watch(() => sort.value, (newSort) => {
  emits('update:sort', newSort);
});

watch(() => checkboxesInternal.value, (newCheckboxes) => {
  emits('update:checkboxes', newCheckboxes);
});

watch(() => props.checkboxes, (newCheckboxes) => {
  checkboxesInternal.value = newCheckboxes;
});

watch(() => props.sort, (newSort) => {
  sort.value = newSort;
});

watch(() => props.page, (newPage) => {
  // page.value and newPage will not be equal only on page load
  // this check prevents cursor jumping on manual input
  if (page.value !== newPage) pageInput.value = newPage.toString();
  page.value = newPage;
});

const rowRefs = useTemplateRef('rowRefs');
const headerRefs = useTemplateRef('headerRefs');
const rowHeights = ref([]);
const columnWidths = ref([]);
watch(() => props.rows, (newRows) => {
  // rows are set to null when new records are loading
  rowHeights.value = newRows || !rowRefs.value ? [] : rowRefs.value.map((el) => el.offsetHeight);
  columnWidths.value = newRows || !headerRefs.value ? [] : [48, ...headerRefs.value.map((el) => el.offsetWidth)];
});

function addToCheckedValues(id) {
  if (checkboxesInternal.value.includes(id)) {
    checkboxesInternal.value = checkboxesInternal.value.filter((item) => item !== id);
  } else {
    checkboxesInternal.value.push(id);
  }
  checkboxesInternal.value = [ ...checkboxesInternal.value ]
}

const columnsListed = computed(() => props.resource?.columns?.filter(c => c.showIn.list));

async function selectAll(value) {
  if (!allFromThisPageChecked.value) {
    props.rows.forEach((r) => {
      if (!checkboxesInternal.value.includes(r._primaryKeyValue)) {
        checkboxesInternal.value.push(r._primaryKeyValue)
      } 
    });
  } else {
    props.rows.forEach((r) => {
      checkboxesInternal.value = checkboxesInternal.value.filter((item) => item !== r._primaryKeyValue);
    });
  }
  checkboxesInternal.value = [ ...checkboxesInternal.value ];
}

const totalPages = computed(() => Math.ceil(props.totalRows / props.pageSize));

const allFromThisPageChecked = computed(() => {
  if (!props.rows || !props.rows.length) return false;
  return props.rows.every((r) => checkboxesInternal.value.includes(r._primaryKeyValue));
});
const ascArr = computed(() => sort.value.filter((s) => s.direction === 'asc').map((s) => s.field));
const descArr = computed(() => sort.value.filter((s) => s.direction === 'desc').map((s) => s.field));


function onSortButtonClick(event, field) {
  // if ctrl key is pressed, add to sort otherwise sort by this field
  // in any case if field is already in sort, toggle direction
  
  const sortIndex = sort.value.findIndex((s) => s.field === field);
  if (sortIndex === -1) {
    // field is not in sort, add it
    if (event.ctrlKey) {
      sort.value = [...sort.value,{field, direction: 'asc'}];
    } else {
      sort.value = [{field, direction: 'asc'}];
    }
  } else {
    const sortField = sort.value[sortIndex];
    if (sortField.direction === 'asc') {
      sort.value = sort.value.map((s) => s.field === field ? {field, direction: 'desc'} : s);
    } else {
      sort.value = sort.value.filter((s) => s.field !== field);
    }
  }
}


const clickTarget = ref(null);

async function onClick(e,row) {
  if(clickTarget.value === e.target) return;
  clickTarget.value = e.target;
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (window.getSelection().toString()) return;
  else {
    if (row._clickUrl === null) {
      // user asked to nothing on click
      return;
    }
    if (e.ctrlKey || e.metaKey || row._clickUrl?.includes('target=_blank')) {
      
      if (row._clickUrl) {
        window.open(row._clickUrl, '_blank');
      } else {
        window.open(
          router.resolve({
            name: 'resource-show',
            params: {
              resourceId: props.resource.resourceId,
              primaryKey: row._primaryKeyValue,
            },
          }).href,
          '_blank'
        );
      }
    } else {
      if (row._clickUrl) {
        if (row._clickUrl.startsWith('http')) {
          document.location.href = row._clickUrl;
        } else {
          router.push(row._clickUrl);
        }
      } else {
        router.push({
          name: 'resource-show',
          params: {
            resourceId: props.resource.resourceId,
            primaryKey: row._primaryKeyValue,
          },
        });
      }
    }
  }
}

async function deleteRecord(row) {
  const data = await adminforth.confirm({
    message: t('Are you sure you want to delete this item?'),
    yes: t('Delete'),
    no: t('Cancel'),
  });
  if (data) {
    try {
      const res = await callAdminForthApi({
        path: '/delete_record',
        method: 'POST',
        body: {
          resourceId: props.resource.resourceId,
          primaryKey: row._primaryKeyValue,
        }
      });
      if (!res.error){
        emits('update:records', true)
        showSuccesTost(t('Record deleted successfully'))
      } else {
        showErrorTost(res.error)
      }

    } catch (e) {
      showErrorTost(t('Something went wrong, please try again later'));
      console.error(e);
    };
  }
}

const actionLoadingStates = ref({});

async function startCustomAction(actionId, row) {
  actionLoadingStates.value[actionId] = true;

  const data = await callAdminForthApi({
    path: '/start_custom_action',
    method: 'POST',
    body: {
      resourceId: props.resource.resourceId,
      actionId: actionId,
      recordId: row._primaryKeyValue
    }
  });
  
  actionLoadingStates.value[actionId] = false;
  
  if (data?.redirectUrl) {
    // Check if the URL should open in a new tab
    if (data.redirectUrl.includes('target=_blank')) {
      window.open(data.redirectUrl.replace('&target=_blank', '').replace('?target=_blank', ''), '_blank');
    } else {
      // Navigate within the app
      if (data.redirectUrl.startsWith('http')) {
        window.location.href = data.redirectUrl;
      } else {
        router.push(data.redirectUrl);
      }
    }
    return;
  }
  if (data?.ok) {
    emits('update:records', true);

    if (data.successMessage) {
      adminforth.alert({
        message: data.successMessage,
        variant: 'success'
      });
    }
  }
  
  if (data?.error) {
    showErrorTost(data.error);
  }
}

function onPageInput(event) {
  pageInput.value = event.target.innerText;
}

function validatePageInput() {
  const newPage = parseInt(pageInput.value) || 1;
  const validPage = Math.max(1, Math.min(newPage, totalPages.value));
  page.value = validPage;
  pageInput.value = validPage.toString();
}

</script>

<style lang="scss" scoped>
input[type="checkbox"][disabled] {
  @apply opacity-50;
}
input[type="checkbox"]:not([disabled]) {
  @apply cursor-pointer;
}
</style>