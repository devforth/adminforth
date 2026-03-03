<template>
  <Modal 
    ref="modalRef" 
    v-bind="$attrs"
    :closeByClickOutside="clickToCloseOutside || closeByClickOutside"
    :closeByEsc="closeByEsc || closable"
    :beforeCloseFunction="beforeCloseFunction"
    :beforeOpenFunction="beforeOpenFunction"
    :askForCloseConfirmation="askForCloseConfirmation"
    :closeConfirmationText="closeConfirmationText"
    :removeFromDomOnClose="removeFromDomOnClose"
  >
    <template #trigger>
      <div
        v-if="$slots.trigger"
        class="inline-flex items-center cursor-pointer w-full"
      >
        <slot name="trigger"></slot>
      </div>
    </template>

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
        <span class="sr-only">{{ t('Close Modal') }}</span>
      </button>
    </div>
    <!-- Modal body -->
    <div class="p-4 md:p-5 text-lightDialogBodyText dark:text-darkDialogBodyText">
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
        @click="button.onclick(dialog)"
      >
        {{ button.label }}
      </Button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Button from "./Button.vue";
import { ref, computed, type Ref } from 'vue';
import { Modal } from '@/afcl'
import { useI18n } from "vue-i18n";
import type { IDialogInsideButtonClickHandler, DialogButton, DialogProps } from '@/types/FrontendAPI';

const { t } = useI18n();


/**********  for the backward compatibility  ***************/
class Dialog implements IDialogInsideButtonClickHandler {
  hide: () => void
  constructor( hide: () => void ) {
    this.hide = hide;
  }
}
const dialog: Ref<Dialog> = ref(
  new Dialog(
    () => {
      if (dialog.value) {
        tryToHideModal();
      }
    }
  )
);
/*************************************************************/



const modalRef = ref();

const props = withDefaults(defineProps<DialogProps>(), {
  header: '',
  headerCloseButton: true,
  buttons: () => [],
  clickToCloseOutside: false,
  closeByEsc: true,
  closeByClickOutside: true,
  beforeCloseFunction: null,
  beforeOpenFunction: null,
  closable: false,
  askForCloseConfirmation: false,
  closeConfirmationText: 'Are you sure you want to close this dialog?',
  removeFromDomOnClose: false,
})

const buttons = computed<DialogButton[]>(() => {
  if (props.buttons && props.buttons.length > 0) {
    return props.buttons;
  }
  return [
    {
      label: 'Close',
      onclick: (dialog: any) => {
        tryToHideModal();
      },
      options: {}
    }
  ];
});


function open() {
  modalRef.value.open();
}

function close() {
  modalRef.value.hide();
}

defineExpose({
  open: open,
  close: close,
  tryToHideModal: tryToHideModal,
})

function tryToHideModal() {
  modalRef.value?.tryToHideModal();
}


</script>
