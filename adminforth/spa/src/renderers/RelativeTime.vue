<template>
  <Tooltip>
    {{ relativeTime }}
    <template #tooltip v-if="relativeTime">
        {{ fullTime }}
    </template>
  </Tooltip>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import Tooltip from '@/afcl/Tooltip.vue';
import en from 'javascript-time-ago/locale/en';
import TimeAgo from 'javascript-time-ago';
import dayjs from 'dayjs';
import { parseRelativeTimeValue } from './relativeTimeValue';


const id = ref();

TimeAgo.addLocale(en);

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);

const userLocale = ref(navigator.language || 'en-US');
const timeAgoFormatter = new TimeAgo(userLocale.value);
const relativeTime = computed(() => {
  const date = parseRelativeTimeValue(props.record[props.column.name]);
  return date ? timeAgoFormatter.format(date) : '';
});

const fullTime = computed(() => {
  const date = parseRelativeTimeValue(props.record[props.column.name]);
  return date ? dayjs(date).format('DD MMM HH:mm') : '';
});

onMounted(async () => {
  id.value = Math.random().toString(36).substring(7);
});

</script>
