<template>
  <aside 
    ref="sidebarAside"
    @mouseover="!isTogglingSidebar && (isSidebarHovering = true)" 
    @mouseleave="!isTogglingSidebar && (isSidebarHovering = false)"
    id="logo-lightSidebar" 
    class="sidebar-container fixed border-none top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-lightSidebar dark:bg-darkSidebar border-r border-lightSidebarBorder sm:translate-x-0 dark:border-darkSidebarBorder"
    :class="{ 
      '-translate-x-full': !sideBarOpen, 
      'transform-none': sideBarOpen,
      'sidebar-collapsed': iconOnlySidebarEnabled && isSidebarIconOnly && !isSidebarHovering,
      'sidebar-expanded': !iconOnlySidebarEnabled || !isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering),
      'sidebar-floating': isSidebarIconOnly && isSidebarHovering
     }"
    aria-label="Sidebar"
  >
    <div class="h-full px-3 pb-20 md:pb-4 bg-lightSidebar dark:bg-darkSidebar border-r border-lightSidebarBorder dark:border-darkSidebarBorder pt-4" :class="{'sidebar-scroll':!isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering)}">
      <div 
        class="af-logo-title-wrapper flex relative transition-all duration-300 ease-in-out h-8 items-center" 
        :class="{
          'mb-4': isSidebarIconOnly && !isSidebarHovering, 'mx-4 mb-4': !isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering),
          'justify-center': !(coreStore.config?.showBrandLogoInSidebar !== false && (!iconOnlySidebarEnabled || !isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering))) 
        }"
      >
        <img
          :src="loadFile(coreStore.config?.brandLogo || '@/assets/logo.svg')" 
          :alt="`${ coreStore.config?.brandName } Logo`"
          class="af-logo h-8 me-3" 
          :class="{ 
            'hidden': !(coreStore.config?.showBrandLogoInSidebar !== false && (!iconOnlySidebarEnabled || !isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering)))          }"
        />
        <img v-if="coreStore.config?.iconOnlySidebar?.logo" :src="loadFile(coreStore.config?.iconOnlySidebar?.logo || '')" :alt="`${ coreStore.config?.brandName } Logo`" class="af-sidebar-icon-only-logo h-8" :class="{ 'hidden': !(coreStore.config?.showBrandLogoInSidebar !== false && coreStore.config?.iconOnlySidebar?.logo && iconOnlySidebarEnabled && isSidebarIconOnly && !isSidebarHovering) }" />
        <span 
          v-if="coreStore.config?.showBrandNameInSidebar && (!iconOnlySidebarEnabled || !isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering))"
          class="af-title self-center text-lightNavbarText-size font-semibold sm:text-lightNavbarText-size whitespace-nowrap dark:text-darkSidebarText text-lightSidebarText truncate"
        >
          {{ coreStore.config?.brandName }}
        </span>
        <div v-if="!isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering)" class="flex items-center gap-2 w-auto" :class="{'w-full justify-end': coreStore.config?.showBrandLogoInSidebar === false}">
          <component 
            v-for="c in coreStore?.config?.globalInjections?.sidebarTop || []"
            :is="getCustomComponent(c)"
            :meta="c.meta"
            :adminUser="coreStore.adminUser"
          />
        </div>
        <div class="absolute top-1.5 -right-4 z-10 hidden sm:block" v-if="!forceIconOnly && iconOnlySidebarEnabled && (!isSidebarIconOnly || (isSidebarIconOnly && isSidebarHovering))">
          <button class="text-sm text-lightSidebarIcons group-hover:text-lightSidebarIconsHover dark:group-hover:text-darkSidebarIconsHover dark:text-darkSidebarIcons" @click="toggleSidebar">
            <IconPanelLeftClose v-if="!isSidebarIconOnly" class="w-4 h-4 active:scale-95 transition-all duration-200 hover:text-lightSidebarIconsHover dark:hover:text-darkSidebarIconsHover" />
            <IconPanelLeftOpen v-else class="w-4 h-4 active:scale-95 transition-all duration-200 hover:text-lightSidebarIconsHover dark:hover:text-darkSidebarIconsHover" />
          </button>
        </div>
      </div>

     <div
      v-if="coreStore?.config?.defaultUserExists && !isLocalhost"
      class="mb-4 rounded-lg border border-lightInputErrorColor/30 bg-lightInputErrorColor/10 text-lightInputErrorColor dark:border-darkInputErrorColor/30 dark:bg-darkInputErrorColor/10 dark:text-darkInputErrorColor text-sm"
      :class="iconOnlySidebarEnabled && isSidebarIconOnly && !isSidebarHovering ? 'flex w-10 h-10 ml-1 items-center justify-center' : 'p-3'"
    >
      <IconCircleAlert class="inline-block align-text-bottom w-4 h-4 shrink-0" />
      <template v-if="!iconOnlySidebarEnabled || !isSidebarIconOnly || isSidebarHovering">
        {{ $t('Default user') }} <strong>"adminforth"</strong> {{ $t('detected. Delete it and create your own account.') }}
      </template>
    </div>

      <ul class="af-sidebar-container space-y-0.5 text-sm" >
      <template v-if="!iconOnlySidebarEnabled || !isSidebarIconOnly" v-for="(item, i) in coreStore.menu" :key="`menu-${i}`">
          <div v-if="item.type === 'divider'" class="my-2 mx-2 border-t border-lightSidebarDevider dark:border-darkSidebarDevider"></div>
          <div v-else-if="item.type === 'gap'" class="flex items-center justify-center h-4"></div>
          <div v-else-if="item.type === 'heading'" class="flex items-center justify-left px-3 pt-3 pb-1 text-xs font-medium tracking-wide text-lightSidebarHeading dark:text-darkSidebarHeading
          ">{{ item.label }}</div>
          <li v-else-if="item.children" class="af-sidebar-expand-container">
            <button @click="clickOnMenuItem(item)" type="button" class="af-sidebar-expand-button flex items-center w-full px-3 py-1.5 text-sm text-lightSidebarText rounded-default transition duration-75  group hover:bg-lightSidebarItemHover hover:text-lightSidebarTextHover dark:text-darkSidebarText dark:hover:bg-darkSidebarItemHover dark:hover:text-darkSidebarTextHover"
                :class="isGroupOpened(item) ? 'af-sidebar-dropdown-expanded' : 'af-sidebar-dropdown-collapsed'"
                :aria-controls="`dropdown-example${i}`"
            >
              <component v-if="item.icon" :is="getIcon(item.icon)" class="w-4 h-4 text-lightSidebarIcons group-hover:text-lightSidebarIconsHover transition duration-75 dark:group-hover:text-darkSidebarIconsHover dark:text-darkSidebarIcons" ></component>
              <span class="overflow-hidden flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">{{ item.label }}
                <span v-if="item.badge || item.badge === 0" class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 ms-2 text-[11px] font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG
                  fill-lightAnnouncementText dark:fill-darkAnnouncementText text-lightAnnouncementText dark:text-darkAnnouncementText">
                  <Tooltip v-if="item.badgeTooltip">
                    {{ item.badge }}
                    <template #tooltip>
                      {{ item.badgeTooltip }}
                    </template>
                  </Tooltip>
                  <template v-else>
                    {{ item.badge }}
                  </template> 
                </span>
              </span>

              <IconChevronDown :class="{'rotate-180':  isGroupOpened(item) }" class="w-3 h-3 text-lightSidebarIcons dark:text-darkSidebarIcons transition-transform duration-200" aria-hidden="true" />
            </button>

            <div class="grid transition-[grid-template-rows,opacity] duration-200 ease-in-out"
              :class="isGroupOpened(item) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
              :inert="!isGroupOpened(item)"
            >
              <div class="min-h-0 overflow-hidden">
                <ul :id="`dropdown-example${i}`" role="none" class="af-sidebar-dropdown mt-0.5 ml-[1.25rem] pl-2 border-l border-lightSidebarDevider dark:border-darkSidebarDevider space-y-0.5">
                  <template v-for="(child, j) in item.children" :key="`menu-${i}-${j}`">
                    <li class="af-sidebar-menu-link">
                        <MenuLink :item="child" isChild="true" @click="$emit('hideSidebar')"/>
                    </li>
                  </template>
                </ul>
              </div>
            </div>
      </li>
      <li v-else class="af-sidebar-menu-link">
        <MenuLink :item="item" @click="$emit('hideSidebar')"/>
      </li>
      </template>
      <template v-if="iconOnlySidebarEnabled && isSidebarIconOnly" v-for="(item, i) in coreStore.menu" :key="`menu-${i}`">
            <div v-if="item.type === 'divider'" class="my-2 mx-2 border-t border-lightSidebarDevider dark:border-darkSidebarDevider"></div>
            <div v-else-if="item.type === 'gap'" class="flex items-center justify-center h-4"></div>
            <div v-else-if="item.type === 'heading' && isSidebarHovering" class="flex items-center justify-left px-3 h-8 text-xs font-medium tracking-wide text-lightSidebarHeading dark:text-darkSidebarHeading
            ">{{ item.label }}</div>
            <div v-else-if="item.type === 'heading' && !isSidebarHovering" class="opacity-0 w-1 h-8">{{ item.label }}</div>
            <li v-else-if="item.children" class="af-sidebar-expand-container">
                <button @click="clickOnMenuItem(item)" type="button" class="af-sidebar-expand-button relative flex items-center h-9 py-2 text-sm text-lightSidebarText rounded-default group hover:bg-lightSidebarItemHover hover:text-lightSidebarTextHover dark:text-darkSidebarText dark:hover:bg-darkSidebarItemHover dark:hover:text-darkSidebarTextHover"
                    :class="[
                      isGroupOpened(item) ? 'af-sidebar-dropdown-expanded' : 'af-sidebar-dropdown-collapsed',
                      isSidebarIconOnly && !isSidebarHovering ? 'w-10 ml-1 px-3' : 'w-full px-3'
                    ]"
                    :aria-controls="`dropdown-example${i}`"
                >
                    <component v-if="item.icon" :is="getIcon(item.icon)" class="min-w-4 w-4 h-4 text-lightSidebarIcons group-hover:text-lightSidebarIconsHover transition duration-75    dark:group-hover:text-darkSidebarIconsHover dark:text-darkSidebarIcons" ></component>

                    <span 
                      class="overflow-hidden block ms-3 text-left rtl:text-right transition-all duration-200 ease-in-out"
                      :class="{
                        'opacity-0 ms-0 translate-x-4 flex-none': isSidebarIconOnly && !isSidebarHovering,
                        'opacity-100 ms-3 translate-x-0 flex-none': isSidebarIconOnly && isSidebarHovering,
                        'opacity-100 ms-3 translate-x-0 flex-1': !isSidebarIconOnly
                      }"
                      :style="isSidebarIconOnly ? { 
                        minWidth: `calc(${expandedWidth} - 0.75rem*2 - 0.75rem*2 - 1rem - 0.75rem)`,
                        width: `calc(${expandedWidth} - 0.75rem*2 - 0.75rem*2 - 1rem - 0.75rem)`
                      } : {}"
                    >{{ item.label }}

                        <span v-if="item.badge || item.badge === 0" class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 ms-2 text-[11px] font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
                        fill-lightAnnouncementText dark:fill-darkAnnouncementText text-lightAnnouncementText dark:text-darkAnnouncementText">
                        <Tooltip v-if="item.badgeTooltip">
                            {{ item.badge }}
                            <template #tooltip>
                            {{ item.badgeTooltip }}
                            </template>
                        </Tooltip>
                        <template v-else>
                            {{ item.badge }}
                        </template> 
                        </span>
                    </span>

                    <IconChevronDown :class="{'rotate-180':  isGroupOpened(item) }" class="w-3 h-3 ml-2 absolute right-3 text-lightSidebarIcons dark:text-darkSidebarIcons transition-transform duration-200" aria-hidden="true" />
                </button>

                <ul :id="`dropdown-example${i}`" role="none" class="af-sidebar-dropdown pt-0.5 space-y-0.5" :class="{ 'hidden': !isGroupOpened(item) }">
                    <template v-for="(child, j) in item.children" :key="`menu-${i}-${j}`">
                        <li class="af-sidebar-menu-link">
                            <MenuLink :item="child" isChild="true" @click="$emit('hideSidebar')" :isSidebarIconOnly="isSidebarIconOnly" :isSidebarHovering="isSidebarHovering"/>
                        </li>
                    </template>
                </ul>
            </li>
        <li v-else class="af-sidebar-menu-link">
            <MenuLink :item="item" @click="$emit('hideSidebar')" :isSidebarIconOnly="isSidebarIconOnly" :isSidebarHovering="isSidebarHovering"/>
        </li>
      </template>
     </ul>


      <div id="dropdown-cta" class="p-4 mt-6 w-[14.375rem] rounded-lg bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
        fill-lightAnnouncementText dark:fill-darkAnnouncementText text-lightAnnouncementText dark:text-darkAnnouncementText text-sm" role="alert"
        v-if="(ctaBadge && !isSidebarIconOnly) || (ctaBadge && isSidebarIconOnly && isSidebarHovering)"
      >
        <div class="flex items-center mb-3" :class="!ctaBadge.title ? 'float-right' : ''">
          <!-- <span class="bg-lightPrimaryOpacity dark:bg-darkPrimaryOpacity  text-sm font-semibold me-2 px-2.5 py-0.5 rounded "
            v-if="ctaBadge.title"
          > -->
          <span>
            {{ctaBadge.title}}
          </span>
          <button type="button" 
            class="ms-auto -mx-1.5 -my-1.5 bg-lightPrimaryOpacity dark:bg-darkPrimaryOpacity inline-flex justify-center items-center w-6 h-6  rounded-lg  p-1 hover:brightness-110" 
            aria-label="Close"
            v-if="ctaBadge?.closable" @click="closeCTA"
          >
            <span class="sr-only">Close</span>
            <IconX class="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
        <p class="mb-3 text-sm" v-if="ctaBadge.html" v-html="ctaBadge.html"></p>
        <p class="mb-3 text-sm fill-lightNavbarText dark:fill-darkPrimary text-lightNavbarText dark:text-darkNavbarPrimary" v-else>
          {{ ctaBadge.text }}  
        </p>
        <!-- <a class="text-sm text-lightPrimary underline font-medium hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" href="#">Turn new navigation off</a> -->
      </div>

      <component 
        v-for="c in coreStore?.config?.globalInjections?.sidebar || []"
        :is="getCustomComponent(c)"
        :meta="c.meta"
        :adminUser="coreStore.adminUser"
      />
    </div>
  </aside>
