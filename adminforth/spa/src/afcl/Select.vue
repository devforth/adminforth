<template>
  <div class="afcl-select afcl-select-wrapper relative inline-block" ref="internalSelect" 
    :class="{'opacity-50': readonly}"
  >
    <div class="relative">
      <input
        ref="inputEl"
        type="text"
        :readonly="readonly || searchDisabled"
        v-model="search"
        @click="inputClick"
        @input="inputInput"
        class="block w-full pl-3 pr-10 py-2.5 border border-lightDropownButtonsBorder rounded-md leading-5 bg-lightDropdownButtonsBackground 
        placeholder-lightDropdownButtonsPlaceholderText text-lightDropdownButtonsText sm:text-sm transition duration-150 ease-in-out dark:bg-darkDropdownButtonsBackground dark:border-darkDropdownButtonsBorder dark:placeholder-darkDropdownButtonsPlaceholderText
        dark:text-darkDropdownButtonsText focus:ring-lightPrimary focus:border-lightPrimary dark:focus:ring-darkPrimary dark:focus:border-darkPrimary"
        autocomplete="off" data-custom="no-autofill"
        :placeholder="
          selectedItems.length && !multiple ? '' :  (showDropdown ? $t('Search') : placeholder || $t('Select...')) 
        "
      />

      <div v-if="!multiple && selectedItems.length" class="text-lightDropdownButtonsText dark:text-darkDropdownButtonsText absolute pointer-events-none inset-y-0 left-2 flex items-center pr-2 px-1">
        <slot 
          name="selected-item" 
          :option="selectedItems[0]"
        ></slot>
        <span v-if="!$slots['selected-item']" class="text-lightDropdownButtonsText dark:text-darkDropdownButtonsText font-medium  ">
          {{ selectedItems[0]?.label }}
        </span>
      </div>

      <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
        <!-- triangle icon -->
        <IconCaretDownSolid class="h-5 w-5 text-lightPrimary dark:text-darkPrimary opacity-50 transition duration-150 ease-in"
          :class="{ 'transform rotate-180': showDropdown }"
        />
      </div>
    </div>
    <teleport to="body" v-if="(teleportToBody  || teleportToTop) && showDropdown">
      <div ref="dropdownEl" :style="getDropdownPosition" :class="{'shadow-none': isTop, 'z-10': teleportToBody, 'z-[1000]': teleportToTop}"
        class="fixed w-full bg-lightDropdownOptionsBackground shadow-lg dark:shadow-black dark:bg-darkDropdownOptionsBackground
          dark:border-gray-600 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm max-h-48"
        @scroll="handleDropdownScroll">
        <div
          v-for="item in filteredItems"
          :key="item.value"
          class="px-4 py-2 cursor-pointer hover:bg-lightDropdownOptionsHoverBackground dark:hover:bg-darkDropdownOptionsHoverBackground text-lightDropdownOptionsText dark:text-darkDropdownOptionsText"
          :class="{ 'bg-lightDropdownPicked dark:bg-darkDropdownPicked': selectedItems.includes(item) }"
          @click="toogleItem(item)"
        >
          <slot name="item" :option="item"></slot>
          <label v-if="!$slots.item" :for="item.value">{{ item.label }}</label>
        </div>
        <div v-if="!filteredItems.length" class="px-4 py-2 cursor-pointer text-lightDropdownOptionsText dark:text-darkDropdownOptionsText">
          {{ $t('No results found') }}
        </div>

        <div v-if="$slots['extra-item']" class="px-4 py-2 dark:text-gray-400">
          <slot name="extra-item"></slot>
        </div>
      </div>
    </teleport>

    <div v-if="!teleportToBody && !teleportToTop && showDropdown" ref="dropdownEl" :style="dropdownStyle" :class="{'shadow-none': isTop}"
      class="absolute z-10 mt-1 w-full bg-lightDropdownOptionsBackground shadow-lg text-lightDropdownButtonsText dark:shadow-black dark:bg-darkDropdownOptionsBackground
        dark:border-gray-600 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm max-h-48"
        @scroll="handleDropdownScroll">
      <div
        v-for="item in filteredItems"
        :key="item.value"
        class="px-4 py-2 cursor-pointer text-lightDropdownOptionsText hover:bg-lightDropdownOptionsHoverBackground dark:hover:bg-darkDropdownOptionsHoverBackground dark:text-darkDropdownOptionsText"
        :class="{ 'bg-lightDropdownPicked dark:bg-darkDropdownPicked': selectedItems.includes(item) }"
        @click="toogleItem(item)"
      >
        <slot name="item" :option="item"></slot>
        <label v-if="!$slots.item" :for="item.value">{{ item.label }}</label>
      </div>
      <div v-if="!filteredItems.length" class="px-4 py-2 cursor-pointer text-lightDropdownOptionsText dark:text-darkDropdownOptionsText">
        {{ options?.length ? $t('No results found') : $t('No items here') }}
      </div>
      <div v-if="$slots['extra-item']"  class="px-4 py-2 dark:text-darkDropdownOptionsText">
        <slot name="extra-item"></slot>
      </div>

    </div>

    <div v-if="multiple && selectedItems.length"
      class="inset-y-0 left-2 flex items-center pr-2 flex-wrap gap-y-2 py-2"
    >
      <template v-for="item in selectedItems" :key="`afcl-select-${item.value}`">
        <slot name="selected-item" :item="item"></slot>
        <div v-if="!$slots['selected-item']"
          class="bg-lightDropdownMultipleSelectBackground text-lightDropdownMultipleSelectText text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-darkDropdownMultipleSelectBackground dark:text-darkDropdownMultipleSelectText">
          <span>{{ item.label }}</span>
          <button
            type="button"
            @click="toogleItem(item)"
            class="z-index-100 flex-shrink-0 ml-1 h-4 w-4 -mr-1 rounded-full inline-flex items-center justify-center text-lightDropdownMultipleSelectIcon hover:text-lightDropdownMultipleSelectIconHover dark:text-darkDropdownMultipleSelectIcon dark:hover:text-darkDropdownMultipleSelectIconHover focus:outline-none focus:text-lightDropdownMultipleSelectIconFocus focus:bg-lightDropdownMultipleSelectIconFocusBackground dark:focus:text-darkDropdownMultipleSelectIconFocus dark:focus:bg-darkDropdownMultipleSelectIconFocusBackground"
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick,type PropType, type Ref } from 'vue';
import { IconCaretDownSolid } from '@iconify-prerendered/vue-flowbite';
import { useElementSize } from '@vueuse/core'

