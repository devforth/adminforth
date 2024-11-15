<template>
  <AfTooltip>
    {{ relativeTime }}
    <template #tooltip v-if="relativeTime">
        {{ fullTime }}
    </template>
  </AfTooltip>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import AfTooltip from '@/components/AfTooltip.vue';
import en from 'javascript-time-ago/locale/en';
import TimeAgo from 'javascript-time-ago';
import dayjs from 'dayjs';


const id = ref();

TimeAgo.addLocale(en);

const props = defineProps(['column', 'record', 'meta', 'resource', 'adminUser']);

const userLocale = ref(navigator.language || 'en-US');
const timeAgoFormatter = new TimeAgo(userLocale.value);
const relativeTime = computed(() => {
  const value = props.record[props.column.name];
  const date = new Date(value);
  return timeAgoFormatter.format(date);
});

const fullTime = computed(() => {
  const value = props.record[props.column.name];  
  const date = dayjs(new Date(value));
  return date.format('DD MMM HH:mm');
});

onMounted(async () => {
  id.value = Math.random().toString(36).substring(7);
});

</script>
