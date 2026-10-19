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
        class="block w-full pl-2.5 pr-9 py-1.5 border border-lightDropownButtonsBorder rounded-default leading-5 bg-lightDropdownButtonsBackground shadow-customLight hover:border-lightInputBorderHover dark:hover:border-darkInputBorderHover
        placeholder-lightDropdownButtonsPlaceholderText text-lightDropdownButtonsText text-base sm:text-sm transition duration-150 ease-in-out dark:bg-darkDropdownButtonsBackground dark:border-darkDropdownButtonsBorder dark:placeholder-darkDropdownButtonsPlaceholderText
        dark:text-darkDropdownButtonsText focus:outline-none focus:ring-[3px] focus:ring-lightInputFocusRing focus:border-lightInputFocusBorder dark:focus:ring-darkInputFocusRing dark:focus:border-darkInputFocusBorder"
        :class="[{'cursor-pointer': searchDisabled}, classesForInput]"
        :id="inputId"
        :name="inputId"
        form="afcl-select-detached"
        autocomplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-bwignore
        data-form-type="other"
        :placeholder="
          selectedItems.length && !multiple ? '' :  (showDropdown && !searchDisabled ? $t('Search') : placeholder || $t('Select...'))
        "
      />

      <div v-if="!multiple && selectedItems.length" class="text-sm text-lightDropdownButtonsText dark:text-darkDropdownButtonsText absolute pointer-events-none inset-y-0 left-1.5 flex items-center pr-2 px-1">
        <slot 
          name="selected-item" 
          :option="selectedItems[0]"
        ></slot>
        <span v-if="!$slots['selected-item']" class="text-lightDropdownButtonsText dark:text-darkDropdownButtonsText">
          {{ selectedItems[0]?.label }}
        </span>
      </div>

      <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
        <!-- triangle icon -->
        <IconChevronDown class="h-4 w-4 text-lightInputIconColor dark:text-darkInputIconColor transition duration-150 ease-in"
          :class="{ 'transform rotate-180': showDropdown }"
        />
      </div>
    </div>
    <teleport :to="teleportTarget" v-if="(teleportToBody  || teleportToTop) && showDropdown">
      <div ref="dropdownEl" :style="getDropdownPosition" :class="{'shadow-none': isTop, 'z-30': teleportToBody, 'z-[1000]': teleportToTop}"
        class="fixed w-full bg-lightDropdownOptionsBackground shadow-popover dark:shadow-darkPopover dark:bg-darkDropdownOptionsBackground
          rounded-lg p-1 text-base overflow-auto focus:outline-none sm:text-sm max-h-60"
        @scroll="handleDropdownScroll">
        <div
          v-for="item in filteredItems"
          :key="item.value"
          class="px-2.5 py-1.5 rounded-md cursor-pointer hover:bg-lightDropdownOptionsHoverBackground dark:hover:bg-darkDropdownOptionsHoverBackground text-lightDropdownOptionsText dark:text-darkDropdownOptionsText"
          :class="{ 'bg-lightDropdownPicked dark:bg-darkDropdownPicked font-medium': selectedItems.includes(item) }"
          @click="toogleItem(item)"
        >
          <slot name="item" :option="item"></slot>
          <label v-if="!$slots.item" :for="item.value">{{ item.label }}</label>
        </div>
        <div v-if="!filteredItems.length" class="px-2.5 py-1.5 text-lightDropdownButtonsPlaceholderText dark:text-darkDropdownButtonsPlaceholderText">
          {{ $t('No results found') }}
        </div>

        <div v-if="$slots['extra-item']" class="px-2.5 py-1.5 text-lightDropdownOptionsText dark:text-darkDropdownOptionsText">
          <slot name="extra-item"></slot>
        </div>
      </div>
    </teleport>

    <div v-if="!teleportToBody && !teleportToTop && showDropdown" ref="dropdownEl" :style="dropdownStyle" :class="{'shadow-none': isTop}"
      class="afcl-select-content absolute z-10 mt-1 w-full bg-lightDropdownOptionsBackground shadow-popover text-lightDropdownButtonsText dark:shadow-darkPopover dark:bg-darkDropdownOptionsBackground
        rounded-lg p-1 text-base overflow-auto focus:outline-none sm:text-sm max-h-60"
        @scroll="handleDropdownScroll">
      <div
        v-for="item in filteredItems"
        :key="item.value"
        class="px-2.5 py-1.5 rounded-md cursor-pointer text-lightDropdownOptionsText hover:bg-lightDropdownOptionsHoverBackground dark:hover:bg-darkDropdownOptionsHoverBackground dark:text-darkDropdownOptionsText"
        :class="{ 'bg-lightDropdownPicked dark:bg-darkDropdownPicked font-medium': selectedItems.includes(item) }"
        @click="toogleItem(item)"
      >
        <slot name="item" :option="item"></slot>
        <label v-if="!$slots.item" :for="item.value">{{ item.label }}</label>
      </div>
      <div v-if="!filteredItems.length" class="px-2.5 py-1.5 text-lightDropdownButtonsPlaceholderText dark:text-darkDropdownButtonsPlaceholderText">
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
          class="inline-flex items-center bg-lightDropdownMultipleSelectBackground text-lightDropdownMultipleSelectText text-xs font-medium me-1.5 ps-2 pe-1.5 h-[1.375rem] rounded dark:bg-darkDropdownMultipleSelectBackground dark:text-darkDropdownMultipleSelectText">
          <span>{{ item.label }}</span>
          <button
            type="button"
            @click="toogleItem(item)"
            class="z-index-100 flex-shrink-0 ml-1 h-4 w-4 -mr-1 rounded-full inline-flex items-center justify-center text-lightDropdownMultipleSelectIcon hover:text-lightDropdownMultipleSelectIconHover dark:text-darkDropdownMultipleSelectIcon dark:hover:text-darkDropdownMultipleSelectIconHover focus:outline-none focus:text-lightDropdownMultipleSelectIconFocus focus:bg-lightDropdownMultipleSelectIconFocusBackground dark:focus:text-darkDropdownMultipleSelectIconFocus dark:focus:bg-darkDropdownMultipleSelectIconFocusBackground"
          >
            <span class="sr-only">{{ $t('Remove item') }}</span>
            <IconX class="h-3 w-3" />
          </button>
        </div> 
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, useId,type PropType, type Ref } from 'vue';
import { IconChevronDown, IconX } from '@iconify-prerendered/vue-lucide';
import { useElementSize } from '@vueuse/core'
import { useTeleportTarget } from './shadowRoot';

