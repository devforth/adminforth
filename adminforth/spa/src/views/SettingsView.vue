<template>
  <div>
    <nav 
      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady && defaultLayout"
      class="fixed h-14 top-0 z-20 w-full border-b shadow-sm bg-lightNavbar shadow-headerShadow dark:bg-darkNavbar dark:border-darkSidebarDevider"
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
                v-if="!coreStore.config?.singleTheme"
                @click="toggleTheme" class="cursor-pointer flex items-center gap-1 block px-4 py-2 text-sm text-black  dark:text-darkSidebarTextHover dark:hover:text-darkSidebarTextActive" role="menuitem">
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
  </div>
</template>

<script setup lang="ts">

import { useCoreStore } from '@/stores/core';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
const coreStore = useCoreStore();
const router = useRouter();

const loggedIn = computed(() => !!coreStore?.adminUser);
const routerIsReady = ref(false);
const loginRedirectCheckIsReady = ref(false);

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
</script>
