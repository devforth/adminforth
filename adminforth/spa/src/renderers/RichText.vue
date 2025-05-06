<template>
    <div class="rich-text" v-html="htmlContent"></div>
  </template>
  
  <script setup lang="ts">
  import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common'
  
  const props = defineProps<{
    column: AdminForthResourceColumnCommon
    record: any
    meta: any
    resource: AdminForthResourceCommon
    adminUser: AdminUser
  }>()
  
  const htmlContent = props.record[props.column.name] || ''
  </script>
  
  <style scoped>
  .rich-text {
    /* You can add default styles here if needed */
    word-break: break-word;
  }
  </style>
  