const props = defineProps({
  options: Array,
  modelValue: {
    type: Array as PropType<(string | number)[]>,
    default: () => [],
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
  searchDisabled: {
    type: Boolean,
    default: false,
  },
  teleportToBody: {
    type: Boolean,
    default: false,
  },
  teleportToTop: {
    type: Boolean,
    default: false,
  },
  searchDebounceMs: {
    type: Number,
    default: 300,
  },
});

const emit = defineEmits(['update:modelValue', 'scroll-near-end', 'search']);

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
let searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;

function inputInput() {
  if (!props.multiple && selectedItems.value.length) {
    selectedItems.value = [];
    emit('update:modelValue', null);
  }
  if (!props.searchDisabled) {
    if (searchDebounceHandle) {
      clearTimeout(searchDebounceHandle);
    }
    searchDebounceHandle = setTimeout(() => {
      emit('search', search.value);
    }, props.searchDebounceMs);
  }
}

function updateFromProps() {
  if (props.modelValue !== undefined) {
    if (!props.multiple) {
      const el = props.options?.find((item: any) => item.value === props.modelValue);
      if (el) {
        selectedItems.value = [el];
      } else {
        selectedItems.value = [];
      }
    } else {
      selectedItems.value = props.options?.filter((item: any) => props.modelValue?.includes(item.value)) || [];
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

  if(props.teleportToBody){
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

const handleDropdownScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  const threshold = 10; // pixels from bottom
  
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - threshold) {
    emit('scroll-near-end');
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

const filteredItems: Ref<any[]> = computed(() => {

  if (props.searchDisabled) {
    return props.options || [];
  }
  
  return (props.options || []).filter((item: any) =>
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

const toogleItem = (item: any) => {
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
  if (searchDebounceHandle) {
    clearTimeout(searchDebounceHandle);
    searchDebounceHandle = null;
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