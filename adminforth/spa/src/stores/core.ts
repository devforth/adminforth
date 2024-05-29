import { ref } from 'vue'
import { defineStore } from 'pinia'
import { callAdminForthApi } from '@/utils';


export const useCoreStore = defineStore('core', () => {
  const resourceById = ref([]);
  const menu = ref([]);
  const config = ref({});
  const record = ref({});
  const resourceColumns = ref(null);
  const resourceColumnsError = ref('');
  const resourceColumnsId = ref(null);

  async function fetchMenuAndResource() {
    const resp = await callAdminForthApi({
      path: '/get_base_config',
      method: 'GET',
    });
    menu.value = resp.menu;
    resourceById.value = resp.resources.reduce((acc, resource) => {
      acc[resource.resourceId] = resource;
      return acc;
    }, {});
    config.value = resp.config;
  }

  async function fetchRecord({ resourceId, primaryKey }) {
    record.value = null;

    record.value = await callAdminForthApi({
      path: '/get_record',
      method: 'POST',
      body: {
        resourceId: resourceId,
        primaryKey: primaryKey,
      }
    });
  }

  async function fetchColumns({ resourceId }) {
    console.log('fetchColumns 1', resourceId, resourceColumnsId.value);
    if (resourceColumnsId.value === resourceId && resourceColumns.value) {
      // already fetched
      return;
    }
    resourceColumnsId.value = resourceId;
    resourceColumns.value = null;
    resourceColumnsError.value = '';
    const res = await callAdminForthApi({
      path: '/get_resource_columns',
      method: 'POST',
      body: {
        resourceId,
      }
    }
    );
    if (res.error) {
      resourceColumnsError.value = res.error;
    } else {
      resourceColumns.value = res.resource.columns;
    }
  }


  return { 
    config,
    resourceById, 
    menu, 
    fetchMenuAndResource, fetchRecord, record, resourceColumns, fetchColumns, resourceColumnsError}
})
