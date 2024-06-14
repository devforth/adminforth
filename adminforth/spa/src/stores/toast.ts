import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { callAdminForthApi } from '@/utils';
import { v1 as uuid } from 'uuid';

export const useToastStore = defineStore('toast', () => {
    const toasts = ref([]);
    const addToast = (toast) => {
        toasts.value.push({...toast, id: uuid()});
    };
    const removeToast = (toast) => {
        toasts.value = toasts.value.filter((t) => t.id !== toast.id);
    };
    return { toasts, addToast, removeToast };
});