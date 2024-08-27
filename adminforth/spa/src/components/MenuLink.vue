<template>
  <RouterLink 
      :to="{name: item.resourceId ? 'resource-list' : item.path, params: item.resourceId ? { resourceId: item.resourceId }: {}}" 
      class="flex group items-center py-2 text-lightSidebarText dark:text-darkSidebarText rounded-default  hover:bg-lightSidebarItemHover hover:text-lightSidebarTextHover dark:hover:bg-darkSidebarItemHover dark:hover:text-darkSidebarTextHover active:bg-lightSidebarActive dark:active:bg-darkSidebarHover" role="menuitem"
      :class="{ 
        'px-4': isChild,
        'px-2': !isChild,
        'bg-lightSidebarItemActive dark:bg-darkSidebarItemActive': item.resourceId ?
        ($route.params.resourceId === item.resourceId && $route.name === 'resource-list') :
        ($route.name === item.path)
      }"
  >
    <component v-if="item.icon" :is="getIcon(item.icon)" class="w-5 h-5 text-lightSidebarIcons dark:text-darkSidebarIcons  transition duration-75  group-hover:text-lightSidebarIconsHover dark:group-hover:text-darkSidebarIconsHover" ></component>
    <span class="ms-3">{{ item.label }}</span>
    <span v-if="item.badge" class="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
          fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent">{{ item.badge }}</span>

  </RouterLink>
</template>

<script setup lang="ts">
import { getIcon } from '@/utils';

const props = defineProps(['item', 'isChild']);


</script>