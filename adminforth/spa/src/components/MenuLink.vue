<template>
  <RouterLink 
      :to="{name: child.resourceId ? 'resource-list' : child.name, params: child.resourceId ? { resourceId: child.resourceId }: {}}" 
      class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem"
      :class="{ 
        'bg-blue-100': child.resourceId ? 
        ($route.params.resourceId === child.resourceId && $route.name === 'resource-list') :
        ($route.name === child.name)
      }"
  >
    <component v-if="child.icon" :is="getIcon(child.icon)" class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" ></component>
    <span class="ms-3">{{ child.label }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { getIcon } from '@/utils';
import { defineProps, resolveComponent } from 'vue';

const props = defineProps(['child']);


</script>