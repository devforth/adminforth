import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { callAdminForthApi } from '@/utils';

export const useCoreStore = defineStore('core', () => {
  const resourceById = ref([]);
  const menu = ref([]);
  const config = ref({});
  const record = ref({});
  const resourceColumns = ref(null);
  const resource = ref(null);
  const resourceColumnsWithFilters = computed(() => {
    if (!resourceColumns.value) {
      return [];
    }
    return resourceColumns.value.filter((col) => col.showIn.includes('filter'));
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
    resourceById.value = resp.resources.reduce((acc, resource) => {
      acc[resource.resourceId] = resource;
      return acc;
    }, {});
    config.value = resp.config;
    adminUser.value = resp.user;
    console.log('🌍 AdminForth v', resp.version);
  }

  async function fetchRecord({ resourceId, primaryKey }) {
    record.value = null;
    
    if (!resourceColumns.value) {
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
            field: resourceColumns.value.find((col) => col.primaryKey).name,
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

  async function fetchResourceFull({ resourceId }) {
    if (resourceColumnsId.value === resourceId && resourceColumns.value) {
      // already fetched
      return;
    }
    resourceColumnsId.value = resourceId;
    resourceColumns.value = null;
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
      resourceColumns.value = res.resource.columns;
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
    resourceColumns, 
    fetchResourceFull, 
    resourceColumnsError,
    resourceOptions,
    resource,
    adminUser,
    resourceColumnsWithFilters
  }
})
