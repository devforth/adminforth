<template>
  <AfTooltip>
    <span class="flex items-center">
      {{ visualValue }} <IconFileCopyAltSolid @click.stop="copyToCB" class="w-5 h-5 text-lightPrimary dark:text-darkPrimary" v-if="visualValue"/>
    </span>
    <template #tooltip v-if="visualValue">
      {{ props.record[props.column.name] }}
    </template>
  </AfTooltip>
  
</template>

<script setup>  
import { computed, ref, onMounted, nextTick } from 'vue';
import { IconFileCopyAltSolid } from '@iconify-prerendered/vue-flowbite';
import AfTooltip from '@/components/AfTooltip.vue';


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
  window.adminforth.alert({
    message: 'ID copied to clipboard',
    variant: 'success',
  })
}

onMounted(async () => {
  id.value = Math.random().toString(36).substring(7);
  await nextTick();
});

</script>