<template>
  <Teleport to="body">
  <div ref="modalEl" tabindex="-1" aria-hidden="true" class="hidden fixed inset-0 z-[110] w-full h-full overflow-y-auto overflow-x-hidden flex items-center justify-center">
    <div class="relative p-4 w-full max-w-md max-h-full" >
            <div class="afcl-confirmation-container relative bg-lightAcceptModalBackground rounded-lg shadow dark:bg-darkAcceptModalBackground dark:shadow-black">
        <button type="button" @click="modalStore.togleModal" class="absolute top-3 end-2.5 text-lightAcceptModalCloseIcon bg-transparent hover:bg-lightAcceptModalCloseIconHoverBackground hover:text-lightAcceptModalCloseIconHover rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:text-darkAcceptModalCloseIcon dark:hover:bg-darkAcceptModalCloseIconHoverBackground dark:hover:text-darkAcceptModalCloseIconHover" >
                    <svg class="w-3 h-3"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span class="sr-only">{{ $t('Close modal') }}</span>
                </button>
                <div class="p-4 md:p-5 text-center">
                    <svg class="mx-auto mb-4 text-lightAcceptModalWarningIcon w-12 h-12 dark:text-darkAcceptModalWarningIcon"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                    </svg>
                    <h3 class="afcl-confirmation-title mb-5 text-lg font-normal text-lightAcceptModalText dark:text-darkAcceptModalText">{{ modalStore?.modalContent?.content }}</h3>
                    <h3 class=" afcl-confirmation-title mb-5 text-lg font-normal text-lightAcceptModalText dark:text-darkAcceptModalText" v-html="modalStore?.modalContent?.contentHTML"></h3>

                    <button @click="()=>{ modalStore.onAcceptFunction(true);modalStore.togleModal()}" type="button" class="afcl-confirmation-accept-button text-lightAcceptModalConfirmButtonText bg-lightAcceptModalConfirmButtonBackground hover:bg-lightAcceptModalConfirmButtonBackgroundHover focus:ring-4 focus:outline-none focus:ring-lightAcceptModalConfirmButtonFocus font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center dark:text-darkAcceptModalConfirmButtonText dark:bg-darkAcceptModalConfirmButtonBackground dark:hover:bg-darkAcceptModalConfirmButtonBackgroundHover dark:focus:ring-darkAcceptModalConfirmButtonFocus">
                        {{ modalStore?.modalContent?.acceptText }}
                    </button>
                    <button @click="()=>{modalStore.onAcceptFunction(false);modalStore.togleModal()}"  type="button" class="afcl-confirmation-cancel-button py-2.5 px-5 ms-3 text-sm font-medium text-lightAcceptModalCancelButtonText focus:outline-none bg-lightAcceptModalCancelButtonBackground rounded-lg border border-lightAcceptModalCancelButtonBorder hover:bg-lightAcceptModalCancelButtonBackgroundHover hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-lightAcceptModalCancelButtonFocus dark:focus:ring-darkAcceptModalCancelButtonFocus dark:bg-darkAcceptModalCancelButtonBackground dark:text-darkAcceptModalCancelButtonText dark:border-darkAcceptModalCancelButtonBorder dark:hover:text-darkAcceptModalCancelButtonTextHover dark:hover:bg-darkAcceptModalCancelButtonBackgroundHover">{{ modalStore?.modalContent?.cancelText }}</button>
                </div>
            </div>
        </div>
    </div>

</Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, nextTick, ref } from 'vue';
import { useModalStore } from '@/stores/modal';
import { Modal } from 'flowbite';

const modalStore = useModalStore();
const modalEl = ref(null);
const modal = ref(null);

watch( () => modalStore.isOpened, (newVal) => {
    if (newVal) {
        open();
    } else {
        close();
    }
  }
);

onMounted(async () => {
  await nextTick();
  modal.value = new Modal(
    modalEl.value,
    {
      closable: true,
      backdrop: 'static',
      backdropClasses: "bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-[100]"
    }
  );
})

function open() {
  modal.value?.show();
}

function close() {
  modal.value?.hide();
}

</script>

<style scoped>
.modal {
  position: fixed;
  z-index: 999;
  top: 20%;
  left: 50%;
  width: 300px;
  margin-left: -150px;
}
</style>