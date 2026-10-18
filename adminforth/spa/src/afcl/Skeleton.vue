<template>
    <div v-if="type === 'image'" role="status" class="flex animate-pulse items-center justify-center bg-lightSkeletonBackgroundColor rounded dark:bg-darkSkeletonBackgroundColor">
        <IconImage class="w-10 h-10 text-lightSkeletonIconColor dark:text-darkSkeletonIconColor" />
    </div>
    <div v-else-if="type === 'video'" role="status" class="flex items-center justify-center max-w-sm bg-lightSkeletonBackgroundColor rounded-lg animate-pulse dark:bg-darkSkeletonBackgroundColor">
        <IconVideo class="w-10 h-10 text-lightSkeletonIconColor dark:text-darkSkeletonIconColor" />
        <span class="sr-only">Loading...</span>
    </div>
    <IconCircleUserRound v-else-if="type === 'avatar'" class="me-3 animate-pulse text-lightSkeletonIconColor dark:text-darkSkeletonBackgroundColor" />
    <div
        v-else-if="type === 'input'"
        role="input"
        :class="['animate-pulse bg-lightSkeletonBackgroundColor dark:bg-darkSkeletonBackgroundColor rounded-default', $attrs.class]"
    ></div>
    <div v-else role="status" class="flex items-center justify-center animate-pulse bg-lightSkeletonIconColor rounded-full dark:bg-darkSkeletonBackgroundColor">
        <span class="sr-only">Loading...</span>
    </div>
</template>

<script setup lang="ts">
import { IconCircleUserRound, IconImage, IconVideo } from '@iconify-prerendered/vue-lucide';

defineProps<{
    type?: string,
}>();
</script>
