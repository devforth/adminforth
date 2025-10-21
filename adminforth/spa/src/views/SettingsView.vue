<template>
  <div class="mt-20 h-full w-full" :class="{ 'hidden': initialTabSet === false }">
    <div v-if="!coreStore?.config?.settingPages || coreStore?.config?.settingPages.length === 0">
      <p>No setting pages configured or still loading...</p>
    </div>
      <VerticalTabs v-else ref="VerticalTabsRef" v-model:active-tab="activeTab" @update:active-tab="setURL({slug: $event, pageLabel: ''})">
      <template v-for="(c,i) in coreStore?.config?.settingPages" :key="`tab:${settingPageSlotName(c,i)}`" v-slot:['tab:'+c.slug]>
        <div class="flex items-center justify-center whitespace-nowrap w-full px-4 gap-2" @click="setURL(c)">
          <component v-if="c.icon" :is="getIcon(c.icon)" class="w-5 h-5 group-hover:text-lightSidebarIconsHover transition duration-75 dark:group-hover:text-darkSidebarIconsHover dark:text-darkSidebarIcons" ></component>
          {{ c.pageLabel }}
        </div>
      </template>

      <template v-for="(c,i) in coreStore?.config?.settingPages" :key="`${settingPageSlotName(c,i)}-content`" v-slot:[c.slug]>
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
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCoreStore } from '@/stores/core';
import { getCustomComponent, getIcon } from '@/utils';
import { Dropdown } from 'flowbite';
import adminforth from '@/adminforth';
import { VerticalTabs } from '@/afcl'
import { useRoute } from 'vue-router'

const route = useRoute()
const coreStore = useCoreStore();
const router = useRouter();

const routerIsReady = ref(false);
const loginRedirectCheckIsReady = ref(false);
const dropdownUserButton = ref<HTMLElement | null>(null);
const VerticalTabsRef = ref();
const activeTab = ref('');
const initialTabSet = ref(false);

watch(() => route?.params?.page, (val) => {
  handleURLChange(val as string | null);
});

async function initRouter() {
  await router.isReady();
  routerIsReady.value = true;
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
  if (coreStore.adminUser) {
    await loadMenu();
    loginRedirectCheckIsReady.value = true;
    const routeParamsPage = route?.params?.page;
    if (!routeParamsPage) {
      if (coreStore.config?.settingPages?.[0]) {
        setURL(coreStore.config.settingPages[0]);
      }
    } else {
      handleURLChange(routeParamsPage as string | null);
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
  router.replace({
    name: 'settings',
    params: { page: item?.slug }
  });
}

function handleURLChange(val: string | null) {
  let isParamInTabs;
  for (const c of coreStore?.config?.settingPages || []) {
    if (c.slug ? c.slug === val : slugifyString(c.pageLabel) === val) {
      isParamInTabs = true;
      break;
    }
  }
  if (isParamInTabs) {
    VerticalTabsRef.value.setActiveTab(val);
    activeTab.value = val as string;
    if (!initialTabSet.value) initialTabSet.value = true;
  } else {
    if (coreStore.config?.settingPages?.[0]) {
      setURL(coreStore.config.settingPages[0]);
    }
  }
}
</script>
