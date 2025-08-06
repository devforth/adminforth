<template>
        <Toggle 
        :disabled="readonly" 
        @update:modelValue="$emit('update:value', $event)"
        :modelValue="valueFromRecord"
        >
        <p>{{text}}</p>
    </Toggle>
</template>

<script setup lang="ts">
import Toggle from '@/afcl/Toggle.vue';
import type {
  AdminForthResourceColumnCommon,
  AdminForthResourceCommon,
  AdminUser,
} from "@/types/Common";

    const props = defineProps<{
        value: boolean,
        text: string,
        column: AdminForthResourceColumnCommon,
        record: any,
        meta: any,
        resource: AdminForthResourceCommon,
        adminUser: AdminUser,
        readonly: boolean
    }>();
    console.log(JSON.stringify(props));
    console.log("Current mode:", props.meta?.mode)
    defineEmits(['update:value']);
    const valueFromRecord = props.record[props.column.name]
    const editReadOnly = props.column.editReadonly;
</script>