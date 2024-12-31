<template>
  <Select
      class="w-full"
      :options="column.enum"
      :model-value="record[column.name]"
      @update:model-value="emit('update:value', $event)"
  >
    <template #item="{option}">
      <span class="text-xl inline-flex">{{ getCountryFlag(option.value) }}</span> {{ option.label }}
    </template>

    <template #selected-item="{option}">
      <span class="text-xl inline-flex">{{ getCountryFlag(option.value) }}</span> {{ option.label }}
    </template>
  </Select>
</template>

<script setup lang="ts">
import Select from "@/afcl/Select.vue";
import type {
  AdminForthResourceColumnCommon,
  AdminForthResourceCommon,
  AdminUser,
} from "@/types/Common";

const props = defineProps<{
  column: AdminForthResourceColumnCommon;
  record: any;
  meta: any;
  resource: AdminForthResourceCommon;
  adminUser: AdminUser;
}>();

const emit = defineEmits(["update:value"]);

function getCountryFlag(countryCode: string) {
  return countryCode?.toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

</script>