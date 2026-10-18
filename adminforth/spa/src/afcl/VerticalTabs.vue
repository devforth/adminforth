<template>
  <div class="md:flex">
    <div :class="mergeClasses('md:me-4 mb-4 md:mb-0 mr-6 md:mr-0 md:min-w-[11rem]', tabsClass)">
      <slot name="tabs-header"></slot>
      <ul class="space-y-0.5 text-sm">
        <li v-for="tab in tabs" :key="`${tab}-tab-controll`">
          <a
            v-if="!props.hideTabesWhenSingle || tabs.length > 1"
            href="#"
            @click.prevent="setActiveTab(tab)"
            class="flex items-center gap-2 w-full min-h-[34px] px-2.5 py-1.5 rounded-default transition-colors [&>svg]:shrink-0"
            :class="tab === activeTab
              ? 'font-medium text-lightVerticalTabsTextActive bg-lightVerticalTabsBackgroundActive dark:text-darkVerticalTabsTextActive dark:bg-darkVerticalTabsBackgroundActive'
              : 'text-lightVerticalTabsText hover:text-lightVerticalTabsTextHover hover:bg-lightVerticalTabsBackgroundHover dark:text-darkVerticalTabsText dark:hover:text-darkVerticalTabsTextHover dark:hover:bg-darkVerticalTabsBackgroundHover [&>svg]:text-lightInputIconColor dark:[&>svg]:text-darkInputIconColor'"
            :aria-current="tab === activeTab ? 'page' : undefined"
          >
            <slot :name="`tab:${tab}`"></slot>
          </a>
        </li>
      </ul>
    </div>
    <div :class="mergeClasses('w-full md:ps-6 md:border-s md:border-lightFormBorder dark:md:border-darkFormBorder text-sm text-lightVerticalTabsSlotText dark:text-darkVerticalTabsSlotText', contentClass)">
      <slot :name="activeTab"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, useSlots, ref, type Ref } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { mergeClasses } from './classMerge';

  const tabs : Ref<string[]> = ref([]);
  const activeTab = ref('');
  const props = withDefaults(defineProps<{
    activeTab?: string;
    hideTabesWhenSingle?: boolean;
    // override the default classes of the tab list column and of the content, e.g. paddings or the divider
    tabsClass?: ClassNameValue;
    contentClass?: ClassNameValue;
  }>(), {
    hideTabesWhenSingle: false,
  });
  const emites = defineEmits([
    'update:activeTab',
  ]);

  defineExpose({
    setActiveTab
  });

  onMounted(() => {
    const slots = useSlots();
    tabs.value = Object.keys(slots).reduce((tbs: string[], tb: string) => {
      if (tb.startsWith('tab:')) {
        tbs.push(tb.replace('tab:', ''));
      }
      return tbs;
    }, []);
    if (tabs.value.length > 0) {
      activeTab.value = tabs.value[0];
    }
  });

  function setActiveTab(tab: string) {
    if (tabs.value.includes(tab)) {
      activeTab.value = tab;
      emites('update:activeTab', tab);
    }
  }
</script>
