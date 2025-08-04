<template>
    <label class="inline-flex items-center cursor-pointer bor" :class="{'opacity-50' : props.disabled}">
        <input :id="id" 
            type="checkbox" 
            value="" class="sr-only peer" 
            :disabled="props.disabled"
            :checked="props.modelValue"
            @change="$emit('update:modelValue', $event.target.checked)"
            > 
            <div class="border border-lightToggleBorderUnactive relative min-w-11 min-h-6 bg-lightToggleBgUnactive peer-focus:outline-none peer-focus:ring-4 
                peer-focus:ring-lightToggleRing dark:peer-focus:ring-darkToggleRing rounded-full peer dark:bg-darkToggleBgUnactive 
                peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:top-[2px] peer-checked:border-none 
                peer-checked:after:border-lightToggleBorderActive  after:content-[''] after:absolute after:top-[1px] 
                after:start-[2px] after:bg-lightToggleCircleUnactive peer-checked:after:bg-lightToggleCircleActive dark:after:bg-darkToggleCircleUnactive after:border-lightToggleBgUnactive dark:after:border-darkToggleBgUnactive after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all dark:border-darkToggleBorderUnactive peer-checked:bg-lightToggleBgActive 
                dark:peer-checked:bg-darkToggleBgActive dark:peer-checked:after:border-darkToggleBorderActive dark:peer-checked:after:bg-darkToggleCircleActive">
            </div>
        <label :for="id" class="cursor-pointer ms-3 text-sm font-medium text-lightToggleText dark:text-darkToggleText">
            <slot></slot>
        </label>
    </label>
</template>

<script setup lang="ts">
    const props = defineProps({
        modelValue: Boolean,
        disabled: Boolean,
    });

    defineEmits(['update:modelValue']);
    const id = `afcb-${Math.random().toString(36).substring(7)}`
</script>