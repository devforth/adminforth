<script setup>
import VueDiff from 'vue-diff';
import { ref } from 'vue';
import 'vue-diff/dist/index.css';

const props = defineProps(['prev', 'current', 'meta']);

app.use(VueDiff);
</script>

<template>
    <Diff
      :mode="'split'"
      :theme="'light'"
      :language="'plaintext'"
      :prev="props.prev"
      :current="props.current"
    />
  </template>
  