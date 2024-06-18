<template>
    
    Appartment {{ record.title }}
    Id: "{{ record?.id }}"
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['column', 'record']);

</script>