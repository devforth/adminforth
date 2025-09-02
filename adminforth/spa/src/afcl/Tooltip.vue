<template>
  <div ref="triggerEl" class="afcl-tooltip inline-flex items-center">
      <slot></slot>
  </div>
  <div
    role="tooltip"
    class="absolute z-20 invisible inline-block px-3 py-2 text-sm font-medium text-lightTooltipText dark:darkTooltipText transition-opacity duration-300 bg-lightTooltipBackground rounded-lg shadow-sm opacity-0 tooltip dark:bg-darkTooltipBackground"
    ref="tooltip"
  >
    <slot name="tooltip"></slot>
    <div class="tooltip-arrow" data-popper-arrow></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, type Ref } from 'vue';
import { Tooltip } from 'flowbite';

const triggerEl = ref(null);
const tooltip = ref(null);

const tp: Ref<Tooltip|null> = ref(null);

onMounted(async () => {
  //await one tick when all is mounted
  await nextTick();
  tp.value = new Tooltip(
    tooltip.value,
    triggerEl.value,
    {
      placement: 'bottom',
      triggerType: 'hover',
    },
  );
})


onUnmounted(() => {
  //destroy tooltip
  tp.value?.destroy();
})
</script>