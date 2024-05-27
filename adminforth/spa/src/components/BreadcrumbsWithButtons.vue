<template>
  <div class="flex items-center justify-between mb-3 flex-wrap gap-y-2">
    <Breadcrumbs />
    <div class="flex items-center space-x-1">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import Breadcrumbs from '@/components/Breadcrumbs.vue';
</script>