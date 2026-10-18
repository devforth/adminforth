<template>
  <component
      :is="isExternalUrl(item.url) ? 'a' : RouterLink"
      v-bind="isExternalUrl(item.url)
        ? { href: item.url }
        : { to: item.url || { name: item.resourceId ? 'resource-list' : item.path, params: item.resourceId ? { resourceId: item.resourceId }: {} } }"
      :target="item.isOpenInNewTab ? '_blank' : '_self'"
      class="af-menu-link flex group relative items-center py-1.5 text-lightSidebarText dark:text-darkSidebarText rounded-default transition-colors duration-150 ease-in-out"
      :class="{
        'hover:bg-lightSidebarItemHover hover:text-lightSidebarTextHover dark:hover:bg-darkSidebarItemHover dark:hover:text-darkSidebarTextHover active:bg-lightSidebarItemActive dark:active:bg-darkSidebarItemActive': !['divider', 'gap', 'heading'].includes(item.type),
        'pl-2.5 pr-3': isChild && !isSidebarIconOnly && !isSidebarHovering,
        'pl-6 pr-3': isChild && isSidebarIconOnly && isSidebarHovering,
        'w-full': !isSidebarIconOnly || isSidebarHovering,
        'px-3': !isChild && (!isSidebarIconOnly || isSidebarHovering),
        'w-10 h-9 ml-1 px-3': isSidebarIconOnly && !isSidebarHovering,
        'bg-lightSidebarItemActive text-lightSidebarTextActive font-medium dark:bg-darkSidebarItemActive dark:text-darkSidebarTextActive': isItemActive(item)
      }"
  >
    <component v-if="item.icon" :is="getIcon(item.icon)"
      class="min-w-4 w-4 h-4 text-lightSidebarIcons dark:text-darkSidebarIcons group-hover:text-lightSidebarIconsHover dark:group-hover:text-darkSidebarIconsHover transition-colors duration-150 ease-in-out"
      :class="{ 'text-lightSidebarIconsHover dark:text-darkSidebarIconsHover': isItemActive(item) }"
    >
    </component>
    <IconFileImage v-else-if="!isChild || isSidebarIconOnly"
      class="min-w-4 w-4 h-4 text-lightSidebarIcons dark:text-darkSidebarIcons group-hover:text-lightSidebarIconsHover dark:group-hover:text-darkSidebarIconsHover transition-colors duration-150 ease-in-out"
    />
    <div 
      class="overflow-hidden block ms-3 pr-4 text-left rtl:text-right transition-all duration-200 ease-in-out"
      :class="{
        'opacity-0 ms-0 translate-x-4 flex-none': isSidebarIconOnly && !isSidebarHovering,
        'opacity-100 ms-3 translate-x-0 flex-1': !isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering),
        '!ms-0': isChild && !item.icon && !isSidebarIconOnly,
      }"
      :style="isSidebarIconOnly ? { 
        minWidth: isChild 
          ? `calc(${expandedWidth} - 0.75rem*2 - 1.5rem*2 - 1rem - 0.75rem)`
          : `calc(${expandedWidth} - 0.75rem*2 - 0.75rem*2 - 1rem - 0.75rem)`,
        width: isChild 
          ? `calc(${expandedWidth} - 0.75rem*2 - 1.5rem*2 - 1rem - 0.75rem)`
          : `calc(${expandedWidth} - 0.75rem*2 - 0.75rem*2 - 1rem - 0.75rem)`
      } : {}"
    >
      {{ item.label }}
    </div>
    <span class="absolute flex items-center justify-center right-1 top-1/2 -translate-y-1/2" v-if="(item.badge || item.badge === 0) && showExpandedBadge ">
      <Tooltip v-if="item.badgeTooltip">
        <div class="af-badge inline-flex items-center justify-center h-5 px-1.5 ms-2 text-[11px] font-medium tabular-nums rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
        fill-lightAnnouncementText dark:fill-darkAnnouncementText text-lightAnnouncementText dark:text-darkAnnouncementText min-w-[1.25rem] max-w-[3rem]">{{ item.badge }}</div>
        <template #tooltip>
          {{ item.badgeTooltip }}
        </template>
      </Tooltip>
      <template v-else>
        <div class="af-badge inline-flex items-center justify-center h-5 px-1.5 ms-2 text-[11px] font-medium tabular-nums rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
        fill-lightAnnouncementText dark:fill-darkAnnouncementText text-lightAnnouncementText dark:text-darkAnnouncementText min-w-[1.25rem] max-w-[3rem]">{{ item.badge }}</div>
      </template>
    </span>
    <div v-if="(item.badge || item.badge === 0) && isSidebarIconOnly && !isSidebarHovering"  class="af-badge absolute right-0.5 bottom-1 -translate-y-1/2 inline-flex items-center justify-center h-2 w-2 text-sm font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
      fill-lightAnnouncementText dark:fill-darkAnnouncementText text-lightAnnouncementText dark:text-darkAnnouncementText">
    </div>
  </component>
</template>

<script setup lang="ts">  
import { getIcon } from '@/utils';
import { Tooltip } from '@/afcl';
import { ref, watch, computed } from 'vue';
import { useCoreStore } from '@/stores/core';
import { IconFileImage } from '@iconify-prerendered/vue-lucide';
import { useRoute, RouterLink } from 'vue-router';

const isExternalUrl = (url: string ) => /^https?:\/\//.test(url || '');

const route = useRoute();

const isItemActive = (item: any) => {
  if (item.url) {
    return !isExternalUrl(item.url) && route.fullPath === item.url;
  }

  if (item.resourceId) {
    return route.params.resourceId === item.resourceId && route.name === 'resource-list';
  }

  return route.name === item.path;
};

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