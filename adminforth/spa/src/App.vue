<template>
  <nav 
    v-if="loggedIn"

    class="fixed h-14 top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
    <div class="px-3 py-3 lg:px-5 lg:pl-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center justify-start rtl:justify-end">
          <button data-drawer-target="logo-sidebar" data-drawer-toggle="logo-sidebar" aria-controls="logo-sidebar" type="button" class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
              <span class="sr-only">Open sidebar</span>
              <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path clip-rule="evenodd" fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
              </svg>
          </button>
          <div  class="flex ms-2 md:me-24">
            <img src="https://flowbite.com/docs/images/logo.svg" class="h-8 me-3" alt="FlowBite Logo" />
            <span class="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
              {{ coreStore.config?.brandName }}
            </span>
          </div>
        </div>
        <div class="flex items-center">
          

            <div class="flex items-center ms-3">
              <div>
                <button type="button" class="flex text-sm bg-gray-100 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 dark:bg-gray-700" aria-expanded="false" data-dropdown-toggle="dropdown-user">
                  <span class="sr-only">Open user menu</span>
                  <svg class="w-8 h-8 text-gray-400 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M12 20a7.966 7.966 0 0 1-5.002-1.756l.002.001v-.683c0-1.794 1.492-3.25 3.333-3.25h3.334c1.84 0 3.333 1.456 3.333 3.25v.683A7.966 7.966 0 0 1 12 20ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10c0 5.5-4.44 9.963-9.932 10h-.138C6.438 21.962 2 17.5 2 12Zm10-5c-1.84 0-3.333 1.455-3.333 3.25S10.159 13.5 12 13.5c1.84 0 3.333-1.455 3.333-3.25S13.841 7 12 7Z" clip-rule="evenodd"/>
                  </svg>

                </button>
              </div>
              <div class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded shadow dark:shadow-black dark:bg-gray-700 dark:divide-gray-600 dark:shadow-black" id="dropdown-user">
                <div class="px-4 py-3" role="none">
                  <p class="text-sm text-gray-900 dark:text-white" role="none" v-if="coreStore.userFullname">
                    {{ coreStore.userFullname }}
                  </p>
                  <p class="text-sm font-medium text-gray-900 truncate dark:text-gray-300" role="none">
                    {{ coreStore.username }}
                  </p>
                </div>
                <ul class="py-1" role="none">
                  <li >
                    <span @click="toggleTheme" class=" cursor-pointer flex items-center	 gap-1 block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                      {{ theme === 'dark' ? 'Light' : 'Dark' }}
                      <IconMoonSolid class="w-5 h-5 text-blue-300
                      " v-if="theme !== 'dark'"/>
                      <IconSunSolid class="w-5 h-5 text-yellow-300
                      " v-else/>
                      mode
                    </span>
                  </li>
                  
                  <li>
                    <button @click="logout" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">Sign out</button>
                </li>
                </ul>
              </div>
            </div>
          </div>
      </div>
    </div>
  </nav>


  <aside 
    v-if="loggedIn"

    id="logo-sidebar" class="fixed top-0 left-0 z-10 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700" aria-label="Sidebar">
    <div class="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
        <ul class="space-y-2 font-medium">
          <template v-for="(item, i) in coreStore.menu" :key="`menu-${i}`">
            <div v-if="item.type === 'divider'" class="border-t border-gray-200 dark:border-gray-700"></div>
            <div v-else-if="item.type === 'gap'" class="flex items-center justify-center h-8"></div>
            
            <li v-else-if="item.children">
              <button  type="button" class="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" 
                  :aria-controls="`dropdown-example${i}`"
                  :data-collapse-toggle="`dropdown-example${i}`"
              >
                <component v-if="item.icon" :is="getIcon(item.icon)" class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" ></component>

                <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">{{ item.label }}</span>
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
              </button>

              <ul :id="`dropdown-example${i}`" role="none" class="py-2 space-y-2" :class="{ 'hidden': !item.open }">
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
    
  <div class="p-4 sm:ml-64 dark:bg-gray-800" v-if="loggedIn">
    <div class="p-0 dark:border-gray-700 mt-14">
        <RouterView/>     
    </div>
  </div> 

  <div v-else-if="routerIsReady">
    <RouterView/>
  </div>
  <AcceptModal />
</template>

<style scoped>
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch, defineComponent } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { initFlowbite } from 'flowbite'
import './index.scss'
import { useCoreStore } from '@/stores/core';
import { IconMoonSolid, IconSunSolid } from '@iconify-prerendered/vue-flowbite';
import AcceptModal from './components/AcceptModal.vue';
import MenuLink from './components/MenuLink.vue';
import { useRoute, useRouter } from 'vue-router';
import { getIcon } from '@/utils';
import { useHead } from 'unhead'
import { createHead } from 'unhead'
const coreStore = useCoreStore();


createHead()






const route = useRoute();
const router = useRouter();
const title = ref('');


const routerIsReady = ref(false);

const loggedIn = computed(() => route.name !== 'login' && routerIsReady.value);

const theme = ref('light');

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark');
}

async function logout() {
  await coreStore.logout();
  router.push({ name: 'login' });
}




async function initRouter() {
  await router.isReady();
  routerIsReady.value = true;
}

// initialize components based on data attribute selectors
onMounted(async () => {
  initRouter();
  initFlowbite();
  await coreStore.fetchMenuAndResource();
  title.value = coreStore.config.title || 'Admin Forth';
  useHead({
  title: title.value,
  
})
})

</script>
