<template>
  <!-- drawer component -->
  <div id="drawer-navigation" class="fixed top-14 right-0 z-50 p-4 overflow-y-auto transition-transform translate-x-full bg-white w-80 dark:bg-gray-800" 
      tabindex="-1" aria-labelledby="drawer-navigation-label"
      :style="{ height: `calc(100vh - 3.5rem)` }"
  >
    <h5 id="drawer-navigation-label" class="text-base font-semibold text-gray-500 uppercase dark:text-gray-400">
      Filters

      <button type="button" data-drawer-hide="drawer-navigation" aria-controls="drawer-navigation" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 absolute end-2.5 inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" >
        <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        <span class="sr-only">Close menu</span>
      </button>
    </h5>
   
    <div class="py-4 ">
      <ul class="space-y-3 font-medium">
         <li v-for="c in columnsWithFilter" :key="c">
            {{ c.label }}

            <Dropdown 
              v-if="c.type === 'boolean'" 
              :options="[{ label: 'Yes', value: true }, { label: 'No', value: false }, { label: 'Unset', value: null }]"
              @update:modelValue="setFilterItem({ column: c, operator: 'in', value: $event })"
              :modelValue="filters.find(f => f.field === c.name && f.operator === 'in')?.value || []"
            />
            
            <Dropdown 
              v-else-if="c.enum"
              :options="c.enum"
              :allowCustom="c.allowCustom"
              @update:modelValue="setFilterItem({ column: c, operator: 'in', value: $event })"
              :modelValue="filters.find(f => f.field === c.name && f.operator === 'in')?.value || []"
            />

           <input
             v-else-if="[ 'string', 'text' ].includes(c.type)"
             type="text" class="w-full py-1 px-2 border border-gray-300 rounded-md"
             placeholder="Search"
             @input="setFilterItem({ column: c, operator: 'ilike', value: $event.target.value || undefined })"
             :value="getFilterItem({ column: c, operator: 'ilike' })"
           >

           <CustomDateRangePicker
             v-else-if="['datetime'].includes(c.type)"
             :column="c"
             :valueStart="filters.find(f => f.field === c.name && f.operator === 'gte')?.value || undefined"
             @update:valueStart="setFilterItem({ column: c, operator: 'gte', value: $event || undefined })"
             :valueEnd="filters.find(f => f.field === c.name && f.operator === 'lte')?.value || undefined"
             @update:valueEnd="setFilterItem({ column: c, operator: 'lte', value: $event || undefined })"
           />

           <input
             v-else-if="[ 'date', 'time' ].includes(c.type)"
             type="text" class="w-full py-1 px-2 border border-gray-300 rounded-md"
             placeholder="Search datetime"
             @input="setFilterItem({ column: c, operator: 'ilike', value: $event.target.value || undefined })"
             :value="getFilterItem({ column: c, operator: 'ilike' })"
           >

            <div v-else-if="['integer', 'decimal', 'float'].includes(c.type)" class="flex gap-2">
              <input 
                type="number" aria-describedby="helper-text-explanation" 
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="from"
                @input="setFilterItem({ column: c, operator: 'gte', value: $event.target.value || undefined })"
                :value="getFilterItem({ column: c, operator: 'gte' })"
              >
              <input 
                type="number" aria-describedby="helper-text-explanation" 
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="to"
                @input="setFilterItem({ column: c, operator: 'lte', value: $event.target.value || undefined})"
                :value="getFilterItem({ column: c, operator: 'lte' })"
              >
            </div>
            
         </li>
      </ul>
   </div>

   <div class="flex justify-end gap-2">
      <button 
        :disabled="!filters.length"
        type="button" 
        class="flex items-center py-1 px-3  mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded border border-gray-300 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="clear">Clear all</button>

   </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Dropdown from '@/components/Dropdown.vue';
import CustomDateRangePicker from '@/components/CustomDateRangePicker.vue';

// props: columns
// add support for v-model:filers
const props = defineProps(['columns', 'filters']);
const emits = defineEmits(['update:filters']);

const columnsWithFilter = computed( 
  () => props.columns?.filter(column => column.showIn.includes('filter')) || []
);


// filters is a array of objects
// {
//   field: 'name',
//   value: 'John',
//   operator: 'like'
// }

function setFilterItem({ column, operator, value }) {

  const index = props.filters.findIndex(f => f.field === column.name && f.operator === operator);
  if (value === undefined) {
    if (index !== -1) {
      props.filters.splice(index, 1);
    }
    emits('update:filters', [...props.filters]);
    return;
  } else {
    if (index === -1) {
      props.filters.push({ field: column.name, value, operator });
    } else {
      props.filters[index].value = value;
    }
  }
  emits('update:filters', [...props.filters]);
}

function getFilterItem({ column, operator }) {
  return props.filters.find(f => f.field === column.name && f.operator === operator)?.value || '';
}

async function clear() {
  emits('update:filters', []);
}
</script>