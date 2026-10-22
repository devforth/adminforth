<template>
  <Badge v-if="value !== null" :variant="meta.variants?.[value]">{{ label }}</Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Badge, { type BadgeVariant } from '@/afcl/Badge.vue';
import type { AdminForthResourceColumnCommon } from '@/types/Common';

const props = defineProps<{
  column: AdminForthResourceColumnCommon;
  record: Record<string, any>;
  meta: { variants?: Record<string, BadgeVariant> };
}>();

const value = computed(() => props.record[props.column.name]);
const label = computed(() => props.column.enum!.find((item) => item.value === value.value)!.label);
</script>
