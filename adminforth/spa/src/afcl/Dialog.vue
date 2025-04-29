<template>
  <div
    v-if="$slots.trigger"
    @click="modal?.show()" class="inline-flex items-center cursor-pointer"
  >
    <slot name="trigger"></slot>
  </div>
  <Teleport to="body">
    <div ref="modalEl" tabindex="-1" aria-hidden="true" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full max-h-full">
      <div v-bind="$attrs" class="relative p-4 max-w-2xl max-h-full" :class="$attrs.class?.includes('w-') ? '' : 'w-full'">
        <!-- Modal content -->
        <div class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
          <!-- Modal header -->
          <div
            v-if="header"
            class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200"
          >
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ header }}
            </h3>
            <button
              v-if="headerCloseButton"
              type="button"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              @click="modal?.hide()"
            >
              <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>
          <!-- Modal body -->
          <div class="p-4 md:p-5 space-y-4 text-gray-700 dark:text-gray-400">
            <slot></slot>
          </div>
          <!-- Modal footer -->
          <div
            v-if="buttons.length"
            class="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600"
          >
            <Button
              v-for="(button, buttonIndex) in buttons"
              :key="buttonIndex"
              v-bind="button.options"
              :class="{ 'ms-3': buttonIndex > 0 }"
              @click="button.onclick(modal)"
            >
              {{ button.label }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import Button from "./Button.vue";
import { ref, onMounted, nextTick, onUnmounted, type Ref } from 'vue';
import { Modal } from 'flowbite';

const modalEl = ref(null);
const modal: Ref<Modal|null> = ref(null);

const props = defineProps({
  header: {
    type: String,
    default: '',
  },
  headerCloseButton: {
    type: Boolean,
    default: true,
  },
  buttons: {
    type: Array,
    default: () => [{ label: 'Close', onclick: (dialog) => dialog.hide(), type: '' }],
  },
  clickToCloseOutside: {
    type: Boolean,
    default: true,
  },
});

onMounted(async () => {
  //await one tick when all is mounted
  await nextTick();
  modal.value = new Modal(
    modalEl.value,
    {
      backdrop: props.clickToCloseOutside ? 'dynamic' : 'static',
    },
  );
})

onUnmounted(() => {
  //destroy tooltip
  modal.value?.destroy();
})

function open() {
  modal.value?.show();
}

function close() {
  modal.value?.hide();
}

defineExpose({
  open: open,
  close: close,
})

</script>
