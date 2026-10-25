<template>
  <div>
    <nav 
      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady && defaultLayout"
      id="af-header-nav"
      class="fixed h-14 top-0 z-30 w-full border-b border-lightNavbarBorder bg-lightNavbar dark:bg-darkNavbar dark:border-darkNavbarBorder"
    >
      <div class="af-header px-3 lg:px-5 lg:pl-3 flex items-center justify-between h-full w-full" >
        <div class="flex items-center justify-start rtl:justify-end">
          <button @click="sideBarOpen = !sideBarOpen"
            type="button" class="inline-flex items-center justify-center w-[2.125rem] h-[2.125rem] text-sm text-lightNavbarIcons rounded-default sm:hidden hover:bg-lightSidebarItemHover focus:outline-none focus-visible:ring-[3px] focus-visible:ring-lightFocusRing dark:text-darkNavbarIcons dark:hover:bg-darkSidebarItemHover dark:focus-visible:ring-darkFocusRing">
              <span class="sr-only">{{ $t('Open sidebar') }}</span>
              <IconMenu class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div class="flex items-center gap-3">
          <component 
            v-if="coreStore?.adminUser"
            v-for="c in coreStore?.config?.globalInjections?.header || []"
            :is="getCustomComponent(c)"
            :meta="c.meta"
            :adminUser="coreStore.adminUser"
          />

          <Tooltip v-if="coreStore.isInternetError">
            <IconWifiOff class="blinking-icon w-5 h-5 text-lightInputErrorColor dark:text-darkInputErrorColor" />
            <template #tooltip>
              {{$t('Internet connection lost')}}
            </template>
          </Tooltip>

          <button
            v-if="!coreStore.config?.singleTheme"
            type="button"
            :aria-label="$t('Toggle theme')"
            @click="toggleTheme"
            class="af-header-theme-toggle flex items-center justify-center w-[2.125rem] h-[2.125rem] rounded-default cursor-pointer text-lightNavbarIcons hover:text-lightNavbarText hover:bg-lightSidebarItemHover focus:outline-none focus-visible:ring-[3px] focus-visible:ring-lightFocusRing dark:text-darkNavbarIcons dark:hover:text-darkNavbarText dark:hover:bg-darkSidebarItemHover dark:focus-visible:ring-darkFocusRing transition-colors">
            <IconMoon class="w-4 h-4" v-if="coreStore.theme !== 'dark'" />
            <IconSun class="w-4 h-4" v-else />
          </button>

          <DropdownMenu
            v-model:open="userMenuOpen"
            placement="bottom-end"
            keepMounted
            contentClass="af-settings-popup min-w-[15rem] max-w-none max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain divide-y bg-lightUserMenuBackground divide-lightUserMenuBorder text-lightUserMenuText dark:bg-darkUserMenuBackground dark:divide-darkUserMenuBorder dark:text-darkUserMenuText"
          >
            <template #trigger>
              <button type="button" class="flex text-sm rounded-full focus:outline-none focus-visible:ring-[3px] focus-visible:ring-lightFocusRing dark:focus-visible:ring-darkFocusRing" :aria-expanded="userMenuOpen">
                <span class="sr-only">{{ $t('Open user menu') }}</span>
                <span class="flex rounded-full ring-1 ring-lightNavbarBorder hover:ring-lightInputBorderHover dark:ring-darkNavbarBorder dark:hover:ring-darkInputBorderHover transition-shadow">
                  <img
                    v-if="coreStore.userAvatarUrl"
                    class="w-[2.125rem] h-[2.125rem] rounded-full object-cover"
                    :src="coreStore.userAvatarUrl"
                    alt="user photo"
                  />
                  <span v-else class="flex items-center justify-center w-[2.125rem] h-[2.125rem] rounded-full bg-lightSecondaryDarken text-lightNavbarIcons dark:bg-darkSecondaryLighten dark:text-darkNavbarIcons" aria-hidden="true">
                    <IconUser class="w-4 h-4" />
                  </span>
                </span>
              </button>
            </template>

            <div class="px-3 pt-2 pb-2.5" role="none">
              <p class="text-sm font-medium text-lightUserMenuText truncate dark:text-darkUserMenuText" role="none" v-if="coreStore.userFullname">
                {{ coreStore.userFullname }}
              </p>
              <p class="text-xs text-lightUserMenuText/60 truncate dark:text-darkUserMenuText/60" role="none" :class="{ 'text-sm font-medium !text-lightUserMenuText dark:!text-darkUserMenuText': !coreStore.userFullname }">
                {{ coreStore.username }}
              </p>
            </div>

            <ul class="py-1" role="none">
              <!-- plain injected items get the hover from the row, AFCL menu items highlight themselves -->
              <li v-for="c in userMenuComponents" class="rounded-md overflow-hidden bg-lightUserMenuItemBackground text-lightUserMenuItemText dark:bg-darkUserMenuItemBackground dark:text-darkUserMenuItemText [&:not(:has(.afcl-dropdown-menu-item))]:hover:bg-lightUserMenuItemBackgroundHover dark:[&:not(:has(.afcl-dropdown-menu-item))]:hover:bg-darkUserMenuItemBackgroundHover" >
                <component
                  :is="getCustomComponent(c)"
                  :meta="c.meta"
                  :adminUser="coreStore.adminUser"
                />
              </li>
              <li v-if="coreStore?.config?.settingPages && coreStore.config.settingPages.length > 0">
                <UserMenuSettingsButton />
              </li>
              <li class="mt-1 pt-1 border-t border-lightUserMenuBorder dark:border-darkUserMenuBorder first:mt-0 first:pt-0 first:border-t-0">
                <DropdownMenuItem
                  danger
                  :class="USER_MENU_ITEM_CLASSES"
                  @click="logout"
                >
                  <template #icon><IconLogOut /></template>
                  {{ $t('Sign out') }}
                </DropdownMenuItem>
              </li>
            </ul>
          </DropdownMenu>
        </div>
      </div>
    </nav>

    <Sidebar 
      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady && defaultLayout && !headerOnlyLayout && coreStore.menu.length > 0"
      :sideBarOpen="sideBarOpen"
      :forceIconOnly="route.meta?.sidebarAndHeader === 'preferIconOnly'"
      @hideSidebar="hideSidebar"
      @loadMenu="loadMenu"
      @sidebarStateChange="handleSidebarStateChange"
    />

    <div 
      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady && defaultLayout"
      class="af-content-wrapper transition-all duration-300 ease-in-out max-w-[100vw]" 
      :style="{
        marginLeft: headerOnlyLayout ? 0 : isSidebarIconOnly ? '4.5rem' : expandedWidth,
        maxWidth: headerOnlyLayout ? '100%' : isSidebarIconOnly ? 'calc(100% - 4.5rem)' : `calc(100% - ${expandedWidth})`
      }"
    >
      <div class="p-0 mt-14">
        <RouterView/>     
      </div>
    </div> 

    <div v-else-if="routerIsReady && loginRedirectCheckIsReady && publicConfigLoaded">
      <RouterView />
    </div>

    <div v-else class="flex items-center justify-center h-screen">
      <div class="text-3xl text-lightListTablePaginationHelpText dark:text-darkListTablePaginationHelpText animate-bounce">
        <Spinner class="w-8 h-8" />
      </div>
    </div>
    <AcceptModal />
    <ToastStack :style="{ right: `${appPaddingRight}px` }" />


    <div v-if="sideBarOpen"
         @click="hideSidebar"
         drawer-backdrop="" class="bg-lightScrim dark:bg-darkScrim fixed inset-0 z-20">
    </div>

    <component
      v-for="c in coreStore?.config?.globalInjections?.everyPageBottom || []"
      :is="getCustomComponent(c)"
      :adminUser="coreStore.adminUser || null"
      :meta="c.meta"
    />
  </div>
