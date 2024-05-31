<template>
  <div class="relative inline-block w-full" id="dropd">
    <div class="relative">
      <input
        type="text"
        v-model="search"
        @focus="showDropdown = true"
        class="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm transition duration-150 ease-in-out"
        :placeholder="selectedItems.length ? '' : 'Select...'"
      />
      <div class="absolute inset-y-0 left-2 flex items-center pr-2 flex-wrap">
        <div v-for="item in selectedItems" :key="item.name" class="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
          <span>{{ item.label }}</span>
          <button
            type="button"
            @click="toogleItem(item)"
            class="z-index-100  flex-shrink-0 ml-1 h-4 w-4 -mr-1 rounded-full inline-flex items-center justify-center text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 focus:bg-gray-100"
          >
            <span class="sr-only">Remove item</span>
            <svg class="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M1 1l6 6m0-6L1 7"
              />
            </svg>
          </button>
        </div>  
      </div>
      <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
        <!-- triangle icon -->
        <IconCaretDownSolid v-if="!showDropdown" class="h-5 w-5 text-gray-400" />
        <IconCaretUpSolid v-else class="h-5 w-5 text-gray-400" />
      </div>
    </div>
    <div v-if="showDropdown" class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
      <div
        v-for="item in filteredItems"
        :key="item.value"
        class="px-4 py-2 cursor-pointer hover:bg-gray-100"
        :class="{ 'bg-blue-100': selectedItems.includes(item) }"
        @click="toogleItem(item)"
      >
        <label :for="item.value">{{ item.label }}</label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { IconCaretDownSolid, IconCaretUpSolid } from '@iconify-prerendered/vue-flowbite';


const props = defineProps({
  options: Array,
  modelValue: {
    default: undefined,
  },
  allowCustom: {
    type: Boolean,
    default: false,
  },
  single: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const search = ref('');
const showDropdown = ref(false);

const selectedItems = ref([]);

function updateFromProps() {
  console.log('⚡ updateFromProps', props.modelValue)
  if (props.modelValue !== undefined) {
    if (props.single) {
      selectedItems.value = [props.options.find(item => item.value === props.modelValue)];
    } else {
      selectedItems.value = props.options.filter(item => props.modelValue.includes(item.value));
    }
  }
}

onMounted(() => {
  updateFromProps();

  watch(() => props.modelValue, (value) => {
    updateFromProps();
  });

  addClickListener();

});

const filteredItems = computed(() => {
  return props.options.filter(item =>
    item.label.toLowerCase().includes(search.value.toLowerCase())
  );
});

const handleClickOutside = (event) => {
  if (!event.target.closest('#dropd')) {
    showDropdown.value = false;
  }
};

const addClickListener = () => {
  document.addEventListener('click', handleClickOutside);
};

const removeClickListener = () => {
  document.removeEventListener('click', handleClickOutside);
};

const toogleItem = (item) => {
  if (selectedItems.value.includes(item)) {
    selectedItems.value = selectedItems.value.filter(i => i !== item);
  } else {
    if (props.single) {
      selectedItems.value = [item];
    } else {
      selectedItems.value = [...selectedItems.value, item];
    }
  }
  if (props.single) {
    showDropdown.value = false;
  }

  
  const list = selectedItems.value.map(item => item.value);
  const updValue = list.length ? list : undefined;
  let emitValue;
  if (props.single) {
    emitValue = updValue ? updValue[0] : undefined;
  } else {
    emitValue = updValue;
  }
  console.log('⚡ emit', emitValue)
  emit('update:modelValue', emitValue);

};


onUnmounted(() => {
  removeClickListener();
});


</script>