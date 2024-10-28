<template>
    <AfTooltip>
        <a :href="`https://google.com?q=${record.title}`">
            <IconCardSearch class="w-5 h-5 me-2"/>
        </a>

        <template #tooltip>
            Search for competitive apartments in Google
        </template>
    </AfTooltip>
</template>

<script setup>
import { IconCardSearch } from '@iconify-prerendered/vue-mdi';
import AfTooltip from '@/components/AfTooltip.vue';

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);
</script>