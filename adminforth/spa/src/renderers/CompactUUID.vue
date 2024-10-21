<template>
  <span class="flex items-center"  
    :data-tooltip-target="val && `tooltip-${id}`"
    data-tooltip-placement="top"
  >
    {{ visualValue }} <IconFileCopyAltSolid @click.stop="copyToCB" class="w-5 h-5 text-lightPrimary dark:text-darkPrimary" v-if="visualValue"/>

    <div :id="`tooltip-${id}`" role="tooltip" v-if="visualValue"
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
      {{ props.record[props.column.name] }}
      <div class="tooltip-arrow" data-popper-arrow></div>
    </div>
  </span>
</template>

<script setup>  
import { computed, ref, onMounted } from 'vue';
import { IconFileCopyAltSolid } from '@iconify-prerendered/vue-flowbite';
import { initFlowbite } from 'flowbite';

const visualValue = computed(() => {
  // if lenght is more then 8, show only first 4 and last 4 characters, ... in the middle
  const val = props.record[props.column.name];
  if (val && val.length > 8) {
    return `${val.substr(0, 4)}...${val.substr(val.length - 4)}`;
  }
  return val;
});

const props = defineProps(['column', 'record', 'meta']);

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
  await new Promise(resolve => setTimeout(resolve, 0));
  initFlowbite();
});

</script>