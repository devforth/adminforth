<template>
  <div class="flex items-center justify-between mb-3 flex-wrap gap-y-2">
    <Breadcrumbs />
    <slot></slot>
  </div>
</template>

<script setup>
import Breadcrumbs from '@/components/Breadcrumbs.vue';
</script>