<template>
  <div @click="onClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{ (e: 'callAction', extra?: any ): void }>();

function onClick() {
    if (props.disabled) return;
    const extra = { someData: 'example' };
    emit('callAction', extra);
}
</script>