<template>
    <Tooltip>
        <a :href="`https://google.com?q=${record.title}`">
            <IconCardSearch class="w-5 h-5 me-2"/>
        </a>

        <template #tooltip>
            {{$t('Search for competitive apartments in Google')}}
        </template>
    </Tooltip>
</template>

<script setup lang="ts">
import { IconCardSearch } from '@iconify-prerendered/vue-mdi';
import Tooltip from '@/afcl/Tooltip.vue';
import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common';

const props = defineProps<{
    column: AdminForthResourceColumnCommon;
    record: any;
    meta: any;
    resource: AdminForthResourceCommon;
    adminUser: AdminUser
}>();


</script>