<template>
  <RouterLink 
      :to="{name: item.resourceId ? 'resource-list' : item.path, params: item.resourceId ? { resourceId: item.resourceId }: {}}" 
      class="flex items-center py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem"
      :class="{ 
        'px-4': isChild,
        'px-2': !isChild,
        'bg-blue-100': item.resourceId ? 
        ($route.params.resourceId === item.resourceId && $route.name === 'resource-list') :
        ($route.name === item.path)
      }"
  >
    <component v-if="item.icon" :is="getIcon(item.icon)" class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" ></component>
    <span class="ms-3">{{ item.label }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { getIcon } from '@/utils';
import { defineProps } from 'vue';

const props = defineProps(['item', 'isChild']);


</script>