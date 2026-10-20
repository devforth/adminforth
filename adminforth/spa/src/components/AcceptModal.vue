<template>
  <Modal
    ref="modalRef"
    class="w-full sm:w-[400px]"
    :role="dangerous ? 'alertdialog' : 'dialog'"
    :aria-labelledby="titleId"
    :beforeCloseFunction="() => { modalStore.onAcceptFunction(false); modalStore.isOpened = false; }"
    backgroundCustomClasses="z-[998]"
  >
    <div class="flex flex-col gap-3 px-5 py-[18px]">
      <div class="flex items-start gap-3">
        <span
          v-if="dangerous"
          class="flex w-9 h-9 shrink-0 items-center justify-center rounded-lg bg-lightDangerSoft text-lightDanger dark:bg-darkDangerSoft dark:text-darkDanger"
        >
          <component :is="icon" class="w-5 h-5" aria-hidden="true" />
        </span>
        <div class="flex-1 min-w-0 flex flex-col gap-1" :class="dangerous ? 'pt-1.5' : ''">
          <h3 :id="titleId" class="text-base font-semibold tracking-[-0.01em] text-lightDialogHeaderText dark:text-darkDialogHeaderText">
            {{ title }}
          </h3>
          <p v-if="subtitle" class="text-sm leading-5 text-lightDialogBodyText dark:text-darkDialogBodyText">{{ subtitle }}</p>
        </div>
        <Button
          v-if="!dangerous"
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          class="-mt-0.5 -me-1.5 text-lightDialogCloseButton hover:text-lightDialogCloseButtonHover hover:bg-lightDialogCloseButtonHoverBackground dark:text-darkDialogCloseButton dark:hover:text-darkDialogCloseButtonHover dark:hover:bg-darkDialogCloseButtonHoverBackground"
          :aria-label="t('Close Modal')"
          @click="answer(false)"
        >
          <IconX aria-hidden="true" />
        </Button>
      </div>

      <div v-if="modalContent.contentHTML" class="text-sm text-lightDialogBodyText dark:text-darkDialogBodyText" v-html="modalContent.contentHTML"></div>

      <p v-if="modalContent.guardMessage" class="flex items-center gap-1.5 text-xs font-medium text-lightInputIconColor dark:text-darkInputIconColor">
        <IconShieldCheck class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        {{ modalContent.guardMessage }}
      </p>
    </div>

    <div :class="dialogFooterClasses">
      <Button type="button" variant="secondary" @click="answer(false)">{{ modalContent.cancelText }}</Button>
      <Button type="button" :variant="dangerous ? 'danger' : 'primary'" @click="answer(true)">{{ modalContent.acceptText }}</Button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { watch, ref, computed, useId, type Component } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useModalStore } from '@/stores/modal';
import { Button, Modal } from '@/afcl';
import { dialogFooterClasses } from '@/afcl/dialogStyles';
import { IconShieldCheck, IconTriangleAlert, IconX } from '@iconify-prerendered/vue-lucide';

const { t } = useI18n();
const modalRef = ref();
const titleId = useId();
const modalStore = useModalStore();
const { modalContent } = storeToRefs(modalStore);

const dangerous = computed(() => modalContent.value.dangerous);
const icon = computed(() => (modalContent.value.icon ?? IconTriangleAlert) as Component);
// a call with only a message shows it as the title, a call with a title shows the message under it
const title = computed(() => modalContent.value.title || modalContent.value.content);
const subtitle = computed(() => modalContent.value.title ? modalContent.value.content : '');

function answer(accepted: boolean) {
  modalStore.onAcceptFunction(accepted);
  modalStore.togleModal();
}

watch(() => modalStore.isOpened, (opened) => {
  if (opened) {
    modalRef.value.open();
  } else {
    modalRef.value.close();
  }
});
</script>
