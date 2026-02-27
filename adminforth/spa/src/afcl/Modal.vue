<template>
  <div
    v-if="$slots.trigger"
    @click="toggleModal()" class="inline-flex items-center cursor-pointer w-full"
  >
    <slot name="trigger"></slot>
  </div>
  <Teleport to="body">
      <div v-show="isModalOpen" v-if="!removeFromDom" @click="backdropClick" v-bind="$attrs" class="bg-black/50 overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-1rem max-h-full flex" >
        <!-- Modal content -->
        <div class="relative bg-lightDialogBackgorund rounded-lg shadow-sm dark:bg-darkDialogBackgorund">

          <!-- Modal body -->
          <div class="p-4 md:p-5 space-y-4 text-lightDialogBodyText dark:text-darkDialogBodyText">
            <slot ></slot>
          </div>
         
          <!-- Confirmation Modal -->
          <div
            v-if="showConfirmationOnClose"
            class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]"
          >
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h2 class="text-lg font-semibold mb-4 text-lightDialogHeaderText dark:text-darkDialogHeaderText">Confirm Close</h2>
              <p class="mb-6 text-lightDialogBodyText dark:text-darkDialogBodyText">{{ props.closeConfirmationText }}</p>
              <div class="flex justify-end">
                <Button
                  class="me-3 !bg-gray-50 dark:!bg-gray-700 !text-lightDialogBodyText dark:!text-darkDialogBodyText hover:!bg-gray-100 dark:hover:!bg-gray-600 !border-gray-200 dark:!border-gray-600"
                  @click="showConfirmationOnClose = false"
                >
                  Cancel
                </Button>
                <Button
                  @click="
                    showConfirmationOnClose = false;
                    close();
                  "
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
  </Teleport>
</template>

<script setup lang="ts">
import Button from "./Button.vue";
import { ref, onMounted, nextTick, onUnmounted, computed, type Ref } from 'vue';

const isModalOpen = ref(false);

const removeFromDom = computed(() => {
  return props.removeFromDomOnClose && !isModalOpen.value;
})

interface DialogProps {
  clickToCloseOutside?: boolean
  beforeCloseFunction?: (() => void | Promise<void>) | null
  beforeOpenFunction?: (() => void | Promise<void>) | null
  askForCloseConfirmation?: boolean
  closeConfirmationText?: string
  removeFromDomOnClose?: boolean
}

const props = withDefaults(defineProps<DialogProps>(), {
  clickToCloseOutside: true,
  beforeCloseFunction: null,
  beforeOpenFunction: null,
  askForCloseConfirmation: false,
  closeConfirmationText: 'Are you sure you want to close this dialog?',
  removeFromDomOnClose: false,
})

const showConfirmationOnClose = ref(false);


async function open() {
  await props.beforeOpenFunction?.();
  isModalOpen.value = true;
}

async function close() {
  await props.beforeCloseFunction?.();
  isModalOpen.value = false;
}

defineExpose({
  open: open,
  close: close,
  tryToHideModal: tryToHideModal,
})

function tryToHideModal() {
  if (!props.askForCloseConfirmation ) {
    close();
  } else {
    showConfirmationOnClose.value = true;
  }
}

function toggleModal() {
  if (isModalOpen.value) {
    tryToHideModal();
  } else {
    open();
  }
}

function backdropClick(e: MouseEvent) {
  if (props.clickToCloseOutside && e.target === e.currentTarget) {
    tryToHideModal();
  }
}

</script>
