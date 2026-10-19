<template>
  <div
    v-if="$slots.trigger"
    @click="toggleModal()" class="inline-flex items-center cursor-pointer w-full"
  >
    <slot name="trigger"></slot>
  </div>
  <Teleport :to="teleportTarget">
    <Transition
      enter-from-class="af-modal-hidden opacity-0"
      enter-active-class="transition-opacity duration-150 ease-out motion-reduce:transition-none"
      leave-active-class="transition-opacity duration-100 ease-in motion-reduce:transition-none"
      leave-to-class="af-modal-hidden opacity-0"
    >
      <div 
        v-show="isModalOpen" 
        v-if="!removeFromDom" 
        @click="backdropClick" 
        class="afcl-modal-backdrop group/modal fixed inset-0 z-50 flex justify-center overflow-y-auto overflow-x-hidden overscroll-contain bg-lightScrim dark:bg-darkScrim max-sm:pt-12"
        :class="props.backgroundCustomClasses"
      >
        <!-- Modal content -->
        <div
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          v-bind="$attrs"
          class="afcl-modal focus:outline-none transition-transform duration-150 ease-out motion-reduce:transition-none group-[.af-modal-hidden]/modal:translate-y-1 group-[.af-modal-hidden]/modal:scale-[.98] max-sm:group-[.af-modal-hidden]/modal:translate-y-full max-sm:group-[.af-modal-hidden]/modal:scale-100"
          :class="dialogPanelClasses"
        >

          <!-- Modal body -->
          <div class="text-lightDialogBodyText dark:text-darkDialogBodyText">
            <slot ></slot>
          </div>
         
          <!-- Confirmation Modal -->
          <div
            v-if="showConfirmationOnClose"
            class="fixed inset-0 z-[60] flex justify-center overflow-y-auto bg-lightScrim dark:bg-darkScrim max-sm:pt-12"
            :class="props.modalCustomClasses"
          >
            <div
              role="alertdialog"
              aria-modal="true"
              :aria-labelledby="confirmationTitleId"
              class="w-full sm:max-w-sm"
              :class="dialogPanelClasses"
            >
              <div class="px-5 py-[18px]">
                <h2 :id="confirmationTitleId" class="mb-1.5 text-base font-semibold text-lightDialogHeaderText dark:text-darkDialogHeaderText">{{ t('Confirm Close') }}</h2>
                <p class="text-sm text-lightDialogBodyText dark:text-darkDialogBodyText">{{ props.closeConfirmationText }}</p>
              </div>
              <div :class="dialogFooterClasses">
                <Button
                  variant="secondary"
                  @click="showConfirmationOnClose = false"
                >
                  {{ t('Cancel') }}
                </Button>
                <Button
                  @click="
                    showConfirmationOnClose = false;
                    close();
                  "
                >
                  {{ t('Confirm') }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import Button from "./Button.vue";
import { ref, onMounted, nextTick, onUnmounted, computed, watch, useId, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { dialogPanelClasses, dialogFooterClasses } from './dialogStyles';
import { useTeleportTarget, activeElementIn } from './shadowRoot';

const isModalOpen = defineModel<boolean>('open', { default: false });
const { t } = useI18n();
const teleportTarget = useTeleportTarget();

const removeFromDom = computed(() => {
  return props.removeFromDomOnClose && !isModalOpen.value;
})

interface DialogProps {
  closeByClickOutside?: boolean
  closeByEsc?: boolean
  beforeCloseFunction?: (() => void | Promise<void | boolean>) | null
  beforeOpenFunction?: (() => void | Promise<void>) | null
  beforeCancelFunction?: (() => void | Promise<void | boolean>) | null
  askForCloseConfirmation?: boolean
  closeConfirmationText?: string
  removeFromDomOnClose?: boolean
  backgroundCustomClasses?: string
  modalCustomClasses?: string
}

const props = withDefaults(defineProps<DialogProps>(), {
  closeByClickOutside: true,
  closeByEsc: true,
  beforeCloseFunction: null,
  beforeOpenFunction: null,
  beforeCancelFunction: null,
  askForCloseConfirmation: false,
  closeConfirmationText: 'Are you sure you want to close this dialog?',
  removeFromDomOnClose: false,
  backgroundCustomClasses: '',
  modalCustomClasses: '',
})

const showConfirmationOnClose = ref(false);
const confirmationTitleId = useId();

const panelRef = ref<HTMLElement>();
let focusBeforeOpen: HTMLElement | null = null;

// focus goes into the dialog on open (unless the content already took it) and back to the trigger on close
watch(isModalOpen, async (open) => {
  if (open) {
    focusBeforeOpen = document.activeElement as HTMLElement | null;
    await nextTick();
    if (!panelRef.value!.contains(activeElementIn(panelRef.value!))) {
      panelRef.value!.focus({ preventScroll: true });
    }
  } else {
    focusBeforeOpen?.focus({ preventScroll: true });
  }
});


async function open() {
  if (props.beforeOpenFunction) {
    await props.beforeOpenFunction?.();
  }
  isModalOpen.value = true;
}

async function close() {
  if (props.beforeCloseFunction) {
    const shouldClose =  await props.beforeCloseFunction?.();
    if (shouldClose === false) {
      return;
    }
  }
  isModalOpen.value = false;
}

async function cancel() {
  if (props.beforeCancelFunction) {
    const shouldCancel = await props.beforeCancelFunction?.();
    if (shouldCancel === false) return;
  }
  close();
}

defineOptions({
  inheritAttrs: false,
})

defineExpose({
  open: open,
  close: close,
  cancel: cancel,
  tryToHideModal: tryToHideModal,
})

function tryToHideModal(isCancelAction = false) {
  if (!props.askForCloseConfirmation) {
    if (isCancelAction) {
      cancel();
    } else {
      close();
    }
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

function onEsc(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.closeByEsc) {
    tryToHideModal(true);
  }
}

onMounted(() => {
  document.addEventListener('keydown', onEsc)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onEsc)
})


function backdropClick(e: MouseEvent) {
  if (props.closeByClickOutside && e.target === e.currentTarget) {
    tryToHideModal(true);
  }
}

</script>
