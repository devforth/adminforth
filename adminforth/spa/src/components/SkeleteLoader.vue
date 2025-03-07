<template>
    <tr
        v-for="(r, ri) in new Array(props.rows)"
        class="bg-lightListTable dark:bg-darkListTable dark:border-darkListBorder"
        :class="{'border-b': ri !== props.rows - 1}"
        :style="[`height: ${props.rowHeights[ri] !== undefined ? props.rowHeights[ri] : 52.5}px`]"
    >
        <td
            v-for="(c, ci) in new Array(props.columns)" class="items-center px-6 py-4 cursor-default"
            :style="[props.columnWidths[ci] !== undefined
                ? `min-width: ${props.columnWidths[ci]}px; width: ${props.columnWidths[ci]}px;`
                : '']"
        >
            <div role="status" class="max-w-sm animate-pulse">
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
            </div>
        </td>
    </tr>
</template>

<script setup lang="ts">

const props = withDefaults(defineProps<{
    columns: number;
    rows: number;
    rowHeights?: number[];
    columnWidths?: number[];
}>(), {
    rowHeights: [],
    columnWidths: [],
});

</script>
