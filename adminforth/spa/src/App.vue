<template>
  <div>
    <nav 
      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady && defaultLayout"
      class="fixed h-14 top-0 z-20 w-full border-b shadow-sm bg-lightNavbar shadow-headerShadow dark:bg-darkNavbar dark:border-darkSidebarDevider"
    >
      <div class="px-3 lg:px-5 lg:pl-3 flex items-center justify-between h-full w-full" >
          <div class="flex items-center justify-start rtl:justify-end">
            <button @click="sideBarOpen = !sideBarOpen"
              type="button" class="inline-flex items-center p-2 text-sm  rounded-lg sm:hidden hover:bg-lightSidebarItemHover focus:outline-none focus:ring-2 focus:ring-lightSidebarDevider dark:text-darkSidebarIcons dark:hover:bg-darkSidebarHover dark:focus:ring-lightSidebarDevider">
                <span class="sr-only">{{ $t('Open sidebar') }}</span>
                <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clip-rule="evenodd" fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                </svg>
            </button>
          </div>
          <div class="flex items-center">
            <component 
              v-if="coreStore?.adminUser"
              v-for="c in coreStore?.config?.globalInjections?.header || []"
              :is="getCustomComponent(c)"
              :meta="c.meta"
              :adminUser="coreStore.adminUser"
            />

            <div class="flex items-center ms-3 ">
              <span               
                @click="toggleTheme" class="cursor-pointer flex items-center gap-1 block px-4 py-2 text-sm text-black hover:bg-lightHtml dark:text-darkSidebarTextHover dark:hover:bg-darkHtml dark:hover:text-darkSidebarTextActive" role="menuitem">
                <IconMoonSolid class="w-5 h-5 text-blue-300" v-if="coreStore.theme !== 'dark'" />
                <IconSunSolid class="w-5 h-5 text-yellow-300" v-else />
              </span>
              <div>
                <button 
                  ref="dropdownUserButton"
                  type="button" class="flex text-sm bg- rounded-full focus:ring-4 focus:ring-lightSidebarDevider dark:focus:ring-darkSidebarDevider dark:bg-" aria-expanded="false" data-dropdown-toggle="dropdown-user">
                  <span class="sr-only">{{ $t('Open user menu') }}</span>
                  <svg class="w-8 h-8 text-lightNavbarIcons dark:text-darkNavbarIcons" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M12 20a7.966 7.966 0 0 1-5.002-1.756l.002.001v-.683c0-1.794 1.492-3.25 3.333-3.25h3.334c1.84 0 3.333 1.456 3.333 3.25v.683A7.966 7.966 0 0 1 12 20ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10c0 5.5-4.44 9.963-9.932 10h-.138C6.438 21.962 2 17.5 2 12Zm10-5c-1.84 0-3.333 1.455-3.333 3.25S10.159 13.5 12 13.5c1.84 0 3.333-1.455 3.333-3.25S13.841 7 12 7Z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>

              <div class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded shadow dark:shadow-black dark:bg-darkSidebar dark:divide-darkSidebarDevider dark:shadow-black" id="dropdown-user">
                <div class="px-4 py-3" role="none">
                  <p class="text-sm text-gray-900 dark:text-darkNavbarText" role="none" v-if="coreStore.userFullname">
                    {{ coreStore.userFullname }}
                  </p>
                  <p class="text-sm font-medium text-gray-900 truncate dark:text-darkSidebarText" role="none">
                    {{ coreStore.username }}
                  </p>
                </div>

                <ul class="py-1" role="none">
                  <li v-for="c in coreStore?.config?.globalInjections?.userMenu || []" >
                    <component 
                      :is="getCustomComponent(c)"
                      :meta="c.meta"
                      :adminUser="coreStore.adminUser"
                    />
                  </li>
                  <li>
                    <button @click="logout" class="cursor-pointer flex items-center gap-1 block px-4 py-2 text-sm text-black hover:bg-html dark:text-darkSidebarTextHover dark:hover:bg-darkSidebarItemHover dark:hover:text-darkSidebarTextActive w-full" role="menuitem">{{ $t('Sign out') }}</button>
                  </li>
                </ul>
              </div>
            </div>
        </div>
      </div>
    </nav>

    <aside 
      ref="sidebarAside"
      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady && defaultLayout"
      id="logo-lightSidebar" class="fixed border-none top-0 left-0 z-30 w-64 h-screen  transition-transform bg-lightSidebar dark:bg-darkSidebar border-r border-lightSidebarBorder  sm:translate-x-0 dark:bg-darkSidebar dark:border-darkSidebarBorder"
      :class="{ '-translate-x-full': !sideBarOpen, 'transform-none': sideBarOpen }"
      aria-label="Sidebar"
    >
      <div class="h-full px-3 pb-4 overflow-y-auto bg-lightSidebar dark:bg-darkSidebar border-r border-lightSidebarBorder dark:border-darkSidebarBorder">
        <div class="flex ms-2 md:me-24  m-4  ">
          <img :src="loadFile(coreStore.config?.brandLogo || '@/assets/logo.svg')" :alt="`${ coreStore.config?.brandName } Logo`" class="h-8 me-3"  />
          <span 
            v-if="coreStore.config?.showBrandNameInSidebar"
            class="self-center text-lightNavbarText-size font-semibold sm:text-lightNavbarText-size whitespace-nowrap dark:text-darkSidebarText text-lightSidebarText"
          >
            {{ coreStore.config?.brandName }}
          </span>
        </div>

        <ul class="space-y-2 font-medium">
          <template v-for="(item, i) in coreStore.menu" :key="`menu-${i}`">
            <div v-if="item.type === 'divider'" class="border-t border-lightSidebarDevider dark:border-darkSidebarDevider"></div>
            <div v-else-if="item.type === 'gap'" class="flex items-center justify-center h-8"></div>
            <div v-else-if="item.type === 'heading'" class="flex items-center justify-left pl-2 h-8 text-lightSidebarHeading dark:text-darkSidebarHeading
            ">{{ item.label }}</div>
            <li v-else-if="item.children" class="  ">
              <button @click="clickOnMenuItem(i)" type="button" class="flex items-center w-full p-2 text-base text-lightSidebarText rounded-default transition duration-75  group hover:bg-lightSidebarItemHover hover:text-lightSidebarTextHover dark:text-darkSidebarText dark:hover:bg-darkSidebarHover dark:hover:text-darkSidebarTextHover"
                  :aria-controls="`dropdown-example${i}`"
                  :data-collapse-toggle="`dropdown-example${i}`"
              >

                <component v-if="item.icon" :is="getIcon(item.icon)" class="w-5 h-5 text-lightSidebarIcons group-hover:text-lightSidebarIconsHover transition duration-75    dark:group-hover:text-darkSidebarIconsHover dark:text-darkSidebarIcons" ></component>

                <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">{{ item.label }}

                  <span v-if="item.badge" class="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium rounded-full bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
                    fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent">
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

                <svg :class="{'rotate-180':  opened.includes(i) }" class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"  fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
              </button>

              <ul :id="`dropdown-example${i}`" role="none" class="pt-1 space-y-1" :class="{ 'hidden': !opened.includes(i) }">
                <template v-for="(child, j) in item.children" :key="`menu-${i}-${j}`">
                  <li>
                      <MenuLink :item="child" isChild="true" @click="hideSidebar"/>
                    </li>
                </template>
            </ul>
        </li>
        <li v-else>
          <MenuLink :item="item" @click="hideSidebar"/>
        </li>
        </template>
      </ul>


        <div id="dropdown-cta" class="p-4 mt-6 rounded-lg bg-lightAnnouncementBG dark:bg-darkAnnouncementBG 
          fill-lightAnnouncementText dark:fill-darkAccent text-lightAnnouncementText dark:text-darkAccent text-sm" role="alert"
          v-if="ctaBadge"
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
              
              data-dismiss-target="#dropdown-cta" aria-label="Close"
              v-if="ctaBadge?.closable" @click="closeCTA"
            >
              <span class="sr-only">Close</span>
              <svg class="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
              </svg>
            </button>
          </div>
          <p class="mb-3 text-sm " v-if="ctaBadge.html" v-html="ctaBadge.html"></p>
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

    <div class="sm:ml-64 max-w-[100vw] sm:max-w-[calc(100%-16rem)]" 
      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady && defaultLayout">
      <div class="p-0 dark:border-gray-700 mt-14">
        <RouterView/>     
      </div>
    </div> 

    <div v-else-if="routerIsReady && loginRedirectCheckIsReady && publicConfigLoaded">
      <RouterView />
    </div>

    <div v-else class="flex items-center justify-center h-screen">
      <div class="text-3xl text-gray-400 animate-bounce">
        <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
        <span class="sr-only">{{ $t('Loading...') }}</span>
      </div>
    </div>
    <AcceptModal />
    <div v-if="toastStore.toasts.length>0" class="fixed bottom-5 right-5 flex gap-1 flex-col-reverse z-50">
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


  </div>

