<template>
  <div class="afcl-page-header flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
    <!-- the text shrinks first, so actions stay on the right and wrap under it only on narrow screens -->
    <div class="min-w-0 max-w-2xl flex-1 basis-64">
      <h2 class="afcl-page-header-title text-lg font-semibold tracking-tight text-lightCardTitle dark:text-darkCardTitle">{{ title }}</h2>
      <p v-if="description" class="afcl-page-header-description mt-1 text-sm text-lightCardDescription dark:text-darkCardDescription">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="afcl-page-header-actions flex flex-wrap items-center gap-2">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>
