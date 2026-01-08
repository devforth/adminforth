<script setup>
import { useAdminforth } from "@/adminforth"

const { registerSaveInterceptor } = useAdminforth()

registerSaveInterceptor(async ({ action, values, resource }) => {
  console.log('Custom Save Interceptor triggered:', { action, values, resource });
  const modal = window?.adminforthTwoFaModal;
  if (modal?.get2FaConfirmationResult) {
    const confirmationResult = await modal.get2FaConfirmationResult(
      'Confirm to save changes'
    );
    return { ok: true, extra: { confirmationResult } };
  } else {
    return { ok: false, error: '2FA code is required' }
  }
})
</script>

<template>Test</template>