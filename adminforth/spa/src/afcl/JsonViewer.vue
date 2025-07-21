<template>
  <JsonViewer
    class="afcl-json-viewer min-w-[6rem]"
    :value="value"
    :expandDepth="expandDepth"
    copyable
    sort
  />
</template>

<script setup lang="ts">
import { JsonViewer } from 'vue3-json-viewer'

defineProps<{
  value: any
  expandDepth?: number
}>()

</script>
