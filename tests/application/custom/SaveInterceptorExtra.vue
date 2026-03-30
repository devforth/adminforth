<script setup>
import { useAdminforth } from "@/adminforth"

const { registerSaveInterceptor } = useAdminforth()

// A second interceptor that runs after the first one and simply allows save
registerSaveInterceptor(async ({ action, values, resource }) => {
  console.log('Extra Save Interceptor triggered:', { action, values, resource });
  // You can add additional validation here; returning ok: false will block save
  return { ok: true };
})
</script>

<template>Extra Test</template>