</template>

<style lang="scss" scoped>
  /* Sidebar width animations */
  .sidebar-container {
    width: v-bind(expandedWidth); /* Default expanded width (w-64) */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden; /* Prevent content from showing during animation */
    will-change: width, transform;
  }
  
  .sidebar-collapsed {
    width: 4.5rem; /* Collapsed width (w-18) */
  }
  
  .sidebar-expanded {
    width: v-bind(expandedWidth); /* Expanded width (w-64) */
  }

  .sidebar-floating {
    box-shadow: 3px 0px 12px -2px rgba(0, 0, 0, 0.15);
  }

  :deep(.dark) .sidebar-collapsed {
    box-shadow: 12px 0px 18px -8px rgba(0, 0, 0, 0.45);
  }

  /* Text visibility transitions */
  .sidebar-collapsed .af-title {
    opacity: 0;
    transform: translateX(-12px);
    transition: opacity 0.2s ease-out, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sidebar-collapsed svg.w-3 {
    opacity: 0;
    transition: opacity 0.2s ease-out;
  }
  
  .sidebar-expanded .af-title {
    opacity: 1;
    transform: translateX(0);
    transition: opacity 0.25s ease-in 0.1s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.05s;
  }
  .sidebar-expanded svg.w-3 {
    opacity: 1;
    transition: opacity 0.25s ease-in 0.1s;
  }

  /* Overlay scrollbar styling */
  .sidebar-scroll {
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }

  /* Webkit overlay scrollbar */
  .sidebar-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .sidebar-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar-scroll::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  /* Show scrollbar on hover/scroll */
  .sidebar-scroll:hover::-webkit-scrollbar-thumb,
  .sidebar-scroll:active::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.4);
  }

  .sidebar-scroll:hover {
    scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
  }

  /* Dark mode scrollbar */
  .dark .sidebar-scroll:hover {
    scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
  }

  .dark .sidebar-scroll:hover::-webkit-scrollbar-thumb,
  .dark .sidebar-scroll:active::-webkit-scrollbar-thumb {
    background-color: rgba(75, 85, 99, 0.4);
  }

  /* For browsers that support overlay scrollbars natively */
  @supports (overflow: overlay) {
    .sidebar-scroll {
      overflow-y: overlay;
    }
  }
