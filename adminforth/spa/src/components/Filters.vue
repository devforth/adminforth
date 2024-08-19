<template>
  <!-- drawer component -->
  <div id="drawer-navigation" 
  
      class="fixed  right-0 z-50 p-4 overflow-y-auto transition-transform translate-x-full bg-white w-80 dark:bg-gray-800 shadow-xl dark:shadow-gray-900"

      :class="show ? 'top-0 transform-none' : ''"
      tabindex="-1" aria-labelledby="drawer-navigation-label"
      :style="{ height: `calc(100vh ` }"
  >
    <h5 id="drawer-navigation-label" class="text-base font-semibold text-gray-500 uppercase dark:text-gray-400">
      Filters

      <button type="button"   @click="$emit('hide')"  class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 absolute end-2.5 inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" >
        <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        <span class="sr-only">Close menu</span>
      </button>
    </h5>
   
    <div class="py-4 ">
      <ul class="space-y-3 font-medium">
         <li v-for="c in columnsWithFilter" :key="c">
            <p class="dark:text-gray-400">{{ c.label }}</p>

            <Dropdown
              v-if="c.foreignResource"
              :options="columnOptions[c.name] || []"
              @update:modelValue="setFilterItem({ column: c, operator: 'in', value: $event })"
              :modelValue="filtersStore.filters.find(f => f.field === c.name && f.operator === 'in')?.value || []"
            />
            <Dropdown
              v-else-if="c.type === 'boolean'"
              :options="[{ label: 'Yes', value: true }, { label: 'No', value: false }, { label: 'Unset', value: null }]"
              @update:modelValue="setFilterItem({ column: c, operator: 'in', value: $event })"
              :modelValue="filtersStore.filters.find(f => f.field === c.name && f.operator === 'in')?.value || []"
            />
            
            <Dropdown 
              v-else-if="c.enum"
              :options="c.enum"
              :allowCustom="c.allowCustom"
              @update:modelValue="setFilterItem({ column: c, operator: 'in', value: $event })"
              :modelValue="filtersStore.filters.find(f => f.field === c.name && f.operator === 'in')?.value || []"
            />

           <input
             v-else-if="[ 'string', 'text' ].includes(c.type)"
             type="text" class="w-full py-1 px-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
             placeholder="Search"
             @input="setFilterItem({ column: c, operator: 'ilike', value: $event.target.value || undefined })"
             :value="getFilterItem({ column: c, operator: 'ilike' })"
           >

           <CustomDateRangePicker
             v-else-if="['datetime'].includes(c.type)"
             :column="c"
             :valueStart="filtersStore.filters.find(f => f.field === c.name && f.operator === 'gte')?.value || undefined"
             @update:valueStart="setFilterItem({ column: c, operator: 'gte', value: $event || undefined })"
             :valueEnd="filtersStore.filters.find(f => f.field === c.name && f.operator === 'lte')?.value || undefined"
             @update:valueEnd="setFilterItem({ column: c, operator: 'lte', value: $event || undefined })"
           />

           <input
             v-else-if="[ 'date', 'time' ].includes(c.type)"
             type="text" class="w-full py-1 px-2 border border-gray-300 rounded-md"
             placeholder="Search datetime"
             @input="setFilterItem({ column: c, operator: 'ilike', value: $event.target.value || undefined })"
             :value="getFilterItem({ column: c, operator: 'ilike' })"
           >

           <CustomRangePicker
             v-else-if="['integer', 'decimal', 'float'].includes(c.type) && c.allowMinMaxQuery"
             :min="getFilterMinValue(c.name)"
             :max="getFilterMaxValue(c.name)"
             :valueStart="getFilterItem({ column: c, operator: 'gte' })"
             @update:valueStart="setFilterItem({ column: c, operator: 'gte', value: $event || undefined })"
             :valueEnd="getFilterItem({ column: c, operator: 'lte' })"
             @update:valueEnd="setFilterItem({ column: c, operator: 'lte', value: $event || undefined })"
           />

           <div v-else-if="['integer', 'decimal', 'float'].includes(c.type)" class="flex gap-2">
             <input
               type="number" aria-describedby="helper-text-explanation"
               class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
               placeholder="From"
               @input="setFilterItem({ column: c, operator: 'gte', value: $event.target.value || undefined })"
               :value="getFilterItem({ column: c, operator: 'gte' })"
             >
             <input
               type="number" aria-describedby="helper-text-explanation"
               class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
               placeholder="To"
               @input="setFilterItem({ column: c, operator: 'lte', value: $event.target.value || undefined})"
               :value="getFilterItem({ column: c, operator: 'lte' })"
             >
           </div>
            
         </li>
      </ul>
   </div>

   <div class="flex justify-end gap-2">
      <button 
        :disabled="!filtersStore.filters.length"
        type="button" 
        class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="clear">Clear all</button>

   </div>
  </div>

  <div v-if="show"  class="bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0  z-30"
    @click="$emit('hide')">
  </div>
