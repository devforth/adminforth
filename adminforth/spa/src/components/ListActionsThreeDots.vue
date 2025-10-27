<template>
  <div class="relative inline-block">
  <div
    ref="triggerRef"
      class="border border-gray-300 dark:border-gray-700 dark:border-opacity-0 border-opacity-0 hover:border-opacity-100 dark:hover:border-opacity-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
    @click="toggleMenu"
    >
      <IconDotsHorizontalOutline class="w-6 h-6 text-lightPrimary dark:text-darkPrimary" />
    </div>
    <teleport to="body">
      <div
      v-if="showMenu"
      ref="menuRef"
      class="z-50 bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-700 py-1"
      :style="menuStyles"
      >
        <template v-if="resourceOptions.moveBaseActionsOutOfThreeDotsMenu !== true">
          <RouterLink
            v-if="resourceOptions?.allowedActions?.show"
            class="flex text-nowrap p-1 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
            :to="{ 
              name: 'resource-show', 
              params: { 
                resourceId: props.resourceId, 
                primaryKey: record._primaryKeyValue,
              }
            }"

          >
            <IconEyeSolid class="w-5 h-5 mr-2 text-lightPrimary dark:text-darkPrimary"/>
            Show item
          </RouterLink>

          <RouterLink
            v-if="resourceOptions?.allowedActions?.edit"
            class="flex text-nowrap p-1 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
            :to="{ 
              name: 'resource-edit', 
              params: { 
                resourceId: props.resourceId, 
                primaryKey: record._primaryKeyValue,
              }
            }"
          >
            <IconPenSolid class="w-5 h-5 mr-2 text-lightPrimary dark:text-darkPrimary"/>
            Edit item
          </RouterLink>

          <button
            v-if="resourceOptions?.allowedActions?.delete"
            class="flex text-nowrap p-1 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
            @click="deleteRecord(record)"
          >
            <IconTrashBinSolid class="w-5 h-5 mr-2 text-lightPrimary dark:text-darkPrimary"/>
            Delete item
          </button>
        </template>
        <div v-for="action in (resourceOptions.actions ?? []).filter(a => a.showIn?.listThreeDotsMenu)" :key="action.id" >
            <button class="flex text-nowrap p-1 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300" @click="() => { startCustomAction(action.id, record); showMenu = false; }">
                <component v-if="action.icon" :is="getIcon(action.icon)" class="w-5 h-5 mr-2 text-lightPrimary dark:text-darkPrimary"></component>
                {{ action.name }}
            </button>
        </div>
        <template v-if="customActionIconsThreeDotsMenuItems">
            <component 
                v-for="c in customActionIconsThreeDotsMenuItems"
                :is="getCustomComponent(c)"
                :meta="c.meta"
                :resource="coreStore.resource" 
                :adminUser="coreStore.adminUser"
                :record="record"
                :updateRecords="props.updateRecords"
            />
        </template>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import {
  IconEyeSolid,
  IconPenSolid,
  IconTrashBinSolid,
  IconDotsHorizontalOutline
} from '@iconify-prerendered/vue-flowbite';
import { onMounted, onBeforeUnmount, ref, nextTick, watch } from 'vue';
import { getIcon, getCustomComponent } from '@/utils';
import { useCoreStore } from '@/stores/core';
const coreStore = useCoreStore();
const showMenu = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuStyles = ref<Record<string, string>>({});

const props = defineProps<{
    resourceOptions: any;
    record: any;
    customActionIconsThreeDotsMenuItems: any[];
    resourceId: string;
    deleteRecord: (record: any) => void;
    updateRecords: () => void;
    startCustomAction: (actionId: string, record: any) => void;
}>();

onMounted(() => {
  window.addEventListener('scroll', handleScrollOrResize, true);
  window.addEventListener('resize', handleScrollOrResize);
  document.addEventListener('click', handleOutsideClick, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScrollOrResize, true);
  window.removeEventListener('resize', handleScrollOrResize);
  document.removeEventListener('click', handleOutsideClick, true);
});

watch(showMenu, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    // First pass: after DOM mount
    updateMenuPosition();
    // Second pass: after layout/paint to catch width changes (fonts/icons)
    requestAnimationFrame(() => {
      updateMenuPosition();
      // Final safety: one micro-delay retry if width was still 0
      setTimeout(() => updateMenuPosition(), 0);
    });
  }
});

function toggleMenu() {
  if (!showMenu.value) {
    // Provisional position to avoid flashing at left:0 on first open
    const el = triggerRef.value;
    if (el) {
      const rect = el.getBoundingClientRect();
      const gap = 8;
      menuStyles.value = {
        position: 'fixed',
        top: `${Math.round(rect.bottom)}px`,
        left: `${Math.round(rect.left)}px`,
      };
    }
  }
  showMenu.value = !showMenu.value;
}

function updateMenuPosition() {
  const el = triggerRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const margin = 8; // gap around the trigger/menu
  const menuEl = menuRef.value;
  // Measure current menu size to align and decide flipping
  let menuWidth = rect.width; // fallback to trigger width
  let menuHeight = 0;
  if (menuEl) {
    const menuRect = menuEl.getBoundingClientRect();
    // Prefer bounding rect; fallback to offset/scroll width if needed
    const measuredW = menuRect.width || menuEl.offsetWidth || menuEl.scrollWidth;
    if (measuredW > 0) menuWidth = measuredW;
    const measuredH = menuRect.height || menuEl.offsetHeight || menuEl.scrollHeight;
    if (measuredH > 0) menuHeight = measuredH;
  }
  // Right-align: right edge of menu == right edge of trigger
  let left = rect.right - menuWidth;
  // Clamp within viewport with small margin so it doesn't render off-screen
  const minLeft = margin;
  const maxLeft = Math.max(minLeft, window.innerWidth - margin - menuWidth);
  left = Math.min(Math.max(left, minLeft), maxLeft);

  // Determine whether to place above or below based on available space
  const spaceBelow = window.innerHeight - rect.bottom - margin;
  const spaceAbove = rect.top - margin;
  const maxMenuHeight = Math.max(0, window.innerHeight - 2 * margin);

  let top: number;
  if (menuHeight === 0) {
    // Unknown height yet (first pass). Prefer placing below; a subsequent pass will correct if needed.
    top = rect.bottom + margin;
  } else if (menuHeight <= spaceBelow) {
    // Enough space below
    top = rect.bottom + margin;
  } else if (menuHeight <= spaceAbove) {
    // Not enough below but enough above -> flip
    top = rect.top - margin - menuHeight;
  } else {
    // Not enough space on either side: pick the side with more room and clamp within viewport
    if (spaceBelow >= spaceAbove) {
      top = Math.min(rect.bottom + margin, window.innerHeight - margin - menuHeight);
    } else {
      top = Math.max(margin, rect.top - margin - menuHeight);
    }
  }

  menuStyles.value = {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    maxHeight: `${Math.round(maxMenuHeight)}px`,
    overflowY: 'auto',
  };
}

function handleScrollOrResize() {
  showMenu.value = false;
}

function handleOutsideClick(e: MouseEvent) {
  const target = e.target as Node | null;
  if (!target) return;
  if (menuRef.value?.contains(target)) return;
  if (triggerRef.value?.contains(target)) return;
  showMenu.value = false;
}

</script>