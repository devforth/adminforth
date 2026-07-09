<template>
    

<div class="afcl-toast flex items-center w-full p-4 rounded-lg shadow-lg dark:text-darkToastText dark:bg-darkToastBackground bg-lightToastBackground text-lightToastText border-l-4"
    :class="variantConfig.borderClass"
    role="alert"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
>
    <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute af-toast-icon inline-flex items-center justify-center flex-shrink-0 rounded-lg w-full h-full" :class="variantConfig.iconClass">
            <component :is="variantConfig.icon" class="w-5 h-5" aria-hidden="true" />
        </div>
        <svg v-if="hasTimer" class="absolute inset-0 w-full h-full rotate-180">
            <rect
                x="1"
                y="1"
                width="calc(100% - 2px)"
                height="calc(100% - 2px)"
                :class="variantConfig.strokeClass"
                rx="8"
                fill="none"
                stroke-width="2"
                pathLength="100"
                :stroke-dasharray="`100`"
                :stroke-dashoffset="dashOffset"
            />
        </svg>
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
</div>


</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
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

const VARIANT_CONFIGS = {
    info: {
        icon: IconInfoCircleSolid,
        borderClass: 'border-lightPrimary dark:border-darkPrimary',
        iconClass: 'text-lightPrimary dark:text-darkPrimary bg-lightPrimaryOpacity dark:bg-darkPrimary/50 dark:!text-blue-100',
        strokeClass: 'stroke-lightPrimary/50 dark:stroke-darkPrimary/30',
    },
    danger: {
        icon: IconCloseCircleSolid,
        borderClass: 'border-red-500 dark:border-red-800',
        iconClass: 'text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200',
        strokeClass: 'stroke-red-500 dark:stroke-red-700',
    },
    warning: {
        icon: IconExclamationCircleSolid,
        borderClass: 'border-orange-500 dark:border-orange-700',
        iconClass: 'text-orange-500 bg-orange-100 dark:bg-orange-700 dark:text-orange-200',
        strokeClass: 'stroke-orange-500 dark:stroke-orange-600',
    },
    success: {
        icon: IconCheckCircleSolid,
        borderClass: 'border-green-500 dark:border-green-800',
        iconClass: 'text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200',
        strokeClass: 'stroke-green-500 dark:stroke-green-600',
    },
} as const;

const variantConfig = computed(() => VARIANT_CONFIGS[props.toast.variant as keyof typeof VARIANT_CONFIGS] ?? VARIANT_CONFIGS.success);

const hasTimer = computed(() => props.toast.timeout !== 'unlimited');
const totalMs = (typeof props.toast.timeout === 'number' ? props.toast.timeout : 10) * 1e3;
const dashOffset = ref(0);
let rafId: number | null = null;
let remainingMs = totalMs;
let startedAt = 0;

function frame(now: number) {
    const leftMs = Math.max(0, remainingMs - (now - startedAt));
    dashOffset.value = (1 - leftMs / totalMs) * 100;
    if (leftMs <= 0) {
        rafId = null;
        // resolve with undefined on auto-timeout
        toastStore.resolveToast(props.toast.id);
        emit('close');
        return;
    }
    rafId = requestAnimationFrame(frame);
}

function pauseTimer() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
    remainingMs = Math.max(0, remainingMs - (performance.now() - startedAt));
}

function resumeTimer() {
    if (!hasTimer.value || rafId !== null || remainingMs <= 0) return;
    startedAt = performance.now();
    rafId = requestAnimationFrame(frame);
}

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
    resumeTimer();
});

onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId);
});

</script>

<style lang="scss" scoped>

</style>