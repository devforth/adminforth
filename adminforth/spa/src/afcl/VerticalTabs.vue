<template>
  <div class="md:flex">
    <ul class="flex-column space-y space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0">
      <li v-for="tab in tabs" :key="`${tab}-tab-controll`">
        <a 
          href="#"
          @click="activeTab = tab"
          class="inline-flex items-center px-4 py-3 rounded-lg w-full"
          :class="tab === activeTab ? 'text-lightPrimaryContrast bg-lightPrimary active dark:bg-darkPrimary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white'"
          aria-current="page"
        >
          <slot :name="`tab:${tab}`"></slot>
        </a>
      </li>
    </ul>
    <div class="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full">
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
    tabs.value = Object.keys(slots).reduce((tbs, tb) => {
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