<script setup>
import VueDiff from 'vue-diff';
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
      :prev="JSON.stringify(props.record[props.meta.resourceColumns.resourceDataColumnName].oldRecord, null, 2)"
      :current="JSON.stringify(props.record[props.meta.resourceColumns.resourceDataColumnName].newRecord, null, 2)"
    />
</template>
  