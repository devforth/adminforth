import { ref, watch, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { v1 as uuid } from 'uuid';
import { useRoute } from 'vue-router';



export const useToastStore = defineStore('toast', () => {
    const toasts: Ref<any[]> = ref([]);
    const route = useRoute();

    watch(route, () => {
        // on route change clear all toasts older then 5 seconds
        const now = +new Date();
        toasts.value = toasts.value.filter((t) => t?.timeout === 'unlimited' || now - t.createdAt < 5000);
    });

    const addToast = (toast: { 
        message?: string; 
        messageHtml?: string; 
        variant: string; 
        timeout?: number | 'unlimited';
        buttons?: { value: any; label: string }[];
        onResolve?: (value?: any) => void;
    }): string => {
        const toastId = uuid();
        toasts.value.push({
            ...toast,
            id: toastId,
            createdAt: +new Date(),
        });
        return toastId;
    };
    const removeToast = (toast: { id: string }) => {
        toasts.value = toasts.value.filter((t) => t.id !== toast.id);
    };

    const resolveToast = (toastId: string, value?: any) => {
        const t = toasts.value.find((x) => x.id === toastId);
        try {
            t?.onResolve?.(value);
        } catch {
            // no-op
        }
        toasts.value = toasts.value.filter((x) => x.id !== toastId);
    };

    return { toasts, addToast, removeToast, resolveToast };
});