<template>
  <div v-if="error" class="af-login-modal-error flex items-center p-3 mb-4 text-sm rounded-lg border text-lightDanger border-lightDangerBorder bg-lightDangerSoft dark:text-darkDanger dark:border-darkDangerBorder dark:bg-darkDangerSoft" role="alert">
    <IconCircleAlert class="shrink-0 w-4 h-4 me-3" aria-hidden="true" />
    <span class="sr-only">{{ $t('Info') }}</span>
    <div>
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { IconCircleAlert } from '@iconify-prerendered/vue-lucide';

defineProps({
  error: {
    type: String,
    default: null
  }
});
</script>
