<template>
  <JsonViewer
    class="afcl-json-viewer min-w-[6rem]"
    :value="value"
    :expandDepth="expandDepth"
    copyable
    sort
    :theme="currentTheme"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { JsonViewer } from 'vue3-json-viewer'
import { useCoreStore } from '@/stores/core'

defineProps<{
  value: any
  expandDepth?: number
}>()

const coreStore = useCoreStore()

const currentTheme = computed(() => (coreStore.theme === 'dark' ? 'dark' : 'light'))
</script>
