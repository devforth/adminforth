<template>
  <RouterLink 
      :to="{name: item.resourceId ? 'resource-list' : item.path, params: item.resourceId ? { resourceId: item.resourceId }: {}}" 
      class="af-menu-link flex group relative items-center w-full py-2 text-lightSidebarText dark:text-darkSidebarText rounded-default transition-all duration-200 ease-in-out" 
      :class="{ 
        'hover:bg-lightSidebarItemHover hover:text-lightSidebarTextHover dark:hover:bg-darkSidebarItemHover dark:hover:text-darkSidebarTextHover active:bg-lightSidebarActive dark:active:bg-darkSidebarHover': !['divider', 'gap', 'heading'].includes(item.type),
        'pl-6 pr-3.5': (isChild && !isSidebarIconOnly && !isSidebarHovering) || (isChild && isSidebarIconOnly && isSidebarHovering),
        'px-3.5 ': !isChild || (isSidebarIconOnly && !isSidebarHovering),
        'max-w-12': isSidebarIconOnly && !isSidebarHovering,
        'bg-lightSidebarItemActive dark:bg-darkSidebarItemActive': item.resourceId ?
        ($route.params.resourceId === item.resourceId && $route.name === 'resource-list') :
        ($route.name === item.path)
      }"
  >
    <component v-if="item.icon" :is="getIcon(item.icon)" 
      class="min-w-5 min-h-5 text-lightSidebarIcons dark:text-darkSidebarIcons group-hover:text-lightSidebarIconsHover dark:group-hover:text-darkSidebarIconsHover transition-all duration-200 ease-in-out"
    >
    </component>
    <IconFileImageOutline v-else
      class="min-w-5 min-h-5 text-lightSidebarIcons dark:text-darkSidebarIcons group-hover:text-lightSidebarIconsHover dark:group-hover:text-darkSidebarIconsHover transition-all duration-200 ease-in-out"
    />
    <div 
      class="overflow-hidden block ms-3 pr-4 text-left rtl:text-right transition-all duration-200 ease-in-out"
      :class="{
        'opacity-0 ms-0 translate-x-4 flex-none': isSidebarIconOnly && !isSidebarHovering,
        'opacity-100 ms-3 translate-x-0 flex-1': !isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering),
      }"
      :style="isSidebarIconOnly ? { 
        minWidth: isChild 
          ? `calc(${expandedWidth} - 0.75rem*2 - 1.5rem*2 - 1.25rem - 0.75rem)`
          : `calc(${expandedWidth} - 0.75rem*2 - 0.875rem*2 - 1.25rem - 0.75rem)`,
        width: isChild 
          ? `calc(${expandedWidth} - 0.75rem*2 - 1.5rem*2 - 1.25rem - 0.75rem)`
          : `calc(${expandedWidth} - 0.75rem*2 - 0.875rem*2 - 1.25rem - 0.75rem)`
      } : {}"
    >
      {{ item.label }}
    </div>
    <span class="absolute flex items-center justify-center right-1 top-1/2 -translate-y-1/2" v-if="item.badge && showExpandedBadge">
      <Tooltip v-if="item.badgeTooltip">
        <div class="af-badge inline-flex items-center justify-center h-3 py-2.5 px-1 ms-3 text-xs font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
        fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent min-w-[1.5rem] max-w-[3rem]">{{ item.badge }}</div>
        <template #tooltip>
          {{ item.badgeTooltip }}
        </template>
      </Tooltip>
      <template v-else>
        <div class="af-badge inline-flex items-center justify-center h-3 py-2.5 px-1 ms-3 text-xs font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
        fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent min-w-[1.5rem] max-w-[3rem]">{{ item.badge }}</div>
      </template>
    </span>
    <div v-if="item.badge && isSidebarIconOnly && !isSidebarHovering"  class="af-badge absolute right-0.5 bottom-1 -translate-y-1/2 inline-flex items-center justify-center h-2 w-2 text-sm font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
      fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent">
    </div>
  </RouterLink>
</template>

<script setup lang="ts">  
import { getIcon } from '@/utils';
import { Tooltip } from '@/afcl';
import { ref, watch, computed } from 'vue';
import { useCoreStore } from '@/stores/core';
import { IconFileImageOutline } from '@iconify-prerendered/vue-flowbite';

const props = defineProps(['item', 'isChild', 'isSidebarIconOnly', 'isSidebarHovering']);

const coreStore = useCoreStore();

const expandedWidth = computed(() => coreStore.config?.iconOnlySidebar?.expandedSidebarWidth || '16.5rem');

const BADGE_SHOW_DELAY_MS = 200;
const showExpandedBadge = ref(false);
let showBadgeTimer: ReturnType<typeof setTimeout> | null = null;

function cancelShowBadgeTimer() {
  if (showBadgeTimer) {
    clearTimeout(showBadgeTimer);
    showBadgeTimer = null;
  }
}

function showBadgeImmediately() {
  cancelShowBadgeTimer();
  showExpandedBadge.value = true;
}

function hideBadgeImmediately() {
  cancelShowBadgeTimer();
  showExpandedBadge.value = false;
}

function showBadgeAfterDelay() {
  cancelShowBadgeTimer();
  showBadgeTimer = setTimeout(() => {
    showExpandedBadge.value = true;
    showBadgeTimer = null;
  }, BADGE_SHOW_DELAY_MS);
}

watch(
  [() => props.isSidebarIconOnly, () => props.isSidebarHovering],
  ([isIconOnly, isHovering]) => {
    if (!isIconOnly) {
      showBadgeImmediately();
      return;
    }

    if (isHovering) {
      showBadgeAfterDelay();
      return;
    }

    hideBadgeImmediately();
  },
  { immediate: true }
);

</script>