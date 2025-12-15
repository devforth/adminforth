<template>
  <div @click="onClick" class="flex items-center justify-center">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ disabled?: boolean, extra?: any }>();
const emit = defineEmits<{ (e: 'callAction', extra?: any ): void }>();

function onClick() {
    if (props.disabled) return;
    emit('callAction', props.extra);
}
</script>