type ISingleSelectModelValue = string | number | boolean | null;

const props = defineProps({
  options: Array,
  modelValue: {
    type: [Array, String, Number, Boolean] as PropType<(ISingleSelectModelValue)[] | ISingleSelectModelValue>,
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
  classesForInput: {
    type: String,
    default: '',
  },
  disableTogleOfSelectedItem: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['update:modelValue', 'scroll-near-end', 'search']);

// Chrome's password manager picks the nearest preceding text input as the "username" field of a form
// containing <input type="password">, which made an enum Select sitting above a password column get
// filled with the saved email. form="afcl-select-detached" points at no existing form, which per spec
// leaves the input with no form owner, so it is no longer part of that password form. The unique
// id/name additionally stops every Select on the page from sharing one field identity.
const inputId = `afs-${useId()}`;

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
      selectedItems.value = props.options?.filter((item: any) => (props.modelValue as (ISingleSelectModelValue)[])?.includes(item.value)) || [];
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
  }, {deep: true});

  watch(() => props.options, () => {
    updateFromProps();
  }, { deep: true });

  addClickListener();
  
  // Add scroll listeners if teleportToBody is true
  if (props.teleportToBody) {
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
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


const teleportTarget = useTeleportTarget();

const handleClickOutside = (event: MouseEvent) => {
  // inside a shadow root event.target is the host, composedPath() starts at the clicked element
  const targetEl = event.composedPath()[0] as HTMLElement;
  const closestSelect = targetEl.closest('.afcl-select');
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
  if (selectedItems.value.includes(item) && !props.disableTogleOfSelectedItem) {
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
    window.removeEventListener('resize', handleScroll);
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