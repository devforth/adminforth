<template>
    <div v-if="isInitFinished" class="inline-flex rounded-md shadow-xs" role="group">
        <button v-for="button in buttons" :key="`${button}-button-controll`" 
            :disabled="slotProps[button].disabled"
            class="inline-flex items-center text-sm font-medium border-t border-b border-r border-lightButtonGroupBorder focus:z-10 focus:ring-2 dark:border-darkButtonGroupBorder disabled:opacity-50 disabled:cursor-not-allowed"
            :class="[
                buttonsStyles[button] === 'rounded' ? 'border rounded-lg' 
                : buttonsStyles[button] === 'rounded-left' ? 'border rounded-s-lg' 
                : buttonsStyles[button] === 'rounded-right' ? 'border rounded-e-lg border-l-lightButtonGroupBackground focus:border-l-lightButtonGroupBorder dark:border-l-darkButtonGroupBackground dark:focus:border-l-darkButtonGroupBorder' 
                : buttonsStyles[button] === 'no-rounded' ? 'border border-l-lightButtonGroupBackground focus:border-l-lightButtonGroupBorder dark:border-l-darkButtonGroupBackground dark:focus:border-l-darkButtonGroupBorder' 
                : buttonsStyles[button] === 'rounded-left-with-right-border' ? 'border rounded-s-lg' : '',
                (button === activeButton || props.solidColor === true) ? 'bg-lightButtonGroupActiveBackground text-lightButtonGroupActiveText focus:ring-lightButtonGroupActiveFocusRing dark:bg-darkButtonGroupActiveBackground dark:text-darkButtonGroupActiveText dark:focus:ring-darkButtonGroupActiveFocusRing' 
                                        :'text-lightButtonGroupText bg-lightButtonGroupBackground focus:ring-lightButtonGroupFocusRing hover:bg-lightButtonGroupBackgroundHover hover:text-lightButtonGroupTextHover dark:bg-darkButtonGroupBackground dark:text-darkButtonGroupText dark:hover:text-darkButtonGroupTextHover dark:hover:bg-darkButtonGroupBackgroundHover dark:focus:ring-darkButtonGroupFocusRing'
            ]"
            @click="setActiveButton(button)"
        >
            <slot :name="`button:${button}`"></slot>
        </button>
    </div>
</template>

<script lang="ts" setup>
    import { onMounted, useSlots, reactive, ref, type Ref } from 'vue';

    const buttons : Ref<string[]> = ref([]);
    const buttonsStyles : Ref<Record<string, string>> = ref({});
    const activeButton = ref('');
    const slotProps = reactive<Record<string, any>>({});
    const isInitFinished = ref(false);
    
    const emits = defineEmits(['update:modelValue']);

    const props = defineProps<{
        solidColor?: boolean;
        modelValue?: string;
    }>();
    
    onMounted(() => {
        const slots = useSlots();
        buttons.value = Object.keys(slots).reduce((tbs: string[], tb: string) => {
        if (tb.startsWith('button:')) {
            tbs.push(tb.replace('button:', ''));
        }
        return tbs;
        }, []);
        if (buttons.value.length > 0) {
            activeButton.value = buttons.value[0];
        }
        for (const button of buttons.value) {
            const temp = {
                [button]: getButtonsClasses(button)
            }
            buttonsStyles.value = { ...buttonsStyles.value, ...temp };
            const slot = slots[`button:${button}`];
            if (slot && slot()[0]?.props) {
                slotProps[button] = slot()[0].props;
            } else {
                slotProps[button] = {};
            }
            if (slotProps[button]?.disabled === undefined) {
                slotProps[button].disabled = false;
            }
        }
        isInitFinished.value = true;
    });


    function setActiveButton(button: string) {
        if (buttons.value.includes(button)) {
        activeButton.value = button;
        emits('update:modelValue', button);
        }
    }

    function getButtonsClasses(button: string) {
        const index = buttons.value.indexOf(button);
        const lenght = buttons.value.length;
        if ( lenght === 1 ) {
            return 'rounded'
        } else if ( lenght === 2 && index === 0 ) {
            return 'rounded-left-with-right-border'
        } else if ( index === 0 ) {
            return 'rounded-left'
        } else if ( index === lenght - 1 ) {
            return 'rounded-right'
        } else {
            return 'no-rounded'
        }
    }

</script>