<template>
  <!-- drawer component -->
  <div id="drawer-navigation" class="fixed top-14 right-0 z-50 h-screen p-4 overflow-y-auto transition-transform translate-x-full bg-white w-80 dark:bg-gray-800" tabindex="-1" aria-labelledby="drawer-navigation-label">
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
              :options="[{ label: 'Yes', value: true }, { label: 'No', value: false }]"
              @change="setFilter(c, $event.target.checked)" :checked="filters.find(f => f.field === c.name)?.value" />
            
            <Dropdown 
              v-else-if="c.enum"
              :options="c.enum"
              :allowCustom="c.allowCustom"
              @change="setFilter(c, $event)" :value="filters.find(f => f.field === c.name)?.value" 
            />

            <input 
              v-else-if="[ 'string', 'number', 'date', 'time', 'datetime' ].includes(c.type)"
              type="text" class="w-full py-1 px-2 border border-gray-300 rounded-md"
              placeholder="Search"
              @input="setFilter(c, $event.target.value)"
              :value="filters.find(f => f.field === c.name)?.value"
            >
            
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
import { ref, defineEmits, computed } from 'vue'
import Dropdown from '@/components/Dropdown.vue';

// props: columns
// add support for v-model:filers
const props = defineProps(['columns', 'filters']);
const emits = defineEmits(['update:filters']);

const columnsWithFilter = computed( 
  () => props.columns?.filter(column => column.showIn.includes('F')) || []
);


// filters is a array of objects
// {
//   field: 'name',
//   value: 'John',
//   operator: 'like'
// }

async function setFilter(column, value) {
  const index = props.filters.findIndex(f => f.field === column.name);
  if (!value) {
    if (index !== -1) {
      props.filters.splice(index, 1);
    }
  } else {
    if (index === -1) {
      props.filters.push({ field: column.name, value, operator: 'like' });
    } else {
      props.filters[index].value = value;
    }
  }
  emits('update:filters', [...props.filters]);
}

async function clear() {
  emits('update:filters', []);
}
</script>