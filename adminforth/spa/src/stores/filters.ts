import { ref, computed, type Ref } from 'vue';
import { defineStore } from 'pinia';
import { useCoreStore } from './core';
import type { FilterParams } from '@/types/Common';
import type { AdminforthFilterStore, sortType } from '../spa_types/core';

export const useFiltersStore = defineStore('filters', () => {
    const filters: Ref<FilterParams[]> = ref([]);
    const sort: Ref<sortType> = ref(null);
    const coreStore = useCoreStore();

    const setSort = (s: sortType): void => {
        sort.value = s;
    }
    const getSort = (): sortType => {
        return sort.value;
    }
    const setFilter = (filter: FilterParams) => {
        const index = filters.value.findIndex(f => f.field === filter.field);
        if (filters.value[index] && filters.value[index].operator === filter.operator) {
            filters.value[index] = filter;
            return;
        }
        filters.value.push(filter);
    }
    const setFilters = (f: FilterParams[]) => {
        filters.value = f;
    }
    const getFilters = (): FilterParams[] => {
        return filters.value;
    }
    const clearFilter = (fieldName: string): void => {
        filters.value = filters.value.filter(f => f.field !== fieldName);
    }
    const clearFilters = (): void => {
        filters.value = [];
    }

    const shouldFilterBeHidden = (fieldName: string): boolean => {
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

    const store = {
        setFilter, 
        getFilters, 
        clearFilters, 
        filters, 
        setFilters, 
        setSort, 
        getSort,
        visibleFiltersCount,
        shouldFilterBeHidden,
        clearFilter
    }

    return store as AdminforthFilterStore;
})
