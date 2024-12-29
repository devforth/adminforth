<template>
    <div @click="close" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-500 hover:underline dark:hover:underline cursor-pointer">
        🌂
    </div>
</template>

<script setup lang="ts">
import adminforth from "@/adminforth";
function close() {
    console.log('🚀 ~ file: login2.vue ~ line 5 ~ close ~ close');
    adminforth.closeUserMenuDropdown();
}
</script>

<style lang="scss" scoped>

</style>