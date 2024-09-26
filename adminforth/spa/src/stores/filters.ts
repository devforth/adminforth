import { ref, type Ref } from 'vue';
import { defineStore } from 'pinia';

export const useFiltersStore = defineStore('filters', () => {
    const filters: Ref<any[]> = ref([]);
    const sort: Ref<any> = ref({});

    const setSort = (s: any) => {
        sort.value = s;
    }
    const getSort = () => {
        return sort.value;
    }
    const setFilter = (filter: any) => {
        filters.value.push(filter);
    }
    const setFilters = (f: any) => {
        filters.value = f;
    }
    const getFilters = () => {
        return filters.value;
    }
    const clearFilters = () => {
        filters.value = [];
    }
    return {setFilter, getFilters, clearFilters, filters, setFilters, setSort, getSort}
})
