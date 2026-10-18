<template>
  <div ref="triggerEl" class="afcl-tooltip inline-flex items-center" :style="{ anchorName }" @mouseenter="show" @mouseleave="hide">
      <slot></slot>
  </div>
  <teleport to="body" v-if="isOpen">
    <div
      ref="tooltipEl"
      popover="manual"
      role="tooltip"
      :data-placement="placement"
      :style="{ positionAnchor: anchorName }"
      class="afcl-tooltip-popover inline-block px-2.5 py-1.5 text-xs font-medium text-lightTooltipText dark:text-darkTooltipText transition-opacity duration-150 bg-lightTooltipBackground rounded-md shadow-popover dark:bg-darkTooltipBackground dark:shadow-darkPopover"
    >
      <slot name="tooltip"></slot>
      <div class="afcl-tooltip-arrow" :style="{ left: `${arrowLeft}px` }"></div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, useId } from 'vue';

const OFFSET = 8;
const SUPPORTS_ANCHOR = CSS.supports('anchor-name: --a');

const anchorName = `--afcl-tooltip-${useId()}`;
const triggerEl = ref<HTMLElement>();
const tooltipEl = ref<HTMLElement>();
const isOpen = ref(false);
const placement = ref<'top' | 'bottom'>('bottom');
const arrowLeft = ref(0);

async function show() {
  isOpen.value = true;
  await nextTick();
  tooltipEl.value!.showPopover();

  const trigger = triggerEl.value!.getBoundingClientRect();
  if (!SUPPORTS_ANCHOR) {
    placeByRect(trigger);
  }
  const tooltip = tooltipEl.value!.getBoundingClientRect();
  placement.value = tooltip.top < trigger.top ? 'top' : 'bottom';
  arrowLeft.value = trigger.left + trigger.width / 2 - tooltip.left;

  document.addEventListener('keydown', onKeydown);
}

function hide() {
  isOpen.value = false;
  document.removeEventListener('keydown', onKeydown);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    hide();
  }
}

// Safari before 26 and Firefox before 147 have no CSS anchor positioning
function placeByRect(trigger: DOMRect) {
  const el = tooltipEl.value!;
  const { width, height } = el.getBoundingClientRect();
  const fitsBelow = trigger.bottom + OFFSET + height <= window.innerHeight;
  const top = fitsBelow ? trigger.bottom + OFFSET : trigger.top - OFFSET - height;
  const left = Math.min(Math.max(trigger.left + (trigger.width - width) / 2, 0), window.innerWidth - width);
  el.style.top = `${top}px`;
  el.style.left = `${left}px`;
}

onBeforeUnmount(hide);
</script>

<style>
/* popover puts the tooltip into the top layer, so no z-index and no clipping by overflow of the parents */
.afcl-tooltip-popover {
  inset: auto;
  margin: 0;
  overflow: visible;
}

@supports (anchor-name: --a) {
  .afcl-tooltip-popover {
    position-area: bottom;
    position-try-fallbacks: flip-block;
    margin-top: 8px;
  }
}

@starting-style {
  .afcl-tooltip-popover {
    opacity: 0;
  }
}

.afcl-tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
  transform: translateX(-50%) rotate(45deg);
}

.afcl-tooltip-popover[data-placement='top'] > .afcl-tooltip-arrow {
  bottom: -4px;
}

.afcl-tooltip-popover[data-placement='bottom'] > .afcl-tooltip-arrow {
  top: -4px;
}
</style>
