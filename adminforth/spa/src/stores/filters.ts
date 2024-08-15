import { ref, type Ref } from 'vue';
import { defineStore } from 'pinia';

export const useFiltersStore = defineStore('filters', () => {
    const filters: Ref<any[]> = ref([]);
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
    return {setFilter, getFilters, clearFilters, filters, setFilters}
})
