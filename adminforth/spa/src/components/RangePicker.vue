<template>
  <div class="range-slider" ref="trackRef" @mousedown="onTrackMouseDown">
    <div class="track"></div>
    <div class="range bg-lightPrimary/30" :style="rangeStyle"></div>

    <div
      class="bg-lightPrimary thumb"
      :style="minThumbStyle"
      @mousedown.stop.prevent="startDrag('min', $event)"
      @mouseenter="minHovered = true"
      @mouseleave="minHovered = false"
    ></div>
    <div v-if="minHovered || activeThumb === 'min'" class="thumb-tooltip" :style="minTooltipStyle">{{ minVal }}</div>

    <div
      class="bg-lightPrimary thumb"
      :style="maxThumbStyle"
      @mousedown.stop.prevent="startDrag('max', $event)"
      @mouseenter="maxHovered = true"
      @mouseleave="maxHovered = false"
    ></div>
    <div v-if="maxHovered || activeThumb === 'max'" class="thumb-tooltip" :style="maxTooltipStyle">{{ maxVal }}</div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array as unknown as () => [number, number],
    default: () => [0, 100]
  },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  dotSize: { type: Number, default: 20 },
  height: { type: String, default: '8px' }
})

const emit = defineEmits(['update:modelValue'])

const trackRef = ref<HTMLElement | null>(null)

const minVal = ref(props.modelValue[0])
const maxVal = ref(props.modelValue[1])

watch(() => props.modelValue, (val) => {
  if (!val) return
  minVal.value = val[0]
  maxVal.value = val[1]
})

function clamp(val: number) {
  return Math.min(props.max, Math.max(props.min, val))
}

function valueToPercent(val: number) {
  return ((val - props.min) / (props.max - props.min)) * 100
}

function percentToValue(percent: number) {
  return props.min + ((props.max - props.min) * percent) / 100
}

const minPercent = computed(() => valueToPercent(minVal.value))
const maxPercent = computed(() => valueToPercent(maxVal.value))

const rangeStyle = computed(() => ({
  left: `${minPercent.value}%`,
  width: `${maxPercent.value - minPercent.value}%`,
  transition: isAnimating.value ? 'left 0.18s ease, width 0.18s ease' : 'none'
}))

const minThumbStyle = computed(() => ({
  left: `calc(${minPercent.value}% - ${props.dotSize / 2}px)`,
  width: `${props.dotSize}px`,
  height: `${props.dotSize}px`,
  transition: isAnimating.value ? 'left 0.18s ease' : 'none',
  zIndex: activeThumb.value === 'min' ? 3 : 2
}))

const maxThumbStyle = computed(() => ({
  left: `calc(${maxPercent.value}% - ${props.dotSize / 2}px)`,
  width: `${props.dotSize}px`,
  height: `${props.dotSize}px`,
  transition: isAnimating.value ? 'left 0.18s ease' : 'none',
  zIndex: activeThumb.value === 'max' ? 3 : 2
}))

const minTooltipStyle = computed(() => ({
  left: `${minPercent.value}%`,
  transition: isAnimating.value ? 'left 0.18s ease' : 'none'
}))

const maxTooltipStyle = computed(() => ({
  left: `${maxPercent.value}%`,
  transition: isAnimating.value ? 'left 0.18s ease' : 'none'
}))

const activeThumb = ref<'min' | 'max' | null>(null)
const isAnimating = ref(false)
const minHovered = ref(false)
const maxHovered = ref(false)

function startDrag(type: 'min' | 'max', e: MouseEvent) {
  activeThumb.value = type
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', stopDrag)
}

function onMouseMove(e: MouseEvent) {
  if (!trackRef.value || !activeThumb.value) return

  const rect = trackRef.value.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  const value = Math.round(clamp(percentToValue(percent)))

  if (activeThumb.value === 'min') {
    if (value > maxVal.value) {
      // cross over: become the max thumb
      minVal.value = maxVal.value
      maxVal.value = value
      activeThumb.value = 'max'
    } else {
      minVal.value = value
    }
  } else {
    if (value < minVal.value) {
      // cross over: become the min thumb
      maxVal.value = minVal.value
      minVal.value = value
      activeThumb.value = 'min'
    } else {
      maxVal.value = value
    }
  }

  emit('update:modelValue', [minVal.value, maxVal.value])
}

function stopDrag() {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', stopDrag)
  activeThumb.value = null
}

function onTrackMouseDown(e: MouseEvent) {
  if (!trackRef.value) return

  const rect = trackRef.value.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  const value = percentToValue(percent)

  const distToMin = Math.abs(value - minVal.value)
  const distToMax = Math.abs(value - maxVal.value)

  isAnimating.value = true
  if (distToMin < distToMax) {
    minVal.value = Math.round(Math.min(clamp(value), maxVal.value))
  } else {
    maxVal.value = Math.round(Math.max(clamp(value), minVal.value))
  }

  emit('update:modelValue', [minVal.value, maxVal.value])

  setTimeout(() => { isAnimating.value = false }, 200)
}

onBeforeUnmount(() => {
  stopDrag()
})
</script>

<style scoped>
.range-slider {
  position: relative;
  width: 100%;
  height: 20px;
  display: flex;
  align-items: center;
}

.track {
  position: absolute;
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 9999px;
}

.range {
  position: absolute;
  height: 8px;
  border-radius: 9999px;
}

.thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 9999px;
  cursor: pointer;
}

.thumb-tooltip {
  position: absolute;
  top: -28px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  padding: 6px 6px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  animation: tooltip-in 0.12s ease;
}

.thumb-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.75);
}

@keyframes tooltip-in {
  from { opacity: 0; transform: translateX(-50%) translateY(4px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
