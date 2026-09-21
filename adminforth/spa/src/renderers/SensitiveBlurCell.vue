<template>
  <div class="inline-flex items-center gap-1">
    <Tooltip v-if="tooltipText">
      <div
        class="rounded-default me-2"
        :class="{
          'overflow-hidden max-h-[20px]': !isMultiline,
          'shrink-0 w-[90px]': compact,
        }"
        @click="toggle"
      >
        <span
          class="cursor-pointer select-none transition-all duration-200 text-lightListTableText dark:text-darkListTableText"
          :class="{
            'block truncate': compact,
            'block': isMultiline,
            'blur-[7px] hover:blur-[5px] brightness-50 dark:brightness-150': !show,
            'pointer-events-none': isMultiline && !show,
          }"
          @click="onValueClick"
        >
          <template v-if="compact">{{ visualValue }}</template>
          <ValueRenderer v-else :column="column" :record="record" />
        </span>
      </div>
      <template #tooltip>
        <span class="whitespace-nowrap">{{ tooltipText }}</span>
      </template>
    </Tooltip>
    <div
      v-else
      class="rounded-default me-2"
      :class="{
        'overflow-hidden max-h-[20px]': !isMultiline,
        'shrink-0 w-[90px]': compact,
      }"
      @click="toggle"
    >
      <span
        class="cursor-pointer select-none transition-all duration-200 text-lightListTableText dark:text-darkListTableText"
        :class="{
          'block truncate': compact,
          'block': isMultiline,
          'blur-[7px] hover:blur-[5px] brightness-50 dark:brightness-150': !show,
          'pointer-events-none': isMultiline && !show,
        }"
        @click="onValueClick"
      >
        <template v-if="compact">{{ visualValue }}</template>
        <ValueRenderer v-else :column="column" :record="record" />
      </span>
    </div>

    <span v-if="eyeButton" class="shrink-0 w-5 h-5">
      <IconEyeSolid
        v-if="!show"
        @click.stop="toggle"
        class="w-5 h-5 cursor-pointer text-lightPrimary dark:text-darkPrimary"
      />
      <IconEyeSlashSolid
        v-else
        @click.stop="toggle"
        class="w-5 h-5 cursor-pointer text-lightPrimary dark:text-darkPrimary"
      />
    </span>

    <span v-if="showCopy && rawValue" class="shrink-0 w-5 h-5">
      <IconFileCopyAltSolid
        @click.stop="copyToCB"
        class="w-5 h-5 cursor-pointer text-lightPrimary dark:text-darkPrimary"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconFileCopyAltSolid, IconEyeSolid, IconEyeSlashSolid } from '@iconify-prerendered/vue-flowbite';
import ValueRenderer from '@/components/ValueRenderer.vue';
import Tooltip from '@/afcl/Tooltip.vue';
import { useAdminforth } from '@/adminforth';
import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common';

const props = defineProps<{
  column: AdminForthResourceColumnCommon;
  record: any;
  meta: { compact?: boolean; copy?: boolean; eyeButton?: boolean } | any;
  resource: AdminForthResourceCommon;
  adminUser: AdminUser;
}>();

const { t } = useI18n();
const { alert } = useAdminforth();

const show = ref(false);

const rawValue = computed(() => {
  const value = props.record[props.column.name];
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
});

const compact = computed(() => props.meta?.compact);
const showCopy = computed(() => props.meta?.copy);

const isMultiline = computed(
  () => props.column.type === 'json' && !props.column.isArray?.enabled && !compact.value
);
const eyeButton = computed(() => props.meta?.eyeButton ?? isMultiline.value);
const visualValue = computed(() => {
  const val = rawValue.value;
  if (val.length > 8) {
    return `${val.slice(0, 4)}...${val.slice(-4)}`;
  }
  return val;
});

const tooltipText = computed(() => {
  if (compact.value && show.value) {
    return rawValue.value;
  }
  if (eyeButton.value) {
    return '';
  }
  return show.value ? t('Click to hide') : t('Click to show');
});

function toggle(event: MouseEvent) {
  show.value = !show.value;
  event.stopPropagation();
}

function onValueClick(event: MouseEvent) {
  if (isMultiline.value && show.value && eyeButton.value) {
    event.stopPropagation();
  }
}

function copyToCB() {
  navigator.clipboard.writeText(rawValue.value);
  alert({
    message: t('Copied to clipboard'),
    variant: 'success',
  });
}
</script>
