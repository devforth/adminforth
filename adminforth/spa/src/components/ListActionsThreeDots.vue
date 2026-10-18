<template>
  <DropdownMenu
    v-model:open="showMenu"
    placement="bottom-end"
    teleportToBody
    :contentClass="['af-list-actions-three-dots z-40 min-w-[10rem]', THREE_DOTS_MENU_CONTENT_CLASSES]"
  >
    <template #trigger>
      <Button variant="ghost" size="sm" iconOnly>
        <IconEllipsis />
      </Button>
    </template>

    <DropdownMenuItem
      v-if="isBaseActionInMenu('show')"
      :class="THREE_DOTS_MENU_ITEM_CLASSES"
      :to="{ name: 'resource-show', params: { resourceId: props.resourceId, primaryKey: record._primaryKeyValue } }"
    >
      <template #icon><IconEye /></template>
      {{ $t('Show item') }}
    </DropdownMenuItem>
    <DropdownMenuItem
      v-if="isBaseActionInMenu('edit')"
      :class="THREE_DOTS_MENU_ITEM_CLASSES"
      :to="{ name: 'resource-edit', params: { resourceId: props.resourceId, primaryKey: record._primaryKeyValue } }"
    >
      <template #icon><IconPencil /></template>
      {{ $t('Edit item') }}
    </DropdownMenuItem>
    <DropdownMenuItem
      v-if="isBaseActionInMenu('delete')"
      :class="THREE_DOTS_MENU_ITEM_CLASSES"
      @click="deleteRecord(record)"
    >
      <template #icon><IconTrash2 /></template>
      {{ $t('Delete item') }}
    </DropdownMenuItem>

    <DropdownMenuItem
      v-for="action in menuActions"
      :key="action.id"
      :class="THREE_DOTS_MENU_ITEM_CLASSES"
      @click="actionItemClick(action.id, $event)"
    >
      <component
        :ref="(el: any) => { actionRefs[action.id] = el; }"
        :is="action.customComponent ? getCustomComponent(formatComponent(action.customComponent)) : CallActionWrapper"
        :meta="formatComponent(action.customComponent).meta"
        :row="record"
        :resource="coreStore.resource"
        :adminUser="coreStore.adminUser"
        @callAction="(payload? : Object) => startCustomAction(action.id, record, payload)"
      >
        <!-- preventDefault marks the click as handled by the action component -->
        <span @click.prevent class="flex flex-1 items-center gap-2">
          <component
            v-if="action.icon"
            :is="getIcon(action.icon)"
            class="w-4 h-4 text-lightInputIconColor dark:text-darkInputIconColor"
          />
          {{ $t(action.name) }}
        </span>
      </component>
    </DropdownMenuItem>

    <component
      v-for="c in customActionIconsThreeDotsMenuItems"
      :is="getCustomComponent(formatComponent(c))"
      :meta="formatComponent(c).meta"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
      :record="record"
      :updateRecords="props.updateRecords"
    />
  </DropdownMenu>
</template>

<script lang="ts" setup>
import { IconEye, IconPencil, IconTrash2, IconEllipsis } from '@iconify-prerendered/vue-lucide';
import { computed, ref } from 'vue';
import { getIcon, getCustomComponent, formatComponent } from '@/utils';
import { THREE_DOTS_MENU_CONTENT_CLASSES, THREE_DOTS_MENU_ITEM_CLASSES } from '@/utils/threeDotsMenu';
import { useCoreStore } from '@/stores/core';
import { Button, DropdownMenu, DropdownMenuItem } from '@/afcl';
import CallActionWrapper from '@/components/CallActionWrapper.vue'
import { type AdminForthActionFront, type AdminForthComponentDeclaration } from '@/types/Common';

const coreStore = useCoreStore();
const showMenu = ref(false);
const actionRefs: Record<string, any> = {};

const props = defineProps<{
    resourceOptions: any;
    record: any;
    customActionIconsThreeDotsMenuItems: AdminForthComponentDeclaration[];
    resourceId: string;
    deleteRecord: (record: any) => void;
    updateRecords: () => void;
    startCustomAction: (actionId: string, row: any, extraData?: Record<string, any>) => void;
}>();

const menuActions = computed<AdminForthActionFront[]>(
  () => (props.resourceOptions.actions ?? []).filter((a: AdminForthActionFront) => a.showIn?.listThreeDotsMenu)
);

// a base action is listed here unless it is rendered as a quick icon in the row
function isBaseActionInMenu(action: 'show' | 'edit' | 'delete') {
  return props.resourceOptions?.allowedActions?.[action] && !props.resourceOptions?.baseActionsAsQuickIcons?.includes(action);
}

// a click on the item padding is forwarded to the action component (see `click` expose of custom action components),
// clicks on its content are already handled by the component itself
function actionItemClick(actionId: string, event: MouseEvent) {
  if (!event.defaultPrevented) {
    actionRefs[actionId]?.click?.();
  }
}
</script>
