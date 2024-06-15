<template>
    
    Hello from 🇺🇦 1 
    "{{ column?.name }}" is not "{{ record?.id }}""
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['column', 'record']);

</script>