<template>
  <div v-if="defaultLayout" >

    <nav 
      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady"
      class="fixed h-14 top-0 z-20 w-full  border-b shadow-sm bg-lightNavbar shadow-headerShadow dark:bg-darkNavbar dark:border-darkSidebarDevider">
      <div class="px-3 py-3 lg:px-5 lg:pl-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center justify-start rtl:justify-end">
            <button @click="sideBarOpen = !sideBarOpen"
            type="button" class="inline-flex items-center p-2 text-sm  rounded-lg sm:hidden hover:bg-lightSidebarItemHover focus:outline-none focus:ring-2 focus:ring-lightSidebarDevider dark:text-darkSidebarIcons dark:hover:bg-darkSidebarHover dark:focus:ring-lightSidebarDevider">
                <span class="sr-only">Open sidebar</span>
                <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clip-rule="evenodd" fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                </svg>
            </button>
            
          </div>
          <div class="flex items-center">
            <div class="flex items-center ms-3 ">
              <div>
                <button type="button" class="flex text-sm bg- rounded-full focus:ring-4 focus:ring-lightSidebarDevider dark:focus:ring-darkSidebarDevider dark:bg-" aria-expanded="false" data-dropdown-toggle="dropdown-user">
                  <span class="sr-only">Open user menu</span>
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
                  <li>
                    <span @click="toggleTheme" class="cursor-pointer flex items-center gap-1 block px-4 py-2 text-sm text-black hover:bg-lightHtml dark:text-darkSidebarTextHover dark:hover:bg-darkHtml dark:hover:text-darkSidebarTextActive" role="menuitem">
                      {{ theme === 'dark' ? 'Light' : 'Dark' }}
                      <IconMoonSolid class="w-5 h-5 text-blue-300" v-if="theme !== 'dark'" />
                      <IconSunSolid class="w-5 h-5 text-yellow-300" v-else />
                      mode
                    </span>
                  </li>
                  <li>
                    <button @click="logout" class="cursor-pointer flex items-center gap-1 block px-4 py-2 text-sm text-black hover:bg-html dark:text-darkSidebarTextHover dark:hover:bg-darkSidebarItemHover dark:hover:text-darkSidebarTextActive w-full" role="menuitem">Sign out</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
   </nav>



    <aside 

      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady"

      id="logo-lightSidebar" class="fixed bg-lightSidebar border-none top-0 left-0 z-20 w-64 h-screen  transition-transform bg-lightSidebar dark:bg-darkSidebar border-r border-lightSidebarBorder  sm:translate-x-0 dark:bg-darkSidebar dark:border-darkSidebarBorder" 
      :class="{ '-translate-x-full': !sideBarOpen, 'transform-none': sideBarOpen }"
      aria-label="Sidebar"
    >
      <div class="h-full px-3 pb-4 overflow-y-auto bg-lightSidebar dark:bg-darkSidebar border-r border-lightSidebarBorder dark:border-darkSidebarBorder">
        <div class="flex ms-2 md:me-24  m-4  ">
          <img :src="loadFile(coreStore.config?.brandLogo || '@/assets/logo.svg')" :alt="`${ coreStore.config?.brandName } Logo`" class="h-8 me-3"  />
          <span class="self-center text-lightNavbarText-size font-semibold sm:text-lightNavbarText-size whitespace-nowrap dark:text-darkSidebarText text-lightSidebarText">
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
                  <component v-if="item.icon" :is="getIcon(item.icon)" class="w-5 h-5 text-lightSidebarIcons group-hover:text-lightSidebarIconsHover transition duration-75   dark:group-hover:text-darkSidebarIconsHover dark:text-darkSidebarIcons" ></component>

                  <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">{{ item.label }}</span>
                  <svg :class="{'rotate-180':  opened.includes(i) }" class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"  fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                  </svg>
                </button>

                <ul :id="`dropdown-example${i}`" role="none" class="pt-1 space-y-1" :class="{ 'hidden': !opened.includes(i) }">
                  <template v-for="(child, j) in item.children" :key="`menu-${i}-${j}`">
                    <li>
                      <MenuLink :item="child" isChild="true" />
                    </li>
                  </template>
                </ul> 
              </li>
              <li v-else>
                <MenuLink :item="item" />
              </li>
            </template>
          </ul>
      </div>
    </aside>
    

    <div class="sm:ml-64 dark:bg-gray-800" v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady">
      <div class="p-0 dark:border-gray-700 mt-14">
        <RouterView/>     
      </div>
    </div> 

    <div v-else-if="routerIsReady && loginRedirectCheckIsReady">
      <RouterView/>
    </div>
    <div v-else class="flex items-center justify-center h-screen">
      <div class="text-3xl text-gray-400 animate-bounce">
        <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
        <span class="sr-only">Loading...</span>
      </div>
    </div>
    <AcceptModal />
    <div v-if="toastStore.toasts.length>0" class="fixed bottom-5 right-5 flex gap-1 flex-col-reverse">
      <transition-group
        name="fade"
        tag="div"
        class="flex flex-col-reverse gap-1"
      >
        <Toast :toast="t" @close="toastStore.removeToast(t)" v-for="(t,i) in toastStore.toasts" :key="`t-${t.id}`" ></Toast>
      </transition-group>
    </div>

    <div v-if="sideBarOpen" 
    @click="sideBarOpen = false"
    
    drawer-backdrop="" class="bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-5"></div>


