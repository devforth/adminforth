<template>
  <RouterLink 
      :to="{name: item.resourceId ? 'resource-list' : item.path, params: item.resourceId ? { resourceId: item.resourceId }: {}}" 
      class="af-menu-link flex group relative items-center w-full py-2 text-lightSidebarText dark:text-darkSidebarText rounded-default transition-all duration-200 ease-in-out" 
      :class="{ 
        'ml-1': isSidebarIconOnly && !isSidebarHovering && isChild,
        'hover:bg-lightSidebarItemHover hover:text-lightSidebarTextHover dark:hover:bg-darkSidebarItemHover dark:hover:text-darkSidebarTextHover active:bg-lightSidebarActive dark:active:bg-darkSidebarHover': !['divider', 'gap', 'heading'].includes(item.type),
        'px-6': (isChild && !isSidebarIconOnly && !isSidebarHovering) || (isChild && isSidebarIconOnly && isSidebarHovering),
        'px-3.5': !isChild || (isSidebarIconOnly && !isSidebarHovering),
        'max-w-13': isSidebarIconOnly && !isSidebarHovering,
        'bg-lightSidebarItemActive dark:bg-darkSidebarItemActive': item.resourceId ?
        ($route.params.resourceId === item.resourceId && $route.name === 'resource-list') :
        ($route.name === item.path)
      }"
  >
    <component v-if="item.icon" :is="getIcon(item.icon)" 
      class="text-lightSidebarIcons dark:text-darkSidebarIcons group-hover:text-lightSidebarIconsHover dark:group-hover:text-darkSidebarIconsHover transition-all duration-200 ease-in-out"
      :class="{
        'min-w-4 min-h-4': isSidebarIconOnly && !isSidebarHovering && isChild,
        'min-w-5 min-h-5': !(isSidebarIconOnly && !isSidebarHovering && isChild)
      }" >
    </component>
    <span 
      class="overflow-hidden block relative ms-3 text-left rtl:text-right transition-all duration-200 ease-in-out"
      :class="{
        'opacity-0 ms-0 translate-x-4 flex-none': isSidebarIconOnly && !isSidebarHovering,
        'opacity-100 ms-3 translate-x-0 flex-none': isSidebarIconOnly && isSidebarHovering,
        'opacity-100 ms-3 translate-x-0 flex-1': !isSidebarIconOnly
      }"
      :style="isSidebarIconOnly ? { 
        minWidth: isChild 
          ? 'calc(16.5rem - 0.75rem*2 - 1.5rem*2 - 1.25rem - 0.75rem)'
          : 'calc(16.5rem - 0.75rem*2 - 0.875rem*2 - 1.25rem - 0.75rem)',
        width: isChild 
          ? 'calc(16.5rem - 0.75rem*2 - 1.5rem*2 - 1.25rem - 0.75rem)'
          : 'calc(16.5rem - 0.75rem*2 - 0.875rem*2 - 1.25rem - 0.75rem)'
      } : {}"
    >
      {{ item.label }}
      <template v-if="item.badge && (!isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering))">
        <Tooltip v-if="item.badgeTooltip">
          <div class="af-badge inline-flex items-center justify-center absolute top-1/2 -translate-y-1/2 h-3 py-3 px-1 ms-3 text-sm font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
          fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent min-w-[1.5rem] max-w-[3rem]">{{ item.badge }}</div>
          <template #tooltip>
            {{ item.badgeTooltip }}
          </template>
        </Tooltip>
        <template v-else>
          <div class="af-badge inline-flex items-center justify-center absolute top-1/2 -translate-y-1/2 h-3 py-3 px-1 ms-3 text-sm font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
          fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent min-w-[1.5rem] max-w-[3rem]">{{ item.badge }}</div>
        </template>
      </template>
    </span>
    <div v-if="item.badge && isSidebarIconOnly && !isSidebarHovering"  class="af-badge absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-2 w-2 text-sm font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
      fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent">
    </div>
  </RouterLink>
</template>

<script setup lang="ts">  
import { getIcon } from '@/utils';
import { Tooltip } from '@/afcl';

defineProps(['item', 'isChild', 'isSidebarIconOnly', 'isSidebarHovering']);

</script>