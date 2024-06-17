<template>
  <div class="full-width flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2">
    🗨️ This is a custom line 
    <button
      @click="show = !show"
      class="flex items-center py-1 px-3 mb-2 text-sm font-medium rounded-default text-red-600 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-red-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-red-500 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">Show Record</button>
  </div>
  <div class="full-width flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2">
 
    <pre v-if="show" class="text-xs full-width">
{{ JSON.stringify(
          { record, resource, adminUser }, null, 2)
      }}
    </pre>

  </div>
</template>

<script setup>

import { ref } from 'vue';

const show = ref(false);

const props = defineProps({
  record: Object,
  resource: Object,
  adminUser: Object,
});
</script>