<template>
  <DropdownMenu
    v-if="threeDotsDropdownItems?.length || customActions?.length || (bulkActions?.some((action: AdminForthBulkActionFront) => action.showInThreeDotsDropdown))"
    v-model:open="showDropdown"
    placement="bottom-start"
    :closeOnSelect="false"
    keepMounted
    :contentClass="['max-w-64', THREE_DOTS_MENU_CONTENT_CLASSES]"
  >
    <template #trigger>
      <Button
        iconOnly
        class="text-lightThreeDotsMenuIconDots hover:text-lightThreeDotsMenuIconDotsHover dark:text-darkThreeDotsMenuIconDots  dark:hover:text-darkThreeDotsMenuIconDotsHover"
        variant="secondary"
      >
        <IconEllipsis aria-hidden="true" />
      </Button>
    </template>

    <DropdownMenuItem
      v-for="(item, i) in threeDotsDropdownItems"
      :key="`dropdown-item-${i}`"
      :class="THREE_DOTS_MENU_ITEM_CLASSES"
      :disabled="!!(checkboxes && checkboxes.length === 0 && item.meta?.disabledWhenNoCheckboxes)"
      @click="injectedComponentClick(i, $event)"
    >
      <component
        v-if="getCustomComponent(item)"
        :ref="(el: any) => setComponentRef(el, i)" :is="getCustomComponent(item)!"
        :meta="item.meta"
        :resource="coreStore.resource"
        :adminUser="coreStore.adminUser"
        :checkboxes="checkboxes"
        :updateList="props.updateList"
        :clearCheckboxes="clearCheckboxes"
      />
    </DropdownMenuItem>

    <DropdownMenuItem
      v-for="(action, i) in customActions"
      :key="action.id"
      :class="THREE_DOTS_MENU_ITEM_CLASSES"
      @click="injectedComponentClick(threeDotsDropdownItems ? threeDotsDropdownItems.length + i : i, $event)"
    >
      <component
        :ref="(el: any) => setComponentRef(el, threeDotsDropdownItems ? threeDotsDropdownItems.length + i : i)"
        :is="(action.customComponent && getCustomComponent(formatComponent(action.customComponent))) || CallActionWrapper"
        :meta="formatComponent(action.customComponent).meta"
        @callAction="(payload? : Object) => handleActionClick(action, payload)"
      >
        <!-- preventDefault marks the click as handled by the action component -->
        <span @click.prevent class="flex flex-1 items-center gap-2">
          <component
            v-if="action.icon && !actionLoadingStates[action.id!]"
            :is="getIcon(action.icon)"
            class="w-4 h-4 text-lightInputIconColor dark:text-darkInputIconColor"
          />
          <Spinner
            v-if="actionLoadingStates[action.id!]"
            class="w-4 h-4"
          />
          {{ action.name }}
        </span>
      </component>
    </DropdownMenuItem>

    <DropdownMenuItem
      v-for="action in (bulkActions ?? []).filter(a => a.showInThreeDotsDropdown)"
      :key="action.id"
      :class="THREE_DOTS_MENU_ITEM_CLASSES"
      :disabled="!!(checkboxes && checkboxes.length === 0)"
      @click="startBulkAction(action.id!)"
    >
      <template v-if="action.icon" #icon>
        <component :is="getIcon(action.icon)" />
      </template>
      {{ action.label }}
    </DropdownMenuItem>
  </DropdownMenu>
</template>


<script setup lang="ts">
import { getCustomComponent, getIcon, formatComponent, executeCustomAction } from '@/utils';
import { useCoreStore } from '@/stores/core';
import { useAdminforth } from '@/adminforth';
import { useRoute, useRouter } from 'vue-router';
import CallActionWrapper from '@/components/CallActionWrapper.vue'
import { ref, type ComponentPublicInstance, onMounted } from 'vue';
import type { AdminForthActionFront, AdminForthBulkActionFront, AdminForthComponentDeclarationFull } from '@/types/Common';
import { Spinner, Button, DropdownMenu, DropdownMenuItem } from '@/afcl';
import { IconEllipsis } from '@iconify-prerendered/vue-lucide';
import { THREE_DOTS_MENU_CONTENT_CLASSES, THREE_DOTS_MENU_ITEM_CLASSES } from '@/utils/threeDotsMenu';

const { list, alert} = useAdminforth();
const route = useRoute();
const coreStore = useCoreStore();
const router = useRouter();
const threeDotsDropdownItemsRefs = ref<Array<ComponentPublicInstance | null>>([]);
const showDropdown = ref(false);
const actionLoadingStates = ref<Record<string, boolean>>({});

const props = defineProps({
  threeDotsDropdownItems: Array<AdminForthComponentDeclarationFull>,
  customActions: Array<AdminForthActionFront>,
  bulkActions: Array<AdminForthBulkActionFront>,
  checkboxes: Array,
  updateList: {
    type: Function,
  },
  clearCheckboxes: {
    type: Function
  }
});

const emit = defineEmits(['startBulkAction']);

function setComponentRef(el: ComponentPublicInstance | null, index: number) {
  if (el) {
    threeDotsDropdownItemsRefs.value[index] = el;
  }
}

async function handleActionClick(action: AdminForthActionFront, payload: any) {
  list.closeThreeDotsDropdown();
  await executeCustomAction({
    actionId: action.id,
    resourceId: route.params.resourceId as string,
    recordId: route.params.primaryKey as string,
    extra: payload || {},
    setLoadingState: (loading: boolean) => {
      actionLoadingStates.value[action.id!] = loading;
    },
    onSuccess: async (data: any) => {
      await coreStore.fetchRecord({
        resourceId: route.params.resourceId as string,
        primaryKey: route.params.primaryKey as string,
        source: 'show',
      });

      if (data.successMessage) {
        alert({
          message: data.successMessage,
          variant: 'success'
        });
      }
    },
    onError: (error: string) => {
      alert({
        message: error,
        variant: 'danger'
      });
    }
  });
}

function startBulkAction(actionId: string) {
  list.closeThreeDotsDropdown();
  emit('startBulkAction', actionId);
  showDropdown.value = false;
}

async function injectedComponentClick(index: number, event: MouseEvent) {
  if (event.defaultPrevented) {
    showDropdown.value = false;
    return;
  }
  const componentRef = threeDotsDropdownItemsRefs.value[index];
  if (componentRef && 'click' in componentRef) {
    (componentRef as any).click?.();
  }
  showDropdown.value = false;
}

onMounted(() => {
  list.closeThreeDotsDropdown = () => {
    showDropdown.value = false;
  };
});

</script>


