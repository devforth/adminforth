<script setup>
import VueDiff from 'vue-diff';
import { ref } from 'vue';
import 'vue-diff/dist/index.css';
import { app } from '@/main';

app.use(VueDiff);

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);
</script>

<template>
    <Diff
      :mode="'split'"
      :theme="'light'"
      :language="'JSON'"
      :prev="props.record[props.meta.resourceColumns.resourceDataColumnName].oldRecord"
      :current="props.record[props.meta.resourceColumns.resourceDataColumnName].newRecord"
    />
</template>
  