</style>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted, type Ref } from 'vue';
import { useCoreStore } from '@/stores/core';
import MenuLink from './MenuLink.vue';
import { IconPanelLeftClose, IconPanelLeftOpen, IconChevronDown, IconX, IconCircleAlert } from '@iconify-prerendered/vue-lucide';
import { getIcon, verySimpleHash, loadFile, getCustomComponent, lsKey } from '@/utils';
import { Tooltip } from '@/afcl';
import type { AnnouncementBadgeResponse, AdminForthConfigMenuItem } from '@/types/Common';
import { useAdminforth } from '@/adminforth';
import { useI18n } from 'vue-i18n';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '::1';

const { menu } = useAdminforth();
const { t } = useI18n();

interface Props {
  sideBarOpen: boolean;
  forceIconOnly?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  hideSidebar: [];
  loadMenu: [];
  sidebarStateChange: [{ isSidebarIconOnly: boolean; isSidebarHovering: boolean }];
}>();

const coreStore = useCoreStore();

const OPENED_GROUPS_LS_KEY = lsKey('sidebarOpenedGroups');
// expanded/collapsed state of groups toggled by user, by itemId, untouched groups fall back to item.open
const openedGroups = ref<Record<string, boolean>>(JSON.parse(localStorage.getItem(OPENED_GROUPS_LS_KEY) || '{}'));
const sidebarAside = ref(null);

