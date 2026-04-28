<template>
  <Teleport to="body">
    <Modal 
      ref="modalRef"
      :beforeCloseFunction="()=>{modalStore.onAcceptFunction(false);modalStore.isOpened=false}"
      backgroundCustomClasses="z-[998]"
      modalCustomClasses="z-[999]"
    >
      <div class="relative p-6 sm:p-8 w-[440px] bg-white rounded-2xl shadow-xl dark:bg-gray-800" >
        
        <button type="button" @click="modalStore.togleModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors dark:hover:text-white" >
          <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>
        </button>

        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-5 relative dark:bg-red-900/20">
            <IconClipboardDocumentSolid class="w-10 h-10 text-red-500" />
          <div class="absolute bottom-1 right-1 bg-red-500 rounded-full w-[18px] h-[18px] flex items-center justify-center border-2 border-white dark:border-gray-800">
              <span class="text-white text-[10px] font-medium">!</span>
          </div>
        </div>
          
          <h3 v-if="modalStore?.modalContent?.title" class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            {{ modalStore.modalContent.title }}
          </h3>
          
          <div class="mb-2 text-[15px] text-gray-600 dark:text-gray-300">
            <div v-if="modalStore?.modalContent?.contentHTML" class="font-medium" v-html="modalStore.modalContent.contentHTML"></div>
            <p v-else-if="modalStore?.modalContent?.content" class="font-medium">{{ modalStore.modalContent.content }}</p>
          </div>

          <hr class="border-t border-gray-100 dark:border-gray-700 mb-6">

          <div class="flex justify-center gap-4 w-full">
            <button @click="()=>{modalStore.onAcceptFunction(false);modalStore.togleModal()}" type="button" class="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                {{ modalStore?.modalContent?.cancelText }}
            </button>
            
            <button 
              @click="()=>{ modalStore.onAcceptFunction(true);modalStore.togleModal()}" 
              type="button" 
              class="flex-1 flex items-center justify-center py-2.5 px-4 text-sm font-medium transition-all focus:outline-none 
                    text-white bg-red-600 hover:bg-red-700 
                    dark:bg-red-500 dark:hover:bg-red-600 
                    border border-red-700 dark:border-red-600 
                    rounded-lg shadow-sm focus:z-10 focus:ring-4 
                    focus:ring-red-100 dark:focus:ring-red-900 gap-1">
                {{ modalStore?.modalContent?.acceptText }}
            </button>
          </div>

          <div class="flex items-center justify-center mt-5 text-xs text-gray-400 gap-1.5 font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span>Your changes will not be saved</span>
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
import { IconClipboardDocumentSolid } from '@iconify-prerendered/vue-heroicons';


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