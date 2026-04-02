<template>
  <div class="flex flex-wrap gap-2">
    <input
      :min="minFormatted"
      :max="maxFormatted"
      type="number" aria-describedby="helper-text-explanation"
      class="flex-1 bg-lightRangePickerInputBackground border border-lightRangePickerInputBorder text-lightRangePickerInputText placeholder-lightRangePickerInputPlaceholder text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-20 p-2.5 dark:bg-darkRangePickerInputBackground dark:border-darkRangePickerInputBorder dark:placeholder-darkRangePickerInputPlaceholder dark:text-darkRangePickerInputText dark:focus:ring-blue-500 dark:focus:border-blue-500"
      :placeholder="$t('From')"
      v-model="start"
    >
    <p>_</p>
    <input
      :min="minFormatted"
      :max="maxFormatted"
      type="number" aria-describedby="helper-text-explanation"
      class="flex-1 bg-lightRangePickerInputBackground border border-lightRangePickerInputBorder text-lightRangePickerInputText placeholder-lightRangePickerInputPlaceholder text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-20 p-2.5 dark:bg-darkRangePickerInputBackground dark:border-darkRangePickerInputBorder dark:placeholder-darkRangePickerInputPlaceholder dark:text-darkRangePickerInputText dark:focus:ring-blue-500 dark:focus:border-blue-500"
      :placeholder="$t('To')"
      v-model="end"
    >

    <div v-if="min && max" class="w-full px-2.5">
      <RangePicker
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
import {computed, onMounted, ref, watch} from "vue";
import debounce from 'debounce'
import RangePicker from './RangePicker.vue';

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

const minFormatted = computed(() => Math.floor(<number>props.min));
const maxFormatted = computed(() => Math.ceil(<number>props.max));


const start = ref<string | number>(props.valueStart);
const end = ref<string | number>(props.valueEnd);

const sliderValue = ref<[number, number]>([minFormatted.value, maxFormatted.value]);

watch([start, end], () => {
  if ( !start.value && end.value ) {
    setSliderValues(minFormatted.value, end.value);
  } else if ( start.value && !end.value ) {
    setSliderValues(start.value, maxFormatted.value);
  } else if ( !start.value && !end.value ) {
    setSliderValues(minFormatted.value, maxFormatted.value);
  } else {
    setSliderValues(start.value, end.value);
  }
})

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
  if (props.valueStart == start.value) {
    return;
  }
  start.value = props.valueStart;
  setSliderValues(start.value, end.value)
}

function updateEndFromProps() {
  if (props.valueEnd == end.value) {
    return;
  }
  end.value = props.valueEnd;
  setSliderValues(start.value, end.value)
}

watch(start, () => {
  emit('update:valueStart', start.value)
})

watch(end, () => {
  emit('update:valueEnd', end.value);
})

watch([minFormatted,maxFormatted], () => {
  if ( !start.value && end.value ) {
    setSliderValues(minFormatted.value, end.value);
  } else if ( start.value && !end.value ) {
    setSliderValues(start.value, maxFormatted.value);
  } else if ( !start.value && !end.value ) {
    setSliderValues(minFormatted.value, maxFormatted.value);
  } else {
    setSliderValues(start.value, end.value);
  }
})

function setSliderValues(start: any, end: any) {
  sliderValue.value = [start || minFormatted.value, end || maxFormatted.value];
}
</script>