const smQuery = window.matchMedia('(min-width: 640px)');
const isMobile = ref(!smQuery.matches);
const iconOnlySidebarEnabled = computed(() => props.forceIconOnly === true || coreStore.config?.iconOnlySidebar?.enabled !== false);
const isSidebarIconOnly = ref(false);

const expandedWidth = computed(() => coreStore.config?.iconOnlySidebar?.expandedSidebarWidth || '16.5rem');

function handleBreakpointChange(e: MediaQueryListEvent) {
  isMobile.value = !e.matches;
  if (isMobile.value) {
    isSidebarIconOnly.value = false;
  } else {
    if (props.forceIconOnly === true) {
      isSidebarIconOnly.value = true;
    } else if (iconOnlySidebarEnabled.value && localStorage.getItem(lsKey('iconOnlySidebar')) === 'true') {
      isSidebarIconOnly.value = true;
    } else {
      isSidebarIconOnly.value = false;
    }
  }
}

smQuery.addEventListener('change', handleBreakpointChange);


const isSidebarHovering = ref(false);
const isTogglingSidebar = ref(false);

function toggleSidebar() {
  if (props.forceIconOnly) {
    return;
  }
  if (!iconOnlySidebarEnabled.value) {
    return;
  }
  if (isMobile.value) {
    return;
  }
  isTogglingSidebar.value = true;
  isSidebarIconOnly.value = !isSidebarIconOnly.value;
  if (isSidebarIconOnly.value) {
    isSidebarHovering.value = false;
  }
  setTimeout(() => {
    isTogglingSidebar.value = false;
  }, 100);
}

