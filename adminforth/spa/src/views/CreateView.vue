<template>
  <div class="relative">
    <Filters :columns="columns" v-model:filters="filters" :columnsMinMax="columnsMinMax" />

    <div class="flex items-center justify-between mb-3">
      <Breadcrumbs />
    </div>

    <pre>
      {{ item }}
    </pre>  

  </div>
</template>


<script setup>

import { ref, computed, onMounted } from 'vue';  
import { useRoute } from 'vue-router';
import { callAdminForthApi } from '@/utils';

const item = ref(null);
const route = useRoute();

onMounted(async () => {
  item.value = await callAdminForthApi({
    path: '/get_record',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId,
      primaryKey: route.params.primaryKey,
    }
  });
});

</script>