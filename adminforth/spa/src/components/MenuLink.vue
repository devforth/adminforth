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
    <span class="text-ellipsis overflow-hidden ms-3">{{ item.label }}</span>
    <span v-if="item.badge"
    >
          
        <Tooltip v-if="item.badgeTooltip">
          <div class="inline-flex items-center justify-center h-3 py-3 px-1 ms-3 text-sm font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
          fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent min-w-[1.5rem] max-w-[3rem]">{{ item.badge }}</div>

          <template #tooltip>
            {{ item.badgeTooltip }}
          </template>
        </Tooltip>
        <template v-else>
          <div class="inline-flex items-center justify-center h-3 py-3 px-1 ms-3 text-sm font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
          fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent min-w-[1.5rem] max-w-[3rem]">{{ item.badge }}</div>
        </template> 

    </span>

  </RouterLink>
</template>

<script setup lang="ts">
import { getIcon } from '@/utils';
import { Tooltip } from '@/afcl';
const props = defineProps(['item', 'isChild']);


</script>