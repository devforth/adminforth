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

    <div v-if="min !== undefined && max !== undefined" class="w-full px-2.5">
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
import { computed, ref, watch } from "vue";
import debounce from 'debounce'
import RangePicker from './RangePicker.vue';

const props = defineProps<{
  valueStart: number | null | string,
  valueEnd: number | null | string,
  min: number | string | undefined,
  max: number | string | undefined,
}>()

const emit = defineEmits(['update:valueStart', 'update:valueEnd']);

const minFormatted = computed(() => {
  const v = Number(props.min);
  return isNaN(v) ? 0 : Math.floor(v);
});

const maxFormatted = computed(() => {
  const v = Number(props.max);
  return isNaN(v) ? 100 : Math.ceil(v);
});

const normalize = (val: any) => (val === "" || val === null || val === undefined) ? null : Number(val);

const start = ref<number | null>(normalize(props.valueStart));
const end = ref<number | null>(normalize(props.valueEnd));

const sliderValue = ref<[number, number]>([
  start.value ?? minFormatted.value, 
  end.value ?? maxFormatted.value
]);

function setSliderValues(s: number | null, e: number | null) {
  sliderValue.value = [s ?? minFormatted.value, e ?? maxFormatted.value];
}

watch([start, end], () => {
  setSliderValues(start.value, end.value);
}, { immediate: true });

const updateFromSlider = debounce((value: [number, number]) => {
  start.value = value[0] === minFormatted.value ? null : value[0];
  end.value = value[1] === maxFormatted.value ? null : value[1];
}, 500);

watch(() => props.valueStart, (newVal) => {
  const v = normalize(newVal);
  if (v !== start.value) start.value = v;
});

watch(() => props.valueEnd, (newVal) => {
  const v = normalize(newVal);
  if (v !== end.value) end.value = v;
});

watch(start, (newVal) => emit('update:valueStart', newVal));
watch(end, (newVal) => emit('update:valueEnd', newVal));

watch([minFormatted, maxFormatted], () => {
  setSliderValues(start.value, end.value);
})
</script>