function isGroupOpened(item: AdminForthConfigMenuItem) {
  return openedGroups.value[item.itemId!] ?? item.open;
}

function clickOnMenuItem(item: AdminForthConfigMenuItem) {
  openedGroups.value[item.itemId!] = !isGroupOpened(item);
  localStorage.setItem(OPENED_GROUPS_LS_KEY, JSON.stringify(openedGroups.value));
}



watch(isSidebarIconOnly, (isIconOnly) => {
  if (!isMobile.value && iconOnlySidebarEnabled.value && !props.forceIconOnly) {
    localStorage.setItem(lsKey('iconOnlySidebar'), isIconOnly.toString());
  }
  emit('sidebarStateChange', { isSidebarIconOnly: isIconOnly, isSidebarHovering: isSidebarHovering.value });
})

watch(isSidebarHovering, (hovering) => {
  emit('sidebarStateChange', { isSidebarIconOnly: isSidebarIconOnly.value, isSidebarHovering: hovering });
})

watch(sidebarAside, (sidebarAside) => {
  if (sidebarAside) {
    coreStore.fetchMenuBadges();
  }
})

const ctaBadge: Ref<(AnnouncementBadgeResponse & { hash: string; }) | null> = computed(() => {
  const badge = coreStore.config?.announcementBadge;
  if (!badge) {
    return null;
  }
  const hash = badge.closable ? verySimpleHash(JSON.stringify(badge)) : '';
  if (badge.closable && window.localStorage.getItem(lsKey(`ctaBadge-${hash}`))) {
    return null;
  }
  return {...badge, hash};
});

