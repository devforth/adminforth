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
        toasts.value = toasts.value.filter((t) => now - t.createdAt < 5000);
    });

    const addToast = (toast: { message: string; variant: string }) => {
        const toastId = uuid();
        toasts.value.push({
            ...toast,
            id: toastId,
            createdAt: +new Date(),
        });
    };
    const removeToast = (toast: { id: string }) => {
        toasts.value = toasts.value.filter((t) => t.id !== toast.id);
    };
    return { toasts, addToast, removeToast };
});