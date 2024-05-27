import { ref } from 'vue'
import { defineStore } from 'pinia'
import { callAdminForthApi } from '@/utils';


export const useCoreStore = defineStore('core', () => {
  const resourceById = ref([]);
  const menu = ref([]);
  const brandName = ref('');
  const config = ref({});
  const record = ref({});

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
    brandName.value = resp.brandName;
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


  return { brandName, resourceById, menu, fetchMenuAndResource, fetchRecord, record, config}
})
