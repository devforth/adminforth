<template>
  <div v-show="totalCost !== null" 
    class="flex items-center justify-center w-full h-full bg-gray-100 text-gray-800 text-xs font-medium p-1 rounded 
      dark:bg-gray-700 dark:text-gray-300">
      <Tooltip>
        <template #tooltip>
          <div class="text-sm">Your total property cost</div>
        </template>
        <IconDollarOutline class="text-2xl opacity-50" />
        <div class="text-2xl text-gray-900 dark:text-white"> {{totalCost}}</div>
      </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref } from 'vue';
import { ref } from 'vue';
import websocket from '@/websocket';
import { IconDollarOutline } from '@iconify-prerendered/vue-flowbite';
import { Tooltip } from '@/afcl';

const props = defineProps({
  adminUser: Object,
});

const totalCost: Ref<number|null> = ref(null);

onMounted(() => {
  websocket.subscribe(`/property-cost/${props.adminUser!.pk}`, (data: any) => {
    // this callback called once we receive publish in topic from the websocket
    totalCost.value = data.totalCost;
  });
});

</script>