function closeCTA() {
  if (!ctaBadge.value) {
    return;
  }
  const hash = ctaBadge.value.hash;
  window.localStorage.setItem(lsKey(`ctaBadge-${hash}`), '1');
  nextTick( async() => {
    emit('loadMenu');
    await coreStore.fetchMenuBadges();
    menu.refreshMenuBadges();
  })
}

onMounted(() => {
  if (!iconOnlySidebarEnabled.value) {
    isSidebarIconOnly.value = false;
  }

  // Emit initial state
  emit('sidebarStateChange', { isSidebarIconOnly: isSidebarIconOnly.value, isSidebarHovering: isSidebarHovering.value });
})

onUnmounted(() => {
  smQuery.removeEventListener('change', handleBreakpointChange);
  if (isMobile.value && props.sideBarOpen) {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
})

watch(() => props.forceIconOnly, (force) => {
  if (isMobile.value) {
    isSidebarIconOnly.value = false;
    return;
  }
  if (props.forceIconOnly === true) {
    isSidebarIconOnly.value = true;
  } else if (iconOnlySidebarEnabled.value && localStorage.getItem(lsKey('iconOnlySidebar')) === 'true') {
    isSidebarIconOnly.value = true;
  } else {
    isSidebarIconOnly.value = false;
  }
}, { immediate: true })

watch(() => props.sideBarOpen, (isOpen) => {
  if (isMobile.value) {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Unlock body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }
}, { immediate: true })

</script>
