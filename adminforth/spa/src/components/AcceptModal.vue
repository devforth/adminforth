<template>
  <Teleport to="body">
    <Modal 
      ref="modalRef"
      :beforeCloseFunction="()=>{modalStore.onAcceptFunction(false);modalStore.isOpened=false}"
      backgroundCustomClasses="z-[998]"
      modalCustomClasses="z-[999] flex items-center justify-center" 
    >
      <div class="relative p-6 sm:p-8 sm:w-[440px] rounded-lg shadow-xl bg-lightAcceptModalBackground dark:bg-darkAcceptModalBackground" >
        
        <button type="button" @click="modalStore.togleModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors dark:hover:text-white" >
          <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>
        </button>

        <div class="text-center flex flex-col">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 relative"
            :class="modalStore.modalContent.dangerous ? 'bg-red-50 dark:bg-red-900/20' : 'bg-lightPrimaryOpacity dark:bg-darkPrimaryOpacity'">
            <IconClipboardDocumentSolid class="w-10 h-10"
              :class="modalStore.modalContent.dangerous ? 'text-red-500' : 'text-lightButtonsBackground dark:text-darkButtonsBackground'" />
            <div class="absolute bottom-1 right-1 rounded-default w-[18px] h-[18px] flex items-center justify-center border-2 border-white dark:border-gray-800"
              :class="modalStore.modalContent.dangerous ? 'bg-red-500' : 'bg-lightButtonsBackground dark:bg-darkButtonsBackground'">
                <span class="text-lightButtonsText dark:text-darkButtonsText text-[10px] font-medium">!</span>
            </div>
          </div>
          
          <div class="flex flex-col gap-3">
            <h3 v-if="modalStore?.modalContent?.title" class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ modalStore.modalContent.title }}
            </h3>
            
            <div class="text-[15px] text-gray-600 dark:text-gray-300">
              <div v-if="modalStore?.modalContent?.contentHTML" class="font-medium" v-html="modalStore.modalContent.contentHTML"></div>
              <p v-else-if="modalStore?.modalContent?.content" class="font-medium">{{ modalStore.modalContent.content }}</p>
            </div>
          </div>

          <hr class="border-t-2 border-gray-300 dark:border-gray-500 my-6">

          <div class="flex justify-center gap-4 w-full">
            <button @click="()=>{modalStore.onAcceptFunction(false);modalStore.togleModal()}" type="button" class="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-white rounded-default border border-gray-200 hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                {{ modalStore?.modalContent?.cancelText }}
            </button>
            
            <button
              @click="()=>{ modalStore.onAcceptFunction(true);modalStore.togleModal()}"
              type="button"
              class="flex-1 flex items-center justify-center py-2.5 px-4 text-sm font-medium transition-all focus:outline-none
                    border-none rounded-default shadow-sm focus:z-10 focus:ring-4 gap-1"
              :class="modalStore.modalContent.dangerous
                ? 'text-lightAcceptModalConfirmButtonText dark:text-darkAcceptModalConfirmButtonText bg-lightAcceptModalConfirmButtonBackground dark:bg-darkAcceptModalConfirmButtonBackground hover:bg-lightAcceptModalConfirmButtonBackgroundHover dark:hover:bg-darkAcceptModalConfirmButtonBackgroundHover focus:ring-lightAcceptModalConfirmButtonFocus dark:focus:ring-darkAcceptModalConfirmButtonFocus'
                : 'text-lightButtonsText dark:text-darkButtonsText bg-lightButtonsBackground dark:bg-darkButtonsBackground hover:bg-lightButtonsHover dark:hover:bg-darkButtonsHover focus:ring-lightButtonFocusRing dark:focus:ring-darkButtonFocusRing'">
                {{ modalStore?.modalContent?.acceptText }}
            </button>
          </div>

          <div v-if="modalStore?.modalContent?.guardMessage" class="flex items-center justify-center mt-6 text-xs text-gray-400 gap-1.5 font-medium">
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
import { Modal } from '@/afcl';
import { IconClipboardDocumentSolid, IconShieldCheck } from '@iconify-prerendered/vue-heroicons';


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