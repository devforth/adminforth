<template>
  <div
    v-if="$slots.trigger"
    @click="modal?.show()" class="inline-flex items-center cursor-pointer"
  >
    <slot name="trigger"></slot>
  </div>
  <Teleport to="body">
    <div ref="modalEl" tabindex="-1" aria-hidden="true" class="[scrollbar-gutter:stable] hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full max-h-full">
      <div v-bind="$attrs" class="relative p-4 max-w-2xl max-h-full" :class="($attrs.class as string)?.includes('w-') ? '' : 'w-full'">
        <!-- Modal content -->
        <div class="relative bg-lightDialogBackgorund rounded-lg shadow-sm dark:bg-darkDialogBackgorund">
          <!-- Modal header -->
          <div
            v-if="header"
            class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-darkDialogBreakLine border-lightDialogBreakLine"
          >
            <h3 class="text-xl font-semibold text-lightDialogHeaderText dark:text-darkDialogHeaderText">
              {{ header }}
            </h3>
            <button
              v-if="headerCloseButton"
              type="button"
              class="text-lightDialogCloseButton bg-transparent hover:bg-lightDialogCloseButtonHoverBackground hover:text-lightDialogCloseButtonHover rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:text-darkDialogCloseButton dark:hover:bg-darkDialogCloseButtonHoverBackground dark:hover:text-darkDialogCloseButtonHover"
              @click="tryToHideModal"
            >
              <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>
          <!-- Modal body -->
          <div class="p-4 md:p-5 space-y-4 text-lightDialogBodyText dark:text-darkDialogBodyText">
            <slot></slot>
          </div>
          <!-- Modal footer -->
          <div
            v-if="buttons.length"
            class="flex items-center p-4 md:p-5 border-t border-lightDialogBreakLine rounded-b dark:border-darkDialogBreakLine"
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
      <div>
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
                  modal?.hide();
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
import { Modal } from 'flowbite';

const modalEl = ref(null);
const modal: Ref<Modal|null> = ref(null);

interface DialogButton {
  label: string
  onclick: (dialog: any) => void
  options?: Record<string, any> 
}

interface DialogProps {
  header?: string
  headerCloseButton?: boolean
  buttons?: DialogButton[]
  clickToCloseOutside?: boolean
  beforeCloseFunction?: (() => void | Promise<void>) | null
  beforeOpenFunction?: (() => void | Promise<void>) | null
  closable?: boolean
  askForCloseConfirmation?: boolean
  closeConfirmationText?: string
}

const props = withDefaults(defineProps<DialogProps>(), {
  header: '',
  headerCloseButton: true,
  buttons: () => [],
  clickToCloseOutside: true,
  beforeCloseFunction: null,
  beforeOpenFunction: null,
  closable: true,
  askForCloseConfirmation: false,
  closeConfirmationText: 'Are you sure you want to close this dialog?',
})

const buttons = computed<DialogButton[]>(() => {
  if (props.buttons && props.buttons.length > 0) {
    return props.buttons;
  }
  return [
    {
      label: 'Close',
      onclick: (dialog: any) => {
        if (!props.askForCloseConfirmation) {
          dialog.hide();
        } else {
          showConfirmationOnClose.value = true;
        }
      },
      options: {}
    }
  ];
});

const showConfirmationOnClose = ref(false);
onMounted(async () => {
  //await one tick when all is mounted
  await nextTick();
  modal.value = new Modal(
    modalEl.value,
    {
      closable: props.closable,
      backdrop: props.clickToCloseOutside ? 'dynamic' : 'static',
      onHide: async () => {
        if (props.beforeCloseFunction) {
          await props.beforeCloseFunction();
        }
      },
      onShow: async () => {
        if (props.beforeOpenFunction) {
          await props.beforeOpenFunction();
        }
      },
    }
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
  tryToHideModal: tryToHideModal,
})

function tryToHideModal() {
  if (!props.askForCloseConfirmation ) {
    modal.value?.hide();
  } else {
    showConfirmationOnClose.value = true;
  }
}


</script>
