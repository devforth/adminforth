<template>
  <a v-if='record[column.name]' :href="record[column.name]"
    class="text-blue-500 hover:underline overflow-ellipsis overflow-hidden whitespace-nowrap inline-block max-w-full"
  >{{ record[column.name] }}</a>
</template>

<script setup>

defineProps({
  record: Object,
  resource: Object,
  adminUser: Object,
  meta: Object,
  column: Object
});


</script>