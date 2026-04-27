<template>
  <div class="afcl-select afcl-select-wrapper relative inline-block af-button-shadow rounded" ref="internalSelect" 
    :class="{'opacity-50': readonly}"
  >
    <div class="relative w-fit">
      <button 
        ref="dropdownFilterEl" 
        type="button" 
        @click="dropdownClick" 
        class="group h-[34px] inline-flex items-center justify-between min-w-max px-3 py-2 text-left cursor-pointer 
        text-sm font-medium transition-all rounded border outline-none gap-x-2
        bg-lightListViewButtonBackground text-lightListViewButtonText border-lightListViewButtonBorder  
        dark:bg-darkListViewButtonBackground dark:text-darkListViewButtonText dark:border-darkListViewButtonBorder 
        hover:bg-lightListViewButtonBackgroundHover hover:text-lightListViewButtonTextHover"
      >
        <span v-if="displayLabel" class="whitespace-nowrap">
          {{ displayLabel }}
        </span>
        <span 
          v-else 
          class="opacity-100 transition-colors whitespace-nowrap"
        >
          {{ filter?.name || placeholder || $t('Select...') }}
        </span>

        <IconCaretDownSolid class="h-4 w-4 text-lightPrimary dark:text-darkPrimary opacity-50 transition duration-150 ease-in flex-shrink-0"
          :class="{ 'transform rotate-180': showDropdown }"
        />
      </button>
    </div>

    <teleport to="body" v-if="teleportToBody && showDropdown">
      <div 
        ref="dropdownEl" 
        :style="getDropdownPosition" 
        class="fixed z-[1000] w-max min-w-fit bg-lightDropdownOptionsBackground shadow-lg dark:shadow-black dark:bg-darkDropdownOptionsBackground
          dark:border-gray-600 rounded-md text-base ring-1 ring-black ring-opacity-5 overflow-hidden focus:outline-none sm:text-sm max-h-64 flex flex-col"
      >
        <div class="py-1 overflow-y-auto grow" @scroll="handleDropdownScroll">
          <div
            v-for="item in options"
            :key="item.value"
            class="px-4 py-2 cursor-pointer hover:bg-lightDropdownOptionsHoverBackground dark:hover:bg-darkDropdownOptionsHoverBackground text-lightDropdownOptionsText dark:text-darkDropdownOptionsText"
            :class="{ 'bg-lightDropdownPicked dark:bg-darkDropdownPicked': isItemSelected(item) }"
            @click="toggleItem(item)"
          >
            <slot name="item" :option="item">
              {{ item.label }}
            </slot>
          </div>
          
          <div v-if="!options?.length" class="px-4 py-2 text-gray-500 italic text-center">
            {{ $t('No items here') }}
          </div>

          <div
            v-if="modelValue !== null && modelValue !== undefined && modelValue !== ''"
            class="px-4 py-2 cursor-pointer hover:bg-lightDropdownOptionsHoverBackground dark:hover:bg-darkDropdownOptionsHoverBackground text-lightDropdownOptionsText dark:text-darkDropdownOptionsText"
            @click="clearSelection"
          >
            {{ $t('Clear selection') }}
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type PropType } from 'vue';
import { IconCaretDownSolid } from '@iconify-prerendered/vue-flowbite';

const props = defineProps({
  filter: {
    type: Object as PropType<{ name: string; enum: any[] }>,
    default: null,
  },
  options: {
    type: Array as PropType<{label: string, value: any}[]>,
    default: () => [],
  },
  modelValue: [String, Number, Boolean, Array] as PropType<any>,
  placeholder: String,
  readonly: Boolean,
  teleportToBody: Boolean,
});

const emit = defineEmits(['update:modelValue', 'scroll-near-end']);

const showDropdown = ref(false);
const dropdownFilterEl = ref<HTMLElement | null>(null);
const dropdownEl = ref<HTMLElement | null>(null);
const internalSelect = ref<HTMLElement | null>(null);

const displayLabel = computed(() => {
  const selected = props.options.find(o => o.value === props.modelValue);
  return selected ? selected.label : '';
});

const isItemSelected = (item: any) => props.modelValue === item.value;

const toggleItem = (item: any) => {
  emit('update:modelValue', item.value);
  showDropdown.value = false;
};

const clearSelection = () => {
  emit('update:modelValue', null);
  showDropdown.value = false;
};

const dropdownClick = () => {
  if (!props.readonly) showDropdown.value = !showDropdown.value;
};

const getDropdownPosition = computed(() => {
  if (!dropdownFilterEl.value) return {};
  const rect = dropdownFilterEl.value.getBoundingClientRect();
  return {
    top: `${rect.bottom + window.scrollY + 4}px`,
    left: `${rect.right + window.scrollX - (dropdownEl.value?.offsetWidth || rect.width)}px`,
    minWidth: `${rect.width}px`
  };
});

const handleDropdownScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
    emit('scroll-near-end');
  }
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (internalSelect.value?.contains(target)) return;
  if (dropdownEl.value?.contains(target)) return;
  
  showDropdown.value = false;
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>