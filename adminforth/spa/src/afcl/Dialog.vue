<template>
  <Modal 
    ref="modalRef" 
    class="afcl-dialog"
    :aria-labelledby="header ? titleId : undefined"
    v-bind="$attrs"
    :closeByClickOutside="clickToCloseOutside || closeByClickOutside"
    :closeByEsc="closeByEsc || closable"
    :beforeCloseFunction="beforeCloseFunction"
    :beforeCancelFunction="beforeCancelFunction" 
    :beforeOpenFunction="beforeOpenFunction"
    :askForCloseConfirmation="askForCloseConfirmation"
    :closeConfirmationText="closeConfirmationText"
    :removeFromDomOnClose="removeFromDomOnClose"
  >
    <template v-if="$slots.trigger" #trigger>
      <slot name="trigger"></slot>
    </template>

    <!-- Modal header -->
    <div
      v-if="header"
      class="afcl-dialog-header flex items-start justify-between gap-3 px-5 pt-[18px] pb-1.5"
    >
      <h3 :id="titleId" class="text-base font-semibold tracking-[-0.01em] text-lightDialogHeaderText dark:text-darkDialogHeaderText">
        {{ header }}
      </h3>
      <Button
        v-if="headerCloseButton"
        type="button"
        variant="ghost"
        size="sm"
        iconOnly
        class="-mt-0.5 -me-1.5 text-lightDialogCloseButton hover:text-lightDialogCloseButtonHover hover:bg-lightDialogCloseButtonHoverBackground dark:text-darkDialogCloseButton dark:hover:text-darkDialogCloseButtonHover dark:hover:bg-darkDialogCloseButtonHoverBackground"
        :aria-label="t('Close Modal')"
        @click="tryToCancelModal"
      >
        <IconX aria-hidden="true" />
      </Button>
    </div>
    <!-- Modal body -->
    <div
      class="afcl-dialog-body px-5 pb-[18px] text-sm text-lightDialogBodyText dark:text-darkDialogBodyText"
      :class="header ? 'pt-1.5' : 'pt-5'"
    >
      <slot></slot>
    </div>
    <!-- Modal footer -->
    <div
      v-if="buttons.length"
      class="afcl-dialog-footer"
      :class="dialogFooterClasses"
    >
      <Button
        v-for="(button, buttonIndex) in buttons"
        :key="buttonIndex"
        v-bind="button.options"
        @click="button.onclick(dialog)"
        :mode="button.options?.mode || 'primary'"
      >
        {{ button.label }}
      </Button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Button from "./Button.vue";
import { IconX } from '@iconify-prerendered/vue-lucide';
import { ref, computed, useId, type Ref } from 'vue';
import Modal from './Modal.vue';
import { dialogFooterClasses } from './dialogStyles';
import { useI18n } from "vue-i18n";

const { t } = useI18n();


interface IDialogInsideButtonClickHandler {
  hide: () => void
}


interface DialogButton {
  label: string
  onclick: (dialog: IDialogInsideButtonClickHandler) => void
  options?: Record<string, any> 
}

const modalRef = ref();
const titleId = useId();

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
      options: { variant: 'secondary' }
    }
  ];
});


function open() {
  modalRef.value.open();
}

function close() {
  modalRef.value.close();
}

function tryToCancelModal() {
  modalRef.value?.cancel();
}

defineExpose({
  open: open,
  close: close,
  tryToHideModal: tryToHideModal,
  tryToCancelModal: tryToCancelModal,
})

function tryToHideModal() {
  modalRef.value?.tryToHideModal();
}

interface DialogProps {
  /**
   * The header text to display in the dialog. If not provided, no header will be displayed.
   */
  header?: string

  /**
   * If true, a close button will be displayed in the dialog header. Default is true.
   */
  headerCloseButton?: boolean

  /**
   * An array of buttons to display in the dialog footer. 
   */
  buttons?: DialogButton[]

  /**
   * If true, clicking outside the dialog will close it. Default is true.
   * 
   * @deprecated Use `closeByClickOutside` instead
   */
  clickToCloseOutside?: boolean

  /**
   * If true, pressing the Esc key will close the dialog. Default is true.
   */
  closeByEsc?: boolean

  /**
   * If true, clicking outside the dialog will close it. Default is true.
   */
  closeByClickOutside?: boolean

  /**
   * Function that will be called before the dialog is closed. 
   */
  beforeCloseFunction?: (() => void | Promise<void | boolean>) | null

  /**
   * Function that will be called before the dialog is opened. 
   */
  beforeOpenFunction?: (() => void | Promise<void>) | null

  /**
  * Function that will be called before the dialog is canceled. 
  */
  beforeCancelFunction?: (() => void | Promise<void | boolean>) | null

  /**
   * Disables close on Ecs button
   * 
   * @deprecated Use `closeByEsc` or  instead
   */
  closable?: boolean

  /**
   * If true, the dialog will ask for confirmation before closing. Default is false.
   */
  askForCloseConfirmation?: boolean

  /**
   * The text to display in the close confirmation dialog. Default is "Are you sure you want to close this dialog?".
   */
  closeConfirmationText?: string

  /**
   * If true, the dialog will be removed from the DOM when closed. Default is false.
   */
  removeFromDomOnClose?: boolean
}






/**********  for the backward compatibility  ***************/
class Dialog implements IDialogInsideButtonClickHandler {
  hide: (isCancel?: boolean) => void
  constructor(hideFn: (isCancel?: boolean) => void) {
    this.hide = hideFn;
  }
}
const dialog: Ref<Dialog> = ref(
  new Dialog((isCancel = false) => {
    if (dialog.value) {
      if (isCancel) {
        modalRef.value?.cancel();
      } else {
        modalRef.value?.close();
      }
    }
  })
);
/*************************************************************/

</script>
