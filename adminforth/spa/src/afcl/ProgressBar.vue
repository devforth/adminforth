<template>
  <div class="relative mt-4 lg:mt-10 w-full max-w-[700px] bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
    <span class="absolute -top-6 left-0 text-sm text-gray-500">{{ leftLabel }}</span>
    <span class="absolute -top-6 right-0 text-sm text-gray-500">{{ rightLabel }}</span>
    <div 
      class="bg-lightPrimary dark:bg-darkPrimary h-2.5 rounded-full" 
      :style="{ width: `${percentage}%` }"
    ></div>
    <template v-if="showValues">
      <span class="absolute top-4 left-0 text-sm text-gray-500">{{ formatValue(minValue) }}</span>
      <span v-if="showProgress" class="absolute top-4 right-1/2 translate-x-1/2 text-sm text-gray-500">{{ progressText }}</span>
      <span class="absolute top-4 right-0 text-sm text-gray-500">{{ formatValue(maxValue) }}</span>
    </template>
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
  showValues: boolean
  showProgress: boolean
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
  return Math.round(((props.currentValue - min) / (max - min)) * 100)
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
