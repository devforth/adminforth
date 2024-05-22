import { ref } from 'vue'
import { defineStore } from 'pinia'
import { callAdminForthApi } from '@/utils';


export const useCoreStore = defineStore('core', () => {
  const resourceById = ref([]);
  const menu = ref([]);
  const brand = ref('');
  async function fetchMenuAndResource() {
    const resp = await callAdminForthApi({
      path: '/get_menu_config',
      method: 'GET',
    });
    menu.value = resp.menu;
    resourceById.value = resp.resources.reduce((acc, resource) => {
      acc[resource.resourceId] = resource;
      return acc;
    }, {});
    brand.value = resp.brandName;
  }

  return { brand, resourceById, menu, fetchMenuAndResource }
})
