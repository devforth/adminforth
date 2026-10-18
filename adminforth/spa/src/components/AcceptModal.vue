<template>
  <Teleport to="body">
    <Modal 
      ref="modalRef"
      :beforeCloseFunction="()=>{modalStore.onAcceptFunction(false);modalStore.isOpened=false}"
      backgroundCustomClasses="z-[998]"
      modalCustomClasses="z-[999] flex items-center justify-center" 
    >
      <div class="relative p-6 sm:w-[420px] rounded-xl shadow-popover dark:shadow-darkPopover bg-lightAcceptModalBackground dark:bg-darkAcceptModalBackground" >
        
        <button type="button" @click="modalStore.togleModal()" class="absolute top-3 right-3 p-1.5 rounded-default text-lightAcceptModalCloseIcon hover:text-lightAcceptModalCloseIconHover hover:bg-lightAcceptModalCloseIconHoverBackground dark:text-darkAcceptModalCloseIcon dark:hover:text-darkAcceptModalCloseIconHover dark:hover:bg-darkAcceptModalCloseIconHoverBackground transition-colors" >
          <IconX class="w-4 h-4" />
        </button>

        <div class="text-center flex flex-col">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-xl mb-4 relative"
            :class="modalStore.modalContent.dangerous ? 'bg-lightDangerSoft dark:bg-darkDangerSoft' : 'bg-lightSecondaryDarken dark:bg-darkSecondaryLighten'">
            <IconClipboardList class="w-6 h-6"
              :class="modalStore.modalContent.dangerous ? 'text-lightAcceptModalWarningIcon dark:text-darkAcceptModalWarningIcon' : 'text-lightButtonsBackground dark:text-darkButtonsBackground'" />
            <div class="absolute -bottom-1 -right-1 rounded-full w-[18px] h-[18px] flex items-center justify-center border-2 border-lightAcceptModalBackground dark:border-darkAcceptModalBackground"
              :class="modalStore.modalContent.dangerous ? 'bg-lightAcceptModalConfirmButtonBackground dark:bg-darkAcceptModalConfirmButtonBackground' : 'bg-lightButtonsBackground dark:bg-darkButtonsBackground'">
                <span class="text-lightButtonsText dark:text-darkButtonsText text-[10px] font-medium">!</span>
            </div>
          </div>
          
          <div class="flex flex-col gap-3">
            <h3 v-if="modalStore?.modalContent?.title" class="text-lg font-semibold tracking-tight text-lightDialogHeaderText dark:text-darkDialogHeaderText">
              {{ modalStore.modalContent.title }}
            </h3>
            
            <div class="text-sm text-lightAcceptModalText dark:text-darkAcceptModalText">
              <div v-if="modalStore?.modalContent?.contentHTML" v-html="modalStore.modalContent.contentHTML"></div>
              <p v-else-if="modalStore?.modalContent?.content">{{ modalStore.modalContent.content }}</p>
            </div>
          </div>

          <hr class="border-t border-lightDialogBreakLine dark:border-darkDialogBreakLine my-5">

          <div class="flex justify-center gap-2 w-full">
            <Button @click="()=>{modalStore.onAcceptFunction(false);modalStore.togleModal()}" type="button" variant="secondary" class="flex-1">
                {{ modalStore?.modalContent?.cancelText }}
            </Button>
            
            <Button
              @click="()=>{ modalStore.onAcceptFunction(true);modalStore.togleModal()}"
              type="button"
              class="flex-1"
              :variant="modalStore.modalContent.dangerous ? 'danger' : 'primary'">
                {{ modalStore?.modalContent?.acceptText }}
            </Button>
          </div>

          <div v-if="modalStore?.modalContent?.guardMessage" class="flex items-center justify-center mt-5 text-xs text-lightAcceptModalText dark:text-darkAcceptModalText gap-1.5 font-medium">
            <IconShieldCheck class="w-4 h-4" />
            <span> {{ modalStore?.modalContent?.guardMessage }}</span>
          </div>

        </div>
      </div>
    </Modal>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue';
import { useModalStore } from '@/stores/modal';
import { Button, Modal } from '@/afcl';
import { IconClipboardList, IconShieldCheck, IconX } from '@iconify-prerendered/vue-lucide';


const modalRef = ref();
const modalStore = useModalStore();

watch( () => modalStore.isOpened, (newVal) => {
    if (newVal) {
        open();
    } else {
        close();
    }
  }
);



function open() {
  modalRef.value.open();
}

function close() {
  modalRef.value.close();
}

</script>
