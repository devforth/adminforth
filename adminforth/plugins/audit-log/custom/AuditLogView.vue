<script setup>
import VueDiff from 'vue-diff';
import 'vue-diff/dist/index.css';
import { app } from '@/main';
import { useCoreStore } from '@/stores/core';
import { computed } from 'vue';
app.use(VueDiff);

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);
const coreStore = useCoreStore();
const theme = computed(() => coreStore.theme);; 
const isMobile = computed(() => navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone|iPad|iPod/i));

</script>

<template>
    <Diff
      :mode="isMobile ? 'unified' : 'split'"
      :theme="theme"
      :language="'JSON'"
      :prev="JSON.stringify(props.record[props.meta.resourceColumns.resourceDataColumnName].oldRecord, null, 2)"
      :current="JSON.stringify(props.record[props.meta.resourceColumns.resourceDataColumnName].newRecord, null, 2)"
    />
</template>
  