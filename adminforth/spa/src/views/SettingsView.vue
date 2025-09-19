<template>
  <div>
    <nav 
      v-if="loggedIn && routerIsReady && loginRedirectCheckIsReady"
      class="h-14 top-0 z-20 w-full border-b shadow-sm bg-lightNavbar shadow-headerShadow dark:bg-darkNavbar dark:border-darkSidebarDevider"
    >
      <div class="af-header px-3 lg:px-5 lg:pl-3 flex items-center justify-end h-full w-full" >
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
                  <li v-if="coreStore?.config?.settingPages && coreStore.config.settingPages.length > 0">
                    <UserMenuSettingsButton />
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
  <div class="m-4 h-full w-full">

    <div v-if="!coreStore?.config?.settingPages || coreStore?.config?.settingPages.length === 0">
      <p>No setting pages configured or still loading...</p>
    </div>
      <VerticalTabs v-else ref="VerticalTabsRef" @update:active-tab="setURL({slug: $event, pageLabel: ''})">
      <template v-for="(c,i) in coreStore?.config?.settingPages" :key="`tab:${settingPageSlotName(c,i)}`" v-slot:['tab:'+settingPageSlotName(c,i)]>
        <div class="flex items-center justify-center whitespace-nowrap w-full px-4 gap-2" @click="setURL(c)">
          <component v-if="c.icon" :is="getIcon(c.icon)" class="w-5 h-5 group-hover:text-lightSidebarIconsHover transition duration-75 dark:group-hover:text-darkSidebarIconsHover dark:text-darkSidebarIcons" ></component>
          {{ c.pageLabel }}
        </div>
      </template>

      <template v-for="(c,i) in coreStore?.config?.settingPages" :key="`${settingPageSlotName(c,i)}-content`" v-slot:[settingPageSlotName(c,i)]>
        <component 
          :is="getCustomComponent({file: c.component || ''})"
          :resource="coreStore.resource"
          :adminUser="coreStore.adminUser"
        />
      </template>
    </VerticalTabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCoreStore } from '@/stores/core';
import { useUserStore } from '@/stores/user';
import { getCustomComponent, getIcon } from '@/utils';
import { Dropdown } from 'flowbite';
import { IconMoonSolid, IconSunSolid } from '@iconify-prerendered/vue-flowbite';
import adminforth from '@/adminforth';
import { VerticalTabs } from '@/afcl'
import { useRoute } from 'vue-router'

const route = useRoute()
const coreStore = useCoreStore();
const userStore = useUserStore();
const router = useRouter();

const loggedIn = computed(() => { return !!coreStore?.adminUser });
const routerIsReady = ref(false);
const loginRedirectCheckIsReady = ref(false);
const sideBarOpen = ref(false);
const theme = ref('light');
const dropdownUserButton = ref<HTMLElement | null>(null);
const VerticalTabsRef = ref();

async function initRouter() {
  await router.isReady();
  routerIsReady.value = true;
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  coreStore.toggleTheme();
}

function settingPageSlotName(c: { slug?: string; pageLabel?: string }, idx: number) {
  const base = (c.slug && c.slug.trim()) || (c.pageLabel && c.pageLabel.trim()) || `tab-${idx}`;
  return base
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-') || `tab-${idx}`;
}


async function logout() {
  userStore.unauthorize();
  await userStore.logout();
  router.push({ name: 'login' })
}

watch(dropdownUserButton, (el) => {
  if (el) {
    const dd = new Dropdown(
      document.querySelector('#dropdown-user') as HTMLElement,
      document.querySelector('[data-dropdown-toggle="dropdown-user"]') as HTMLElement,
    );
    adminforth.closeUserMenuDropdown = () => dd.hide();
  }
});

onMounted(async () => {
  await loadMenu();
  loginRedirectCheckIsReady.value = true;
  const routeParamsPage = route?.params?.page;
  if (!routeParamsPage) {
    if (coreStore.config?.settingPages?.[0]) {
      setURL(coreStore.config.settingPages[0]);
    }
  } else {
    let isParamInTabs;
    for (const c of coreStore?.config?.settingPages || []) {
      if (c.slug ? c.slug === routeParamsPage : slugifyString(c.pageLabel) === routeParamsPage) {
        isParamInTabs = true;
        break;
      }
    }
    if (isParamInTabs) {
      VerticalTabsRef.value.setActiveTab(routeParamsPage);
    } else {
      if (coreStore.config?.settingPages?.[0]) {
        setURL(coreStore.config.settingPages[0]);
      }
    }
  }
});

async function loadMenu() {
  await initRouter();
  await coreStore.fetchMenuAndResource();
}

function slugifyString(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-');
}

function setURL(item: {
  pageLabel: string;
  slug?: string | undefined;
}) {
  const slug = item?.slug;
  if (slug) {
    router.replace({
      name: 'settings',
      params: { page: slug }
    });
  } else {
    const slugified = slugifyString(item.pageLabel);
    router.replace({
      name: 'settings',
      params: { page: slugified }
    });
  }
}
</script>
