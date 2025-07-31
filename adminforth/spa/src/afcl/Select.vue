<template>
  <div class="afcl-select afcl-select-wrapper relative inline-block" ref="internalSelect" 
    :class="{'opacity-50': readonly}"
  >
    <div class="relative">
      <input
        ref="inputEl"
        type="text"
        :readonly="readonly"
        v-model="search"
        @click="inputClick"
        @input="inputInput"
        class="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 sm:text-sm transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-lightPrimary focus:border-lightPrimary dark:focus:ring-darkPrimary dark:focus:border-darkPrimary"
        autocomplete="off" data-custom="no-autofill"
        :placeholder="
          selectedItems.length && !multiple ? '' :  (showDropdown ? $t('Search') : placeholder || $t('Select...')) 
        "
      />

      <div v-if="!multiple && selectedItems.length" class="absolute pointer-events-none inset-y-0 left-2 flex items-center pr-2 px-1">
        <slot 
          name="selected-item" 
          :option="selectedItems[0]"
        ></slot>
        <span v-if="!$slots['selected-item']" class="text-lightPrimary dark:text-white font-medium  ">
          {{ selectedItems[0]?.label }}
        </span>
      </div>

      <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
        <!-- triangle icon -->
        <IconCaretDownSolid class="h-5 w-5 text-lightPrimary dark:text-gray-400 opacity-50 transition duration-150 ease-in"
          :class="{ 'transform rotate-180': showDropdown }"
        />
      </div>
    </div>
    <teleport to="body" v-if="teleportToBody && showDropdown">
      <div ref="dropdownEl" :style="getDropdownPosition" :class="{'shadow-none': isTop}"
        class="fixed z-[5] w-full bg-white shadow-lg dark:shadow-black dark:bg-gray-700 
          dark:border-gray-600 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm max-h-48">
        <div
          v-for="item in filteredItems"
          :key="item.value"
          class="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-400"
          :class="{ 'bg-lightPrimaryOpacity dark:bg-darkPrimaryOpacity': selectedItems.includes(item) }"
          @click="toogleItem(item)"
        >
          <slot name="item" :option="item"></slot>
          <label v-if="!$slots.item" :for="item.value">{{ item.label }}</label>
        </div>
        <div v-if="!filteredItems.length" class="px-4 py-2 cursor-pointer text-gray-400 dark:text-gray-300">
          {{ options.length ? $t('No results found') : $t('No items here') }}
        </div>

        <div v-if="$slots['extra-item']" class="px-4 py-2 dark:text-gray-400">
          <slot name="extra-item"></slot>
        </div>
      </div>
    </teleport>

    <div v-if="!teleportToBody && showDropdown" ref="dropdownEl" :style="dropdownStyle" :class="{'shadow-none': isTop}"
      class="absolute z-10 mt-1 w-full bg-white shadow-lg dark:shadow-black dark:bg-gray-700 
        dark:border-gray-600 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm max-h-48">
      <div
        v-for="item in filteredItems"
        :key="item.value"
        class="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-400"
        :class="{ 'bg-lightPrimaryOpacity dark:bg-darkPrimaryOpacity': selectedItems.includes(item) }"
        @click="toogleItem(item)"
      >
        <slot name="item" :option="item"></slot>
        <label v-if="!$slots.item" :for="item.value">{{ item.label }}</label>
      </div>
      <div v-if="!filteredItems.length" class="px-4 py-2 cursor-pointer text-gray-400 dark:text-gray-300">
        {{ options.length ? $t('No results found') : $t('No items here') }}
      </div>
      <div v-if="$slots['extra-item']"  class="px-4 py-2 dark:text-gray-400">
        <slot name="extra-item"></slot>
      </div>

    </div>

    <div v-if="multiple && selectedItems.length"
      class="inset-y-0 left-2 flex items-center pr-2 flex-wrap gap-y-2 py-2"
    >
      <template v-for="item in selectedItems" :key="`afcl-select-${item.value}`">
        <slot name="selected-item" :item="item"></slot>
        <div v-if="!$slots['selected-item']"
          class="bg-lightPrimaryOpacity text-lightPrimary text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-darkPrimaryOpacity dark:text-darkPrimary">
          <span>{{ item.label }}</span>
          <button
            type="button"
            @click="toogleItem(item)"
            class="z-index-100 flex-shrink-0 ml-1 h-4 w-4 -mr-1 rounded-full inline-flex items-center justify-center text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 focus:bg-gray-100"
          >
            <span class="sr-only">{{ $t('Remove item') }}</span>
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
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, type Ref } from 'vue';
import { IconCaretDownSolid } from '@iconify-prerendered/vue-flowbite';
import { useElementSize } from '@vueuse/core'

