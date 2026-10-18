<template>
  <div class="@container h-full w-full px-4 py-6 md:px-10" :class="{ 'hidden': initialTabSet === false }">
    <div v-if="!visiblePages.length">
      <p>{{ $t('No setting pages configured or still loading...') }}</p>
    </div>
    <!-- settings are one card: tabs on a tinted pane at the left, the page of the active tab at the right.
         The card stacks them by its own width, not by the viewport, because the sidebar and the agent panel take the width too -->
    <VerticalTabs
      v-else
      ref="VerticalTabsRef"
      v-model:active-tab="activeTab"
      class="flex flex-col @4xl:flex-row @4xl:min-h-[40rem] overflow-hidden rounded-xl border border-lightCardBorder bg-lightCardBackground dark:border-darkCardBorder dark:bg-darkCardBackground"
      tabsClass="m-0 md:m-0 md:self-stretch @4xl:w-64 shrink-0 px-3 py-4 @4xl:py-5 rounded-none border-0 border-b @4xl:border-b-0 @4xl:border-e border-lightCardBorder dark:border-darkCardBorder bg-lightVerticalTabsBackground dark:bg-darkVerticalTabsBackground"
      contentClass="min-w-0 overflow-x-auto p-6"
      @update:active-tab="setURL({slug: $event, pageLabel: ''})"
    >
      <template #tabs-header>
        <div class="px-2.5 pb-4">
          <h1 class="text-[15px] font-semibold leading-snug text-lightCardTitle dark:text-darkCardTitle">{{ $t('Settings') }}</h1>
          <p class="mt-0.5 truncate text-xs text-lightCardDescription dark:text-darkCardDescription">{{ $t('Signed in as {username}', { username: coreStore.username }) }}</p>
        </div>
      </template>

      <template v-for="page in visiblePages" v-slot:['tab:'+page.slug]>
        <component v-if="page.icon" :is="getIcon(page.icon)" class="w-4 h-4"></component>
        <span class="min-w-0 truncate">{{ page.pageLabel }}</span>
      </template>

      <template v-for="page in visiblePages" v-slot:[page.slug]>
        <component
          :is="getCustomComponent({file: page.component || ''})"
          :resource="coreStore.resource"
          :adminUser="coreStore.adminUser"
        />
      </template>
    </VerticalTabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCoreStore } from '@/stores/core';
import { getCustomComponent, getIcon } from '@/utils';
import { VerticalTabs } from '@/afcl'
import { useRoute } from 'vue-router'

const route = useRoute()
const coreStore = useCoreStore();
const router = useRouter();

const routerIsReady = ref(false);
const loginRedirectCheckIsReady = ref(false);
const VerticalTabsRef = ref();
const activeTab = ref('');
const initialTabSet = ref(false);
const visiblePages = computed(() => coreStore.config?.settingPages?.filter(page => page.isVisible) ?? []);

watch(() => route?.params?.page, (val) => {
  handleURLChange(val as string | null);
});

async function initRouter() {
  await router.isReady();
  routerIsReady.value = true;
}

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