</template>

<style lang="scss" scoped>

  @keyframes blink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.2;
    }
  }

  .blinking-icon {
    animation: blink 2s ease-in-out infinite;
  }

  @media (max-width: 640px) {
    .af-content-wrapper {
      margin-left: 0 !important;
      max-width: 100% !important;
    }
  }


</style>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, onBeforeMount } from 'vue';
import { RouterView } from 'vue-router';
import './index.scss'
import { useCoreStore } from '@/stores/core';
import { useUserStore } from '@/stores/user';
import { IconMoon, IconSun, IconWifiOff, IconMenu, IconUser, IconLogOut } from '@iconify-prerendered/vue-lucide';
import AcceptModal from './components/AcceptModal.vue';
import Sidebar from './components/Sidebar.vue';
import { useRoute, useRouter } from 'vue-router';
import { createHead } from 'unhead'
import { getCustomComponent, handleNotAuthorized, lsKey } from '@/utils';
import ToastStack from './components/ToastStack.vue';
import adminforth, { initFrontedAPI, useAdminforth } from '@/adminforth';
import UserMenuSettingsButton from './components/UserMenuSettingsButton.vue';
import { Tooltip, Spinner, DropdownMenu, DropdownMenuItem } from '@/afcl'
import { USER_MENU_ITEM_CLASSES } from '@/utils/userMenu';

const coreStore = useCoreStore();
const userStore = useUserStore();

const { menu } = useAdminforth();

initFrontedAPI()

createHead()
const sideBarOpen = ref(false);
const route = useRoute();
const router = useRouter();
const publicConfigLoaded = ref(false);
const userMenuOpen = ref(false);

// injected user menu items close the menu via useAdminforth().closeUserMenuDropdown()
adminforth.closeUserMenuDropdown = () => {
  userMenuOpen.value = false;
};


const routerIsReady = ref(false);
const loginRedirectCheckIsReady = ref(false);

const isSidebarIconOnly = ref(localStorage.getItem(lsKey('iconOnlySidebar')) === 'true');

const loggedIn = computed(() => !!coreStore?.adminUser);

const defaultLayout = computed(() => {
  return route.meta?.sidebarAndHeader !== 'none';
});

