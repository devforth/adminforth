<template>
    

<div class="afcl-toast flex items-center w-full p-4 rounded-lg shadow-lg dark:text-darkToastText dark:bg-darkToastBackground bg-lightToastBackground text-lightToastText border-l-4"
    :class="toast.variant == 'info' ? 'border-lightPrimary dark:border-darkPrimary' : toast.variant == 'danger' ? 'border-red-500 dark:border-red-800' : toast.variant == 'warning' ? 'border-orange-500 dark:border-orange-700' : 'border-green-500 dark:border-green-800'"
    role="alert"
>
    <div v-if="toast.variant == 'info'" class="af-toast-icon inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-lightPrimary dark:text-darkPrimary bg-lightPrimaryOpacity rounded-lg dark:bg-darkPrimary dark:!text-blue-100">
        <IconInfoCircleSolid class="w-5 h-5" aria-hidden="true" />
    </div>
    <div v-else-if="toast.variant == 'danger'" class="af-toast-icon inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
        <IconCloseCircleSolid class="w-5 h-5" aria-hidden="true" />
    </div>
    <div v-else-if="toast.variant == 'warning'" class="af-toast-icon inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-orange-500 bg-orange-100 rounded-lg dark:bg-orange-700 dark:text-orange-200">
        <IconExclamationCircleSolid class="w-5 h-5" aria-hidden="true" />

    </div>
    <div v-else class="af-toast-icon inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
        <IconCheckCircleSolid class="w-5 h-5" aria-hidden="true" />
    </div>
    <div class="flex flex-col items-center justify-center break-all overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:70]">
        <div class="ms-3 text-sm font-normal max-w-xs pr-2" v-if="toast.messageHtml" v-html="toast.messageHtml"></div>
        <div class="ms-3 text-sm font-normal max-w-xs pr-2" v-else>
            {{toast.message}}
        </div>
        <div v-if="toast.buttons" class="flex mt-2 gap-2 w-full ml-3">
            <div v-for="button in toast.buttons" class="af-toast-button rounded-md bg-lightButtonsBackground hover:bg-lightButtonsHover text-lightButtonsText dark:bg-darkPrimary dark:hover:bg-darkButtonsBackground  dark:text-darkButtonsText">
                <button @click="onButtonClick(button.value)" class="px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-sm">
                    {{ button.label }}
                </button>
            </div>
        </div>
    </div>
    <button @click="closeToast" type="button" class="ms-auto -mx-1.5 -my-1.5 bg-lightToastCloseIconBackground text-lightToastCloseIcon hover:text-lightToastCloseIconHover rounded-lg focus:ring-2 focus:ring-lightToastCloseIconFocusRing p-1.5 hover:bg-lightToastCloseIconBackgroundHover inline-flex items-center justify-center h-8 w-8 dark:text-darkToastCloseIcon dark:hover:text-darkToastCloseIconHover dark:bg-darkToastCloseIconBackground dark:hover:bg-darkToastCloseIconBackgroundHover dark:focus:ring-darkToastCloseIconFocusRing" >
        <svg class="w-3 h-3"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
        </svg>
    </button>
    <!-- <div class="h-full ml-3 w-1 rounded-r-lg" :class="toast.variant == 'info' ? 'bg-lightPrimary dark:bg-darkPrimary' : toast.variant == 'danger' ? 'bg-red-500 dark:bg-red-800' : toast.variant == 'warning' ? 'bg-orange-500 dark:bg-orange-700' : 'bg-green-500 dark:bg-green-800'"></div> -->
</div>


</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useToastStore } from '@/stores/toast';
import { IconInfoCircleSolid, IconCloseCircleSolid, IconExclamationCircleSolid, IconCheckCircleSolid } from '@iconify-prerendered/vue-flowbite';

const toastStore = useToastStore();
const emit = defineEmits(['close']);
const props = defineProps<{
    toast: {
        message?: string;
        messageHtml?: string;
        variant: string;
        id: string;
        timeout?: number|'unlimited';
        buttons?: { value: any; label: string }[];
    }
}>();
function closeToast() {
    // resolve with undefined on close (X button)
    toastStore.resolveToast(props.toast.id);
    emit('close');
}

function onButtonClick(value: any) {
    toastStore.resolveToast(props.toast.id, value);
    emit('close');
}

onMounted(() => {
    if (props.toast.timeout === 'unlimited') return;
    else { 
      setTimeout(() => {
        // resolve with undefined on auto-timeout
        toastStore.resolveToast(props.toast.id);
        emit('close');
      }, (props.toast.timeout || 10) * 1e3 );
    }
});

</script>

<style lang="scss" scoped>

</style>