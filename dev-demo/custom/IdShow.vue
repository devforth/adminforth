<template>
    <Tooltip>
        <a :href="`https://google.com?q=${record.title}`">
            <IconCardSearch class="w-5 h-5 me-2"/>
        </a>

        <template #tooltip>
            Search for competitive apartments in Google
        </template>
    </Tooltip>
</template>

<script setup>
import { IconCardSearch } from '@iconify-prerendered/vue-mdi';
import Tooltip from '@/afcl/Tooltip.vue';

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);
</script>