<template>
  <div class="inline-flex items-center gap-1">
    <Tooltip>
      <div
        class="overflow-hidden max-h-[20px] rounded-default"
        :class="{ 'shrink-0 w-[90px]': compact }"
        @click="toggle"
      >
        <span
          class="cursor-pointer select-none transition-all duration-200 text-lightListTableText dark:text-darkListTableText"
          :class="{
            'block truncate': compact,
            'blur-[7px] hover:blur-[5px] brightness-50 dark:brightness-150': !show,
          }"
        >
          <template v-if="compact">{{ visualValue }}</template>
          <ValueRenderer v-else :column="column" :record="record" />
        </span>
      </div>
      <template #tooltip>
        <span class="whitespace-nowrap">{{ tooltipText }}</span>
      </template>
    </Tooltip>

    <IconFileCopyAltSolid
      v-if="showCopy && rawValue"
      @click.stop="copyToCB"
      class="shrink-0 min-w-5 min-h-5 cursor-pointer text-lightPrimary dark:text-darkPrimary"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconFileCopyAltSolid } from '@iconify-prerendered/vue-flowbite';
import ValueRenderer from '@/components/ValueRenderer.vue';
import Tooltip from '@/afcl/Tooltip.vue';
import { useAdminforth } from '@/adminforth';
import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common';

const props = defineProps<{
  column: AdminForthResourceColumnCommon;
  record: any;
  meta: { compact?: boolean; copy?: boolean } | any;
  resource: AdminForthResourceCommon;
  adminUser: AdminUser;
}>();

const { t } = useI18n();
const { alert } = useAdminforth();

const show = ref(false);

const rawValue = computed(() => props.record[props.column.name]);

const compact = computed(() => props.meta?.compact);
const showCopy = computed(() => compact.value && props.meta?.copy);
const visualValue = computed(() => {
  const val = rawValue.value;
  if (val && String(val).length > 8) {
    const s = String(val);
    return `${s.slice(0, 4)}...${s.slice(-4)}`;
  }
  return val;
});

const tooltipText = computed(() => {
  if (compact.value && show.value) {
    return rawValue.value;
  }
  return show.value ? t('Click to hide') : t('Click to show');
});

function toggle(event: MouseEvent) {
  show.value = !show.value;
  event.stopPropagation();
}

function copyToCB() {
  navigator.clipboard.writeText(rawValue.value);
  alert({
    message: t('Copied to clipboard'),
    variant: 'success',
  });
}
</script>
