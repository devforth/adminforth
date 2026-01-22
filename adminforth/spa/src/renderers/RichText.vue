<template>
  <div class="rich-text" v-html="htmlContent"></div>
</template>

<script setup lang="ts">
import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common'
import { protectAgainstXSS } from '@/utils'

const props = defineProps<{
  column: AdminForthResourceColumnCommon
  record: any
  meta: any
  resource: AdminForthResourceCommon
  adminUser: AdminUser
}>()
const htmlContent = protectAgainstXSS(props.record[props.column.name])

</script>

<style scoped>
.rich-text {
   /* You can add default styles here if needed */
  word-break: break-word;
}
.rich-text :deep(table) {
  border-collapse: collapse;
  border: 1px solid #ddd;
}

.rich-text :deep(table th),
.rich-text :deep(table td) {
  border: 1px solid #ddd;
  padding: 8px;
}

.rich-text :deep(table th) {
  background-color: #f5f5f5;
  font-weight: 600;
}
</style>