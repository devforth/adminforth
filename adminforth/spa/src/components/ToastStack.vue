<template>
  <!-- the padding leaves room for the shadows, the list scrolls inside max-h -->
  <div class="af-toast-stack fixed bottom-0 z-[100] flex flex-col-reverse max-h-[50vh] overflow-y-auto p-5 pointer-events-none [scrollbar-width:none] [mask-image:linear-gradient(transparent,black_1.25rem)]">
    <TransitionGroup
      tag="ol"
      class="relative shrink-0 w-96 max-w-[calc(100vw-2.5rem)] pointer-events-auto transition-[height] duration-300 ease-out"
      :style="{ height: `${stack.height}px` }"
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      leave-active-class="transition-opacity duration-300"
      leave-to-class="opacity-0"
      @mouseenter="expanded = true"
      @mouseleave="expanded = false"
    >
      <li
        v-for="item in stack.items"
        :key="item.toast.id"
        :ref="(el) => measure(item.toast, el as HTMLElement | null)"
        class="absolute inset-x-0 bottom-0"
      >
        <Toast
          :toast="item.toast"
          :paused="expanded"
          class="origin-top overflow-hidden transition-[transform,height,opacity] duration-300 ease-out *:transition-opacity *:duration-300"
          :class="item.class"
          :style="item.style"
          @close="toastStore.removeToast(item.toast)"
        />
      </li>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import Toast from './Toast.vue';
import { useToastStore } from '@/stores/toast';

// collapsed, toasts lie on each other with the newest in front, hover spreads them into a list
const PEEK_PX = 12; // how much a toast shows above the one in front of it
const SCALE_STEP = 0.05;
const STACK_DEPTH = 3; // toasts drawn in the collapsed stack, the older ones wait hidden behind them
const GAP_PX = 8;

const toastStore = useToastStore();
const expanded = ref(false);
// natural height of a toast, measured on mount: in the collapsed stack the toasts behind take the height of the front one
const heights = reactive(new WeakMap<object, number>());

function measure(toast: object, el: HTMLElement | null) {
  if (el && !heights.has(toast)) {
    heights.set(toast, el.offsetHeight);
  }
}

const stack = computed(() => {
  const fromFront = [...toastStore.toasts].reverse();
  const frontHeight = heights.get(fromFront[0]);
  let listOffset = 0;
  const layouts = fromFront.map((toast, i) => {
    const height = heights.get(toast);
    const depth = Math.min(i, STACK_DEPTH - 1);
    const layout = expanded.value
      ? { toast, offset: listOffset, height, scale: 1, class: '' }
      : {
          toast,
          offset: depth * PEEK_PX,
          height: i ? frontHeight : height,
          scale: 1 - depth * SCALE_STEP,
          class: i === 0 ? '' : i < STACK_DEPTH ? '*:opacity-0' : 'opacity-0 *:opacity-0',
        };
    listOffset += (height ?? 0) + GAP_PX;
    return layout;
  });
  return {
    height: Math.max(0, ...layouts.map((l) => l.offset + (l.height ?? 0))),
    // older toasts go first in the DOM, so the newer ones are painted over them
    items: layouts.reverse().map((l) => ({
      toast: l.toast,
      class: l.class,
      style: {
        transform: `translateY(-${l.offset}px) scale(${l.scale})`,
        height: l.height === undefined ? undefined : `${l.height}px`,
      },
    })),
  };
});
</script>
