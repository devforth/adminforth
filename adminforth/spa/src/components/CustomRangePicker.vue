<template>
  <div class="flex flex-wrap gap-2">
    <input
      :min="minFormatted"
      :max="maxFormatted"
      type="number" aria-describedby="helper-text-explanation"
      class="bg-lightRangePickerInputBackground border border-lightRangePickerInputBorder text-lightRangePickerInputText placeholder-lightRangePickerInputPlaceholder text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-20 p-2.5 dark:bg-darkRangePickerInputBackground dark:border-darkRangePickerInputBorder dark:placeholder-darkRangePickerInputPlaceholder dark:text-darkRangePickerInputText dark:focus:ring-blue-500 dark:focus:border-blue-500"
      :placeholder="$t('From')"
      v-model="start"
    >

    <input
      :min="minFormatted"
      :max="maxFormatted"
      type="number" aria-describedby="helper-text-explanation"
      class="bg-lightRangePickerInputBackground border border-lightRangePickerInputBorder text-lightRangePickerInputText placeholder-lightRangePickerInputPlaceholder text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-20 p-2.5 dark:bg-darkRangePickerInputBackground dark:border-darkRangePickerInputBorder dark:placeholder-darkRangePickerInputPlaceholder dark:text-darkRangePickerInputText dark:focus:ring-blue-500 dark:focus:border-blue-500"
      :placeholder="$t('To')"
      v-model="end"
    >

    <button
      v-if="isChanged"
      type="button"
      class="flex items-center p-0.5 ml-auto px-3 text-sm font-medium text-lightRangePickerButtonText focus:outline-none bg-lightRangePickerButtonBackground rounded border border-lightRangePickerButtonBorder hover:bg-lightRangePickerButtonBackgroundHover hover:text-lightRangePickerButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightRangePickerFocusRing dark:focus:ring-darkRangePickerFocusRing dark:bg-darkRangePickerButtonBackground dark:text-darkRangePickerButtonText dark:border-darkRangePickerButtonBorder dark:hover:text-darkRangePickerButtonTextHover dark:hover:bg-darkRangePickerButtonBackgroundHover disabled:opacity-50 disabled:cursor-not-allowed"
      @click="clear">Clear
    </button>

    <div v-if="min && max" class="w-full px-2.5">
      <vue-slider
        class="custom-slider"
        :dot-size="20"
        height="7.99px"
        :min="minFormatted"
        :max="maxFormatted"
        v-model="sliderValue"
        @update:model-value="updateFromSlider($event)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css'
import {computed, onMounted, ref, watch} from "vue";
import debounce from 'debounce'

const props = defineProps({
  valueStart: {
    default: '',
  },
  valueEnd: {
    default: '',
  },
  min: {},
  max: {},
});

const emit = defineEmits(['update:valueStart', 'update:valueEnd']);

const minFormatted = computed(() => Math.floor(props.min));
const maxFormatted = computed(() => Math.ceil(props.max));

const isChanged = computed(() => {
  return start.value && start.value !== minFormatted.value || end.value && end.value !== maxFormatted.value;
});

const start = ref(props.valueStart);
const end = ref(props.valueEnd);

const sliderValue = ref([minFormatted.value, maxFormatted.value]);

const updateFromSlider =
    debounce((value: [number, number]) => {
      start.value = value[0] === minFormatted.value ? '': value[0];
      end.value = value[1] === maxFormatted.value ? '': value[1];
    }, 500);

onMounted(() => {
  updateStartFromProps();
  updateEndFromProps();

  watch(() => props.valueStart, (value) => {
    updateStartFromProps();
  });

  watch(() => props.valueEnd, (value) => {
    updateEndFromProps();
  });
})

function updateStartFromProps() {
  start.value = props.valueStart;
  setSliderValues(start.value, end.value)
}

function updateEndFromProps() {
  end.value = props.valueEnd;
  setSliderValues(start.value, end.value)
}

watch(start, () => {
  console.log('⚡ emit', start.value)
  emit('update:valueStart', start.value)
})

watch(end, () => {
  console.log('⚡ emit', end.value)
  emit('update:valueEnd', end.value);
})

watch([minFormatted,maxFormatted], () => {
  setSliderValues(minFormatted.value, maxFormatted.value)
})

const clear = () => {
  start.value = ''
  end.value = ''
  setSliderValues('', '')
}

function setSliderValues(start, end) {
  sliderValue.value = [start || minFormatted.value, end || maxFormatted.value];
}
</script>

<style lang="scss" scoped>
.custom-slider {
    &:deep(.vue-slider-rail) {
        background-color: rgb(229 231 235);
    }

    &:deep(.vue-slider-dot-handle) {
        // apply bg-blue-500 to the handle when active
        @apply bg-lightPrimary;
        border: none;
        box-shadow: none;
    }

    &:deep(.vue-slider-dot-handle:hover) {
        @apply bg-lightPrimary;
        filter: brightness(1.1);
        border: none;
        box-shadow: none;
    }

    &:deep(.vue-slider-process) {
      @apply bg-lightPrimaryOpacity;

    }

    &:deep(.vue-slider-process:hover) {
      filter: brightness(1.1);
      @apply bg-lightPrimaryOpacity;
    }
}

.dark .custom-slider {
  &:deep(.vue-slider-rail) {
    background-color: rgb(55 65 81); // gray-700
  }

  &:deep(.vue-slider-dot-handle) {
    @apply bg-darkPrimary;
    border: none;
    box-shadow: none;
  }

  &:deep(.vue-slider-dot-handle:hover) {
    @apply bg-darkPrimary;
    filter: brightness(1.1);
    border: none;
    box-shadow: none;
  }

  &:deep(.vue-slider-process) {
    @apply bg-darkPrimaryOpacity;
  }

  &:deep(.vue-slider-process:hover) {
    filter: brightness(1.1);
    @apply bg-darkPrimaryOpacity;
  }
}

</style>