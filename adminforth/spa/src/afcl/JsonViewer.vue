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
import { computed, defineAsyncComponent } from 'vue'
import { useCoreStore } from '@/stores/core'
import "vue3-json-viewer/dist/vue3-json-viewer.css";

defineProps<{
  value: any
  expandDepth?: number
}>()

const JsonViewer = defineAsyncComponent(() => import('vue3-json-viewer').then(module => module.JsonViewer))
const coreStore = useCoreStore()

const currentTheme = computed(() => (coreStore.theme === 'dark' ? 'dark' : 'light'))
</script>
