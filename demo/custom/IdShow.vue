<template> 
    Appartment {{ record?.title }}
    Id: "{{ record?.id }}"
    Meta: "{{ meta }}"
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['column', 'record', 'meta']);

</script>