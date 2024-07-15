<template>
  <div>
    with zooming support

    {{ record }}
  </div>
</template>

<script setup>
import { ref } from 'vue'

// define props record, column
defineProps({
  record: Object,
  column: Object
})
</script>