</template>

<style lang="scss" scoped>

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

</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch, onBeforeMount, nextTick, type Ref } from 'vue';
import { RouterView } from 'vue-router';
import { Dropdown } from 'flowbite'
import './index.scss'
import { useCoreStore } from '@/stores/core';
import { useUserStore } from '@/stores/user';
import { IconMoonSolid, IconSunSolid } from '@iconify-prerendered/vue-flowbite';
import AcceptModal from './components/AcceptModal.vue';
import MenuLink from './components/MenuLink.vue';
import { useRoute, useRouter } from 'vue-router';
import { getIcon, verySimpleHash } from '@/utils';
import { createHead } from 'unhead'
import { loadFile } from '@/utils';
import Toast from './components/Toast.vue';
import {useToastStore} from '@/stores/toast';
import { FrontendAPI } from '@/composables/useStores';
import { getCustomComponent } from '@/utils';
import type { AdminForthConfigMenuItem, AnnouncementBadgeResponse } from './types/Common';
import { Tooltip } from '@/afcl';


const coreStore = useCoreStore();
const toastStore = useToastStore();
const userStore = useUserStore();
const frontendApi = new FrontendAPI();
frontendApi.init();

createHead()
const sideBarOpen = ref(false);
const defaultLayout = ref(true);
const route = useRoute();
const router = useRouter();
//create a ref to store the opened menu items with ts type;
const opened = ref<string[]>([]);
const publicConfigLoaded = ref(false);
const dropdownUserButton = ref(null);

