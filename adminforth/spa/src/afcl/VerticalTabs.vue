<template>
  <div class="md:flex">
    <ul class="flex-column space-y-0.5 text-sm text-lightVerticalTabsText dark:text-darkVerticalTabsText md:me-4 mb-4 md:mb-0 md:mr-0 mr-6 md:min-w-[11rem]">
      <li v-for="tab in tabs" :key="`${tab}-tab-controll`">
        <a 
          v-if="!props.hideTabesWhenSingle || tabs.length > 1"
          href="#"
          @click="setActiveTab(tab)"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-default w-full transition-colors"
          :class="tab === activeTab ? 'font-medium text-lightVerticalTabsTextActive bg-lightVerticalTabsBackgroundActive active dark:bg-darkVerticalTabsBackgroundActive dark:text-darkVerticalTabsTextActive' : 'text-lightVerticalTabsText dark:text-darkVerticalTabsText hover:text-lightVerticalTabsTextHover bg-lightVerticalTabsBackground hover:bg-lightVerticalTabsBackgroundHover dark:bg-darkVerticalTabsBackground dark:hover:bg-darkVerticalTabsBackgroundHover dark:hover:darkVerticalTabsTextHover'"
          aria-current="page"
        >
          <slot :name="`tab:${tab}`"></slot>
        </a>
      </li>
    </ul>
    <div class="md:ps-6 md:border-s md:border-lightFormBorder dark:md:border-darkFormBorder text-sm text-lightVerticalTabsSlotText dark:text-darkVerticalTabsSlotText  w-full ">
      <slot :name="activeTab"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, useSlots, ref, type Ref } from 'vue';
  const tabs : Ref<string[]> = ref([]);
  const activeTab = ref('');
  const props = defineProps({
    activeTab: {
      type: String
    },
    hideTabesWhenSingle: {
      type: Boolean,
      default: false
    }
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