</template>

<script setup>
import { watch, computed, ref, onMounted } from 'vue'
import Dropdown from '@/components/Dropdown.vue';
import CustomDateRangePicker from '@/components/CustomDateRangePicker.vue';
import { callAdminForthApi } from '@/utils';
import { useRouter } from 'vue-router';
import { computedAsync } from '@vueuse/core'
import CustomRangePicker from "@/components/CustomRangePicker.vue";
import { useFiltersStore } from '@/stores/filters';

const filtersStore = useFiltersStore();


// props: columns
// add support for v-model:filers
const props = defineProps(['columns', 'filters', 'show', 'columnsMinMax']);
const emits = defineEmits(['update:filters', 'hide']);

const router = useRouter();


const columnsWithFilter = computed(
  () => props.columns?.filter(column => column.showIn.includes('filter')) || []
);

const columnOptions = computedAsync(async () => {
  const ret = {};
  if (!props.columns) {
    return ret;
  }
  await Promise.all(
    Object.values(props.columns).map(async (column) => {
      if (column.foreignResource) {
        const list = await callAdminForthApi({
          method: 'POST',
          path: `/get_resource_foreign_data`,
          body: {
            resourceId: router.currentRoute.value.params.resourceId,
            column: column.name,
            limit: 1000,
            offset: 0,
          },
        });
        ret[column.name] = list.items;
      }
    })
  );

  return ret;
}, {});


// sync 'body' class 'overflow-hidden' with show prop show
watch(() => props.show, (show) => {
  if (show) {
    document.body.classList.add('overflow-hidden');
  } else {
    document.body.classList.remove('overflow-hidden');
  }
});

// filters is a array of objects
// {
//   field: 'name',
//   value: 'John',
//   operator: 'like'
// }

function setFilterItem({ column, operator, value }) {

  const index = filtersStore.filters.findIndex(f => f.field === column.name && f.operator === operator);
  if (value === undefined) {
    if (index !== -1) {
      filtersStore.filters.splice(index, 1);
    }
  } else {
    if (index === -1) {
      filtersStore.setFilter({ field: column.name, value, operator });
    } else {
      filtersStore.setFilters([...filtersStore.filters.slice(0, index), { field: column.name, value, operator }, ...filtersStore.filters.slice(index + 1)])
    }
  }
  emits('update:filters', [...filtersStore.filters]);
}

function getFilterItem({ column, operator }) {
  return filtersStore.filters.find(f => f.field === column.name && f.operator === operator)?.value || '';
}

async function clear() {
  filtersStore.clearFilters();
  emits('update:filters', [...filtersStore.filters]);
}

function getFilterMinValue(columnName) {
  if(props.columnsMinMax && props.columnsMinMax[columnName]) {
    return props.columnsMinMax[columnName]?.min
  }
}

function getFilterMaxValue(columnName) {
  if(props.columnsMinMax && props.columnsMinMax[columnName]) {
    return props.columnsMinMax[columnName]?.max
  }
}
</script>