const headerOnlyLayout = computed(() => {
  return route.meta?.sidebarAndHeader === 'headerOnly';
});

const expandedWidth = computed(() => coreStore.config?.iconOnlySidebar?.expandedSidebarWidth || '16.5rem');

const theme = ref('light');

const userMenuComponents = computed(() => {
  return coreStore?.config?.globalInjections?.userMenu || [];
})

function hideSidebar(): void {
  sideBarOpen.value = false;
}

function handleSidebarStateChange(state: { isSidebarIconOnly: boolean }) {
  isSidebarIconOnly.value = state.isSidebarIconOnly;
}


function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  coreStore.toggleTheme();
}


async function logout() {
  userStore.unauthorize();
  await userStore.logout();
  router.push({ name: 'login' })
}

async function initRouter() {
  await router.isReady();
  routerIsReady.value = true;
}

// used by Sidebar to reload menu, initial load is done by loadConfig below
async function loadMenu() {
  await initRouter();
  if (route.meta.sidebarAndHeader !== 'none') {
    // for custom layouts we don't need to fetch menu
    await coreStore.fetchMenuAndResource();
  }
  loginRedirectCheckIsReady.value = true;
}

async function loadConfig() {
  const resp = await coreStore.fetchConfig({ redirectToLoginIfNotLoggedIn: false });
  publicConfigLoaded.value = true;

  await initRouter();
  if (resp?.loggedIn) {
    // the flag the login route guard reads is only ever set by a login, so a 401 can leave it
    // saying "signed out" for a session the server still honours
    userStore.authorize();
    if (route.name === 'login') {
      await router.replace(route.query.next?.toString() || { name: 'home' });
    }
  } else if (resp && route.meta.sidebarAndHeader !== 'none') {
    // for custom layouts we don't force login, they are allowed to be rendered for anonymous user
    await handleNotAuthorized();
  }
  loginRedirectCheckIsReady.value = true;
}

function humanizeSnake(str: string): string {
  if (!str) {
    return '';
  }
  return str.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

const title = computed(() => {
  let firstParam: string | null | string[] = route?.params ? Object.values(route.params)[0] : null;
  if (typeof firstParam !== 'string') {
    firstParam = null;
  }
  const resourceTitle = coreStore.resourceById[route.params?.resourceId as string]?.label || (firstParam ? humanizeSnake(firstParam as string) : null);
  return `${coreStore.config?.title || coreStore.config?.brandName || 'Adminforth'} | ${ resourceTitle || route.meta.title || ' '}`;
});

const appPaddingRight = ref(0);
let appPaddingObserver: MutationObserver | null = null;
let appPaddingResizeObserver: ResizeObserver | null = null;

function updateAppPaddingRight() {
  const app = document.getElementById('app');
  if (!app) {
    appPaddingRight.value = 0;
    return;
  }
  const style = window.getComputedStyle(app);
  appPaddingRight.value = parseInt(style.paddingRight, 10) || 0;
}

// TODO - useHead not working in this way
// useHead({
//   title: title.value
// })
watch(title, (title) => {
  document.title = title;
})

watch(route, () => {
  userMenuOpen.value = false;
  // Handle preferIconOnly layout
  if (route.meta?.sidebarAndHeader === 'preferIconOnly') {
    isSidebarIconOnly.value = true;
  }
});


// initialize components based on data attribute selectors
onMounted(async () => {
  await loadConfig();
  // wait for the router: it affects the dom (our v-ifs) and fetches the menu
  await initRouter();
  document.documentElement.setAttribute('data-theme', theme.value);
  menu.refresh = async () => {
    await coreStore.refreshMenu();
  }
  menu.refreshMenuBadges = async () => {
    await coreStore.fetchMenuBadges();
  }

  window.addEventListener('online', () => coreStore.isInternetError = false);
  window.addEventListener('offline', () => coreStore.isInternetError = true);

  const app = document.getElementById('app');
  updateAppPaddingRight();
  if (app) {
    // padding-right changes come in via inline style / class updates on #app
    appPaddingObserver = new MutationObserver(updateAppPaddingRight);
    appPaddingObserver.observe(app, { attributes: true, attributeFilter: ['style', 'class'] });
    // and via viewport/box size changes that affect resolved padding
    appPaddingResizeObserver = new ResizeObserver(updateAppPaddingRight);
    appPaddingResizeObserver.observe(app);
  }
})

onUnmounted(() => {
  appPaddingObserver?.disconnect();
  appPaddingResizeObserver?.disconnect();
})

onBeforeMount(()=>{
  theme.value = window.localStorage.getItem(lsKey('theme')) || 'light';
  document.documentElement.classList.toggle('dark', theme.value === 'dark');
})

watch(() => coreStore.config?.singleTheme, (singleTheme) => {
  if (singleTheme) {
    theme.value = singleTheme;
    window.localStorage.setItem(lsKey('theme'), singleTheme);
    document.documentElement.classList.toggle('dark', theme.value === 'dark');
  }
}, { immediate: true })

</script>