const sidebarAside = ref(null);

const routerIsReady = ref(false);
const loginRedirectCheckIsReady = ref(false);

const loggedIn = computed(() => !!coreStore?.adminUser);

const theme = ref('light');

function hideSidebar(): void {
  sideBarOpen.value = false;
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  coreStore.toggleTheme();
}

function clickOnMenuItem(label: string) {
  if (opened.value.includes(label)) {
    opened.value = opened.value.filter((item) => item !== label);
  } else {
    opened.value.push(label);
  }
 
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
  if (!route.meta.customLayout) {
    // for custom layouts we don't need to fetch menu
    await coreStore.fetchMenuAndResource();
  }
  loginRedirectCheckIsReady.value = true;
}

function handleCustomLayout() {
  if (route.meta?.customLayout) {
    defaultLayout.value = false;
  } else {
    defaultLayout.value = true;
  }
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

watch([route, () => coreStore.resourceById, () => coreStore.config], async () => {
  handleCustomLayout()
  await new Promise((resolve) => setTimeout(resolve, 0));
 
});

watch(()=>coreStore.menu, () => {
    coreStore.menu.forEach((item, i) => {
    if (item.open) {
      opened.value.push(i);
    };
  });
})

watch(dropdownUserButton, (dropdownUserButton) => {
  if (dropdownUserButton) {
    const dd = new Dropdown(
      document.querySelector('#dropdown-user') as HTMLElement,
      document.querySelector('[data-dropdown-toggle="dropdown-user"]') as HTMLElement,
    );
    window.adminforth.closeUserMenuDropdown = () => {
      dd.hide();
    }
  }
})

async function loadPublicConfig() {
  await coreStore.getPublicConfig();
  publicConfigLoaded.value = true;
}

watch(sidebarAside, (sidebarAside) => {
  if (sidebarAside) {
    coreStore.fetchMenuBadges();
  }
})

// initialize components based on data attribute selectors
onMounted(async () => {
  loadMenu(); // run this in async mode
  loadPublicConfig(); // and this
  // before init flowbite we have to wait router initialized because it affects dom(our v-ifs) and fetch menu
  await initRouter();
  handleCustomLayout();

  window.adminforth.menu.refreshMenuBadges = async () => {
    await coreStore.fetchMenuBadges();
  }
})

onBeforeMount(()=>{
  theme.value = window.localStorage.getItem('af__theme') || 'light';
  document.documentElement.classList.toggle('dark', theme.value === 'dark');
})


const ctaBadge: Ref<(AnnouncementBadgeResponse & { hash: string; }) | null> = computed(() => {
  const badge = coreStore.config?.announcementBadge;
  if (!badge) {
    return null;
  }
  const hash = badge.closable ? verySimpleHash(JSON.stringify(badge)) : '';
  if (badge.closable && window.localStorage.getItem(`ctaBadge-${hash}`)) {
    return null;
  }
  return {...badge, hash};
});

function closeCTA() {
  if (!ctaBadge.value) {
    return;
  }
  const hash = ctaBadge.value.hash;
  window.localStorage.setItem(`ctaBadge-${hash}`, '1');
}


</script>
