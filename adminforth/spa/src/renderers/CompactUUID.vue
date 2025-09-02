<template>
  <Tooltip>
    <span class="flex items-center">
      {{ visualValue }} <IconFileCopyAltSolid @click.stop="copyToCB" class="min-w-5 min-h-5 text-lightPrimary dark:text-darkPrimary" v-if="visualValue"/>
    </span>
    <template #tooltip v-if="visualValue">
      {{ props.record[props.column.name] }}
    </template>
  </Tooltip>
  
</template>

<script setup lang="ts">

import { computed, ref, onMounted, nextTick } from 'vue';
import { IconFileCopyAltSolid } from '@iconify-prerendered/vue-flowbite';
import Tooltip from '@/afcl/Tooltip.vue';
import adminforth from '@/adminforth';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const visualValue = computed(() => {
  // if lenght is more then 8, show only first 4 and last 4 characters, ... in the middle
  const val = props.record[props.column.name];
  if (val && val.length > 8) {
    return `${val.substr(0, 4)}...${val.substr(val.length - 4)}`;
  }
  return val;
});

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);

const id = ref();

function copyToCB() {
  navigator.clipboard.writeText(props.record[props.column.name]);
  adminforth.alert({
    message: t('ID copied to clipboard'),
    variant: 'success',
  })
}

onMounted(async () => {
  id.value = Math.random().toString(36).substring(7);
  await nextTick();
});

</script>