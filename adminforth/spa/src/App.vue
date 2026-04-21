<template>
  <div>
    <nav 
      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady && defaultLayout"
      id="af-header-nav"
      class="fixed h-14 top-0 z-30 w-full border-b drop-shadow-sm bg-lightNavbar dark:bg-darkNavbar dark:border-darkSidebarDevider"
    >
      <div class="af-header px-3 lg:px-5 lg:pl-3 flex items-center justify-between h-full w-full" >
        <div class="flex items-center justify-start rtl:justify-end">
          <button @click="sideBarOpen = !sideBarOpen"
            type="button" class="inline-flex items-center p-2 text-sm  rounded-lg sm:hidden hover:bg-lightSidebarItemHover focus:outline-none focus:ring-2 focus:ring-lightSidebarDevider dark:text-darkSidebarIcons dark:hover:bg-darkSidebarHover dark:focus:ring-lightSidebarDevider">
              <span class="sr-only">{{ $t('Open sidebar') }}</span>
              <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path clip-rule="evenodd" fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
              </svg>
          </button>
        </div>
        <div class="flex items-center gap-4">
          <component 
            v-if="coreStore?.adminUser"
            v-for="c in coreStore?.config?.globalInjections?.header || []"
            :is="getCustomComponent(c)"
            :meta="c.meta"
            :adminUser="coreStore.adminUser"
          />

          <Tooltip v-if="coreStore.isInternetError">
            <IconWifiOff class="blinking-icon w-8 h-8 text-red-500 hover:scale-110 transition-transform duration-200" />
            <template #tooltip>
              {{$t('Internet connection lost')}}
            </template>
          </Tooltip>

          <span  
            v-if="!coreStore.config?.singleTheme"
            class="flex items-center gap-1 block py-2 text-sm text-black  dark:text-darkSidebarTextHover dark:hover:text-darkSidebarTextActive" role="menuitem">
            <IconMoonSolid class="w-6 h-6 text-blue-300 hover:scale-110 cursor-pointer transition-transform duration-200" @click="toggleTheme" v-if="coreStore.theme !== 'dark'" />
            <IconSunSolid class="w-6 h-6 text-yellow-300 hover:scale-110 cursor-pointer transition-transform duration-200" @click="toggleTheme" v-else />
          </span>

          <div>
            <button 
              ref="dropdownUserButton"
              type="button" class=" hover:scale-110 transition-transform duration-200 flex text-sm bg- rounded-full focus:ring-4 focus:ring-lightSidebarDevider dark:focus:ring-darkSidebarDevider dark:bg-" aria-expanded="false" data-dropdown-toggle="dropdown-user">
              <span class="sr-only">{{ $t('Open user menu') }}</span>
                <img 
                  v-if="coreStore.userAvatarUrl"
                  class="w-8 h-8 rounded-full object-cover" 
                  :src="coreStore.userAvatarUrl" 
                  alt="user photo"
                />
              <svg v-else class="w-8 h-8 text-lightNavbarIcons dark:text-darkNavbarIcons" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 20a7.966 7.966 0 0 1-5.002-1.756l.002.001v-.683c0-1.794 1.492-3.25 3.333-3.25h3.334c1.84 0 3.333 1.456 3.333 3.25v.683A7.966 7.966 0 0 1 12 20ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10c0 5.5-4.44 9.963-9.932 10h-.138C6.438 21.962 2 17.5 2 12Zm10-5c-1.84 0-3.333 1.455-3.333 3.25S10.159 13.5 12 13.5c1.84 0 3.333-1.455 3.333-3.25S13.841 7 12 7Z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
          <div class="z-50 hidden my-4 text-base list-none bg-lightUserMenuBackground divide-y divide-lightUserMenuBorder text-lightUserMenuText rounded shadow dark:shadow-black dark:bg-darkUserMenuBackground dark:divide-darkUserMenuBorder text-darkUserMenuText dark:shadow-black" id="dropdown-user">
            <div class="px-4 py-3" role="none">
              <p class="text-sm text-gray-900 dark:text-darkNavbarText" role="none" v-if="coreStore.userFullname">
                {{ coreStore.userFullname }}
              </p>
              <p class="text-sm font-medium text-gray-900 truncate dark:text-darkSidebarText" role="none">
                {{ coreStore.username }}
              </p>
            </div>

            <ul class="py-1" role="none">
              <li v-for="c in userMenuComponents" class="bg-lightUserMenuItemBackground hover:bg-lightUserMenuItemBackgroundHover text-lightUserMenuItemText hover:text-lightUserMenuItemText dark:bg-darkUserMenuItemBackground dark:hover:bg-darkUserMenuItemBackgroundHover dark:text-darkUserMenuItemText dark:hover:darkUserMenuItemTextHover" >
                <component 
                  :is="getCustomComponent(c)"
                  :meta="c.meta"
                  :adminUser="coreStore.adminUser"
                />
              </li>
              <li v-if="coreStore?.config?.settingPages && coreStore.config.settingPages.length > 0">
                <UserMenuSettingsButton />
              </li>
              <li>
                <button @click="logout" class="cursor-pointer flex items-center gap-1 block px-4 py-2 text-sm bg-lightUserMenuItemBackground hover:bg-lightUserMenuItemBackgroundHover text-lightUserMenuItemText hover:text-lightUserMenuItemText dark:bg-darkUserMenuItemBackground dark:hover:bg-darkUserMenuItemBackgroundHover dark:text-darkUserMenuItemText dark:hover:darkUserMenuItemTextHover w-full" role="menuitem">{{ $t('Sign out') }}</button>
              </li>
            </ul>
          </div>
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
      <div class="p-0 dark:border-gray-700 mt-14">
        <RouterView/>     
      </div>
    </div> 

    <div v-else-if="routerIsReady && loginRedirectCheckIsReady && publicConfigLoaded">
      <RouterView />
    </div>

    <div v-else class="flex items-center justify-center h-screen">
      <div class="text-3xl text-gray-400 animate-bounce">
        <Spinner class="w-8 h-8" />
      </div>
    </div>
    <AcceptModal />
    <div v-if="toastStore.toasts.length>0" class="fixed bottom-5 right-5 flex gap-1 flex-col-reverse z-[100]">
      <transition-group
        name="fade"
        tag="div"
        class="flex flex-col-reverse gap-1"
      >
        <Toast :toast="t" @close="toastStore.removeToast(t)" v-for="(t,i) in toastStore.toasts" :key="`t-${t.id}`" ></Toast>
      </transition-group>
    </div>


    <div v-if="sideBarOpen"
         @click="hideSidebar"
         drawer-backdrop="" class="bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-20">
    </div>

    <component
      v-for="c in coreStore?.config?.globalInjections?.everyPageBottom || []"
      :is="getCustomComponent(c)"
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

  .fade-leave-active {
    @apply transition-opacity duration-500;
  }
  .fade-leave-to {
    @apply opacity-0;
  }
  .fade-enter-active {
    @apply transition-opacity duration-500;
  }
  .fade-enter-from {
    @apply opacity-0;
  }
  .fade-enter-to {
    @apply opacity-100;
  }

  @media (max-width: 640px) {
    .af-content-wrapper {
      margin-left: 0 !important;
      max-width: 100% !important;
    }
  }


