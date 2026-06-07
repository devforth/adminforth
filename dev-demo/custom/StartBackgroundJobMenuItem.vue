<template>
  <div class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
    <IconGridSolid class="h-4 w-4 text-lightPrimary dark:text-darkPrimary" />
    <span>Start Example Job</span>
  </div>
</template>

<script setup lang="ts">
import { IconGridSolid } from '@iconify-prerendered/vue-flowbite';
import { useAdminforth } from '@/adminforth';
import { callApi } from '@/utils';

const { alert, list } = useAdminforth();

const props = defineProps<{
  updateList?: () => Promise<void>;
}>();

async function click() {
  try {
    await callApi({
      path: '/api/create-job/',
      method: 'POST',
    });
    alert({
      message: 'Job started',
      variant: 'success',
    });
    await props.updateList?.();
  } catch (error) {
    alert({
      message: 'Failed to start job',
      variant: 'danger',
    });
    console.error('Failed to start background job:', error);
  } finally {
    list.closeThreeDotsDropdown();
  }
}

defineExpose({
  click,
});
</script>
