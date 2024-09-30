<template>
  <Teleport to="body">
    <!-- todo exclude foreign column-->
    <Filters
      v-if="listResource"
      :columns="listResource.columns.filter((c) => c.name !== listResourceRefColumn.name)"
      v-model:filters="filters"
      :columnsMinMax="columnsMinMax"
      :show="filtersShow"
      @hide="filtersShow = false"
    />
  </Teleport>
    
  <td colspan="2">
    <div class="flex items-center gap-1">
      <h4 v-if="listResource"
          class="px-6 py-4"
      >{{ listResource.label }} inline records</h4>

      <button
        @click="()=>{checkboxes = []}"
        v-if="checkboxes.length"
        data-tooltip-target="tooltip-remove-all"
        data-tooltip-placement="bottom"
        class="flex gap-1  items-center py-1 px-3 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-default border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        <IconBanOutline class="w-5 h-5 "/>
        <div id="tooltip-remove-all" role="tooltip"
             class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
          Remove selection
          <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
      </button>

      <button
        v-if="checkboxes.length" 
        v-for="(action,i) in listResource?.options?.bulkActions" 
        :key="action.id"
        @click="startBulkAction(action.id)"
        class="flex gap-1 items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-default border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
        :class="{
          'bg-red-100 text-red-800 border-red-400 dark:bg-red-700 dark:text-red-400 dark:border-red-400': action.state==='danger', 
          'bg-green-100 text-green-800 border-green-400 dark:bg-green-700 dark:text-green-400 dark:border-green-400':action.state==='success',
          'bg-lightPrimaryOpacity text-lightPrimary border-blue-400 dark:bg-blue-700 dark:text-blue-400 dark:border-blue-400':action.state==='active',
        }"
      >
        <component
          v-if="action.icon"
          :is="getIcon(action.icon)"
          class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></component>

        {{ `${action.label} (${checkboxes.length})` }}
      </button>

      <RouterLink v-if="listResource?.options?.allowedActions?.create"
        :to="{ 
          name: 'resource-create', 
          params: { resourceId: listResource.resourceId }, 
          query: { 
            values: encodeURIComponent(JSON.stringify({[listResourceRefColumn.name]: props.record[selfPrimaryKeyColumn.name]})),
            returnTo: $route.fullPath,
          },
       }"
        class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
      >
        <IconPlusOutline class="w-4 h-4 me-2"/>
        Create
      </RouterLink>

      <button
        v-if="listResource?.options?.allowedActions?.filter"
        class="flex gap-1 items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
        @click="()=>{filtersShow = !filtersShow}"
      >
        <IconFilterOutline class="w-4 h-4 me-2"/>
        Filter
        <span
          class="bg-red-100 text-red-800 text-xs font-medium  px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400"
          v-if="filters.length">
            {{ filters.length }}
          </span>
      </button>

    </div>

    <ResourceListTable
      :noRoundings="true"
      :resource="listResource"
      :rows="rows"
      @update:page="page = $event"
      @update:sort="sort = $event"
      @update:checkboxes="checkboxes = $event"
      @update:records="getList"

      :pageSize="pageSize"
      :totalRows="totalRows"
      :checkboxes="checkboxes"
    />

  </td>
</template>

<script setup>
import { callAdminForthApi } from '@/utils';
import { ref, onMounted, watch, computed  } from 'vue';
import ResourceListTable from '@/components/ResourceListTable.vue';
import Filters from '@/components/Filters.vue';
import {
  IconBanOutline,
  IconFilterOutline,
  IconPlusOutline,
} from '@iconify-prerendered/vue-flowbite';
import { showErrorTost, showWarningTost, showSuccesTost} from '@/composables/useFrontendApi';

import { getIcon } from '@/utils';

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);

const listResource = ref(null);
const loading = ref(true);

const page = ref(1);
const sort = ref([]);
const checkboxes = ref([]);
const pageSize = computed(() => listResource.value?.options?.listPageSize || 10);

const rows = ref(null);
const totalRows = ref(0);

const filters = ref([]);
const filtersShow = ref(false);
const columnsMinMax = ref(null);

const listResourceRefColumn = computed(() => {
  if (!listResource.value) {
    return null;
  }
  return listResource.value.columns.find(c => c.foreignResource?.resourceId === props.resource.resourceId);
});

const selfPrimaryKeyColumn = computed(() => {
  return props.resource.columns.find(c => c.primaryKey);
});

const endFilters = computed(() => {
  if (!listResource.value) {
    return [];
  }
  // get name of the column that is foreign key
  const refColumn = listResourceRefColumn.value;

  const primaryKeyColumn = selfPrimaryKeyColumn.value;

  if (!refColumn) {
    showErrorTost(`Column with foreignResource.resourceId which is equal to '${props.resource.resourceId}' not found in resource which is specified as foreighResourceId '${listResource.value.resourceId}'`,10000);
    return [];
  }
  return [
    ...filters.value,
    {
      field: refColumn.name,
      operator: 'eq',
      value: props.record[primaryKeyColumn.name],
    },
  ];
});

watch([page], async () => {
  await getList();
});

watch([sort], async () => {
  await getList();
}, {deep: true});

watch([filters], async () => {
  page.value = 1;
  checkboxes.value = [];
  await getList();
}, {deep: true});


async function startBulkAction(actionId) {
  const data = await callAdminForthApi({
    path: '/start_bulk_action',
    method: 'POST',
    body: {
      resourceId: listResource.value.resourceId,
      actionId: actionId,
      recordIds: checkboxes.value
    }
  });
  if (data?.ok) {
    checkboxes.value = [];
    await getList();
  }
  if (data?.error) {
    showErrorTost(data.error);
  }
}

async function getList() {
  rows.value = null;
  const data = await callAdminForthApi({
    path: '/get_resource_data',
    method: 'POST',
    body: {
      source: 'list',
      resourceId: listResource.value.resourceId,
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
      filters: endFilters.value,
      sort: sort.value,
    }
  });

  if (data.error) {
    showErrorTost(data.error);
    rows.value = [];
    totalRows.value = 0;
    return;
  }

  rows.value = data.data?.map(row => {
    row._primaryKeyValue = row[listResource.value.columns.find(c => c.primaryKey).name];
    return row;
  });
  totalRows.value = data.total;
}

onMounted( async () => {
  loading.value = true;
  const foreighResourceId = props.meta.foreignResourceId;
  listResource.value = (await callAdminForthApi({
      path: `/plugin/${props.meta.pluginInstanceId}/get_resource`,
      method: 'POST',
      body: {},
  })).resource;
  columnsMinMax.value = await callAdminForthApi({
    path: '/get_min_max_for_columns',
    method: 'POST',
    body: {
      resourceId: foreighResourceId,
    }
  });
  loading.value = false;
  await getList();
});

</script>