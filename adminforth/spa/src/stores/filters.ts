import { ref } from 'vue'
import { defineStore } from 'pinia'
import { callAdminForthApi } from '@/utils';

export const useFiltersStore = defineStore('filters', () => {
    const filters = ref([]);
    const setFilter = (filter: any) => {
        filters.value = [...filters.value, filter];
    }
    const setFilters = (f: any) => {
        filters.value = [...f];
    }
    const getFilters = () => {
        return filters.value;
    }
    const clearFilters = () => {
        filters.value = [];
    }
    return {setFilter, getFilters,clearFilters, filters,setFilters}
    })

    