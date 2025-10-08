<template>
<a href="#" 
    class="block max-w-sm bg-lightCardBackground border border-lightCardBorder rounded-lg shadow-sm hover:bg-lightCardBackgroundHover dark:bg-darkCardBackground dark:border-darkCardBorder dark:hover:bg-darkCardBackgroundHover"
    :class="[
        props.size === 'sm' ? 'p-2' : props.size === 'md' ? 'p-4' : 'p-6',
        props.hideBorder ? 'border-0' : ''
    ]"
>

<h5 class="font-bold tracking-tight text-lightCardTitle dark:text-darkCardTitle" :class="[props.size === 'sm' ? 'text-base' : props.size === 'md' ? 'text-lg mb-1' : 'text-xl mb-2']">{{ props.title }}</h5>
<p class="font-normal text-lightCardDescription dark:text-darkCardDescription" :class="[props.size === 'sm' ? 'text-sm' : props.size === 'md' ? 'text-base' : 'text-lg']">{{ props.description }}</p>
    <slot></slot>
</a>
</template>


<script setup lang="ts">
const props = defineProps<{
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    hideBorder?: boolean;
}>();

</script>