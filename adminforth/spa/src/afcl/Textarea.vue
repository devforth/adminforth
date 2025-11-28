<template>
  <textarea
    ref="input"
    class="afcl-textarea bg-lightInputBackground border border-lightInputBorder text-lightInputText placeholder-lightInputPlaceholderText text-sm rounded-md block w-full p-2.5 dark:bg-darkInputBackground dark:border-darkInputBorder dark:placeholder-darkInputPlaceholderText dark:text-darkInputText dark:border-darkInputBorder focus:ring-lightInputFocusRing focus:border-lightInputFocusBorder dark:focus:ring-darkInputFocusRing dark:focus:border-darkInputFocusBorder"
    :class="`${readonly ? 'opacity-50' : ''} ${isIos ? 'text-md' : 'text-sm'}`"
    :placeholder="placeholder"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    :readonly="readonly"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();
const isIos = coreStore.isIos;

const props = defineProps<{
  modelValue: string
  readonly?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const input = ref<HTMLTextAreaElement | null>(null)

defineExpose({
  focus: () => input.value?.focus(),
})
</script>
