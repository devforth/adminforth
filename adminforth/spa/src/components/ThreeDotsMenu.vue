<template >
  <template v-if="threeDotsDropdownItems?.length || customActions?.length">
    <button 
      data-dropdown-toggle="listThreeDotsDropdown" 
      class="flex items-center py-2 px-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 rounded-default"
    >
      <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
        <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>
      </svg>
    </button>

    <!-- Dropdown menu -->
    <div 
      id="listThreeDotsDropdown" 
      class="z-20 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600">
        <ul class="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownMenuIconButton">
          <li v-for="item in threeDotsDropdownItems" :key="`dropdown-item-${item.label}`">
            <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
              <component :is="getCustomComponent(item)" 
                :meta="item.meta" 
                :resource="coreStore.resource" 
                :adminUser="coreStore.adminUser"
              />
            </a>
          </li>
          <li v-for="action in customActions" :key="action.id">
            <a href="#" @click.prevent="handleActionClick(action)" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
              <div class="flex items-center gap-2">
                <component 
                  v-if="action.icon" 
                  :is="getIcon(action.icon)" 
                  class="w-4 h-4 text-lightPrimary dark:text-darkPrimary"
                />
                {{ action.name }}
              </div>
            </a>
          </li>
        </ul>
    </div>
  </template>
</template>


<script setup lang="ts">
import { getCustomComponent, getIcon } from '@/utils';
import { useCoreStore } from '@/stores/core';
import adminforth from '@/adminforth';
import { callAdminForthApi } from '@/utils';
import { useRoute } from 'vue-router';

const route = useRoute();
const coreStore = useCoreStore();

const props = defineProps({
  threeDotsDropdownItems: Array,
  customActions: Array
});

async function handleActionClick(action) {
  adminforth.list.closeThreeDotsDropdown();
  
  const actionId = action.id;
  const data = await callAdminForthApi({
    path: '/start_custom_action',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId,
      actionId: actionId,
      recordId: route.params.primaryKey
    }
  });
  
  if (data?.ok) {
    await coreStore.fetchRecord({
      resourceId: route.params.resourceId, 
      primaryKey: route.params.primaryKey,
      source: 'show',
    });

    if (data.successMessage) {
      adminforth.alert({
        message: data.successMessage,
        variant: 'success'
      });
    }
  }
  
  if (data?.error) {
    adminforth.alert({
      message: data.error,
      variant: 'danger'
    });
  }
}
</script>
