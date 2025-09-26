import { ref, computed, type Ref } from 'vue';
import { defineStore } from 'pinia';
import { useCoreStore } from './core';

export const useFiltersStore = defineStore('filters', () => {
    const filters: Ref<any[]> = ref([]);
    const sort: Ref<any> = ref({});
    const coreStore = useCoreStore();

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

    const shouldFilterBeHidden = (fieldName: string) => {
        if (coreStore.resource?.columns) {
            const column = coreStore.resource.columns.find((col: any) => col.name === fieldName);
            if (column?.showIn?.filter !== true) {
                return true;
            }
        }
        return false;
    }

    const visibleFiltersCount = computed(() => {
        return filters.value.filter(f => !shouldFilterBeHidden(f.field)).length;
    });

    return {
        setFilter, 
        getFilters, 
        clearFilters, 
        filters, 
        setFilters, 
        setSort, 
        getSort,
        visibleFiltersCount,
        shouldFilterBeHidden
    }
})
