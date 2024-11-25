<template>
    <tr v-for="c in new Array(props.rows)" class="bg-lightListTable border-b dark:bg-darkListTable dark:border-darkListBorder">
        <td v-for="r in new Array(props.columns)" class="items-center px-6 py-8 cursor-default" >
            <div role="status" class="max-w-sm animate-pulse">
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
            </div>
        </td>
    </tr>
</template>

<script setup lang="ts">

const props = defineProps<{
    columns: number;
    rows: number;
}>();

</script>
