<template>
    

<div class="afcl-toast flex items-center w-full p-3 pe-4 rounded-lg shadow-popover dark:shadow-darkPopover dark:text-darkToastText dark:bg-darkToastBackground bg-lightToastBackground text-lightToastText"
    role="alert"
>
    <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute af-toast-icon inline-flex items-center justify-center flex-shrink-0 rounded-lg w-full h-full" :class="variantConfig.iconClass">
            <component :is="variantConfig.icon" class="w-4 h-4" aria-hidden="true" />
        </div>
        <svg v-if="hasTimer" class="absolute inset-0 w-full h-full rotate-180">
            <rect
                x="1"
                y="1"
                width="calc(100% - 2px)"
                height="calc(100% - 2px)"
                :class="variantConfig.strokeClass"
                rx="0.5rem"
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
    <button @click="closeToast" type="button" class="ms-auto -mx-1.5 -my-1.5 bg-lightToastCloseIconBackground text-lightToastCloseIcon hover:text-lightToastCloseIconHover rounded-default focus:outline-none focus-visible:ring-[3px] focus-visible:ring-lightToastCloseIconFocusRing p-1.5 hover:bg-lightToastCloseIconBackgroundHover inline-flex items-center justify-center h-8 w-8 dark:text-darkToastCloseIcon dark:hover:text-darkToastCloseIconHover dark:bg-darkToastCloseIconBackground dark:hover:bg-darkToastCloseIconBackgroundHover dark:focus-visible:ring-darkToastCloseIconFocusRing" >
        <IconX class="w-3.5 h-3.5" />
    </button>
</div>


</template>

<script setup lang="ts">
import { onUnmounted, computed, ref, watch } from 'vue';
import { useToastStore } from '@/stores/toast';
import { IconInfo, IconCircleX, IconTriangleAlert, IconCircleCheck, IconX } from '@iconify-prerendered/vue-lucide';

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
    };
    paused: boolean;
}>();

const VARIANT_CONFIGS = {
    info: {
        icon: IconInfo,
        iconClass: 'text-lightPrimary bg-lightPrimaryOpacity dark:text-darkPrimary dark:bg-darkPrimaryOpacity',
        strokeClass: 'stroke-lightPrimary/50 dark:stroke-darkPrimary/30',
    },
    danger: {
        icon: IconCircleX,
        iconClass: 'text-lightDanger bg-lightDangerSoft dark:text-darkDanger dark:bg-darkDangerSoft',
        strokeClass: 'stroke-lightDanger/50 dark:stroke-darkDanger/30',
    },
    warning: {
        icon: IconTriangleAlert,
        iconClass: 'text-lightWarning bg-lightWarningSoft dark:text-darkWarning dark:bg-darkWarningSoft',
        strokeClass: 'stroke-lightWarning/50 dark:stroke-darkWarning/30',
    },
    success: {
        icon: IconCircleCheck,
        iconClass: 'text-lightSuccess bg-lightSuccessSoft dark:text-darkSuccess dark:bg-darkSuccessSoft',
        strokeClass: 'stroke-lightSuccess/50 dark:stroke-darkSuccess/30',
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

watch(() => props.paused, (paused) => paused ? pauseTimer() : resumeTimer(), { immediate: true });

onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId);
});

</script>

<style lang="scss" scoped>

</style>