</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch, onBeforeMount } from 'vue';
import { RouterView } from 'vue-router';
import { Dropdown } from 'flowbite'
import './index.scss'
import { useCoreStore } from '@/stores/core';
import { useUserStore } from '@/stores/user';
import { IconMoonSolid, IconSunSolid } from '@iconify-prerendered/vue-flowbite';
import { IconWifiOff } from '@iconify-prerendered/vue-humbleicons';
import AcceptModal from './components/AcceptModal.vue';
import Sidebar from './components/Sidebar.vue';
import { useRoute, useRouter } from 'vue-router';
import { createHead } from 'unhead'
import { getCustomComponent } from '@/utils';
import Toast from './components/Toast.vue';
import {useToastStore} from '@/stores/toast';
import { initFrontedAPI } from '@/adminforth';
import { useAdminforth } from '@/adminforth';
import UserMenuSettingsButton from './components/UserMenuSettingsButton.vue';
import { Tooltip, Spinner } from '@/afcl'

const coreStore = useCoreStore();
const toastStore = useToastStore();
const userStore = useUserStore();

const { menu } = useAdminforth();
let { closeUserMenuDropdown } = useAdminforth();

initFrontedAPI()

createHead()
const sideBarOpen = ref(false);
const route = useRoute();
const router = useRouter();
const publicConfigLoaded = ref(false);
const dropdownUserButton = ref(null);


const routerIsReady = ref(false);
const loginRedirectCheckIsReady = ref(false);

const isSidebarIconOnly = ref(localStorage.getItem('afIconOnlySidebar') === 'true');

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

async function loadMenu() {
  await initRouter();
  if (route.meta.sidebarAndHeader !== 'none') {
    // for custom layouts we don't need to fetch menu
    await coreStore.fetchMenuAndResource();
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

// TODO - useHead not working in this way
// useHead({
//   title: title.value
// })
watch(title, (title) => {
  document.title = title;
})

watch(route, () => {
  // Handle preferIconOnly layout
  if (route.meta?.sidebarAndHeader === 'preferIconOnly') {
    isSidebarIconOnly.value = true;
  }
});


watch(dropdownUserButton, (dropdownUserButton) => {
  if (dropdownUserButton) {
    const dd = new Dropdown(
      document.querySelector('#dropdown-user') as HTMLElement,
      document.querySelector('[data-dropdown-toggle="dropdown-user"]') as HTMLElement,
    );
    closeUserMenuDropdown = () => {
      dd.hide();
    }
  }
})

async function loadPublicConfig() {
  await coreStore.getPublicConfig();
  publicConfigLoaded.value = true;
}


// initialize components based on data attribute selectors
onMounted(async () => {
  loadMenu(); // run this in async mode
  loadPublicConfig(); // and this
  // before init flowbite we have to wait router initialized because it affects dom(our v-ifs) and fetch menu
  await initRouter();

  menu.refreshMenuBadges = async () => {
    await coreStore.fetchMenuBadges();
  }

  window.addEventListener('online', () => coreStore.isInternetError = false);
  window.addEventListener('offline', () => coreStore.isInternetError = true);
})

onBeforeMount(()=>{
  theme.value = window.localStorage.getItem('af__theme') || 'light';
  document.documentElement.classList.toggle('dark', theme.value === 'dark');
})

watch(() => coreStore.config?.singleTheme, (singleTheme) => {
  if (singleTheme) {
    theme.value = singleTheme;
    window.localStorage.setItem('af__theme', singleTheme);
    document.documentElement.classList.toggle('dark', theme.value === 'dark');
  }
}, { immediate: true })

</script>
