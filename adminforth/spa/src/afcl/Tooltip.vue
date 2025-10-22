<template>
  <div ref="triggerEl" class="afcl-tooltip inline-flex items-center" @mouseenter="mouseOn" @mouseleave="mouseOff">
      <slot></slot>
  </div>
  <teleport to="body" v-if="showTooltip">
    <div
      role="tooltip"
      class="absolute z-20 invisible inline-block px-3 py-2 text-sm font-medium text-lightTooltipText dark:darkTooltipText transition-opacity duration-300 bg-lightTooltipBackground rounded-lg shadow-sm opacity-0 tooltip dark:bg-darkTooltipBackground"
      ref="tooltip"
    >
      <slot name="tooltip"></slot>
      <div class="tooltip-arrow" data-popper-arrow></div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, type Ref } from 'vue';
import { Tooltip } from 'flowbite';

const triggerEl = ref(null);
const tooltip = ref(null);
const showTooltip = ref(false);
const tp: Ref<Tooltip|null> = ref(null);

async function mouseOn() {
  showTooltip.value = true;
  await nextTick();

  tp.value?.destroy();

  tp.value = new Tooltip(
    tooltip.value,
    triggerEl.value,
    {
      placement: 'bottom',
      triggerType: 'hover',
    },
  );

  tp.value.show();
}

function mouseOff() {
  tp.value?.hide();
  tp.value?.destroy();
  tp.value = null;
  showTooltip.value = false;
}

</script>