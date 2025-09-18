<template>
  <div class="md:flex">
    <ul class="flex-column space-y space-y-4 text-sm font-medium text-lightVerticalTabsText dark:text-darkVerticalTabsText md:me-4 mb-4 md:mb-0">
      <li v-for="tab in tabs" :key="`${tab}-tab-controll`">
        <a 
          href="#"
          @click="activeTab = tab"
          class="inline-flex items-center px-4 py-3 rounded-lg w-full"
          :class="tab === activeTab ? 'text-lightVerticalTabsTextActive bg-lightVerticalTabsBackgroundActive active dark:bg-darkVerticalTabsBackgroundActive dark:text-darkVerticalTabsTextActive' : 'text-lightVerticalTabsText dark:text-darkVerticalTabsText hover:text-lightVerticalTabsTextHover bg-lightVerticalTabsBackground hover:bg-lightVerticalTabsBackgroundHover dark:bg-darkVerticalTabsBackground dark:hover:bg-darkVerticalTabsBackgroundHover dark:hover:darkVerticalTabsTextHover'"
          aria-current="page"
        >
          <slot :name="`tab:${tab}`"></slot>
        </a>
      </li>
    </ul>
    <div class="ps-6  text-medium text-lightVerticalTabsSlotText dark:text-darkVerticalTabsSlotText  w-full ">
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
    }
  });
  const emites = defineEmits([
    'update:activeTab',
  ]);
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
</script>