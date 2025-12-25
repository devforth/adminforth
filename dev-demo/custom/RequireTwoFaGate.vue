<template>
  asdasf
  <div class="contents" @click.stop.prevent="onClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
  const emit = defineEmits<{ (e: 'callAction', payload?: any): void }>();
  const props = defineProps<{ disabled?: boolean; meta?: Record<string, any> }>();

  async function onClick() {
    if (props.disabled) return;
  //@ts-ignore
  const verificationResult = await window.adminforthTwoFaModal.get2FaConfirmationResult();
    emit('callAction', { verificationResult });
  }
</script>