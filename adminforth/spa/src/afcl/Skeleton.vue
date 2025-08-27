<template>
    <div v-if="type === 'image'" role="status" class="flex animate-pulse items-center justify-center bg-lightSkeletonBackgroundColor rounded dark:bg-darkSkeletonBackgroundColor">
        <svg class="w-10 h-10 text-lightSkeletonIconColor dark:text-darkSkeletonIconColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
        </svg>
    </div>
    <div v-else-if="type === 'video'" role="status" class="flex items-center justify-center max-w-sm bg-lightSkeletonBackgroundColor rounded-lg animate-pulse dark:bg-darkSkeletonBackgroundColor">
        <svg class="w-10 h-10 text-lightSkeletonIconColor dark:text-darkSkeletonIconColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 20">
            <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z"/>
            <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM9 13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2Zm4 .382a1 1 0 0 1-1.447.894L10 13v-2l1.553-1.276a1 1 0 0 1 1.447.894v2.764Z"/>
        </svg>
        <span class="sr-only">Loading...</span>
    </div>
    <svg v-else-if="type === 'avatar'" class="me-3 animate-pulse text-lightSkeletonIconColor dark:text-darkSkeletonBackgroundColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/>
    </svg>
    <div v-else role="status" class="flex items-center justify-center animate-pulse bg-lightSkeletonIconColor rounded-full dark:bg-darkSkeletonBackgroundColor">
        <span class="sr-only">Loading...</span>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    type?: string,
}>();
</script>