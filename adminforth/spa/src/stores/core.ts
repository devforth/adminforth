import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { callAdminForthApi } from '@/utils';
import websocket from '@/websocket';
import { useAdminforth } from '@/adminforth';

import type { AdminForthResourceCommon, AdminForthResourceColumnCommon, GetBaseConfigResponse, ResourceVeryShort, AdminUser, UserData, AdminForthConfigMenuItem, AdminForthConfigForFrontend } from '@/types/Common';
import type { Ref } from 'vue'

export const useCoreStore = defineStore('core', () => {
  const { alert } = useAdminforth();
  const resourceById: Ref<Record<string, ResourceVeryShort>> = ref({});
  const theme: Ref<'light'| 'dark'> = ref(window.localStorage.getItem('af__theme') as ('light'|'dark') || 'light');

  const menu: Ref<AdminForthConfigMenuItem[]> = ref([]);
  const config: Ref<AdminForthConfigForFrontend | null> = ref(null);
  const record: Ref<any | null> = ref({});
  const resource: Ref<AdminForthResourceCommon | null> = ref(null);
  const userData: Ref<UserData | null> = ref(null);
  const isResourceFetching = ref(false);
  const isInternetError = ref(false);

  const resourceColumnsWithFilters = computed(() => {
    if (!resource.value) {
      return [];
    }
    return resource.value.columns.filter((col: AdminForthResourceColumnCommon) => col.showIn?.filter);
  })

  const resourceOptions: Ref<AdminForthResourceCommon['options'] | null> = ref(null);
  const resourceColumnsError: Ref<string> = ref('');
  const resourceColumnsId: Ref<string | null> = ref(null);
  const adminUser: Ref<null | AdminUser> = ref(null);

  
  async function resetAdminUser() {
    adminUser.value = null;
  }

  async function resetResource() {
    resource.value = null;
  }

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
    const resp: GetBaseConfigResponse = await callAdminForthApi({
      path: '/get_base_config',
      method: 'GET',
    });

    if(!resp){
      return
    }
    menu.value = resp.menu;
    resourceById.value = resp.resources.reduce((acc: Record<string, ResourceVeryShort>, resource: ResourceVeryShort) => {
      acc[resource.resourceId] = resource;
      return acc;
    }, {});
    config.value = resp.config;
    adminUser.value = resp.adminUser;
    userData.value = resp.user;
    console.log('🌍 AdminForth v', resp.version);
  }

  function findItemWithId(items: AdminForthConfigMenuItem[], itemId: string): AdminForthConfigMenuItem | undefined {
    for (const item of items) {
      if (item.itemId === itemId) {
        return item;
      }
      if (item.children) {
        const found = findItemWithId(item.children, itemId);
        if (found) {
          return found;
        }
      }
    }
  }
  async function subscribeToMenuBadges() {
    const processItem = (mi: AdminForthConfigMenuItem) => {

      // console.log('🔔 subscribeToMenuBadges', mi.badge, JSON.stringify(mi));
      if (mi.badge !== undefined) {
        websocket.subscribe(`/opentopic/update-menu-badge/${mi.itemId}`, ({ badge }) => {
          mi.badge = badge;
        });
      }
    }
  
    menu.value.forEach((mi) => {
      processItem(mi);
      if (mi.children) {
        mi.children.forEach((child) => {
          processItem(child);
        })
      }
    })
  }
  async function fetchMenuBadges() {
    const resp: Record<string, string> = await callAdminForthApi({
      path: '/get_menu_badges',
      method: 'GET',
    });
    if (!resp) {
      return;
    }
    Object.entries(resp).forEach(([itemId, badge]: [string, string]) => {
      const item: AdminForthConfigMenuItem | undefined = findItemWithId(menu.value, itemId);
      if (item) {
        item.badge = badge;
      }
    });
    // TODO: This thing was created for something. Find out why
    // websocket.unsubscribeAll();
    subscribeToMenuBadges();

  }


  async function fetchRecord({ resourceId, primaryKey, source }: { resourceId: string, primaryKey: string, source: string }) {
    record.value = null;
    
    if (!resource.value) {
      throw new Error('Columns not fetched yet');
    }
    const col = resource.value.columns.find((col: AdminForthResourceColumnCommon) => col.primaryKey);
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
      alert({
        message: respData.error,
        variant: 'danger',
        timeout: 30,
      });
      record.value = {};
    } else {
      record.value = respData.data[0];
    }

  }

  async function fetchResourceFull({ resourceId, forceFetch }: { resourceId: string, forceFetch?: boolean }) {
    if (resourceColumnsId.value === resourceId && resource.value && !forceFetch) {
      // already fetched
      return;
    }
    isResourceFetching.value = true;
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
    isResourceFetching.value = false;
  }

  async function getPublicConfig() {
    const res = await callAdminForthApi({
      path: '/get_public_config',
      method: 'GET',
    });
    config.value = {...config.value, ...res};
  }

  async function getLoginFormConfig() {
    const res = await callAdminForthApi({
      path: '/get_login_form_config',
      method: 'GET',
    });
    console.log('📦 getLoginFormConfig', res);
    config.value = {...config.value, ...res};
  }

  const username = computed(() => {
    const usernameField = config.value?.usernameField;
    return userData.value && usernameField && userData.value[usernameField];
  });

  const userFullname = computed(() => {
    const userFullnameField = config.value?.userFullnameField;
    return userData.value && userFullnameField && userData.value[userFullnameField];
  })

  const userAvatarUrl = computed(() => {
    return userData.value?.userAvatarUrl || null;
  });

  const isIos = computed(() => {
    return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  )});


  return { 
    config,
    resourceById, 
    menu, 
    username,
    userFullname,
    userAvatarUrl,
    getPublicConfig,
    fetchMenuAndResource, 
    getLoginFormConfig,
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
    resetAdminUser,
    resetResource,
    isResourceFetching,
    isIos,
    isInternetError,
  }
})
