<template>
  <div class="relative w-full max-w-[700px] bg-lightProgressBarUnfilledColor rounded-full h-2.5 dark:bg-darkProgressBarUnfilledColor" :class="props.height ? `h-${props.height}` : ''">
    <span class="absolute -top-6 left-0 text-sm text-lightProgressBarText dark:text-darkProgressBarText">{{ leftLabel }}</span>
    <span class="absolute -top-6 right-0 text-sm text-lightProgressBarText dark:text-darkProgressBarText">{{ rightLabel }}</span>
    <div 
      class="bg-lightProgressBarFilledColor dark:bg-darkProgressBarFilledColor h-2.5 rounded-full transition-all duration-300 ease-in-out"
      :class="{ 'progress-bar': showAnimation, [`h-${props.height}`]: props.height }"  
      :style="{ width: `${percentage}%` }"
    ></div>
    <div class="flex justify-between mt-2">
      <span v-if="showValues" class="text-sm text-lightProgressBarText dark:text-darkProgressBarText">{{ formatValue(minValue) }}</span>
      <span v-if="showProgress" class="text-sm text-lightProgressBarText dark:text-darkProgressBarText">{{ progressText }}</span>
      <span v-if="showValues" class="text-sm text-lightProgressBarText dark:text-darkProgressBarText">{{ formatValue(maxValue) }}</span>
    </div>
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
  showAnimation?: boolean
  height?: number
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


<style scoped>
.progress-bar {
  position: relative;
  overflow: hidden;
}

.progress-bar::after {
  content: "";
  position: absolute;
  inset: 0;
  width: 100%;

  background: linear-gradient(
    -45deg,
    transparent 35%,
    rgba(255,255,255,0.4),
    transparent 65%
  );

  transform: translateX(-100%);
  animation: progress-slide 2s linear infinite;
}

@keyframes progress-slide {
  100% {
    transform: translateX(100%);
  }
}
</style>