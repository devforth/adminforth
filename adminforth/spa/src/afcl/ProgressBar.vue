<template>
  <div class="relative w-full max-w-[700px] bg-lightProgressBarUnfilledColor rounded-full h-2.5 dark:bg-darkProgressBarUnfilledColor">
    <span class="absolute -top-6 left-0 text-sm text-lightProgressBarText dark:text-darkProgressBarText">{{ leftLabel }}</span>
    <span class="absolute -top-6 right-0 text-sm text-lightProgressBarText dark:text-darkProgressBarText">{{ rightLabel }}</span>
    <div 
      class="bg-lightProgressBarFilledColor dark:bg-darkProgressBarFilledColor h-2.5 rounded-full transition-all duration-300 ease-in-out"
      :style="{ width: `${percentage}%` }"
    ></div>
    <span v-if="showValues" class="absolute top-4 left-0 text-sm text-lightProgressBarText dark:text-darkProgressBarText">{{ formatValue(minValue) }}</span>
    <span v-if="showProgress" class="absolute top-4 right-1/2 translate-x-1/2 text-sm text-lightProgressBarText dark:text-darkProgressBarText">{{ progressText }}</span>
    <span v-if="showValues" class="absolute top-4 right-0 text-sm text-lightProgressBarText dark:text-darkProgressBarText">{{ formatValue(maxValue) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentValue: number
  minValue?: number
  maxValue?: number
  leftLabel?: string
  rightLabel?: string
  formatter?: (value: number) => string
  progressFormatter?: (value: number, percentage: number) => string
  showLabels?: boolean
  showValues?: boolean
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  minValue: 0,
  maxValue: 100,
  formatter: (value: number) => `${value}`,
  progressFormatter: (value: number, percentage: number) => `${value}`,
  showValues: true,
  showProgress: true
})

const percentage = computed((): number => {
  const min = props.minValue
  const max = props.maxValue
  return Math.floor(((props.currentValue - min) / (max - min)) * 1000) / 10
})

const progressText = computed((): string => {
  const formatter = props.progressFormatter
  return formatter(props.currentValue, percentage.value)
})

const formatValue = (value: number): string => {
  const formatter = props.formatter
  return formatter(value)
}
</script>