const props = defineProps({
  options: Array,
  modelValue: {
    default: undefined,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  teleportToBody: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const search = ref('');
const showDropdown = ref(false);
const inputEl = ref<HTMLElement | null>(null);
const dropdownEl = ref<HTMLElement | null>(null);
const { height: dropdownHeight } = useElementSize(dropdownEl);
const isTop = ref<boolean>(false);

const dropdownStyle = ref<{ top?: string; }>({
  top: "0px",
});

const selectedItems: Ref<any[]> = ref([]);
const internalSelect = ref<HTMLElement | null>(null);

function inputInput() {
  if (!props.multiple && selectedItems.value.length) {
    selectedItems.value = [];
    emit('update:modelValue', null);
  }
}

function updateFromProps() {
  if (props.modelValue !== undefined) {
    if (!props.multiple) {
      const el = props.options.find(item => item.value === props.modelValue);
      if (el) {
        selectedItems.value = [el];
      } else {
        selectedItems.value = [];
      }
    } else {
      selectedItems.value = props.options.filter(item => props.modelValue.includes(item.value));
    }
  }
}

async function inputClick() {
  if (props.readonly) return;
  // Toggle local dropdown
  showDropdown.value = !showDropdown.value;
  // If the dropdown is about to close, reset the search
  if (!showDropdown.value && !search.value) {
    search.value = '';
  }

  if(!props.teleportToBody){
    await nextTick();
    handleScroll();
  }
}

watch(
  () => ({ show: showDropdown.value, dropdownHeight: dropdownHeight.value }),
  (value) => {
    if (value.show && value.dropdownHeight) {
      const inputRect = inputEl.value?.getBoundingClientRect();
      const dropdownTopOverflowed =
        -(value.dropdownHeight ?? 0) - (inputEl.value?.offsetHeight ?? 0)/2 + "px";
      isTop.value =
        (value.dropdownHeight ?? 0) +
          (inputRect?.top ?? 0) +
          (inputRect?.height ?? 0) +
          12 >
        window.innerHeight;
      dropdownStyle.value =  isTop.value ? { top: dropdownTopOverflowed } : {};
    }
  }
);

const handleScroll = () => {
  if (showDropdown.value && inputEl.value) {
    const rect = inputEl.value.getBoundingClientRect();
    const style = {
      left: `${rect.left}px`,
      top: isTop.value && dropdownHeight.value 
        ? `${rect.top - dropdownHeight.value - 8}px`
        : `${rect.bottom + 8}px`,
      width: `${rect.width}px`
    };
    
    if (dropdownEl.value) {
      Object.assign(dropdownEl.value.style, style);
    }
  }
};

onMounted(() => {
  updateFromProps();

  watch(() => props.modelValue, (value) => {
    updateFromProps();
  });

  watch(() => props.options, () => {
    updateFromProps();
  });

  addClickListener();
  
  // Add scroll listeners if teleportToBody is true
  if (props.teleportToBody) {
    window.addEventListener('scroll', handleScroll, true);
  }
});

const filteredItems = computed(() => {
  return props.options.filter(item =>
    item.label.toLowerCase().includes(search.value.toLowerCase())
  );
});


const handleClickOutside = (event: MouseEvent) => {
  const targetEl = event.target as HTMLElement | null;
  const closestSelect = targetEl?.closest('.afcl-select');
  if (closestSelect !== internalSelect.value)
    showDropdown.value = false;
};

const addClickListener = () => {
  document.addEventListener('click', handleClickOutside);
};

const removeClickListener = () => {
  document.removeEventListener('click', handleClickOutside);
};

const toogleItem = (item) => {
  if (selectedItems.value.includes(item)) {
    selectedItems.value = selectedItems.value.filter(i => i.value !== item.value);
  } else {
    if (!props.multiple) {
      selectedItems.value = [item];
    } else {
      selectedItems.value = [...selectedItems.value, item];
    }
  }
  if (!props.multiple) {
    showDropdown.value = false;
  }
  if (!props.multiple && search.value) {
    search.value = '';
  }

  const updValue = selectedItems.value.map(item => item.value);
  let emitValue;
  if (!props.multiple) {
    emitValue = updValue ? updValue[0] : null;
  } else {
    emitValue = updValue;
  }
  emit('update:modelValue', emitValue);
};

onUnmounted(() => {
  removeClickListener();
  // Remove scroll listeners if teleportToBody is true
  if (props.teleportToBody) {
    window.removeEventListener('scroll', handleScroll, true);
  }
});

const getDropdownPosition = computed(() => {
  if (!inputEl.value) return {};
  const rect = inputEl.value.getBoundingClientRect();
  const style: { left: string; top: string; width: string } = {
    left: `${rect.left}px`,
    top: `${rect.bottom + 8}px`,
    width: `${rect.width}px`
  };
  
  if (isTop.value && dropdownHeight.value) {
    style.top = `${rect.top - dropdownHeight.value - 8}px`;
  }
  
  return style;
});

</script>