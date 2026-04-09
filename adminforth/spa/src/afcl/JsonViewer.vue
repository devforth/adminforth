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
import { useCoreStore } from '@/stores/core'
import { defineAsyncComponent } from 'vue';

const JsonViewer = defineAsyncComponent(async () => {
  await import('vue3-json-viewer/dist/vue3-json-viewer.css');
  const { JsonViewer } = await import('vue3-json-viewer');
  return JsonViewer;
});

defineProps<{
  value: any
  expandDepth?: number
}>()

const coreStore = useCoreStore()

const currentTheme = computed(() => (coreStore.theme === 'dark' ? 'dark' : 'light'))
</script>
