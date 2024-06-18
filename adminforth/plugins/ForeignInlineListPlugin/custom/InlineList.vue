<template>
  <td colspan="2">
    <h4 v-if="listResource"
        class="px-6 py-4"
    
    >{{ listResource.label }} inline records</h4>

    <ResourceListTable
      :resource="listResource"
      :rows="rows"
      @update:page="page = $event"
      @update:sort="sort = $event"
      @update:checkboxes="checkboxes = $event"
      :pageSize="pageSize"
      :totalRows="totalRows"
    />
  </td>
</template>

<script setup>
import { callAdminForthApi } from '@/utils';
import { ref, onMounted, watch, computed  } from 'vue';
import ResourceListTable from '@/components/ResourceListTable.vue';

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);

const listResource = ref(null);
const loading = ref(true);

const page = ref(1);
const sort = ref([]);
const checkboxes = ref([]);
const pageSize = computed(() => props.meta.pageSize || 10);

const rows = ref(null);
const totalRows = ref(0);



const filters = computed(() => {
  if (!listResource.value) {
    return [];
  }
  console.log('listResource', listResource.value)
  // get name of the column that is foreign key
  const refColumn = listResource.value.columns.find(c => c.foreignResource?.resourceId === props.resource.resourceId);

  const primaryKeyColumn = listResource.value.columns.find(c => c.primaryKey);

  if (!refColumn) {
    window.adminforth.alert({
      message: `Column with foreignResource.resourceId which is equal to ${props.resource.resourceId} not found in resource which is specified as foreighResourceId (${resource.resourceId})`,
      variant: 'error',
    });
    return [];
  }
  return [
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


async function getList() {
  rows.value = null;
  console.log('getList', listResource.value)
  const data = await callAdminForthApi({
    path: '/get_resource_data',
    method: 'POST',
    body: {
      source: 'list',
      resourceId: listResource.value.resourceId,
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
      filters: filters.value,
      sort: sort.value,
    }
  });

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
      path: '/get_resource',
      method: 'POST',
      body: {
        resourceId: foreighResourceId,
      }
  })).resource;
  loading.value = false;
  await getList();
});

</script>