<template>
    Hello from 🇺🇦 1
    "{{ column.name }}" is not "{{ row.id }}""
</template>

<script setup>
import { ref, defineProps } from 'vue';

const props = defineProps(['column', 'row']);

</script>