import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { callAdminForthApi } from '@/utils';
import type { AdminForthResourceCommon, AdminForthResourceColumnCommon } from '@/types/Common';
import type { Ref } from 'vue'
import type { AdminForthConfigMenuItem } from '@/types/Back';

export const useCoreStore = defineStore('core', () => {
  const resourceById: Ref<Object> = ref({});
  const theme: Ref<'light'| 'dark'> = ref(window.localStorage.getItem('af__theme') as ('light'|'dark') || 'light');

  const menu = ref([]);
  const config = ref({});
  const record: Ref<any | null> = ref({});
  const resource: Ref<AdminForthResourceCommon | null> = ref(null);
  const userData = ref(null);

  const resourceColumnsWithFilters = computed(() => {
    if (!resource.value) {
      return [];
    }
    return resource.value.columns.filter((col: AdminForthResourceColumnCommon) => col.showIn?.includes('filter'));
  })

  const resourceOptions: Ref<AdminForthResourceCommon['options'] | null> = ref(null);
  const resourceColumnsError = ref('');
  const resourceColumnsId = ref(null);
  const adminUser = ref(null);

  async function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    if (theme.value === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    document.documentElement.setAttribute('data-theme', theme.value);
    theme.value = theme.value;
    window.localStorage.setItem('af__theme', theme.value);
  }

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
    adminUser.value = resp.adminUser;
    userData.value = resp.user;
    console.log('🌍 AdminForth v', resp.version);
  }

  function findItemWithId(items: AdminForthConfigMenuItem[], _itemId: string): AdminForthConfigMenuItem | undefined {
    for (const item of items) {
      if (item._itemId === _itemId) {
        return item;
      }
      if (item.children) {
        const found = findItemWithId(item.children, _itemId);
        if (found) {
          return found;
        }
      }
    }
  }
  async function fetchMenuBadges() {
    const resp: Record<string, string> = await callAdminForthApi({
      path: '/get_menu_badges',
      method: 'GET',
    });
    if (!resp) {
      return;
    }
    Object.entries(resp).forEach(([_itemId, badge]: [string, string]) => {
      const item: AdminForthConfigMenuItem | undefined = findItemWithId(menu.value, _itemId);
      if (item) {
        item.badge = badge;
      }
    });
  }


  async function fetchRecord({ resourceId, primaryKey, source }: { resourceId: string, primaryKey: string, source: string }) {
    record.value = null;
    
    if (!resource.value) {
      throw new Error('Columns not fetched yet');
    }
    const col = resource.value.columns.find((col: AdminForthResourceColumn) => col.primaryKey);
    if (!col) {
      throw new Error(`Primary key not found in resource ${resourceId}`);
    }

    const respData = await callAdminForthApi({
      path: '/get_resource_data',
      method: 'POST',
      body: {
        source: source,
        resourceId: resourceId,
        filters: [
          {
            field: col.name,
            operator: 'eq',
            value: primaryKey
          }
        ],
        sort: [],
        limit: 1,
        offset: 0
      }
    });

    if (respData.error) {
      window.adminforth.alert({
        message: respData.error,
        variant: 'danger',
        timeout: 30,
      });
      record.value = {};
    } else {
      record.value = respData.data[0];
    }

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


  const username = computed(() => {
    const usernameField = config.value.usernameField;
    return userData.value && userData.value[usernameField];
  });

  const userFullname = computed(() => {
    const userFullnameField = config.value.userFullnameField;
    return userData.value && userData.value[userFullnameField];
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
    resource,
    adminUser,
    resourceColumnsWithFilters,
    toggleTheme,
    theme,
    fetchMenuBadges,
  }
})