</div>
  <div v-else>
    <div v-if="routerIsReady && loginRedirectCheckIsReady">
      <RouterView/>
    </div>
    <AcceptModal />
    <div v-if="toastStore.toasts.length>0" class="fixed bottom-5 right-5 flex gap-1 flex-col-reverse">
      <transition-group
        name="fade"
        tag="div"
        class="flex flex-col-reverse gap-1"
      >
        <Toast :toast="t" @close="toastStore.removeToast(t)" v-for="(t,i) in toastStore.toasts" :key="`t-${t.id}`" ></Toast>
      </transition-group>
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
import { computed, onMounted, ref, watch, defineComponent, onBeforeMount } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { initFlowbite } from 'flowbite'
import './index.scss'
import { useCoreStore } from '@/stores/core';
import { useUserStore } from '@/stores/user';
import {useModalStore} from '@/stores/modal';
import { IconMoonSolid, IconSunSolid } from '@iconify-prerendered/vue-flowbite';
import AcceptModal from './components/AcceptModal.vue';
import MenuLink from './components/MenuLink.vue';
import { useRoute, useRouter } from 'vue-router';
import { getIcon } from '@/utils';
import { useHead } from 'unhead'
import { createHead } from 'unhead'
import { loadFile } from '@/utils';
import Toast from './components/Toast.vue';
import {useToastStore} from '@/stores/toast';
import { FrontendAPI } from '@/composables/useStores'
// import { link } from 'fs';
const coreStore = useCoreStore();
const modalStore = useModalStore();
const toastStore = useToastStore();
const userStore = useUserStore();
const frontendApi = new FrontendAPI();
frontendApi.init();
const splitAtLast = (str: string, separator: string) => {
  const index = str.lastIndexOf(separator);
  return [str.slice(0, index), str.slice(index + 1)];
}
createHead()
const sideBarOpen = ref(false);
const defaultLayout = ref(true);
const route = useRoute();
const router = useRouter();
const title = ref('');
//create a ref to store the opened menu items with ts type;
const opened = ref<string[]>([]);


const routerIsReady = ref(false);
const loginRedirectCheckIsReady = ref(false);

const loggedIn = computed(() => route.name !== 'login');

const theme = ref('light');

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark');
  window.localStorage.setItem('theme', theme.value);

}

function clickOnMenuItem (label: string) {
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
  await coreStore.fetchMenuAndResource();
  loginRedirectCheckIsReady.value = true;
}

function handleCustomLayout() {
  console.log(route)
  if (route.meta?.customLayout) {
    defaultLayout.value = false;
  } else {
    defaultLayout.value = true;
  }
  console.log(defaultLayout.value,route);
}



watch(route, () => {
  handleCustomLayout()
  title.value = `${coreStore.config?.title || coreStore.config?.brandName || 'Adminforth'} | ${ Object.values(route.params)[0] || route.meta.title || ' '}`;
  useHead({
    title: title.value,
  })
  

});

watch (()=>coreStore.menu, () => {
    coreStore.menu.forEach((item, i) => {
    if (item.open) {
      opened.value.push(i);
    };
  });
})

watch([loggedIn,  routerIsReady, loginRedirectCheckIsReady], ([l,r,lr]) => {
  if (l && r && lr) {
    setTimeout(() => {
      initFlowbite();
    }); 
  }
})

// initialize components based on data attribute selectors
onMounted(async () => {
  loadMenu(); // run this in async mode
  // before init flowbite we have to wait router initialized because it affects dom(our v-ifs) and fetch menu
  await initRouter()
  handleCustomLayout()
  
})

onBeforeMount(()=>{
  theme.value = window.localStorage.getItem('theme') || 'light';
  document.documentElement.classList.toggle('dark', theme.value === 'dark');
})

</script>
