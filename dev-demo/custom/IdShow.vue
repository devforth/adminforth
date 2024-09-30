<template> 
    <a :href="`https://google.com?q=${record.title}`" 
       class="font-medium text-lightPrimary dark:text-darkPrimary hover:underline ml-2"
       :data-tooltip-target="`tooltip-google-${record.id}`"
    >
        <IconCardSearch class="w-5 h-5 me-2"/>
    </a>

    <div :id="`tooltip-google-${record.id}`"
        role="tooltip"
        class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
      Search for competitive apartments in Google
      <div class="tooltip-arrow" data-popper-arrow></div>
    </div>
</template>

<script setup>
import { IconCardSearch } from '@iconify-prerendered/vue-mdi';

const props = defineProps(['column', 'record', 'meta']);

</script>