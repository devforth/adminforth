import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { callAdminForthApi } from '@/utils';
import router from '@/router';

async function findHomepage(menu) {
  for (const item of menu) {
    if (item.homepage) {
      return item;
    }
    if (item.children) {
      const res = findHomepage(item.children);
      if (res) {
        return res;
      }
    }
  }
  return null;
}

export const useCoreStore = defineStore('core', () => {
  const resourceById = ref([]);
  const menu = ref([]);
  const config = ref({});
  const record = ref({});
  const resourceColumns = ref(null);
  const resourceColumnsError = ref('');
  const resourceColumnsId = ref(null);
  const user = ref(null);

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
    user.value = resp.user;

    // find homepage:true in menu recuresively
    const homepage = await findHomepage(menu.value);
    if (homepage) {
      if (homepage.resourceId) {
        // redirect to homepage
        router.push({ name: 'resource-list', params: { resourceId: homepage.resourceId } });
      } else {
        // redirect to path
        router.push(homepage.path);
      }
    }
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
    return user.value && user.value[usernameField];
  });

  const userFullname = computed(() => {
    const userFullnameField = config.value.userFullnameField;
    return user.value && user.value[userFullnameField];
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
    fetchColumns, 
    resourceColumnsError,
    logout
  }
})
