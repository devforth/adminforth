import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { callAdminForthApi } from '@/utils';
import type { AdminForthResource, AdminForthResourceColumn } from '@/types/AdminForthConfig';
import type { Ref } from 'vue'

export const useCoreStore = defineStore('core', () => {
  const resourceById: Ref<Object> = ref({});
  const menu = ref([]);
  const config = ref({});
  const record = ref({});
  const resource: Ref<AdminForthResource | null> = ref(null);

  const resourceColumnsWithFilters = computed(() => {
    if (!resource.value) {
      return [];
    }
    return resource.value.columns.filter((col: AdminForthResourceColumn) => col.showIn?.includes('filter'));
  })

  const resourceOptions = ref(null);
  const resourceColumnsError = ref('');
  const resourceColumnsId = ref(null);
  const adminUser = ref(null);

  async function fetchMenuAndResource() {
    const resp = await callAdminForthApi({
      path: '/get_base_config',
      method: 'GET',
    });
    if(!resp){
      return
    }
    menu.value = resp.menu;
    resourceById.value = resp.resources.reduce((acc: Object, resource: AdminForthResource) => {
      acc[resource.resourceId] = resource;
      return acc;
    }, {});
    config.value = resp.config;
    adminUser.value = resp.user;
    console.log('🌍 AdminForth v', resp.version);
  }

  async function fetchRecord({ resourceId, primaryKey }) {
    record.value = null;
    
    if (!resource.value) {
      throw new Error('Columns not fetched yet');
    }

    const respData = await callAdminForthApi({
      path: '/get_resource_data',
      method: 'POST',
      body: {
        source: 'show',
        resourceId: resourceId,
        filters: [
          {
            field: resource.value.columns.find((col: AdminForthResourceColumn) => col.primaryKey).name,
            operator: 'eq',
            value: primaryKey
          }
        ],
        sort: [],
        limit: 1,
        offset: 0
      }
    });

    console.log('📦 record', respData);
    record.value = respData.data[0];
    resourceOptions.value = respData.options;
  }

  async function fetchResourceFull({ resourceId }: { resourceId: string }) {
    if (resourceColumnsId.value === resourceId && resource.value) {
      // already fetched
      return;
    }
    resourceColumnsId.value = resourceId;
    resourceColumnsError.value = '';
    const res = await callAdminForthApi({
      path: '/get_resource',
      method: 'POST',
      body: {
        resourceId,
      }
    });
    if (res.error) {
      resourceColumnsError.value = res.error;
    } else {
      resourceById.value[resourceId] = res.resource;
      resource.value = res.resource;
      resourceOptions.value = res.resource.options;
    }
  }

  async function getPublicConfig() {
    const res = await callAdminForthApi({
      path: '/get_public_config',
      method: 'GET',
    });
    config.value = {...config.value, ...res};
  }

  async function logout() {
    await callAdminForthApi({
      path: '/logout',
      method: 'POST',
    });
  }

  const username = computed(() => {
    const usernameField = config.value.usernameField;
    return adminUser.value && adminUser.value[usernameField];
  });

  const userFullname = computed(() => {
    const userFullnameField = config.value.userFullnameField;
    return adminUser.value && adminUser.value[userFullnameField];
  })


  return { 
    config,
    resourceById, 
    menu, 
    username,
    userFullname,
    getPublicConfig,
    fetchMenuAndResource, 
    fetchRecord, 
    record, 
    fetchResourceFull, 
    resourceColumnsError,
    resourceOptions,
    logout,
    resource,
    adminUser,
    resourceColumnsWithFilters
  }
})
