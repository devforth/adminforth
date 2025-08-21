<template>
  <div @click="onClick">
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