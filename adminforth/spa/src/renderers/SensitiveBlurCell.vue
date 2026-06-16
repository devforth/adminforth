<template>
  <div class="inline-flex items-center gap-1">
    <div
      class="overflow-hidden max-w-[200px] max-h-[20px] rounded-default"
      :title="show ? $t('Click to hide') : $t('Click to show')"
      @click="toggle"
    >
      <span
        class="cursor-pointer select-none transition-all duration-200 text-lightListTableText dark:text-darkListTableText"
        :class="{
          'blur-[7px] hover:blur-[5px] brightness-50 dark:brightness-150': !show,
        }"
      >
        <ValueRenderer :column="column" :record="record" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ValueRenderer from '@/components/ValueRenderer.vue';
import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common';

const props = defineProps<{
  column: AdminForthResourceColumnCommon;
  record: any;
  meta: any;
  resource: AdminForthResourceCommon;
  adminUser: AdminUser;
}>();

const show = ref(false);

function toggle(event: MouseEvent) {
  show.value = !show.value;
  event.stopPropagation();
}
</script>
