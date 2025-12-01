<template>
  <component :is="'style'" v-if="shouldHide">
    aside, #logo-sidebar, .af-sidebar-container, [aria-label="Sidebar"] { 
        display: none !important; 
        width: 0 !important;
    }
    
    button[aria-controls="logo-sidebar"], .af-logo-title-wrapper { 
        display: none !important; 
    }

    .sm\:ml-64, .md\:ml-64, .lg\:ml-64, div[class*="ml-64"] { 
      margin-left: 0 !important; 
      width: 100% !important;
      max-width: 100% !important;
    }

    .af-header, nav .flex {
        justify-content: flex-end !important;
    }

    .af-header > div:last-child, nav > div > div:last-child {
        margin-left: auto !important;
    }

    nav div.flex.items-center.justify-start {
        display: none !important;
    }
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();

const shouldHide = computed(() => {
  const menu = coreStore.menu || [];
  if (!menu) return false;
  if (menu.length === 0) return true;

  const hasRealItems = menu.some(item => item.path || item.resourceId || (item.children && item.children.length > 0));
  return !hasRealItems;
});
</script>