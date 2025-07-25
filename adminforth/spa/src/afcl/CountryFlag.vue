<template>
    <component v-if="getFlagComponent(countryCode)" class="flag-icon !shadow-none rounded-sm" :is="getFlagComponent(countryCode)" />
    <span v-else-if="countryCode">{{ countryCode }}</span>
</template>

<script setup lang="ts">
import * as FlagIcons from '@iconify-prerendered/vue-flag';

defineProps(['countryCode']);

const getFlagComponent = (countryCode: string) => {
        if (!countryCode) return null;
        
        const normalizedCode = countryCode.charAt(0).toUpperCase() + countryCode.slice(1).toLowerCase();
        const iconName = `Icon${normalizedCode}4x3`; // 4:3 aspect ratio flags
        return FlagIcons[iconName as keyof typeof FlagIcons] || null;
    };
</script>

<style scoped>
    .flag-icon {
        box-shadow: inset -0.3px -0.3px 0.3px 0px rgba(0 0 0 / 0.2), 
            inset 0.3px 0.3px 0.3px 0px rgba(255 255 255 / 0.2),
            0px 0px 3px #00000030;
    }
</style>