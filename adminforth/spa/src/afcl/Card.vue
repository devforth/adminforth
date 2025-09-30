<template>
<a href="#" class="block max-w-sm p-6 bg-lightCardBackground border border-lightCardBorder rounded-lg shadow-sm hover:bg-lightCardBackgroundHover dark:bg-darkCardBackground dark:border-darkCardBorder dark:hover:bg-darkCardBackgroundHover">

<h5 class="mb-2 text-2xl font-bold tracking-tight text-lightCardTitle dark:text-darkCardTitle">{{ props.title }}</h5>
<p class="font-normal text-base text-lightCardDescription dark:text-darkCardDescription">{{ props.description }}</p>
</a>
</template>


<script setup lang="ts">
const props = defineProps<{
    title: string;
    description: string;
}>();

</script>