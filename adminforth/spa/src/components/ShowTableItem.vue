<template>
  <td class="px-6 py-4 whitespace-nowrap">
      {{ column.label }}
  </td>
  <td class="px-6 py-4 whitespace-nowrap whitespace-pre-wrap">
    <ValueRenderer :column="column" :row="row" />
  </td>
</template>

<script setup>
import ValueRenderer from '@/components/ValueRenderer.vue';

defineProps(['column', 'row']);
</script>